import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import apiClient from '@/lib/api-client';

const MovementTrackingChart = ({ weeklyData = [] }) => {
  const [data, setData] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Refs for step detection
  const accelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const lastStepTimeRef = useRef(0);
  const peakDetectionRef = useRef({ lastPeak: 0, threshold: 1.2 });
  const watchIdRef = useRef(null);
  const activeStartTimeRef = useRef(null);
  const activeIntervalRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Enhanced step detection algorithm
  const detectStep = (acceleration) => {
    const { x, y, z } = acceleration;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const normalizedMag = Math.abs(magnitude - 9.8);
    const now = Date.now();
    const timeSinceLastStep = now - lastStepTimeRef.current;
    
    if (timeSinceLastStep < 200) return false;
    const threshold = peakDetectionRef.current.threshold;
    
    if (normalizedMag > threshold) {
      if (accelerationRef.current.magnitude < threshold) {
        lastStepTimeRef.current = now;
        peakDetectionRef.current.threshold = Math.max(0.8, Math.min(2.0, normalizedMag * 0.7));
        return true;
      }
    }
    
    accelerationRef.current.magnitude = normalizedMag;
    return false;
  };

  const calculateCalories = (steps) => {
    return Math.round(steps * 0.04);
  };

  const handleDeviceMotion = (event) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel || !accel.x || !accel.y || !accel.z) return;

    const acceleration = {
      x: accel.x || 0,
      y: accel.y || 0,
      z: accel.z || 0
    };

    const totalAccel = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);
    const isMoving = totalAccel > 12;
    setIsActive(isMoving);

    if (isMoving && detectStep(acceleration)) {
      setSteps(prev => {
        const newSteps = prev + 1;
        setCalories(calculateCalories(newSteps));
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        return newSteps;
      });
    }
  };

  // Track active minutes
  useEffect(() => {
    if (isActive && !activeStartTimeRef.current) {
      activeStartTimeRef.current = Date.now();
      activeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeStartTimeRef.current) / 60000);
        setActiveMinutes(elapsed);
      }, 1000);
    } else if (!isActive && activeStartTimeRef.current) {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
      }
      activeStartTimeRef.current = null;
    }

    return () => {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
      }
    };
  }, [isActive]);

  const handleLocationUpdate = (position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now()
    };

    if (lastLocation) {
      const R = 6371e3;
      const φ1 = lastLocation.lat * Math.PI / 180;
      const φ2 = newLocation.lat * Math.PI / 180;
      const Δφ = (newLocation.lat - lastLocation.lat) * Math.PI / 180;
      const Δλ = (newLocation.lng - lastLocation.lng) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceMeters = R * c;

      if (distanceMeters > 2) {
        setDistance(prev => prev + distanceMeters);
      }
    }

    setLastLocation(newLocation);
  };

  const requestPermissions = async () => {
    setPermissionStatus('requesting');

    try {
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        const motionPermission = await DeviceMotionEvent.requestPermission();
        if (motionPermission !== 'granted') {
          setPermissionStatus('denied');
          return;
        }
      }

      if ('geolocation' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'denied') {
          setPermissionStatus('denied');
          return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          handleLocationUpdate,
          (error) => console.warn('Location error:', error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }

      window.addEventListener('devicemotion', handleDeviceMotion);
      setIsTracking(true);
      setPermissionStatus('granted');
      
      if (window.navigator.vibrate) {
        window.navigator.vibrate([50, 100, 50]);
      }

    } catch (error) {
      console.error('Permission error:', error);
      setPermissionStatus('denied');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    window.removeEventListener('devicemotion', handleDeviceMotion);
    setIsTracking(false);
    setIsActive(false);
    if (activeIntervalRef.current) {
      clearInterval(activeIntervalRef.current);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Auto-start tracking and fetch weekly data on mount
  useEffect(() => {
    const fetchMovementData = async () => {
      try {
        const response = await apiClient.get('/users/me/game');
        const stats = response.data?.stats;
        
        if (stats) {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const weeklyMovement = days.map((day, index) => {
            const baseSteps = (stats.speed || 0) * 50;
            const variation = Math.sin(index * 0.5) * baseSteps * 0.3;
            const calculatedSteps = Math.max(0, Math.round(baseSteps + variation));
            
            const baseActive = (stats.endurance || 0) * 0.4;
            const activeVariation = Math.cos(index * 0.5) * baseActive * 0.2;
            const active = Math.max(0, Math.round(baseActive + activeVariation));
            
            return { day, steps: calculatedSteps, active };
          });
          
          setData(weeklyMovement);
        }
      } catch (err) {
        console.warn('Failed to fetch movement data:', err);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setData(days.map(day => ({ day, steps: 0, active: 0 })));
      }
    };

    // Auto-start tracking
    requestPermissions();
    fetchMovementData();

    return () => {
      stopTracking();
    };
  }, []);

  const safeWeeklyData = Array.isArray(data) && data.length > 0 ? data : [];
  const avgSteps = safeWeeklyData.length 
    ? Math.round(safeWeeklyData.reduce((acc, curr) => acc + (curr.steps || 0), 0) / safeWeeklyData.length)
    : 0;
  const totalWeeklySteps = safeWeeklyData.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const goalSteps = 10000;
  const progressPercentage = Math.min((steps / goalSteps) * 100, 100);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#ffffff',
      position: 'relative',
      paddingBottom: '40px'
    }}>
      {/* Status Bar Spacer */}
      <div style={{ height: '44px', background: '#0a0a0a' }} />

      {/* Header */}
      <div style={{
        padding: '20px 20px 24px 20px',
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '4px'
        }}>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#888',
              marginBottom: '4px',
              fontWeight: '500',
              letterSpacing: '0.3px'
            }}>
              {formatDate(currentTime)}
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '34px',
              fontWeight: '700',
              letterSpacing: '-1px',
              background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Activity</h1>
          </div>
          
          {isTracking && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              padding: '8px 14px',
              borderRadius: '20px',
              border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isActive ? '#10b981' : '#3b82f6',
                boxShadow: isActive ? '0 0 10px #10b981' : '0 0 10px #3b82f6',
                animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none'
              }} />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: isActive ? '#10b981' : '#3b82f6'
              }}>
                {isActive ? 'ACTIVE' : 'TRACKING'}
              </span>
            </div>
          )}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#666',
          marginTop: '4px',
          fontWeight: '400'
        }}>
          {formatTime(currentTime)}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Main Progress Circle */}
        {isTracking && (
          <div style={{
            background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
            borderRadius: '32px',
            padding: '32px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px'
            }}>
              {/* Progress Ring */}
              <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="12"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 85}`}
                    strokeDashoffset={`${2 * Math.PI * 85 * (1 - progressPercentage / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center Content */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    letterSpacing: '-2px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '4px'
                  }}>
                    {steps.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#888',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Steps
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Goal: {goalSteps.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%'
              }}>
                {/* Distance */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>📍</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '2px',
                    letterSpacing: '-0.5px'
                  }}>
                    {(distance / 1000).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Km
                  </div>
                </div>

                {/* Calories */}
                <div style={{
                  background: 'rgba(251, 146, 60, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  border: '1px solid rgba(251, 146, 60, 0.15)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔥</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#fb923c',
                    marginBottom: '2px',
                    letterSpacing: '-0.5px'
                  }}>
                    {calories}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cal
                  </div>
                </div>

                {/* Active Min */}
                <div style={{
                  background: 'rgba(168, 85, 247, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>⏱️</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#a855f7',
                    marginBottom: '2px',
                    letterSpacing: '-0.5px'
                  }}>
                    {activeMinutes}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Min
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Activity Section */}
        {safeWeeklyData.length > 0 && (
          <div style={{
            background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
            borderRadius: '32px',
            padding: '24px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}>Weekly Activity</h2>
              <div style={{
                fontSize: '12px',
                color: '#666',
                fontWeight: '600'
              }}>
                Last 7 days
              </div>
            </div>

            {/* Chart */}
            <div style={{
              height: '180px',
              marginBottom: '20px',
              background: '#0a0a0a',
              borderRadius: '20px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeWeeklyData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(255, 255, 255, 0.03)" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '11px', fontWeight: '600' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(17, 17, 17, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                    }}
                    labelStyle={{ 
                      color: '#ffffff', 
                      fontWeight: '700', 
                      marginBottom: '8px',
                      fontSize: '13px'
                    }}
                    itemStyle={{ 
                      color: '#3b82f6',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="steps" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    activeDot={{ 
                      r: 5, 
                      fill: '#3b82f6', 
                      stroke: '#0a0a0a', 
                      strokeWidth: 3 
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  marginBottom: '6px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Daily Avg
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#3b82f6',
                  letterSpacing: '-1px'
                }}>
                  {avgSteps.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '2px'
                }}>
                  steps per day
                </div>
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  marginBottom: '6px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#10b981',
                  letterSpacing: '-1px'
                }}>
                  {(totalWeeklySteps / 1000).toFixed(1)}k
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '2px'
                }}>
                  steps this week
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Safe Area */}
      <div style={{ height: '20px' }} />

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default MovementTrackingChart;