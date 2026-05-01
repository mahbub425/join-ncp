import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PageSettings } from '../types';

const CONTACT_PHONE = '01717456107';
const CONTACT_EMAIL = 'ncpbhurungamari@gmail.com';

export default function Home() {
  const currentYearBn = new Date().getFullYear().toLocaleString('bn-BD', { useGrouping: false });
  const [settings, setSettings] = useState<PageSettings>({
    heroTitle: 'জাতীয় নাগরিক পার্টিতে যুক্ত হোন',
    heroSubtitle: 'আপনি যে পরিবর্তন দেখতে চান, সেই পরিবর্তনের অংশ হোন। জাতীয় নাগরিক পার্টি (এনসিপি)-এর সাথে যুক্ত হয়ে একসাথে একটি উন্নত ও সম্ভাবনাময় বাংলাদেশ গড়ে তুলি। সততা, ঐক্য ও অগ্রগতির পথে আমরা একসাথে ইতিবাচক পরিবর্তন আনতে পারি।',
    aboutText: 'আমরা কুড়িগ্রামের মানুষের অধিকার ও সুস্থ রাজনীতির বিকাশে বদ্ধপরিকর।',
    contactPhone: CONTACT_PHONE,
    contactAddress: 'ভূরুঙ্গামারী, কুড়িগ্রাম',
    contactEmail: CONTACT_EMAIL,
    facebookPage: 'https://facebook.com/ncp',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return;
      try {
        const d = await getDoc(doc(db, 'settings', 'home'));
        if (d.exists()) {
          const data = d.data() as PageSettings;
          setSettings({
            ...data,
            contactPhone: !data.contactPhone || data.contactPhone === '01XXXXXXXXX' ? CONTACT_PHONE : data.contactPhone,
            contactEmail: !data.contactEmail || data.contactEmail === 'ncp@example.com' ? CONTACT_EMAIL : data.contactEmail,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfdfb] font-sans text-slate-800 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-lg shadow-ncp/10 shrink-0 overflow-hidden border border-slate-100">
              <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-ncp leading-tight sm:leading-none">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h1>
              <p className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 leading-none">এনসিপি • ভূরুঙ্গামারী শাখা</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-24 overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-ncp/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-ncp-red/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-block max-w-full px-3 sm:px-4 py-1.5 bg-ncp-red/10 text-ncp-red rounded-full text-[9px] sm:text-[10px] font-black tracking-[0.08em] sm:tracking-[0.16em] mb-5 border border-ncp-red/20">
              জাতীয় নাগরিক পার্টি (এনসিপি) • ভূরুঙ্গামারী শাখা
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] mb-6 tracking-tight">
              জাতীয় নাগরিক পার্টিতে যুক্ত হোন
            </h2>
            <p className="text-lg sm:text-xl text-slate-700 mb-5 max-w-3xl mx-auto leading-relaxed font-semibold">
              আপনি যে পরিবর্তন দেখতে চান, সেই পরিবর্তনের অংশ হোন।
            </p>
            <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-3xl mx-auto leading-8">
              জাতীয় নাগরিক পার্টি (এনসিপি)-এর সাথে যুক্ত হয়ে একসাথে একটি উন্নত ও সম্ভাবনাময় বাংলাদেশ গড়ে তুলি। সততা, ঐক্য ও অগ্রগতির পথে আমরা একসাথে ইতিবাচক পরিবর্তন আনতে পারি।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/apply" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-10 py-4 sm:py-5 bg-ncp text-white font-bold rounded shadow-xl shadow-ncp/20 hover:opacity-90 transition-all transform hover:-translate-y-1"
              >
                সদস্য হতে আবেদন করুন
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-10 py-4 sm:py-5 bg-white border border-slate-200 text-slate-600 font-bold rounded shadow-sm hover:bg-slate-50 transition-all"
              >
                বিস্তারিত জানুন
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 bg-white relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 xl:gap-20 items-center">
          <div className="relative">
             <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-200">
                <img
                  src="/ncp-join-reference.png"
                  alt="জাতীয় নাগরিক পার্টিতে যোগ দিন"
                  className="w-full h-full object-cover"
                />
             </div>
          </div>
          <div>
            <div className="w-12 h-1 bg-ncp-red mb-6"></div>
            <p className="text-sm font-black text-ncp-red mb-3 tracking-[0.22em]">সততা • ঐক্য • অগ্রগতি</p>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">জাতীয় নাগরিক পার্টি (এনসিপি/জনপা)-এর অঙ্গীকার!</h3>
            <div className="space-y-5 text-base sm:text-lg text-slate-600 leading-8 mb-8">
              <p>
                ২০২৪ সালের জুলাইয়ের গণঅভ্যুত্থান থেকে জন্ম নেওয়া জাতীয় নাগরিক পার্টি (এনসিপি) হলো বাংলাদেশের প্রথম ছাত্র-নেতৃত্বাধীন রাজনৈতিক দল।
              </p>
              <p>
                ২০২৫ সালের ২৮ ফেব্রুয়ারি প্রতিষ্ঠিত এই দলটি দুর্নীতি নির্মূল, জাতীয় ঐক্য গড়ে তোলা এবং প্রতিটি নাগরিকের জন্য অগ্রগতি নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ।
              </p>
              <p>
                নাহিদ ইসলামের নেতৃত্বে গড়ে ওঠা এই দলটি ফ্যাসিবাদ ও বৈষম্যবিরোধী আদর্শে বিশ্বাসী।
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div className="flex items-start gap-4">
                  <div className="mt-1 w-5 h-5 bg-ncp text-white rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">দুর্নীতিমুক্ত জনবান্ধব রাজনীতি</p>
               </div>
               <div className="flex items-start gap-4">
                  <div className="mt-1 w-5 h-5 bg-ncp text-white rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">বৈষম্যবিরোধী জাতীয় ঐক্য</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-150">
           <LayoutDashboard className="w-[500px] h-[500px]" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
           <div className="lg:col-span-12 mb-10">
              <h4 className="text-xs font-black text-ncp-red uppercase tracking-[0.4em] mb-4">Get In Touch</h4>
              <h3 className="text-3xl sm:text-4xl font-black mb-2">যোগাযোগ করুন</h3>
              <p className="text-slate-400 max-w-2xl">আপনার যেকোনো জিজ্ঞাসা বা মতামতের জন্য আমাদের সাথে যোগাযোগ করুন। আমরা আপনার পাশে আছি।</p>
           </div>
           
           <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
              <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Call Us</p>
                 <p className="text-lg font-bold">{settings.contactPhone}</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Email Us</p>
                 <p className="text-lg font-bold break-all">{settings.contactEmail}</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Office</p>
                 <p className="text-sm font-bold">{settings.contactAddress}</p>
              </div>
           </div>

           <div className="lg:col-span-4">
              <div className="p-8 bg-ncp rounded-xl border border-white/10 text-center flex flex-col items-center justify-center shadow-2xl">
                 <h5 className="font-black text-lg mb-4">আমাদের সোশ্যাল মিডিয়া</h5>
                 <p className="text-xs text-white/70 mb-8 leading-relaxed">নিয়মিত আপডেট পেতে আমাদের ফেসবুক পেজে যুক্ত থাকুন।</p>
                 <a href="https://www.facebook.com/NcpBhurungamari/" target="_blank" rel="noreferrer" className="w-full py-4 bg-white text-ncp font-black rounded uppercase tracking-tighter hover:bg-slate-50 transition-all">ফেসবুক পেজে যান</a>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#fdfdfb] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-100">
                <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা • {currentYearBn}</p>
          </div>
          <div className="flex gap-8">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">সকল স্বত্ব সংরক্ষিত</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Developed by{' '}
               <a
                 href="https://www.facebook.com/mahbubul.isam/"
                 target="_blank"
                 rel="noreferrer"
                 className="text-ncp hover:text-ncp-red transition-colors"
               >
                 Md Mahbub Ul Islam
               </a>
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
