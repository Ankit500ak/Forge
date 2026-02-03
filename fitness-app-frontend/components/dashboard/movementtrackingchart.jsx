import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MovementTrackingChart = ({ weeklyData = [] }) => {
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

  // Defensive: fallback to empty array if not provided
  const safeWeeklyData = Array.isArray(weeklyData) ? weeklyData : [];

  const avgSteps = safeWeeklyData.length
    ? Math.round(safeWeeklyData.reduce((acc, curr) => acc + curr.steps, 0) / safeWeeklyData.length)
    : 0;
  const avgActive = safeWeeklyData.length
    ? Math.round(safeWeeklyData.reduce((acc, curr) => acc + curr.active, 0) / safeWeeklyData.length)
    : 0;
  const totalSteps = safeWeeklyData.reduce((acc, curr) => acc + curr.steps, 0);
  const totalActive = safeWeeklyData.reduce((acc, curr) => acc + curr.active, 0);

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