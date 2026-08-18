import React, { useState } from 'react';
import { Smartphone, Download, X, CheckCircle2, ShieldCheck, Copy, Terminal, ExternalLink, ArrowRight, Play, QrCode } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pwa' | 'capacitor'>('pwa');

  if (!isOpen) return null;

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const capacitorCommands = [
    'npm install @capacitor/core @capacitor/cli @capacitor/android',
    'npx cap init SakuKu com.sakuku.app --web-dir dist',
    'npm run build',
    'npx cap add android',
    'npx cap open android',
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  {language === 'en' ? 'SakuKu Android App Installation' : 'Pemasangan Aplikasi Android SakuKu'}
                </h3>
                <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  APK READY
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                {language === 'en'
                  ? 'Run as a native Android App on your phone or build Play Store APK'
                  : 'Jalankan sebagai Aplikasi Android Native di HP Anda atau buat APK Play Store'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 grid grid-cols-2 gap-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'en' ? '1-Tap Mobile Install (APK)' : '1-Klik Install di HP Android'}</span>
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'capacitor'
                ? 'bg-slate-800 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{language === 'en' ? 'Build Android Studio APK' : 'Build APK Android Studio'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'pwa' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-950">
                    {language === 'en'
                      ? 'Instant Mobile Installation (Android Standalone App)'
                      : 'Pemasangan Langsung di Smartphone Android'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {language === 'en'
                      ? 'SakuKu includes full Web App Manifest & Service Worker capabilities. You can install it directly onto your Android home screen as a standalone app.'
                      : 'SakuKu sudah dilengkapi Web App Manifest Android. Anda dapat memasangnya langsung ke layar utama HP Android sebagai aplikasi mandiri.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  {language === 'en' ? 'How to install on Android Chrome:' : 'Langkah Pemasangan di HP Android (Chrome / Browser):'}
                </h5>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">
                        {language === 'en' ? 'Open in Android Mobile Browser' : 'Buka di Browser HP Android'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Open this URL inside Google Chrome or Samsung Internet on your Android phone.'
                          : 'Buka URL aplikasi ini di Google Chrome atau Samsung Internet pada smartphone Android Anda.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">
                        {language === 'en' ? 'Tap Chrome Options Menu (⋮)' : 'Tekan Menu Opsi Chrome (Titik 3 / ⋮)'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'Tap the 3 dots menu at the top right of your Chrome browser screen.'
                          : 'Tekan tombol titik tiga (⋮) di sudut kanan atas layar Chrome HP Anda.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">
                        {language === 'en' ? 'Select "Add to Home Screen" or "Install App"' : 'Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi"'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {language === 'en'
                          ? 'The SakuKu icon will be created on your Android apps list and home screen, running full-screen without address bars.'
                          : 'Ikon SakuKu akan muncul di daftar aplikasi HP Android Anda, berjalan full screen layaknya aplikasi APK native.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-extrabold text-xs block">
                      {language === 'en' ? 'Offline Data & Camera OCR Ready' : 'Dukungan Kamera OCR & Mode Offline'}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {language === 'en' ? 'All records saved securely on your phone' : 'Semua data kas tersimpan aman di HP Anda'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold rounded-lg">
                  READY
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-extrabold text-xs text-amber-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {language === 'en' ? 'Convert to Google Play Store APK / AAB via Capacitor' : 'Ubah ke File APK / AAB Play Store via Capacitor'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {language === 'en'
                    ? 'Execute these commands in your project folder to generate an Android Studio project and build a signed .apk file.'
                    : 'Jalankan perintah ini di folder proyek Anda untuk menghasilkan proyek Android Studio dan membuat file .apk.'}
                </p>
              </div>

              <div className="space-y-2">
                {capacitorCommands.map((cmd, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] flex items-center justify-between gap-2 text-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span className="truncate">{cmd}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(cmd, idx)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-sans font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-[11px] text-blue-950 space-y-1">
                <strong>{language === 'en' ? 'Package ID Name:' : 'Nama Package ID Android:'}</strong>
                <p className="font-mono bg-blue-100/60 p-1.5 rounded text-blue-900">
                  com.sakuku.app
                </p>
                <p className="text-[10px] text-blue-800 mt-1">
                  {language === 'en'
                    ? 'You can upload the resulting app-release.aab file directly to your Google Play Developer Console.'
                    : 'Anda dapat mengupload file app-release.aab yang dihasilkan langsung ke Google Play Developer Console.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            SakuKu Android OS Mobile Edition
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            {language === 'en' ? 'Close Guide' : 'Tutup Panduan'}
          </button>
        </div>

      </div>
    </div>
  );
};
