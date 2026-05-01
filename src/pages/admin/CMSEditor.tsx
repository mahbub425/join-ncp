import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { PageSettings } from '../../types';

const CONTACT_PHONE = '01717456107';
const CONTACT_EMAIL = 'ncpbhurungamari@gmail.com';

export default function CMSEditor() {
  const [settings, setSettings] = useState<PageSettings>({
    heroTitle: 'নতুন দিন, নতুন রাজনীতির আগামীর প্রতিশ্রুতি',
    heroSubtitle: 'জাতীয় নাগরিক পার্টি (এনসিপি), ভূরুঙ্গামারী শাখা।',
    aboutText: 'আমরা কুড়িগ্রামের মানুষের অধিকার ও সুস্থ রাজনীতির বিকাশে বদ্ধপরিকর।',
    contactPhone: CONTACT_PHONE,
    contactAddress: 'ভূরুঙ্গামারী, কুড়িগ্রাম',
    contactEmail: CONTACT_EMAIL,
    facebookPage: 'https://facebook.com/ncp',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await setDoc(doc(db, 'settings', 'home'), settings);
      setMsg({ type: 'success', text: 'সেটিংস সফলভাবে সেভ করা হয়েছে!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'সেভ করতে সমস্যা হয়েছে।' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="text-center py-20">লোড হচ্ছে...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">হোম পেজ এডিটর</h1>
          <p className="text-gray-500">পাবলিক হোম পেজের কনটেন্ট পরিবর্তন করুন</p>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-medium border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 space-y-8">
           <div className="space-y-6">
              <h3 className="font-bold text-gray-900 border-b pb-2">হিরো সেকশন</h3>
              <div className="grid grid-cols-1 gap-6">
                 <Input 
                   label="প্রধান শিরোনাম (Hero Title)" 
                   value={settings.heroTitle} 
                   onChange={(e: any) => setSettings({...settings, heroTitle: e.target.value})} 
                 />
                 <Input 
                   label="উপ-শিরোনাম (Hero Subtitle)" 
                   value={settings.heroSubtitle} 
                   onChange={(e: any) => setSettings({...settings, heroSubtitle: e.target.value})} 
                 />
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="font-bold text-gray-900 border-b pb-2">আমাদের সম্পর্কে</h3>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-sm font-semibold text-gray-700">বিস্তারিত টেক্সট</label>
                <textarea 
                  value={settings.aboutText} 
                  onChange={(e) => setSettings({...settings, aboutText: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[150px]"
                />
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="font-bold text-gray-900 border-b pb-2">যোগাযোগ তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label="মোবাইল" value={settings.contactPhone} onChange={(e: any) => setSettings({...settings, contactPhone: e.target.value})} />
                 <Input label="ইমেইল" value={settings.contactEmail} onChange={(e: any) => setSettings({...settings, contactEmail: e.target.value})} />
                 <Input label="ঠিকানা" value={settings.contactAddress} onChange={(e: any) => setSettings({...settings, contactAddress: e.target.value})} />
                 <Input label="ফেসবুক পেজ লিংক" value={settings.facebookPage} onChange={(e: any) => setSettings({...settings, facebookPage: e.target.value})} />
              </div>
           </div>

           <button 
             type="submit" 
             disabled={saving}
             className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
           >
             <Save className="w-5 h-5" />
             {saving ? 'সেভ হচ্ছে...' : 'পরিবর্তনগুলো সেভ করুন'}
           </button>
        </form>
      </div>
    </AdminLayout>
  );
}

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <input 
      {...props} 
      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
    />
  </div>
);
