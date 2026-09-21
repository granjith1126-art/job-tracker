import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Volume2, VolumeX, Radio, Cpu, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

/**
 * AiraAvatar — High-Fidelity Animated Human-Like AI Robot Avatar
 *
 * Visual & Kinetic Behaviors:
 * - Natural Blinking: Randomized interval eye blinks.
 * - Dynamic Gaze: Eyes look thoughtfully upward during 'thinking', wide & focused during 'listening', happy during 'success'.
 * - Expressive Head Tilt & Nod: Subtle nodding during speech/agreement, curious tilt during listening.
 * - Dynamic Mouth Waveform: Active phoneme speech waveforms during 'speaking'.
 * - Organic Floating: Smooth hovering & breathing idle physics.
 */
export default function AiraAvatar({ 
  state = 'idle', 
  isMuted = false, 
  size = 'md', // 'sm', 'md', 'lg', 'hero'
  onToggleMute = null,
  onClick = null
}) {
  const [blink, setBlink] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const [headTilt, setHeadTilt] = useState(0); // degrees
  const [gazeShift, setGazeShift] = useState({ x: 0, y: 0 });

  // 1. Natural Randomized Eye Blinking
  useEffect(() => {
    let blinkTimeout;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 2500; // 2.5s - 5s
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };
    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 2. Dynamic Mouth Movement during Speaking
  useEffect(() => {
    if (state === 'speaking') {
      const mouthInterval = setInterval(() => {
        setMouthPhase(prev => (prev + 1) % 6);
      }, 110);
      return () => clearInterval(mouthInterval);
    } else {
      setMouthPhase(0);
    }
  }, [state]);

  // 3. Dynamic Head Tilt and Gaze based on Avatar State
  useEffect(() => {
    if (state === 'thinking') {
      setHeadTilt(-3.5);
      setGazeShift({ x: 2, y: -4 }); // Gaze thoughtfully upwards
    } else if (state === 'listening') {
      setHeadTilt(2.5);
      setGazeShift({ x: 0, y: 1 }); // Focused forward/attentive
    } else if (state === 'speaking') {
      setHeadTilt(0);
      setGazeShift({ x: 0, y: 0 });
    } else if (state === 'success') {
      setHeadTilt(1.5);
      setGazeShift({ x: 0, y: 0 });
    } else {
      setHeadTilt(0);
      setGazeShift({ x: 0, y: 0 });
    }
  }, [state]);

  // Dimension scaling
  const sizeMap = {
    sm: { container: 'w-24 h-24', svg: 96 },
    md: { container: 'w-48 h-48', svg: 192 },
    lg: { container: 'w-64 h-64', svg: 256 },
    hero: { container: 'w-72 sm:w-84 h-72 sm:h-84', svg: 330 }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // State metadata badge
  const stateBadge = {
    idle: { label: 'Aira Ready', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', icon: Sparkles },
    listening: { label: 'Aira Listening...', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse', icon: Mic },
    thinking: { label: 'Aira Thinking...', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Cpu },
    speaking: { label: 'Aira Speaking...', color: 'bg-pink-500/25 text-pink-200 border-pink-400/50 shadow-lg shadow-pink-500/20', icon: Radio },
    success: { label: 'Great Answer!', color: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40', icon: CheckCircle2 },
    error: { label: "Let's Revisit", color: 'bg-amber-500/25 text-amber-200 border-amber-400/40', icon: AlertCircle }
  }[state] || { label: 'Aira', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', icon: Sparkles };

  const BadgeIcon = stateBadge.icon;

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer group' : ''}`}
    >
      {/* Outer Holographic Ambient Glow */}
      <div 
        className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          state === 'speaking' 
            ? 'w-80 h-80 bg-gradient-to-r from-pink-500/35 via-purple-500/30 to-indigo-500/30 animate-pulse' 
            : state === 'listening'
            ? 'w-80 h-80 bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-cyan-500/25 animate-pulse'
            : state === 'thinking'
            ? 'w-80 h-80 bg-gradient-to-r from-purple-600/35 via-indigo-600/35 to-pink-600/25'
            : 'w-72 h-72 bg-pink-500/15'
        }`} 
      />

      {/* Orbiting Quantum Rings during THINKING */}
      {state === 'thinking' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-64 h-64 rounded-full border-2 border-dashed border-purple-400/40 animate-spin" style={{ animationDuration: '5s' }} />
          <div className="absolute w-52 h-52 rounded-full border border-pink-400/40 animate-ping" style={{ animationDuration: '2.2s' }} />
          <div className="absolute w-44 h-44 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
        </div>
      )}

      {/* Listening Sound Wave Rings */}
      {state === 'listening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-68 h-68 rounded-full border border-emerald-400/35 animate-ping" style={{ animationDuration: '1.8s' }} />
          <div className="w-60 h-60 rounded-full border-2 border-emerald-500/25 animate-pulse" />
        </div>
      )}

      {/* Main Animated Robot with Floating, Tilt, and Nod Physics */}
      <div 
        className={`relative z-10 transition-transform duration-700 ease-out ${currentSize.container}`}
        style={{
          transform: `rotate(${headTilt}deg)`,
        }}
      >
        <svg 
          viewBox="0 0 300 300" 
          className={`w-full h-full drop-shadow-[0_18px_38px_rgba(236,72,153,0.38)] transition-all ${
            state === 'speaking' ? 'animate-bounce' : 'animate-pulse'
          }`}
          style={{
            animationDuration: state === 'speaking' ? '1.5s' : '3.6s'
          }}
        >
          <defs>
            {/* Glossy Pearlescent White/Pink Chassis Gradient */}
            <linearGradient id="airaChassis" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FDF2F8" />
              <stop offset="80%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>

            {/* Pearlescent Shadow */}
            <linearGradient id="airaChassisShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDF2F8" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Dark Curved Glass Visor Gradient */}
            <linearGradient id="airaVisor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#080C16" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>

            {/* Visor Glass Glare Highlight */}
            <linearGradient id="visorGlare" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#F472B6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Digital Cyan Eye Gradient */}
            <linearGradient id="eyeGlowCyan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Ear Pod Neon Glow */}
            <radialGradient id="earGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="1" />
              <stop offset="60%" stopColor="#DB2777" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9D174D" stopOpacity="0.2" />
            </radialGradient>

            {/* Laser Scan for Thinking state */}
            <linearGradient id="laserScan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1. NECK & UPPER BODY COLLAR */}
          <g id="airaBody">
            <path 
              d="M 90 230 C 90 220, 110 215, 150 215 C 190 215, 210 220, 210 230 L 225 285 C 225 292, 195 298, 150 298 C 105 298, 75 292, 75 285 Z" 
              fill="url(#airaChassis)" 
              stroke="#F472B6" 
              strokeWidth="2.5" 
            />
            {/* Chest Core Badge */}
            <ellipse cx="150" cy="255" rx="24" ry="14" fill="#0F172A" stroke="#EC4899" strokeWidth="2" />
            <circle cx="150" cy="255" r="5" fill={state === 'listening' ? '#10B981' : state === 'speaking' ? '#F43F5E' : '#38BDF8'}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Neck Join */}
            <rect x="130" y="190" width="40" height="30" rx="6" fill="#1E293B" stroke="#F472B6" strokeWidth="1.5" />
            <line x1="136" y1="198" x2="164" y2="198" stroke="#64748B" strokeWidth="2" />
            <line x1="136" y1="206" x2="164" y2="206" stroke="#64748B" strokeWidth="2" />
          </g>

          {/* 2. SIDE EAR HEADPHONE NODULES */}
          <g id="airaEars">
            {/* Left Ear */}
            <rect x="22" y="95" width="28" height="55" rx="14" fill="url(#airaChassisShadow)" stroke="#F472B6" strokeWidth="2" />
            <circle cx="36" cy="122" r="10" fill="url(#earGlow)" />
            <circle cx="36" cy="122" r="5" fill="#FFFFFF" opacity="0.85" />
            {state === 'listening' && (
              <circle cx="36" cy="122" r="16" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.7">
                <animate attributeName="r" values="10;22;10" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Right Ear */}
            <rect x="250" y="95" width="28" height="55" rx="14" fill="url(#airaChassisShadow)" stroke="#F472B6" strokeWidth="2" />
            <circle cx="264" cy="122" r="10" fill="url(#earGlow)" />
            <circle cx="264" cy="122" r="5" fill="#FFFFFF" opacity="0.85" />
            {state === 'listening' && (
              <circle cx="264" cy="122" r="16" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.7">
                <animate attributeName="r" values="10;22;10" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* 3. HEAD CHASSIS (Cute Rounded Futuristic Silhouette) */}
          <g id="airaHeadChassis">
            <path 
              d="M 45 115 C 45 45, 85 20, 150 20 C 215 20, 255 45, 255 115 C 255 185, 220 205, 150 205 C 80 205, 45 185, 45 115 Z" 
              fill="url(#airaChassis)" 
              stroke="#F472B6" 
              strokeWidth="3" 
            />

            {/* Top Head Antenna Gem / Crown Accent */}
            <path d="M 140 20 L 150 8 L 160 20 Z" fill="#EC4899" stroke="#FDF2F8" strokeWidth="1.5" />
            <circle cx="150" cy="8" r="4" fill="#38BDF8">
              <animate attributeName="fill" values="#38BDF8;#F472B6;#38BDF8" dur="2.5s" repeatCount="indefinite" />
            </circle>

            {/* Cute Glowing Pink Blush Cheeks */}
            <ellipse cx="82" cy="155" rx="14" ry="7" fill="#F43F5E" opacity={state === 'speaking' || state === 'success' ? 0.75 : 0.5} />
            <ellipse cx="218" cy="155" rx="14" ry="7" fill="#F43F5E" opacity={state === 'speaking' || state === 'success' ? 0.75 : 0.5} />
          </g>

          {/* 4. GLOSSY DARK FACE VISOR SCREEN */}
          <g id="airaVisorScreen">
            <path 
              d="M 65 112 C 65 60, 95 44, 150 44 C 205 44, 235 60, 235 112 C 235 162, 205 180, 150 180 C 95 180, 65 162, 65 112 Z" 
              fill="url(#airaVisor)" 
              stroke="#38BDF8" 
              strokeWidth="2.5" 
            />

            {/* Visor Glare & Reflection Line */}
            <path 
              d="M 72 95 C 72 65, 100 50, 150 50 C 190 50, 215 62, 225 80 C 205 66, 175 58, 145 58 C 105 58, 80 72, 72 95 Z" 
              fill="url(#visorGlare)" 
            />

            {/* Scanning Laser Beam during THINKING state */}
            {state === 'thinking' && (
              <rect x="68" y="50" width="164" height="12" fill="url(#laserScan)">
                <animate attributeName="y" values="50;165;50" dur="1.6s" repeatCount="indefinite" />
              </rect>
            )}
          </g>

          {/* 5. EXPRESSIVE DIGITAL EYES WITH GAZE SHIFT */}
          <g id="airaEyes" transform={`translate(${gazeShift.x}, ${gazeShift.y})`}>
            {blink ? (
              // Blinking Cute Horizontal Lines
              <>
                <line x1="95" y1="108" x2="125" y2="108" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                <line x1="175" y1="108" x2="205" y2="108" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : state === 'success' ? (
              // Joyful Crescent Curved Eyes (^ ^)
              <>
                <path d="M 94 112 Q 110 94 126 112" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
                <path d="M 174 112 Q 190 94 206 112" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
                <circle cx="110" cy="102" r="2.5" fill="#FFFFFF" />
                <circle cx="190" cy="102" r="2.5" fill="#FFFFFF" />
              </>
            ) : state === 'error' ? (
              // Sympathetic Round Eyes
              <>
                <ellipse cx="110" cy="108" rx="12" ry="10" fill="#FBBF24" />
                <ellipse cx="190" cy="108" rx="12" ry="10" fill="#FBBF24" />
                <circle cx="113" cy="105" r="4" fill="#FFFFFF" />
                <circle cx="193" cy="105" r="4" fill="#FFFFFF" />
              </>
            ) : state === 'listening' ? (
              // Wide Attentive Glowing Green/Cyan Eyes
              <>
                <ellipse cx="110" cy="106" rx="15" ry="18" fill="#10B981" />
                <ellipse cx="190" cy="106" rx="15" ry="18" fill="#10B981" />
                <ellipse cx="110" cy="106" rx="11" ry="14" fill="#059669" />
                <ellipse cx="190" cy="106" rx="11" ry="14" fill="#059669" />
                {/* Sparkle Highlights */}
                <circle cx="105" cy="100" r="5" fill="#FFFFFF" />
                <circle cx="114" cy="112" r="2.5" fill="#FFFFFF" />
                <circle cx="185" cy="100" r="5" fill="#FFFFFF" />
                <circle cx="194" cy="112" r="2.5" fill="#FFFFFF" />
              </>
            ) : (
              // Standard / Speaking / Idle Expressive Digital Eyes
              <>
                <ellipse cx="110" cy="106" rx="14" ry="16" fill="url(#eyeGlowCyan)" />
                <ellipse cx="190" cy="106" rx="14" ry="16" fill="url(#eyeGlowCyan)" />
                <ellipse cx="110" cy="106" rx="9" ry="11" fill="#0284C7" />
                <ellipse cx="190" cy="106" rx="9" ry="11" fill="#0284C7" />
                {/* Catch-light sparkles */}
                <circle cx="105" cy="100" r="4.5" fill="#FFFFFF" />
                <circle cx="114" cy="111" r="2" fill="#FFFFFF" />
                <circle cx="185" cy="100" r="4.5" fill="#FFFFFF" />
                <circle cx="194" cy="111" r="2" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* 6. ANIMATED MOUTH / LIP AUDIO WAVEFORM */}
          <g id="airaMouth">
            {state === 'speaking' ? (
              // Dynamic Talking Waveform
              mouthPhase === 0 ? (
                <path d="M 132 148 Q 150 162 168 148" fill="none" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" />
              ) : mouthPhase === 1 ? (
                <ellipse cx="150" cy="150" rx="10" ry="8" fill="#F43F5E" stroke="#EC4899" strokeWidth="2" />
              ) : mouthPhase === 2 ? (
                <path d="M 135 150 Q 150 140 165 150" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
              ) : mouthPhase === 3 ? (
                <ellipse cx="150" cy="151" rx="14" ry="9" fill="#BE185D" stroke="#F472B6" strokeWidth="2" />
              ) : mouthPhase === 4 ? (
                <path d="M 134 149 Q 150 164 166 149" fill="none" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
              ) : (
                <rect x="142" y="146" width="16" height="8" rx="4" fill="#F43F5E" />
              )
            ) : state === 'success' ? (
              // Big Happy Smile
              <path d="M 130 144 Q 150 166 170 144" fill="none" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
            ) : state === 'listening' ? (
              // Subtle attentive O mouth
              <circle cx="150" cy="150" r="4.5" fill="none" stroke="#10B981" strokeWidth="2.5" />
            ) : state === 'thinking' ? (
              // Small curious flat mouth
              <line x1="140" y1="150" x2="160" y2="150" stroke="#C084FC" strokeWidth="3" strokeLinecap="round" />
            ) : (
              // Pleasant friendly smile
              <path d="M 136 147 Q 150 157 164 147" fill="none" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
            )}
          </g>

          {/* 7. SPEAKING SOUNDWAVE HUD BARS */}
          {state === 'speaking' && (
            <g id="speakingWaves" opacity="0.9">
              <line x1="115" y1="170" x2="115" y2="162" stroke="#F472B6" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="162;156;162" dur="0.35s" repeatCount="indefinite" />
              </line>
              <line x1="125" y1="170" x2="125" y2="158" stroke="#EC4899" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="158;150;158" dur="0.28s" repeatCount="indefinite" />
              </line>
              <line x1="135" y1="170" x2="135" y2="164" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="164;156;164" dur="0.45s" repeatCount="indefinite" />
              </line>
              <line x1="165" y1="170" x2="165" y2="164" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="164;156;164" dur="0.45s" repeatCount="indefinite" />
              </line>
              <line x1="175" y1="170" x2="175" y2="158" stroke="#EC4899" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="158;150;158" dur="0.28s" repeatCount="indefinite" />
              </line>
              <line x1="185" y1="170" x2="185" y2="162" stroke="#F472B6" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y2" values="162;156;162" dur="0.35s" repeatCount="indefinite" />
              </line>
            </g>
          )}
        </svg>
      </div>

      {/* Floating State Badge Indicator */}
      <div className="mt-3 flex items-center gap-2 z-20">
        <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-colors ${stateBadge.color}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{stateBadge.label}</span>
        </div>

        {onToggleMute && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="w-7 h-7 rounded-full bg-[#111827]/80 hover:bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Aira voice' : 'Mute Aira voice'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>
        )}
      </div>
    </div>
  );
}
