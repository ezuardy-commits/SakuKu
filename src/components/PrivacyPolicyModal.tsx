import React, { useState } from 'react';
import { ShieldCheck, FileText, X, Globe, Lock, Trash2, Camera, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'datasafety';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'datasafety'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  {language === 'en' ? 'Legal & Privacy Policy' : 'Kebijakan Privasi & Syarat Ketentuan'}
                </h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  Google Play Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                SakuKu — Play Store Global Policy Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Language Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-[10px] font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'en' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLanguage('id')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'id' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇩 ID
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tab Selector */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 grid grid-cols-3 gap-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Terms of Service' : 'Syarat & Ketentuan'}</span>
          </button>

          <button
            onClick={() => setActiveTab('datasafety')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'datasafety'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Data Safety' : 'Keamanan Data'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-blue-950">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs">
                    {language === 'en' ? 'Google Play Developer Policy Compliant Privacy Policy' : 'Kebijakan Privasi Sesuai Standar Google Play Store'}
                  </h4>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    {language === 'en'
                      ? 'Last Updated: August 11, 2026. Effective globally for all Google Play Store users.'
                      : 'Terakhir diperbarui: 11 Agustus 2026. Berlaku secara global untuk pengguna Google Play Store.'}
                  </p>
                </div>
              </div>

              {language === 'en' ? (
                <>
                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">1. Overview & Data Controller</h5>
                    <p>
                      <strong>SakuKu Financial Bookkeeping</strong> ("we", "our", or "us") is committed to protecting your financial privacy. This Privacy Policy discloses how our application collects, uses, processes, and protects your personal and financial information when you install and use SakuKu across global Android and web platforms.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">2. Information We Collect</h5>
                    <p>We strictly limit data collection to what is necessary for managing your personal and business financial bookkeeping:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Financial Records:</strong> Transaction amounts, dates, income/expense categories, payment account names, notes, and budget targets entered manually or scanned via receipt OCR.</li>
                      <li><strong>Camera & Media Files:</strong> Temporary images of shopping receipts, invoices, bank statements, or handwritten notes captured via camera or selected from photo gallery for AI Vision OCR scanning.</li>
                      <li><strong>App Settings & Preferences:</strong> Selected main currency, language preferences, theme options, and notification settings stored locally on your device.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">3. How We Use Camera & Storage Permissions</h5>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2">
                      <Camera className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600">
                        <strong>Camera Access Permission (<code className="bg-slate-200 px-1 rounded">android.permission.CAMERA</code>):</strong> Used solely when you intentionally trigger the receipt/statement scanner to capture photos of financial documents. Images are processed transiently to extract numbers and vendor names, and are never transmitted to unauthorized third parties or used for facial advertising or tracking.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">4. Use of Google Gemini AI Vision API</h5>
                    <p>
                      When using the automated receipt scanner, image bytes are processed via secure server-side Google Gemini Vision API calls. The data is processed strictly in-memory to extract text, totals, and dates for your ledger, and is immediately discarded afterwards. We do NOT sell, rent, or trade your document images or financial data to any third party.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">5. Data Storage, Security & Encryption</h5>
                    <p>
                      Your financial ledgers are saved securely on your local device storage (<code className="bg-slate-100 px-1 rounded">IndexedDB / LocalStorage</code>). For users utilizing cloud backup features, data is encrypted in transit using standard TLS 1.3 encryption.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">6. User Control & Data Deletion Rights</h5>
                    <p>
                      In compliance with Google Play Data Safety policies and GDPR, you maintain complete ownership of your data. You may export your records to Excel/PDF or permanently delete all local transaction data and accounts at any time via <strong>Settings → Reset All Data</strong> in the application.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">7. Children's Privacy</h5>
                    <p>
                      SakuKu is not directed toward children under 13 years of age. We do not knowingly collect personal identifiable information from children.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">8. Privacy Contact</h5>
                    <p>
                      If you have questions regarding this Privacy Policy or data security practices, contact us at: <a href="mailto:support@sakuku.app" className="text-blue-600 font-bold underline">support@sakuku.app</a>.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">1. Ringkasan & Pengontrol Data</h5>
                    <p>
                      <strong>SakuKu Pencatatan Keuangan</strong> ("kami") berkomitmen penuh melindungi privasi data keuangan Anda. Kebijakan Privasi ini menjelaskan bagaimana aplikasi kami mengumpulkan, menggunakan, memproses, dan melindungi informasi keuangan pribadi maupun bisnis Anda di Google Play Store seluruh dunia.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">2. Informasi yang Kami Kumpulkan</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Catatan Keuangan:</strong> Nominal transaksi, tanggal, kategori pemasukan/pengeluaran, nama akun kas/bank, catatan, dan target anggaran.</li>
                      <li><strong>Kamera & Berkas Media:</strong> Gambar struk belanja, screenshot mutasi bank, atau catatan tulisan tangan yang Anda foto secara khusus untuk dipindai oleh AI OCR.</li>
                      <li><strong>Pengaturan Aplikasi:</strong> Pilihan mata uang utama, bahasa, tema, dan notifikasi pengingat harian.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">3. Penggunaan Izin Kamera</h5>
                    <p>
                      Izin kamera (<code className="bg-slate-100 px-1 rounded">android.permission.CAMERA</code>) hanya digunakan saat Anda menekan tombol pemindaian struk untuk mengambil foto dokumen fisik. Foto hanya diproses sementara untuk membaca angka nominal dan tidak digunakan untuk pelacakan iklan.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">4. Hak Pengguna & Hapus Data</h5>
                    <p>
                      Sesuai dengan kebijakan Google Play Data Safety, Anda berhak mengekspor data ke Excel/PDF atau menghapus seluruh catatan keuangan kapan saja melalui tombol <strong>Pengaturan → Reset / Hapus Data</strong>.
                    </p>
                  </section>
                </>
              )}
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-indigo-950">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs">
                    {language === 'en' ? 'Terms of Service & Usage Agreement' : 'Syarat & Ketentuan Penggunaan Aplikasi'}
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    {language === 'en'
                      ? 'Please review these terms before using SakuKu.'
                      : 'Harap baca syarat dan ketentuan ini sebelum menggunakan SakuKu.'}
                  </p>
                </div>
              </div>

              {language === 'en' ? (
                <>
                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">1. Acceptance of Terms</h5>
                    <p>
                      By downloading, accessing, or using SakuKu, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">2. Financial Bookkeeping Disclaimer</h5>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px] font-medium">
                      <strong>Important Notice:</strong> SakuKu is a personal and small business bookkeeping management tool designed for record-keeping and budgeting purposes only. SakuKu is NOT a bank, credit provider, investment institution, or certified tax/financial advisory service. Users remain solely responsible for the accuracy of their manual entries and business tax compliance.
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">3. User Responsibilities & Acceptable Use</h5>
                    <p>
                      You agree not to use SakuKu for fraudulent financial activities, money laundering, or illegal transaction logging. You are responsible for maintaining the confidentiality of your device and app PIN locks.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">4. Intellectual Property</h5>
                    <p>
                      All software code, graphic designs, trademarks, logos, and AI scanning interfaces in SakuKu are protected by copyright and intellectual property laws.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">5. Limitation of Liability</h5>
                    <p>
                      To the maximum extent permitted by applicable law, SakuKu and its developers shall not be liable for any indirect, incidental, or consequential damages resulting from data loss, device hardware failures, or inaccuracies in receipt OCR scans.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">1. Penerimaan Syarat</h5>
                    <p>
                      Dengan mengunduh dan menggunakan aplikasi SakuKu, Anda menyetujui seluruh Syarat & Ketentuan Penggunaan ini.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">2. Penafian Layanan Keuangan</h5>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px] font-medium">
                      <strong>Pemberitahuan Penting:</strong> SakuKu adalah alat bantu pencatatan kas dan anggaran pribadi/UMKM. SakuKu bukan lembaga perbankan, penyedia pinjaman, atau konsultan pajak resmi. Pengguna bertanggung jawab penuh atas kebenaran input data.
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* TAB 3: DATA SAFETY & PLAY STORE COMPLIANCE TABLE */}
          {activeTab === 'datasafety' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-emerald-950">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs">
                    {language === 'en' ? 'Google Play Data Safety Disclosures' : 'Deklarasi Keamanan Data Google Play'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {language === 'en'
                      ? 'Detailed breakdown of collected and shared data types as declared on Google Play Console.'
                      : 'Rincian pengumpulan dan keamanan data sebagaimana dideklarasikan di Google Play Console.'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <th className="p-2.5">Data Type</th>
                      <th className="p-2.5">Collected?</th>
                      <th className="p-2.5">Shared?</th>
                      <th className="p-2.5">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Financial Info (Transactions & Accounts)</td>
                      <td className="p-2.5 text-emerald-700 font-extrabold">Yes (Local)</td>
                      <td className="p-2.5 text-slate-500 font-bold">No</td>
                      <td className="p-2.5">App functionality (Personal/UMKM Bookkeeping)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Photos & Videos (Receipt Scans)</td>
                      <td className="p-2.5 text-emerald-700 font-extrabold">Yes (Transient)</td>
                      <td className="p-2.5 text-slate-500 font-bold">No (Transient AI)</td>
                      <td className="p-2.5">Receipt & Statement OCR Recognition</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">App Info & Preferences</td>
                      <td className="p-2.5 text-emerald-700 font-extrabold">Yes (Local)</td>
                      <td className="p-2.5 text-slate-500 font-bold">No</td>
                      <td className="p-2.5">Currency, language, theme preferences</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Personal Identifiers (Email/Phone)</td>
                      <td className="p-2.5 text-slate-500 font-bold">Optional</td>
                      <td className="p-2.5 text-slate-500 font-bold">No</td>
                      <td className="p-2.5">Cloud sync & customer support</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {language === 'en' ? 'Security Practices' : 'Praktik Keamanan'}
                </h5>
                <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                  <li>Data is encrypted in transit using standard HTTPS/TLS protocols.</li>
                  <li>Users can request complete data deletion directly inside the app.</li>
                  <li>No financial data is sold to 3rd-party data brokers or advertising networks.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>SakuKu Global Compliance</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            {language === 'en' ? 'I Understand & Agree' : 'Saya Mengerti & Setuju'}
          </button>
        </div>

      </div>
    </div>
  );
};
