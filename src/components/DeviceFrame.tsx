import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryMedium, Signal, Download } from 'lucide-react';
import { AndroidInstallModal } from './AndroidInstallModal';

interface DeviceFrameProps {
  children: React.ReactNode;
  activeMode: 'all' | 'personal' | 'business';
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, activeMode }) => {
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Bar Controls for AI Studio / Preview */}
      <header className="w-full bg-slate-950/90 backdrop-blur border-b border-slate-800 py-2 px-4 flex items-center justify-between text-xs text-slate-400 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-100 tracking-tight">SakuKu Android v1.0</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-extrabold">
            Android OS Native
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Install di HP Android</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsMobileFrame(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                isMobileFrame
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan HP Android"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">HP Android</span>
            </button>
            <button
              onClick={() => setIsMobileFrame(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                !isMobileFrame
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Penuh"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Layar Penuh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        {isMobileFrame ? (
          <div className="relative w-full max-w-[412px] h-[100vh] sm:h-[840px] max-h-[100vh] sm:max-h-[880px] bg-slate-950 sm:rounded-[44px] sm:shadow-2xl sm:shadow-blue-900/20 sm:border-[10px] border-slate-800 flex flex-col overflow-hidden transition-all duration-300">
            {/* Camera Notch */}
            <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-50 items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50" />
            </div>

            {/* Android Status Bar */}
            <div className="bg-slate-900 text-slate-200 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs select-none font-medium z-40 border-b border-slate-800/50">
              <span>{currentTime || '09:41'}</span>
              <div className="flex items-center gap-2 text-slate-300">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px]">98%</span>
                  <BatteryMedium className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* App View Content */}
            <div className="flex-1 bg-slate-50 text-slate-900 overflow-y-auto relative flex flex-col">
              {children}
            </div>

            {/* Android Gesture Bar */}
            <div className="bg-slate-900 py-1.5 flex justify-center items-center select-none z-40">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl h-[88vh] bg-slate-50 text-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col relative border border-slate-200">
            {children}
          </div>
        )}
      </main>

      {/* Android Installation Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
};
