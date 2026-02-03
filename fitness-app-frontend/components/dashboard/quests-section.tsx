import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";

// ─────────────────────────────────────────────────────────────────────────────
// FLUID SCALE  →  clamp(minPx, linear-vw-interpolation, maxPx)
//   min is reached at 320px viewport, max at 1200px viewport.
//   Between those two the value grows linearly with viewport width.
// ─────────────────────────────────────────────────────────────────────────────
const fluid = (min: number, max: number) => {
  const slope     = ((max - min) / 880) * 100;           // vw coefficient
  const intercept = min - (max - min) * (320 / 880);    // px offset
  return `clamp(${min}px, ${slope.toFixed(3)}vw + ${intercept.toFixed(2)}px, ${max}px)`;
};

// ─── Theme ──────────────────────────────────────────────────────────────────
const T = {
  bg         : "#0a0a0f",
  cardBg     : "#12121a",
  cardBorder : "#1e1e2e",
  accent     : "#c084fc",
  accentGlow : "rgba(192,132,252,0.35)",
  gold       : "#f59e0b",
  goldGlow   : "rgba(245,158,11,0.4)",
  text       : "#e2e8f0",
  muted      : "#64748b",
  faint      : "#3f4156",
  green      : "#4ade80",
  greenGlow  : "rgba(74,222,128,0.35)",
};

// ─── Fluid Token Map ────────────────────────────────────────────────────────
//  Every visual size in the component is defined exactly once here.
//  First number = value at 320 px viewport.  Second = value at 1200 px.
const S = {
  /* fonts ---------------------------------------------------------- */
  fontXS      : fluid(8.5,  11),     // tiny labels / badge text
  fontSm      : fluid(10.5, 13),     // meta lines, details body
  fontBase    : fluid(13,   15.5),   // quest name
  fontMd      : fluid(14.5, 17.5),   // XP number on card
  fontLg      : fluid(16.5, 20.5),   // pill stat values
  fontTitle   : fluid(19.5, 25),     // "Active Quests" heading
  fontRing    : fluid(14,   17.5),   // ring centre %

  /* page-level spacing ---------------------------------------------- */
  pagePad     : fluid(16,   28),     // left / right page padding
  pageTop     : fluid(48,   64),     // top safe-area padding
  pageBot     : fluid(32,   48),     // bottom padding

  /* card spacing ---------------------------------------------------- */
  cardPad     : fluid(12,   17),     // inner card padding (all sides)
  cardGap     : fluid(10,   14),     // flex gap between card children
  cardMargin  : fluid(10,   14),     // vertical space between cards

  /* header spacing -------------------------------------------------- */
  headerGap   : fluid(7,    11),     // emoji ↔ title gap
  headerMeta  : fluid(5,    8),      // title → subtitle margin

  /* pill / summary card --------------------------------------------- */
  pillGap     : fluid(6,    10),     // gap between the three pills
  pillPadX    : fluid(8,    14),     // pill horizontal padding
  pillPadY    : fluid(6.5,  10.5),   // pill vertical padding
  pillMarginTop: fluid(14,  20),     // pills ↔ title-row margin

  /* detail panel ---------------------------------------------------- */
  detailPad   : fluid(11,   17),     // expanded-detail vertical padding

  /* border radii ---------------------------------------------------- */
  rCard       : fluid(13,   18),
  rPill       : fluid(9,    13),
  rIcon       : fluid(10,   14),
  rCheck      : fluid(6,    9),
  rBadge      : fluid(14,   22),     // category tag pill

  /* interactive elements -------------------------------------------- */
  checkSize   : fluid(22,   28),     // checkbox w & h
  iconSize    : fluid(38,   48),     // icon bubble w & h
  iconFont    : fluid(18,   23),     // emoji inside bubble
  chevronBox  : fluid(26,   34),     // chevron hit-box
  chevronIcon : fluid(9,    12),     // chevron SVG size
  headerEmoji : fluid(20,   26),     // ⚔️ emoji font size

  /* progress ring --------------------------------------------------- */
  ringSize    : fluid(56,   78),     // outer diameter

  /* celebration overlay --------------------------------------------- */
  celebRing   : fluid(50,   72),
  celebFont   : fluid(18,   26),
};

// ─── Quest Type ─────────────────────────────────────────────────────────────
type Quest = {
  id: number  // Numeric ID from database
  name: string
  icon: string
  duration: string
  completed: boolean
  xp: number
  distance?: string
  muscles?: string
  intensity?: string
  sets?: string
  details?: string
  category?: string
  stat_rewards?: Record<string, number>  // 👑 NEW: Stat rewards {strength: 1, speed: 2, etc}
}

