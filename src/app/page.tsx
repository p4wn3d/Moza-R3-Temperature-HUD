'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Thermometer, MousePointer2, X, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface Telemetry {
  controller: number;
  mos: number;
  motor: number;
}

interface HistoryPoint {
  controller: number;
  mos: number;
  motor: number;
}

export default function HUD() {
  const [data, setData] = useState<Telemetry>({
    controller: 0,
    mos: 0,
    motor: 0,
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(async () => {
      try {
        const telemetry: Telemetry = await invoke('get_telemetry');
        setData(telemetry);
        setHistory(prev => {
          const newPoint = { ...telemetry };
          const newHistory = [...prev, newPoint];
          // 5 minutes @ 3s interval = 100 points
          if (newHistory.length > 100) return newHistory.slice(1);
          return newHistory;
        });
      } catch (e) {
        console.error("Telemetry failed", e);
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  const toggleClickThrough = async () => {
    const newState = !isClickThrough;
    setIsClickThrough(newState);
    await invoke('set_click_through', { ignore: newState });
  };

  const closeApp = async () => {
    await invoke('exit_app');
  };

  if (!mounted) return null;

  const getTempColor = (temp: number) => temp >= 50 ? 'text-[#FF5F00]' : 'text-white';

  return (
    <main className="h-screen w-screen p-2 flex flex-col font-sans select-none overflow-hidden bg-transparent">
      {/* HUD Container */}
      <div 
        className="racing-glass rounded-xl p-3 flex flex-col gap-2 relative border-l-4 border-l-[#FF5F00] shadow-2xl transition-all"
      >
        {/* Header / Drag Handle */}
        <div 
          data-tauri-drag-region
          className="flex justify-between items-center cursor-move h-6"
        >
          <div data-tauri-drag-region className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF5F00] animate-pulse" />
            <span data-tauri-drag-region className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Moza HUD</span>
          </div>
          <div className="flex gap-1">
             <button 
              onClick={() => setShowGraph(!showGraph)}
              className="p-1 rounded-md bg-white/5 text-gray-400 hover:bg-white/20 transition-colors"
              title="Toggle Graph"
            >
              {showGraph ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button 
              onClick={toggleClickThrough}
              className={`p-1 rounded-md transition-colors ${isClickThrough ? 'bg-[#FF5F00] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/20'}`}
              title="Toggle Click-through"
            >
              <MousePointer2 size={12} />
            </button>
            <button 
              onClick={closeApp}
              className="p-1 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* 3 Temperatures Grid */}
        <div className="grid grid-cols-3 gap-1">
          {/* Controller */}
          <div className="flex flex-col">
            <span className="text-[7px] uppercase text-gray-500 font-bold">Controller</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black italic transition-colors duration-500 ${getTempColor(data.controller)}`}>
                {data.controller.toFixed(0)}
              </span>
              <span className="text-[9px] text-[#FF5F00] font-bold">°C</span>
            </div>
          </div>
          
          {/* MOS */}
          <div className="flex flex-col border-x border-white/5 px-2">
            <span className="text-[7px] uppercase text-gray-500 font-bold">MOS</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black italic transition-colors duration-500 ${getTempColor(data.mos)}`}>
                {data.mos.toFixed(1)}
              </span>
              <span className="text-[9px] text-[#FF5F00] font-bold">°C</span>
            </div>
          </div>

          {/* Motor */}
          <div className="flex flex-col">
            <span className="text-[7px] uppercase text-gray-500 font-bold">Motor</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black italic transition-colors duration-500 ${getTempColor(data.motor)}`}>
                {data.motor.toFixed(1)}
              </span>
              <span className="text-[9px] text-[#FF5F00] font-bold">°C</span>
            </div>
          </div>
        </div>

        {/* Multi-line History Graph */}
        {showGraph && (
          <div className="flex flex-col gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex justify-between items-center text-[7px] text-gray-600 uppercase font-bold">
              <div className="flex gap-2">
                <span className="flex items-center gap-1"><div className="w-1 h-1 bg-blue-500" /> CTRL</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500" /> MOS</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[#FF5F00]" /> MOT</span>
              </div>
              <span className="flex items-center gap-1"><Activity size={8} /> 5M Trend</span>
            </div>
            <div className="h-12 w-full relative bg-black/30 rounded overflow-hidden p-1 border border-white/5">
               <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                 {/* Controller Graph (Blue) */}
                 <path
                   d={`M ${history.map((p, i) => `${(i / Math.max(history.length - 1, 1)) * 100},${40 - ((p.controller - 20) / 60) * 40}`).join(' L ')}`}
                   fill="none"
                   stroke="#3B82F6"
                   strokeWidth="1"
                   strokeOpacity="0.8"
                   className="transition-all duration-300"
                 />
                 {/* MOS Graph (Emerald) */}
                 <path
                   d={`M ${history.map((p, i) => `${(i / Math.max(history.length - 1, 1)) * 100},${40 - ((p.mos - 20) / 60) * 40}`).join(' L ')}`}
                   fill="none"
                   stroke="#10B981"
                   strokeWidth="1"
                   strokeOpacity="0.8"
                   className="transition-all duration-300"
                 />
                 {/* Motor Graph (Orange) */}
                 <path
                   d={`M ${history.map((p, i) => `${(i / Math.max(history.length - 1, 1)) * 100},${40 - ((p.motor - 20) / 60) * 40}`).join(' L ')}`}
                   fill="none"
                   stroke="#FF5F00"
                   strokeWidth="1.5"
                   className="transition-all duration-300"
                 />
               </svg>
            </div>
          </div>
        )}
      </div>

      <div data-tauri-drag-region className="mt-1 text-[7px] text-gray-600 uppercase flex justify-center gap-2 opacity-30 cursor-move">
        <span>Resizing Enabled</span>
        <span className="border-x border-white/10 px-2">Click-through Available</span>
        <span>Drag anywhere to move</span>
      </div>
    </main>
  );
}
