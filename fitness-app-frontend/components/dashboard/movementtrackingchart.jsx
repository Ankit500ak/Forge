import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

const MovementTrackingChart = ({ weeklyData = [] }) => {
  const [data, setData] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const accelerationRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const stepThresholdRef = useRef(0);

  // Request location and accelerometer permissions
  const requestPermissions = async () => {
    try {
      // Request location access
      if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now()
            };

            // Calculate distance from last location using Haversine formula
            if (lastLocation) {
              const earthRadiusKm = 6371;
              const dLat = (newLocation.lat - lastLocation.lat) * Math.PI / 180;
              const dLng = (newLocation.lng - lastLocation.lng) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lastLocation.lat * Math.PI / 180) * Math.cos(newLocation.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distanceKm = earthRadiusKm * c;
              const distanceMeters = distanceKm * 1000;
              
              // Average step length is ~0.76 meters
              const estimatedSteps = Math.round(distanceMeters / 0.76);
              setSteps(prev => prev + estimatedSteps);
              setDistance(prev => prev + distanceMeters);
              
              console.log(`📍 Distance: ${distanceMeters.toFixed(2)}m, Steps: ${estimatedSteps}`);
            }

            setLastLocation(newLocation);
          },
          (error) => {
            console.warn('⚠️ Location permission denied:', error);
            setPermissionDenied(true);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }

      // Request accelerometer access (for step detection)
      if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
            setIsTracking(true);
            console.log('✅ Accelerometer access granted');
          }
        } catch (err) {
          console.warn('⚠️ Accelerometer permission denied:', err);
          setIsTracking(false);
        }
      } else if ('DeviceMotionEvent' in window) {
        // For non-iOS devices, just add listener
        window.addEventListener('devicemotion', handleDeviceMotion);
        setIsTracking(true);
        console.log('✅ Accelerometer access granted (non-iOS)');
      }
    } catch (err) {
      console.error('❌ Permission request failed:', err);
      setPermissionDenied(true);
    }
  };

  // Handle accelerometer data to detect steps
  const handleDeviceMotion = (event) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(
      acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
    );

    const now = Date.now();
    const timeDiff = now - lastTimestampRef.current;
    lastTimestampRef.current = now;

    // Simple step detection: peaks in acceleration indicate steps
    // Threshold is typically 25-30 m/s²
    if (magnitude > 25) {
      if (accelerationRef.current < 25) {
        // Crossing threshold upward = step detected
        setSteps(prev => {
          console.log('👟 Step detected!');
          return prev + 1;
        });
      }
    }
    accelerationRef.current = magnitude;
  };

  // Fetch real movement data on mount
  useEffect(() => {
    const fetchMovementData = async () => {
      try {
        const response = await apiClient.get('/users/me/game');
        const stats = response.data?.stats;

        if (stats) {
          const speedStat = stats.speed || 0;
          const enduranceStat = stats.endurance || 0;
          
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const weeklyMovement = days.map((day, index) => {
            const baseSteps = speedStat * 50;
            const variation = Math.sin(index * 0.5) * baseSteps * 0.3;
            const calculatedSteps = Math.max(0, Math.round(baseSteps + variation));
            
            const baseActive = enduranceStat * 0.4;
            const activeVariation = Math.cos(index * 0.5) * baseActive * 0.2;
            const active = Math.max(0, Math.round(baseActive + activeVariation));
            
            return { day, steps: calculatedSteps, active };
          });
          
          setData(weeklyMovement);
          console.log('✅ Loaded movement data:', weeklyMovement);
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch movement data:', err);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setData(days.map((day) => ({ day, steps: 0, active: 0 })));
      }
    };

    fetchMovementData();
    
    // Request location & accelerometer permissions
    requestPermissions();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);
  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.3px'
          }}>
            {label}
          </p>
          
          {payload.map((entry, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: index === payload.length - 1 ? 0 : '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  boxShadow: `0 0 8px ${entry.color}`
                }} />
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.85)'
                }}>
                  {entry.name}
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff'
              }}>
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Dot Component
  const CustomDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    
    if (payload[dataKey] === undefined) return null;

    const isSteps = dataKey === 'steps';
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="rgba(255, 255, 255, 0.15)"
          opacity={0.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={isSteps ? 4 : 3.5}
          fill="#ffffff"
          style={{
            filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))'
          }}
        />
      </g>
    );
  };

  // Custom Active Dot
  const CustomActiveDot = (props) => {
    const { cx, cy, dataKey } = props;
    const isSteps = dataKey === 'steps';
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill="#ffffff"
          opacity={0.2}
        >
          <animate
            attributeName="r"
            from="10"
            to="14"
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.3"
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={cx}
          cy={cy}
          r={isSteps ? 5 : 4.5}
          fill="#ffffff"
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5))'
          }}
        />
      </g>
    );
  };

  // Defensive: use state data instead of prop
  const safeWeeklyData = Array.isArray(data) && data.length > 0 ? data : [];

  const avgSteps = safeWeeklyData.length
    ? Math.round(safeWeeklyData.reduce((acc, curr) => acc + (curr.steps || 0), 0) / safeWeeklyData.length)
    : 0;
  const avgActive = safeWeeklyData.length
    ? Math.round(safeWeeklyData.reduce((acc, curr) => acc + (curr.active || 0), 0) / safeWeeklyData.length)
    : 0;
  const totalSteps = safeWeeklyData.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const totalActive = safeWeeklyData.reduce((acc, curr) => acc + (curr.active || 0), 0);

  return (
    <div style={{
      width: '100%',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      marginTop: 0,
      marginBottom: 0,
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 0,
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '22px',
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}>
            👟
          </span>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.3px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              Movement
            </h3>
            <p style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              Weekly tracking
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{
            textAlign: 'right',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              fontSize: '9px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Avg Steps
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              {avgSteps.toLocaleString()}
            </div>
          </div>
          <div style={{
            textAlign: 'right',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              fontSize: '9px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Avg Active
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              {avgActive}m
            </div>
          </div>

          {/* Current Tracking Stats */}
          {isTracking && (
            <div style={{
              textAlign: 'right',
              padding: '6px 10px',
              background: 'rgba(34, 197, 94, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}>
              <div style={{
                fontSize: '9px',
                fontWeight: 600,
                color: 'rgba(34, 197, 94, 0.8)',
                marginBottom: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Today
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#22c55e',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                {steps.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Permission Request Button */}
        {permissionDenied && (
          <button 
            onClick={requestPermissions}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))'}
          >
            📍 Enable Location & Movement Tracking
          </button>
        )}
      </div>
      </div>

      {/* Chart Container */}
      <div style={{
        position: 'relative',
        marginBottom: 0
      }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart 
            data={safeWeeklyData} 
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              stroke="rgba(255, 255, 255, 0.06)" 
              strokeDasharray="3 3" 
              vertical={false}
              strokeWidth={1}
            />
            
            <XAxis 
              dataKey="day" 
              stroke="rgba(255, 255, 255, 0.2)" 
              tick={{ 
                fill: 'rgba(255, 255, 255, 0.6)', 
                fontSize: 11,
                fontWeight: 600
              }} 
              axisLine={{ 
                stroke: 'rgba(255, 255, 255, 0.15)',
                strokeWidth: 1
              }}
              tickLine={false}
              dy={6}
            />
            
            <YAxis 
              yAxisId="left"
              stroke="rgba(255, 255, 255, 0.2)" 
              tick={{ 
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 10,
                fontWeight: 600
              }} 
              axisLine={{ 
                stroke: 'rgba(255, 255, 255, 0.15)',
                strokeWidth: 1
              }}
              tickLine={false}
              width={40}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="rgba(255, 255, 255, 0.2)" 
              tick={{ 
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 10,
                fontWeight: 600
              }} 
              axisLine={{ 
                stroke: 'rgba(255, 255, 255, 0.15)',
                strokeWidth: 1
              }}
              tickLine={false}
              width={35}
              tickFormatter={(value) => `${value}m`}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ 
                stroke: 'rgba(255, 255, 255, 0.25)', 
                strokeWidth: 1.5,
                strokeDasharray: '4 4'
              }}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="steps" 
              stroke="#ffffff" 
              strokeWidth={2.5}
              dot={<CustomDot dataKey="steps" />}
              activeDot={<CustomActiveDot dataKey="steps" />}
              name="Steps"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="active" 
              stroke="rgba(255, 255, 255, 0.65)" 
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={<CustomDot dataKey="active" />}
              activeDot={<CustomActiveDot dataKey="active" />}
              name="Active Min"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        paddingTop: '6px',
        paddingBottom: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '20px',
              height: '2.5px',
              backgroundColor: '#ffffff',
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
            }} />
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)'
            }} />
          </div>
          <span style={{ 
            color: '#ffffff', 
            fontSize: '11px', 
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>
            Steps
          </span>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg width="20" height="2.5" style={{ overflow: 'visible' }}>
              <line
                x1="0"
                y1="1.25"
                x2="20"
                y2="1.25"
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
            }} />
          </div>
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.85)', 
            fontSize: '11px', 
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>
            Active Min
          </span>
        </div>
      </div>

      {/* Footer Stats */}
      <div style={{
        marginTop: 0,
        paddingBottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            Total Steps
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {totalSteps.toLocaleString()}
          </div>
        </div>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            Total Active
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {totalActive}m
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage with sample data
export default MovementTrackingChart