// ─── Sample Data ────────────────────────────────────────────────────────────
const QUESTS = [
  { id:1, name:"Dawn Patrol",      icon:"🌅", duration:"15 min",  xp:120, completed:true,  details:"Complete your morning meditation and journal entry to start the day with clarity and intention.", category:"Mindfulness" },
  { id:2, name:"Iron Will",        icon:"💪", duration:"45 min",  xp:350, completed:false, details:"Hit the gym and push through your strength training routine. Focus on progressive overload.",     category:"Fitness"     },
  { id:3, name:"Knowledge Seeker", icon:"📖", duration:"30 min",  xp:200, completed:false, details:"Read for 30 minutes on your chosen topic and take notes on the 3 key takeaways.",                category:"Learning"    },
  { id:4, name:"Hydration Hero",   icon:"💧", duration:"All Day", xp:80,  completed:true,  details:"Drink at least 8 glasses of water throughout the day. Track each one as you go.",                category:"Health"      },
  { id:5, name:"Code Warrior",     icon:"⚡", duration:"60 min",  xp:500, completed:false, details:"Work on your coding project. Ship at least one meaningful commit before the day ends.",           category:"Career"      },
];

// ─── Particle ───────────────────────────────────────────────────────────────
function Particle({ style }: { style?: React.CSSProperties }) {
  // particle size scales relative to the icon size token to remain fluid
  const size = `calc(${S.iconSize} * 0.08)`;
  return (
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: T.accent,
      opacity: 0.15,
      ...style,
    }} />
  );
}

