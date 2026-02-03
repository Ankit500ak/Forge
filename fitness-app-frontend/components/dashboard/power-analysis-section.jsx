import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';

const PowerAnalysisSection = () => {
  const [selectedStat, setSelectedStat] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  // Sample data - replace with your actual data
  const radarData = [
    { stat: 'Strength', value: 85, description: 'Raw power output', trend: '+5%' },
    { stat: 'Speed', value: 72, description: 'Movement velocity', trend: '+3%' },
    { stat: 'Endurance', value: 90, description: 'Stamina capacity', trend: '+8%' },
    { stat: 'Agility', value: 68, description: 'Quick reflexes', trend: '+2%' },
    { stat: 'Power', value: 82, description: 'Explosive force', trend: '+6%' },
    { stat: 'Recovery', value: 76, description: 'Healing rate', trend: '+4%' },
  ];

  const overallScore = Math.round(radarData.reduce((acc, curr) => acc + curr.value, 0) / radarData.length);
  
  const getStatTier = (value) => {
    if (value >= 85) return { label: 'ELITE', color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
    if (value >= 70) return { label: 'STRONG', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' };
    if (value >= 60) return { label: 'GOOD', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' };
    return { label: 'DEVELOPING', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
  };

  const statCounts = {
    elite: radarData.filter(s => s.value >= 85).length,
    strong: radarData.filter(s => s.value >= 70 && s.value < 85).length,
    good: radarData.filter(s => s.value >= 60 && s.value < 70).length,
    developing: radarData.filter(s => s.value < 60).length,
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
            }}
          >
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white">
              Power Analysis
            </h2>
            <p className="text-xs font-semibold text-gray-400">
              Complete fitness profile & combat readiness
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* LEFT: Radar Chart */}
        <div 
          className="relative rounded-2xl border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-20">
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3), transparent 70%)',
              }}
            />
          </div>

          <div className="relative z-10 p-6">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <defs>
                  {/* Main gradient fill */}
                  <linearGradient id="radarMainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                  
                  {/* Glow effect */}
                  <filter id="radarGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Hexagonal grid */}
                <PolarGrid 
                  stroke="rgba(139, 92, 246, 0.25)"
                  strokeWidth={1.5}
                  gridType="polygon"
                />
                
                {/* Stat labels */}
                <PolarAngleAxis 
                  dataKey="stat"
                  tick={({ payload, x, y, textAnchor, index }) => {
                    const stat = radarData[index];
                    const tier = getStatTier(stat.value);
                    const isSelected = selectedStat?.stat === stat.stat;
                    const isHovered = hoveredStat?.stat === stat.stat;
                    
                    return (
                      <g 
                        transform={`translate(${x},${y})`}
                        onMouseEnter={() => setHoveredStat(stat)}
                        onMouseLeave={() => setHoveredStat(null)}
                        onClick={() => setSelectedStat(isSelected ? null : stat)}
                        style={{ cursor: 'pointer' }}
                        className="transition-all duration-200"
                      >
                        {/* Background highlight on hover/select */}
                        {(isSelected || isHovered) && (
                          <circle
                            cx={0}
                            cy={0}
                            r={35}
                            fill={tier.glow}
                            className="animate-pulse"
                          />
                        )}
                        
                        {/* Stat name */}
                        <text
                          x={0}
                          y={-10}
                          dy={4}
                          textAnchor={textAnchor}
                          fill={isSelected || isHovered ? tier.color : '#9ca3af'}
                          fontSize={isSelected || isHovered ? "14" : "13"}
                          fontWeight="700"
                          className="transition-all duration-200"
                          style={{ 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            filter: isSelected || isHovered ? `drop-shadow(0 0 8px ${tier.glow})` : 'none'
                          }}
                        >
                          {payload.value}
                        </text>
                        
                        {/* Stat value */}
                        <text
                          x={0}
                          y={8}
                          dy={4}
                          textAnchor={textAnchor}
                          fill={tier.color}
                          fontSize={isSelected || isHovered ? "20" : "18"}
                          fontWeight="900"
                          className="transition-all duration-200"
                          style={{
                            filter: `drop-shadow(0 0 6px ${tier.glow})`
                          }}
                        >
                          {stat.value}
                        </text>
                        
                        {/* Tier label */}
                        <text
                          x={0}
                          y={26}
                          dy={4}
                          textAnchor={textAnchor}
                          fill={tier.color}
                          fontSize="9"
                          fontWeight="700"
                          opacity={isSelected || isHovered ? 1 : 0.8}
                          className="transition-all duration-200"
                          style={{ letterSpacing: '0.5px' }}
                        >
                          {tier.label}
                        </text>
                      </g>
                    );
                  }}
                />
                
                <PolarRadiusAxis 
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                
                {/* Main data overlay */}
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#radarMainGradient)"
                  fillOpacity={0.6}
                  filter="url(#radarGlow)"
                  dot={{ 
                    r: 6, 
                    fill: '#8b5cf6',
                    strokeWidth: 3,
                    stroke: '#ffffff',
                  }}
                  animationDuration={1000}
                  animationBegin={0}
                />
                
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    const tier = getStatTier(data.value);
                    
                    return (
                      <div 
                        className="px-4 py-3 rounded-xl border backdrop-blur-xl"
                        style={{
                          backgroundColor: 'rgba(20, 20, 20, 0.95)',
                          borderColor: tier.color,
                          boxShadow: `0 8px 32px ${tier.glow}, 0 0 0 1px ${tier.glow}`,
                        }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
                          {data.stat}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-3xl font-black" style={{ color: tier.color }}>
                            {data.value}
                          </p>
                          <span className="text-sm font-bold text-gray-500">
                            / 100
                          </span>
                        </div>
                        <p className="text-[10px] font-bold mt-1" style={{ color: tier.color }}>
                          {tier.label}
                        </p>
                        {data.trend && (
                          <p className="text-xs font-semibold mt-2 flex items-center gap-1 text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            {data.trend} this week
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Stats Grid & Overall */}
        <div className="space-y-4">
          
          {/* Overall Score Card */}
          <div
            className="relative rounded-2xl border overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
            }}
          >
            {/* Animated background bars */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-px w-full animate-pulse"
                  style={{
                    top: `${20 * (i + 1)}%`,
                    background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 p-6 flex items-center gap-6">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background ring */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="rgba(139, 92, 246, 0.15)"
                      strokeWidth="10"
                    />
                    {/* Progress ring */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))',
                        transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">
                      {overallScore}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      OVERALL
                    </span>
                  </div>
                </div>
              </div>

              {/* Info & Stats */}
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Combat Rating
                  </p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                    {overallScore >= 85 ? 'Elite Warrior' : overallScore >= 70 ? 'Strong Fighter' : 'Rising Contender'}
                  </h3>
                </div>

                {/* Tier breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  {statCounts.elite > 0 && (
                    <div 
                      className="px-3 py-2 rounded-lg flex items-center gap-2 border"
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)'
                      }}
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xl font-black text-emerald-400">{statCounts.elite}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-500">Elite</p>
                      </div>
                    </div>
                  )}
                  {statCounts.strong > 0 && (
                    <div 
                      className="px-3 py-2 rounded-lg flex items-center gap-2 border"
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)'
                      }}
                    >
                      <Target className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xl font-black text-blue-400">{statCounts.strong}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-blue-500">Strong</p>
                      </div>
                    </div>
                  )}
                  {statCounts.good > 0 && (
                    <div 
                      className="px-3 py-2 rounded-lg flex items-center gap-2 border"
                      style={{ 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-xl font-black text-amber-400">{statCounts.good}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-amber-500">Good</p>
                      </div>
                    </div>
                  )}
                  {statCounts.developing > 0 && (
                    <div 
                      className="px-3 py-2 rounded-lg flex items-center gap-2 border"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
                      }}
                    >
                      <Zap className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-xl font-black text-red-400">{statCounts.developing}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-red-500">Developing</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom gradient bar */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, 
                  #10b981 0%, 
                  #10b981 ${(statCounts.elite / 6) * 100}%,
                  #3b82f6 ${(statCounts.elite / 6) * 100}%,
                  #3b82f6 ${((statCounts.elite + statCounts.strong) / 6) * 100}%,
                  #f59e0b ${((statCounts.elite + statCounts.strong) / 6) * 100}%,
                  #f59e0b ${((statCounts.elite + statCounts.strong + statCounts.good) / 6) * 100}%,
                  #ef4444 ${((statCounts.elite + statCounts.strong + statCounts.good) / 6) * 100}%,
                  #ef4444 100%
                )`,
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              }}
            />
          </div>

          {/* Individual Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            {radarData.map((stat, idx) => {
              const tier = getStatTier(stat.value);
              const isSelected = selectedStat?.stat === stat.stat;
              const isHovered = hoveredStat?.stat === stat.stat;
              
              return (
                <div
                  key={idx}
                  className={`relative group cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, ${tier.glow}, rgba(20, 20, 20, 0.8))`
                      : 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9))',
                    borderColor: isSelected || isHovered ? tier.color : 'rgba(75, 85, 99, 0.3)',
                    boxShadow: isSelected 
                      ? `0 8px 24px ${tier.glow}, 0 0 0 1px ${tier.color}` 
                      : 'none',
                  }}
                  onMouseEnter={() => setHoveredStat(stat)}
                  onMouseLeave={() => setHoveredStat(null)}
                  onClick={() => setSelectedStat(isSelected ? null : stat)}
                >
                  {/* Animated background fill */}
                  <div 
                    className="absolute inset-0 opacity-10 transition-all duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${tier.color} 0%, transparent ${stat.value}%)`,
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />

                  <div className="relative z-10 p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p 
                          className="text-[10px] font-extrabold uppercase tracking-widest mb-1 transition-colors duration-200"
                          style={{ color: isSelected || isHovered ? tier.color : '#9ca3af' }}
                        >
                          {stat.stat}
                        </p>
                        <p className="text-[9px] font-medium text-gray-500">
                          {stat.description}
                        </p>
                      </div>
                      <div 
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: tier.color,
                          boxShadow: isSelected || isHovered ? `0 0 12px ${tier.color}` : 'none',
                          transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                        }}
                      />
                    </div>

                    {/* Value and progress */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className="text-4xl font-black leading-none transition-all duration-300"
                          style={{
                            color: tier.color,
                            textShadow: isSelected ? `0 0 16px ${tier.glow}` : `0 0 8px ${tier.glow}`,
                          }}
                        >
                          {stat.value}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p 
                            className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: tier.color }}
                          >
                            {tier.label}
                          </p>
                          {stat.trend && (
                            <span className="text-[9px] font-bold text-emerald-400">
                              {stat.trend}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mini circular progress */}
                      <svg className="w-12 h-12">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="rgba(75, 85, 99, 0.3)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={tier.color}
                          strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - stat.value / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 24 24)"
                          style={{
                            filter: `drop-shadow(0 0 4px ${tier.glow})`,
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                        <text
                          x="24"
                          y="24"
                          textAnchor="middle"
                          dy="0.35em"
                          fontSize="9"
                          fontWeight="900"
                          fill={tier.color}
                        >
                          {stat.value}
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Bottom accent line with pulse */}
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-700"
                    style={{
                      width: `${stat.value}%`,
                      backgroundColor: tier.color,
                      boxShadow: isSelected ? `0 0 12px ${tier.color}` : `0 0 6px ${tier.color}`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Selected Stat Detail */}
          {selectedStat && (
            <div
              className="rounded-xl border p-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{
                background: `linear-gradient(135deg, ${getStatTier(selectedStat.value).glow}, rgba(20, 20, 20, 0.9))`,
                borderColor: getStatTier(selectedStat.value).color,
                boxShadow: `0 8px 24px ${getStatTier(selectedStat.value).glow}, 0 0 0 1px ${getStatTier(selectedStat.value).color}`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Selected Attribute
                  </p>
                  <h4 className="text-xl font-black mb-1" style={{ color: getStatTier(selectedStat.value).color }}>
                    {selectedStat.stat}
                  </h4>
                  <p className="text-sm font-medium text-gray-400 mb-3">
                    {selectedStat.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="px-3 py-1.5 rounded-lg"
                      style={{ background: getStatTier(selectedStat.value).glow }}
                    >
                      <span className="text-sm font-black" style={{ color: getStatTier(selectedStat.value).color }}>
                        {selectedStat.value}/100
                      </span>
                    </div>
                    {selectedStat.trend && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">
                          {selectedStat.trend}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStat(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105 text-white border"
                  style={{
                    background: 'rgba(30, 30, 30, 0.8)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerAnalysisSection;