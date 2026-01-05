'use client';

import React from 'react';
import { Terminal, Shield, BarChart3, Activity } from 'lucide-react';

/* DATA STRUCTURE TYPES */
export interface BrandOSDashboardData {
  profile: {
    username: string;
    displayName: string;
    profileImageUrl: string;
    followersCount: string;
    verified: boolean;
  };
  scores: {
    brandScore: number;
    voiceConsistency: number;
    engagementScore: number;
  };
  personality: {
    archetype: string;
    emoji: string; // Can be native emoji character or path to SVG (e.g., "/emojis/...")
    type: string;
  };
  tone: {
    formality: number;
    energy: number;
    confidence: number;
  };
  pillars: Array<{
    label: string;
    value: number;
  }>;
  dna: {
    keywords: string[];
    voice: string;
  };
}

interface BrandOSDashboardProps {
  data: BrandOSDashboardData;
}

const BrandOSDashboard: React.FC<BrandOSDashboardProps> = ({ data }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-[#2E6AFF] selection:text-white flex items-center justify-center">

      {/* GLOBAL STYLES FOR FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,900;1,900&family=JetBrains+Mono:wght@400;700&display=swap');

        .font-brand { font-family: 'Inter', sans-serif; }
        .font-os { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }

        /* Grid Pattern for Blue Card */
        .bg-grid-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* BENTO GRID LAYOUT */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

        {/* --- CARD 1: HERO SCORE --- */}
        <div className="md:col-span-2 md:row-span-2 bg-[#2E6AFF] rounded-[4px] relative p-6 md:p-10 flex flex-col justify-between overflow-hidden group hover:brightness-110 transition-all duration-500">
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
          <div className="flex justify-between items-start z-10">
            <span className="font-os text-xs md:text-sm text-white/90 tracking-widest border border-white/40 px-2 py-1 rounded-[2px] bg-[#2E6AFF]">
              SYSTEM_SCORE
            </span>
            <Activity className="text-white/80 w-6 h-6 animate-pulse" />
          </div>
          <div className="relative z-10 my-auto">
            <h1 className="font-brand font-black italic text-[120px] md:text-[180px] leading-none tracking-tighter text-white drop-shadow-xl">
              {data.scores.brandScore}
            </h1>
          </div>
          <div className="z-10 grid grid-cols-2 gap-8 border-t border-white/20 pt-6">
             <div>
                <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">Voice Consistency</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-brand font-bold italic">{data.scores.voiceConsistency}%</span>
                  <div className="h-1.5 w-12 bg-white/30 rounded-full overflow-hidden">
                    <div style={{width: `${data.scores.voiceConsistency}%`}} className="h-full bg-white" />
                  </div>
                </div>
             </div>
             <div className="text-right">
                <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">Engagement</span>
                <span className="text-2xl font-brand font-bold italic">{data.scores.engagementScore}/100</span>
             </div>
          </div>
        </div>

        {/* --- CARD 2: IDENTITY --- */}
        <div className="md:col-span-2 bg-white rounded-[4px] p-6 flex flex-col sm:flex-row items-center justify-between relative group overflow-hidden">
          <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-[3px] border-black p-0.5">
                <img
                  src={data.profile.profileImageUrl}
                  alt={data.profile.displayName}
                  className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              {data.profile.verified && (
                <div className="absolute -bottom-1 -right-1 bg-[#2E6AFF] text-white p-1.5 rounded-full border-[3px] border-white">
                  <Shield size={14} fill="currentColor" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl md:text-4xl font-brand font-black italic text-black tracking-tight leading-none">
                {data.profile.displayName}
              </h2>
              <p className="font-os text-sm text-gray-500 mt-1 font-bold">@{data.profile.username}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <span className="font-os text-[10px] text-gray-400 block uppercase tracking-widest mb-1">Audience</span>
            <span className="text-4xl md:text-5xl font-brand font-black italic text-black tracking-tighter">
              {data.profile.followersCount}
            </span>
          </div>
        </div>

        {/* --- CARD 3: TONE ANALYZER --- */}
        <div className="md:col-span-1 bg-[#1A1A1A] rounded-[4px] p-5 flex flex-col relative overflow-hidden border border-white/5">
          <span className="font-os text-[10px] text-[#666] mb-4 block border-b border-[#333] pb-2 tracking-widest">TONE_MIXER</span>
          <div className="flex-1 flex justify-between items-end gap-3 px-1">
            <div className="w-full h-full flex flex-col justify-end group">
              <div style={{height: `${data.tone.formality}%`}} className="w-full bg-gray-600 rounded-[2px] mb-2 transition-all duration-700 group-hover:bg-white" />
              <span className="font-os text-[9px] text-gray-500 text-center">FORM</span>
            </div>
             <div className="w-full h-full flex flex-col justify-end group">
              <div
                style={{height: `${data.tone.energy}%`}}
                className="w-full bg-[#00FF41] rounded-[2px] mb-2 transition-all duration-700 shadow-[0_0_15px_rgba(0,255,65,0.4)] group-hover:shadow-[0_0_20px_rgba(0,255,65,0.8)]"
              />
              <span className="font-os text-[9px] text-[#00FF41] text-center font-bold">NRGY</span>
            </div>
             <div className="w-full h-full flex flex-col justify-end group">
              <div style={{height: `${data.tone.confidence}%`}} className="w-full bg-[#2E6AFF] rounded-[2px] mb-2 transition-all duration-700 group-hover:brightness-125" />
              <span className="font-os text-[9px] text-[#2E6AFF] text-center font-bold">CONF</span>
            </div>
          </div>
        </div>

        {/* --- CARD 4: ARCHETYPE --- */}
        <div className="md:col-span-1 bg-[#FFD700] rounded-[4px] p-4 flex flex-col justify-between relative overflow-hidden hover:bg-[#FFC000] transition-colors cursor-default">
          <div className="flex justify-between items-start z-10">
            <span className="font-os text-[10px] text-black/70 font-bold border border-black/10 px-1.5 py-0.5 rounded-[2px]">ARCHETYPE</span>
          </div>
          <div className="absolute -right-4 top-6 leading-none opacity-100 transform rotate-12 drop-shadow-lg filter hover:rotate-0 transition-transform duration-300">
            {data.personality.emoji.startsWith('/') ? (
              <img
                src={data.personality.emoji}
                alt={data.personality.archetype}
                className="w-[85px] h-[85px] object-contain"
              />
            ) : (
              <span className="text-[85px]">{data.personality.emoji}</span>
            )}
          </div>
          <div className="z-10 mt-auto">
            <h3 className="text-2xl font-brand font-black italic text-black leading-tight max-w-[80%]">
              {data.personality.archetype}
            </h3>
            <span className="inline-block mt-2 bg-black text-[#FFD700] text-[9px] px-2 py-1 font-os font-bold rounded-[2px]">
              {data.personality.type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* --- CARD 5: DNA TERMINAL --- */}
        <div className="md:col-span-2 bg-[#F0F0F0] rounded-[4px] p-5 flex flex-col justify-between border-l-[6px] border-[#2E6AFF]">
           <div className="flex items-center gap-2 mb-3">
             <Terminal size={14} className="text-black" strokeWidth={3} />
             <span className="font-os text-xs text-black font-bold tracking-wider">&gt; EXECUTE_DNA_SEQUENCE</span>
           </div>
           <div className="flex flex-wrap gap-2 mb-4">
             {data.dna.keywords.map((word, i) => (
               <span key={i} className="bg-black text-white px-2 py-1 text-[10px] md:text-xs font-os rounded-[2px] hover:bg-[#2E6AFF] hover:translate-y-[-2px] transition-all cursor-crosshair">
                 [{word}]
               </span>
             ))}
           </div>
           <div className="bg-white/50 p-3 rounded-[2px] border border-gray-200">
             <p className="font-brand text-sm text-gray-800 leading-snug italic font-medium">
               &quot;{data.dna.voice}&quot;
             </p>
           </div>
        </div>

        {/* --- CARD 6: CONTENT PILLARS --- */}
        <div className="md:col-span-2 bg-black border border-[#333] rounded-[4px] p-6 flex flex-col justify-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 pointer-events-none"
               style={{backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
           <div className="flex justify-between items-center mb-6 z-10">
              <span className="font-os text-xs text-gray-500 tracking-widest">CONTENT_DISTRIBUTION</span>
              <BarChart3 size={16} className="text-gray-600" />
           </div>
           <div className="grid grid-cols-3 gap-4 h-full items-end z-10">
             {data.pillars.slice(0, 3).map((pillar, i) => (
               <div key={i} className="flex flex-col gap-2 h-full justify-end group">
                 <div className="text-xs text-gray-400 font-os text-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                   {pillar.value}%
                 </div>
                 <div className="w-full bg-[#111] rounded-[2px] relative overflow-hidden border border-[#333]" style={{height: '100px'}}>
                   <div
                    style={{height: `${pillar.value}%`}}
                    className={`absolute bottom-0 w-full transition-all duration-1000 ease-out
                      ${i === 0 ? 'bg-white' : i === 1 ? 'bg-[#2E6AFF]' : 'bg-transparent border-t-2 border-x-2 border-white/50'}
                    `}
                   ></div>
                 </div>
                 <span className={`text-center text-xs font-brand font-bold italic tracking-wider ${i===1 ? 'text-[#2E6AFF]' : 'text-white'}`}>
                   {pillar.label}
                 </span>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* CRT Scanline Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" style={{background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%'}}></div>
    </div>
  );
};

export default BrandOSDashboard;