// ─── Progress Ring ──────────────────────────────────────────────────────────
// Uses a fixed viewBox so the SVG scales to whatever fluid container size
// is imposed — no px dimensions on the <svg> element itself.
function ProgressRing({ percent }: { percent: number }) {
  const VB     = 100;                        // viewBox units (arbitrary)
  const SW     = 7;                          // stroke width in viewBox units
  const R      = (VB - SW) / 2;
  const CIRC   = 2 * Math.PI * R;
  const offset = CIRC - (percent / 100) * CIRC;

  return (
    <div style={{ width: S.ringSize, height: S.ringSize, position:"relative", flexShrink:0 }}>
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%"
        style={{ transform:"rotate(-90deg)", display:"block" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={T.accent} />
            <stop offset="100%" stopColor={T.gold}   />
          </linearGradient>
        </defs>
        {/* track */}
        <circle cx={VB/2} cy={VB/2} r={R}
          fill="none" stroke={T.cardBorder} strokeWidth={SW} />
        {/* fill */}
        <circle cx={VB/2} cy={VB/2} r={R}
          fill="none" stroke="url(#ringGrad)" strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition:"stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      {/* centred label */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <span style={{ fontSize: S.fontRing, fontWeight:800, color: T.text, letterSpacing:-0.5 }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

// ─── Quest Card ─────────────────────────────────────────────────────────────


interface QuestCardProps {
  quest: Quest;
  onToggle: (id: number) => void;
  isExpanded: boolean;
  onExpand: (id: number) => void;
}

function QuestCard({ quest, onToggle, isExpanded, onExpand }: QuestCardProps) {
  const [ripple, setRipple] = useState(false);

  const tap = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    onToggle(quest.id);
  };

  return (
    <div style={{
      position  : "relative",
      borderRadius: S.rCard,
      border    : `1px solid ${quest.completed ? T.green+"44" : T.cardBorder}`,
      background: quest.completed
        ? "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))"
        : T.cardBg,
      overflow  : "hidden",
      marginBottom: S.cardMargin,
      animation : "slideUp 0.4s cubic-bezier(.4,0,.2,1) both",
    }}>
      {/* shimmer on completed cards */}
      {quest.completed && (
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none", zIndex:1,
          background:"linear-gradient(105deg, transparent 40%, rgba(74,222,128,0.04) 50%, transparent 60%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 3s ease-in-out infinite",
        }} />
      )}

      {/* ── tappable row ──────────────────────────────────────────── */}
      <div onClick={quest.completed ? undefined : tap} style={{
        position:"relative", zIndex:2,
        display:"flex", alignItems:"center",
        gap: S.cardGap,
        padding: S.cardPad,
        cursor: quest.completed ? "default" : "pointer",
        WebkitTapHighlightColor:"transparent",
        userSelect:"none",
      }}>
        {/* ripple */}
        {ripple && (
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            borderRadius: S.rCard,
            background:"radial-gradient(circle at center, rgba(192,132,252,0.15), transparent 70%)",
            animation:"rippleOut 0.5s ease-out forwards",
          }} />
        )}

        {/* ── checkbox ── */}
        <div style={{
          width: S.checkSize, height: S.checkSize, flexShrink:0,
          borderRadius: S.rCheck,
          border:`2px solid ${quest.completed ? T.green : T.faint}`,
          background: quest.completed ? T.green : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.3s cubic-bezier(.68,-.55,.265,1.55)",
          boxShadow: quest.completed ? `0 0 10px ${T.greenGlow}` : "none",
        }}>
          {quest.completed && (
            <svg viewBox="0 0 12 12" fill="none" style={{ width:"55%", height:"55%" }}>
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ animation:"checkDraw .35s ease forwards" }} />
            </svg>
          )}
        </div>

        {/* ── icon bubble ── */}
        <div style={{
          width: S.iconSize, height: S.iconSize, flexShrink:0,
          borderRadius: S.rIcon,
          background: quest.completed
            ? "rgba(74,222,128,0.1)"
            : "linear-gradient(135deg, rgba(192,132,252,0.15), rgba(124,58,237,0.1))",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: S.iconFont,
          border:`1px solid ${quest.completed ? "rgba(74,222,128,0.2)" : "rgba(192,132,252,0.18)"}`,
        }}>
          {quest.icon}
        </div>

        {/* ── text block ── */}
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{
            display:"block",
            fontSize: S.fontBase, fontWeight:700,
            color: quest.completed ? T.muted : T.text,
            textDecoration: quest.completed ? "line-through" : "none",
            textDecorationColor: quest.completed ? T.green+"66" : "transparent",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            transition:"color .3s",
          }}>
            {quest.name}
          </span>

          <div style={{
            display:"flex", alignItems:"center",
            gap: S.pillGap, marginTop: S.headerMeta,
            fontSize: S.fontSm, color: T.muted,
          }}>
            <span>⏱ {quest.duration}</span>
            <span style={{
              background: quest.completed ? "rgba(74,222,128,0.12)" : "rgba(192,132,252,0.1)",
              color     : quest.completed ? T.green : T.accent,
              padding   : `1px ${S.pillGap}`,
              borderRadius: S.rBadge,
              fontSize  : S.fontXS, fontWeight:600, letterSpacing:0.3,
            }}>
              {quest.category}
            </span>
          </div>
        </div>

        {/* ── XP value ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
          <span style={{
            fontSize: S.fontMd, fontWeight:800,
            color: quest.completed ? T.muted : T.gold,
            textShadow: quest.completed ? "none" : `0 0 8px ${T.goldGlow}`,
            letterSpacing:-0.5,
          }}>
            +{quest.xp}
          </span>
          <span style={{
            fontSize: S.fontXS, fontWeight:700, color: T.faint,
            textTransform:"uppercase", letterSpacing:1,
          }}>
            XP
          </span>
        </div>

        {/* ── chevron ── */}
        <div
          onClick={(e) => { e.stopPropagation(); onExpand(quest.id); }}
          style={{
            width: S.chevronBox, height: S.chevronBox, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            borderRadius: S.rCheck,
            background:"rgba(255,255,255,0.04)",
            cursor:"pointer",
            transition:"transform .3s ease",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>
          <svg viewBox="0 0 10 10" fill="none"
            style={{ width: S.chevronIcon, height: S.chevronIcon }}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke={T.muted} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── expanded detail panel ─────────────────────────────────── */}
      <div style={{
        maxHeight: isExpanded ? 200 : 0,
        overflow:"hidden",
        transition:"max-height .4s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{
          borderTop:`1px solid ${T.cardBorder}`,
          padding:`${S.detailPad} ${S.cardPad} ${S.detailPad}`,
          position:"relative", zIndex:2,
        }}>
          {/* Description */}
          {quest.details && (
            <p style={{ fontSize: S.fontSm, color: T.muted, lineHeight:1.65, margin:`0 0 ${S.cardGap} 0` }}>
              {quest.details}
            </p>
          )}

          {/* 👑 NEW: Stat Rewards Section - Prominent Display */}
          {quest.stat_rewards && Object.keys(quest.stat_rewards).length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: S.pillGap,
              marginTop: S.cardGap,
              paddingTop: S.cardGap,
              borderTop: `1px solid ${T.cardBorder}`,
            }}>
              <span style={{
                fontSize: S.fontXS,
                fontWeight: 700,
                color: T.accent,
                textTransform: 'uppercase',
                letterSpacing: 1,
                width: '100%',
                marginBottom: S.pillGap,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                ⭐ Stat Rewards
              </span>
              {Object.entries(quest.stat_rewards).map(([stat, points]) => {
                // Color coding for 6-stat system
                const statColors: Record<string, { bg: string; text: string; border: string }> = {
                  strength: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.4)' },   // 🟢 Green
                  speed: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.4)' },     // 🔵 Blue
                  endurance: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.4)' },   // 🟢 Green
                  agility: { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.4)' },   // 💗 Pink
                  power: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' },       // 🔴 Red
                  recovery: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' },  // 🟣 Purple
                };
                const colors = statColors[stat] || { bg: 'rgba(192,132,252,0.15)', text: T.accent, border: 'rgba(192,132,252,0.4)' };
                
                return (
                  <div
                    key={stat}
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      padding: `${S.pillPadY} ${S.pillPadX}`,
                      borderRadius: S.rPill,
                      fontSize: S.fontXS,
                      fontWeight: 700,
                      border: `1.5px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>+{points}</span>
                    <span style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: 0.3 }}>
                      {stat}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root Component ─────────────────────────────────────────────────────────
export function QuestsSection({ 
  quests,
  onTaskComplete 
}: { 
  quests: Quest[]
  onTaskComplete?: (xpGain: number, newProgression: any) => void
}) {
  const [localQuests, setQuests] = useState<Quest[]>(quests);
  const [expandedQuest, setExpandedQuest]    = useState<number | null>(null);
  const [celebrationId, setCelebrationId]    = useState<number | null>(null);

  const completedCount = localQuests.filter(q =>  q.completed).length;
  const totalXP        = localQuests.reduce((s,q)=> s + q.xp, 0);
  const completedXP    = localQuests.filter(q =>  q.completed).reduce((s,q)=> s + q.xp, 0);
  const percent        = Math.round((completedCount / localQuests.length) * 100);

  const toggle = async (id: number) => {
    const quest = localQuests.find(q => q.id === id);
    if (!quest) return;

    // Only allow completing incomplete tasks
    if (quest.completed) return;

    // ✅ OPTIMISTIC UPDATE: Update UI immediately without waiting for API
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    setCelebrationId(id);
    
    // Show celebration animation
    setTimeout(() => setCelebrationId(null), 1200);

    // Now sync with backend asynchronously
    try {
      const response = await apiClient.post('/tasks/complete', { taskId: id });
      
      // Update XP in parent component once backend confirms
      if (response.data.progression && onTaskComplete) {
        console.log('✅ Task completed! XP awarded:', response.data.xpGain);
        onTaskComplete(response.data.xpGain, response.data.progression);
        
        // 📡 Dispatch event to notify radar chart to refetch stats
        window.dispatchEvent(new Event('task-completed'));
        console.log('📡 Broadcasted task-completed event');
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      // Revert UI if backend fails
      setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: false } : q));
      alert('Failed to complete task. Please try again.');
    }
  };

  // incomplete first, completed after
  const sorted = [
    ...localQuests.filter(q => !q.completed),
    ...localQuests.filter(q =>  q.completed),
  ];

  return (
      <div style={{
        // allow the container to size naturally; avoid hard viewport height
        minHeight: "100%",
      background: T.bg,
      fontFamily:"'Inter','SF Pro Display',system-ui,sans-serif",
      color     : T.text,
      position  : "relative",
      overflow  : "hidden",
    }}>
      {/* ── global keyframes ────────────────────────────────────── */}
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position:-200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rippleOut {
          from { opacity:1; transform:scale(0.8);  }
          to   { opacity:0; transform:scale(1.15); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset:30; }
          to   { stroke-dashoffset:0;  }
        }
        @keyframes celebBurst {
          0%   { transform:scale(0);   opacity:1; }
          100% { transform:scale(2.5); opacity:0; }
        }
        @keyframes floatUp {
          0%   { opacity:1; transform:translateY(0);    }
          100% { opacity:0; transform:translateY(-60px); }
        }
        @keyframes headerGlow {
          0%,100% { opacity:.4; }
          50%     { opacity:.7; }
        }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── ambient particles ─────────────────────────────────── */}
      <Particle style={{ top:"8%",  left:"15%",                         animation:"floatUp 6s  ease-in-out infinite"         }} />
      <Particle style={{ top:"25%", right:"10%", width:2, height:2,     animation:"floatUp 8s  ease-in-out 1s   infinite"   }} />
      <Particle style={{ top:"60%", left:"5%",   width:4, height:4,     animation:"floatUp 10s ease-in-out 2s   infinite"   }} />
      <Particle style={{ top:"75%", right:"20%",                        animation:"floatUp 7s  ease-in-out 0.5s infinite"   }} />

      {/* ── celebration overlay ───────────────────────────────── */}
      {celebrationId && (
        <div style={{
          position:"fixed", inset:0, zIndex:100, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            width: S.celebRing, height: S.celebRing, borderRadius:"50%",
            border:`3px solid ${T.gold}`,
            animation:"celebBurst .6s ease-out forwards",
            boxShadow:`0 0 30px ${T.goldGlow}`,
          }} />
          <div style={{
            position:"absolute", top:"40%", left:"50%", transform:"translateX(-50%)",
            fontSize: S.celebFont, fontWeight:800, color: T.gold, whiteSpace:"nowrap",
            animation:"floatUp 1.2s ease-out forwards",
            textShadow:`0 0 12px ${T.goldGlow}`,
          }}>
            +XP ✨
          </div>
        </div>
      )}

      {/* ── header section ────────────────────────────────────── */}
      <div style={{
        position     : "relative",
        paddingTop   : S.pageTop,
        paddingBottom: S.pagePad,
        paddingLeft  : S.pagePad,
        paddingRight : S.pagePad,
      }}>
        {/* background glow */}
        <div style={{
          position:"absolute", top:"-40px", left:"50%", transform:"translateX(-50%)",
          width:"120%", height:"45%",
          background:`radial-gradient(ellipse, ${T.accentGlow} 0%, transparent 70%)`,
          animation:"headerGlow 4s ease-in-out infinite",
          pointerEvents:"none",
        }} />

        {/* title + ring row */}
        <div style={{
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          position:"relative", zIndex:1,
        }}>
          <div style={{ minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap: S.headerGap, marginBottom: S.headerMeta }}>
              <span style={{ fontSize: S.headerEmoji, flexShrink:0 }}>⚔️</span>
              <h1 style={{
                fontSize: S.fontTitle, fontWeight:800, color: T.text,
                letterSpacing:-0.5, margin:0,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>
                Active Quests
              </h1>
            </div>
            <p style={{ fontSize: S.fontSm, color: T.muted, margin:0, paddingLeft: S.headerEmoji }}>
              {completedCount} of {localQuests.length} completed
            </p>
          </div>

          <ProgressRing percent={percent} />
        </div>

        {/* XP summary pills */}
        <div style={{
          display:"flex", gap: S.pillGap, marginTop: S.pillMarginTop,
          position:"relative", zIndex:1,
        }}>
          {[
            { label:"Earned",    value: completedXP,         color: T.gold,   glow: T.goldGlow,  bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)"   },
            { label:"Remaining", value: totalXP - completedXP, color: T.accent, glow: T.accentGlow, bg:"rgba(192,132,252,0.07)", border:"rgba(192,132,252,0.18)" },
            { label:"Total",     value: totalXP,             color: T.text,   glow: null,         bg:"rgba(226,232,240,0.04)", border:"rgba(226,232,240,0.1)"  },
          ].map(pill => (
            <div key={pill.label} style={{
              flex:1,
              background  : pill.bg,
              border      : `1px solid ${pill.border}`,
              borderRadius: S.rPill,
              padding     : `${S.pillPadY} ${S.pillPadX}`,
              textAlign   : "center",
            }}>
              <p style={{
                fontSize: S.fontXS, color: T.muted,
                textTransform:"uppercase", letterSpacing:0.8, margin:0,
              }}>
                {pill.label}
              </p>
              <p style={{
                fontSize: S.fontLg, fontWeight:800, color: pill.color,
                margin:"2px 0 0",
                textShadow: pill.glow ? `0 0 8px ${pill.glow}` : "none",
              }}>
                {pill.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── divider ─────────────────────────────────────────────── */}
      <div style={{
        height:1,
        background:`linear-gradient(to right, transparent, ${T.cardBorder}, transparent)`,
        margin:`0 ${S.pagePad}`,
      }} />

      {/* ── quest list ──────────────────────────────────────────── */}
      <div style={{ padding:`${S.pagePad} ${S.pagePad} ${S.pageBot}` }}>
        {sorted.map((quest, i) => (
          <div
            key={quest.id}
            style={{
              animationDelay: `${i * 0.06}s`,
              animationFillMode: "both",
                marginBottom: i === sorted.length - 1 ? 0 : S.cardMargin,
            }}
          >
            <QuestCard
              quest={quest}
              onToggle={toggle}
              isExpanded={expandedQuest === quest.id}
              onExpand={(id) => setExpandedQuest(expandedQuest === id ? null : id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// maintain default export for backwards compatibility
export default QuestsSection;