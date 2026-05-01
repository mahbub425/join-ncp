import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, GripVertical, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { FormField } from '../../types';

export default function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'formFields'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormField));
      setFields(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (field: FormField) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'formFields', field.id), { isHidden: !field.isHidden });
      setFields(fields.map(f => f.id === field.id ? { ...f, isHidden: !f.isHidden } : f));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">ডাইনামিক ফর্ম বিল্ডার</h1>
            <p className="text-gray-500">ডিফল্ট ফিল্ডগুলো হাইড বা নতুন ফিল্ড যোগ করুন</p>
          </div>
          <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all">
            <Plus className="w-5 h-5" />
            নতুন ফিল্ড
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span>অর্ডার</span>
              <span>ফিল্ডের নাম</span>
            </div>
            <span>অ্যাকশন</span>
          </div>
          
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-10 text-center text-gray-400">লোড হচ্ছে...</div>
            ) : fields.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic">এখনো কোনো কাস্টম ফিল্ড যোগ করা হয়নি।</div>
            ) : fields.map((field, index) => (
              <div key={field.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all ${field.isHidden ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50/50'}`}>
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                   <div className="text-gray-300 group-hover:text-gray-500 cursor-move">
                     <GripVertical className="w-5 h-5" />
                   </div>
                   <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-mono font-bold text-gray-500 text-xs">
                     {index + 1}
                   </div>
                   <div className="min-w-0">
                     <p className="font-bold text-gray-900">{field.label}</p>
                     <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">{field.type} • Section {field.section}</p>
                   </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                   <button 
                     onClick={() => toggleVisibility(field)}
                     className={`p-2 rounded-lg transition-all ${field.isHidden ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-emerald-600'}`}
                     title={field.isHidden ? 'দেখুন' : 'হাইড করুন'}
                   >
                     {field.isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                   <button className="p-2 bg-gray-100 text-gray-400 hover:text-red-600 rounded-lg transition-all">
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
          <p className="text-sm text-amber-800 flex items-start gap-3">
            <span className="font-bold">সতর্কতা:</span>
            ডিফল্ট টেমপ্লেট ফিল্ডগুলো ডিলিট করা সম্ভব নয়। প্রয়োজনে আপনি সেগুলোকে হাইড করতে পারেন। কাস্টম ফিল্ডগুলো ফর্মের শেষে যোগ করা হবে।
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
