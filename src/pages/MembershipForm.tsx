import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submissionSchema, SubmissionFormData } from '../lib/validations';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Camera, Upload, Check, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import { bnToEnDigits } from '../lib/utils';

export default function MembershipForm() {
  const currentYearBn = new Date().getFullYear().toLocaleString('bn-BD', { useGrouping: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formNumber, setFormNumber] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      experience: {
        politicalAffiliation: false,
        orgExperience: false
      }
    }
  });

  const formData = watch();
  const isPolitical = watch('experience.politicalAffiliation');
  const isSocial = watch('experience.orgExperience');
  const sameAddress = watch('sameAsPermanent' as any);

  // Auto-save logic
  useEffect(() => {
    const saved = localStorage.getItem('ncp_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        reset(parsed);
        if (parsed.personal?.photoUrl) {
          setImagePreview(parsed.personal.photoUrl);
        }
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  }, [reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('ncp_form_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("ছবির সাইজ ২ মেগাবাইটের বেশি হওয়া যাবে না");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setValue('personal.photoUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const syncAddress = (checked: boolean) => {
    if (checked) {
      const perm = watch('permanentAddress');
      setValue('presentAddress.village', perm.village);
      setValue('presentAddress.union', perm.union);
      setValue('presentAddress.post', perm.post);
      setValue('presentAddress.thana', perm.thana);
      setValue('presentAddress.upazila', perm.upazila);
      setValue('presentAddress.district', perm.district);
    }
  };


  const onSubmit = async (data: SubmissionFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!db) {
        throw new Error("ফায়ারবেস ডাটাবেস সেটআপ করা নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন। (Firebase is NOT connected)");
      }

      const generatedFormNo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Normalize Bengali digits to English for storage to ensure consistency
      const normalizedData = {
        ...data,
        personal: {
          ...data.personal,
          nid: bnToEnDigits(data.personal.nid),
        },
        contact: {
          ...data.contact,
          mobile: bnToEnDigits(data.contact.mobile),
        }
      };

      const payload = {
        ...normalizedData,
        formNo: generatedFormNo,
        status: 'New',
        submittedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'submissions'), payload);
      localStorage.removeItem('ncp_form_draft');
      setFormNumber(generatedFormNo);
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "সাবমিট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
      setError(errorMessage);
      try { handleFirestoreError(err, OperationType.CREATE, 'submissions'); } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white border border-slate-200 rounded-xl shadow-2xl p-6 sm:p-10 text-center relative overflow-hidden"
        >
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-ncp/5 rounded-bl-full -mr-16 -mt-16"></div>
          
          <div className="w-24 h-24 bg-ncp/10 text-ncp rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tighter">সফলভাবে জমা হয়েছে!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখার সাথে যুক্ত হতে আগ্রহ প্রকাশ করার জন্য ধন্যবাদ। আপনার আবেদনটি আমাদের ডাটাবেসে অন্তর্ভুক্ত হয়েছে।
          </p>
          <div className="bg-slate-50 p-8 rounded-lg border border-slate-100 mb-10 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-ncp-red"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ইউনিক ফর্ম নম্বর (Your Form ID)</p>
            <p className="text-3xl sm:text-5xl font-mono font-black text-ncp tracking-tighter break-all">NCP-{formNumber}</p>
          </div>
          <Link 
            to="/" 
            className="inline-block w-full py-4 bg-ncp text-white font-bold rounded shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-xs"
          >
            হোম পেজে ফিরে যান
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfb] py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b-4 border-ncp">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border border-slate-100 shrink-0">
               <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
             </div>
             <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter leading-tight">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mt-1">সদস্য সংগ্রহ ফরম • {currentYearBn}</p>
             </div>
          </div>
          <Link to="/" className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded text-xs font-bold hover:bg-slate-50 transition-all uppercase tracking-tighter flex items-center gap-2">
            ← ফিরে যান (Back)
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 sm:space-y-12 bg-white p-5 sm:p-12 border border-slate-200 rounded-xl shadow-sm relative overflow-hidden group">
          {/* Section A: Personal Info */}
          <Section title="A. পরিচিতি (Personal Info)">
            <div className="flex flex-col-reverse md:flex-row gap-x-12 gap-y-8">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input label="পুরো নাম" {...register('personal.name')} error={errors.personal?.name?.message} />
                <Input label="জাতীয় পরিচয়পত্র নম্বর (NID)" {...register('personal.nid')} error={errors.personal?.nid?.message} />
                <Input label="পিতার নাম" {...register('personal.fatherName')} error={errors.personal?.fatherName?.message} />
                <Input label="মাতার নাম" {...register('personal.motherName')} error={errors.personal?.motherName?.message} />
                <Input label="জন্ম তারিখ" type="date" {...register('personal.dob')} error={errors.personal?.dob?.message} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="রক্তের গ্রুপ" {...register('personal.bloodGroup')} error={errors.personal?.bloodGroup?.message} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                  <Select label="লিঙ্গ" {...register('personal.gender')} error={errors.personal?.gender?.message} options={['পুরুষ', 'মহিলা', 'অন্যান্য']} />
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="flex flex-col items-center">
                 <div className="w-40 h-48 border-2 border-dashed border-slate-200 rounded-lg relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center group cursor-pointer transition-all hover:bg-slate-100 hover:border-ncp" onClick={() => document.getElementById('photo-upload')?.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <User className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">ছবি আপলোড</span>
                        <Upload className="w-4 h-4 mt-2 opacity-50 group-hover:text-ncp group-hover:scale-110 transition-all" />
                      </div>
                    )}
                    <input 
                      id="photo-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                 </div>
                 <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-tight">পাসপোর্ট সাইজ ছবি (Max 2MB)</p>
              </div>
            </div>
          </Section>

          {/* Section B: Education */}
          <Section title="B. শিক্ষাগত যোগ্যতা (Education)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="সর্বোচ্চ শিক্ষাগত যোগ্যতা" {...register('education.qualification')} />
              <Input label="প্রতিষ্ঠানের নাম" {...register('education.institute')} />
            </div>
          </Section>

          {/* Section C & D: Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
            <Section title="C. স্থায়ী ঠিকানা">
              <AddressFields prefix="permanentAddress" register={register} errors={errors} />
            </Section>
            <Section title="D. বর্তমান ঠিকানা">
              <div className="mb-4">
                <Checkbox 
                  label="স্থায়ী ও বর্তমান ঠিকানা একই?" 
                  {...register('sameAsPermanent' as any)} 
                  onChange={(e: any) => {
                    register('sameAsPermanent' as any).onChange(e);
                    syncAddress(e.target.checked);
                  }}
                />
              </div>
              <AddressFields prefix="presentAddress" register={register} errors={errors} />
            </Section>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Section E: Profession */}
          <Section title="E. পেশা ও যোগাযোগ (Profession & Contact)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Select 
                label="পেশা" 
                {...register('profession.occupation')} 
                options={[
                  'ছাত্র', 'চাকুরীজীবী', 'ব্যবসায়ী', 'কৃষক', 'সাংবাদিক', 
                  'আইনজীবী', 'চিকিৎসক', 'প্রকৌশলী', 'শিক্ষক', 'বেকার', 'অন্যান্য'
                ]} 
              />
              <Input label="কর্মস্থল" {...register('profession.workplace')} />
              <Input label="মোবাইল নম্বর (আবশ্যক)" {...register('contact.mobile')} error={errors.contact?.mobile?.message} />
              <Input label="ইমেইল (যদি থাকে)" {...register('contact.email')} error={errors.contact?.email?.message} />
              <div className="md:col-span-2">
                <Input label="ফেসবুক প্রোফাইল লিংক" {...register('contact.facebook')} placeholder="https://facebook.com/yourprofile" />
              </div>
            </div>
          </Section>

          {/* Section G: Experience */}
          <Section title="G. সম্পৃক্ততা (Involvement)">
             <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-100">
                  <div className="space-y-4">
                    <Checkbox label="পূর্ব রাজনৈতিক সংশ্লিষ্টতা আছে?" {...register('experience.politicalAffiliation')} />
                    <AnimatePresence>
                      {isPolitical && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <Input label="রাজনৈতিক সংগঠনের নাম" {...register('experience.politicalOrgName')} placeholder="সংগঠনের নাম লিখুন" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-4">
                    <Checkbox label="সামাজিক সংগঠনের অভিজ্ঞতা আছে?" {...register('experience.orgExperience')} />
                    <AnimatePresence>
                      {isSocial && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <Input label="সামাজিক সংগঠনের নাম" {...register('experience.socialOrgName')} placeholder="সংগঠনের নাম লিখুন" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
             </div>
          </Section>

          {/* Section H: Intent */}
          <Section title="H. ইচ্ছা ও অবদান (Intent)">
            <div className="space-y-6">
              <Input label="যে এলাকায় কাজ করতে ইচ্ছুক" {...register('intent.workArea')} />
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">আপনি পার্টিতে কীভাবে অবদান রাখতে চান?</label>
                <textarea 
                  {...register('intent.contribution')}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-ncp focus:border-ncp transition-all min-h-[120px] text-sm"
                  placeholder="আপনার মতামত এখানে লিখুন..."
                />
              </div>
            </div>
          </Section>

          <Section title="I. আবেদনকারীর স্বাক্ষর">
            <Input
              label="স্বাক্ষর লিখুন"
              {...register('applicantSignature')}
              error={errors.applicantSignature?.message}
              placeholder="আপনার নাম/স্বাক্ষর লিখুন"
              className="signature-input"
            />
          </Section>

          {/* Section I: Commitment */}
          <div className="p-5 sm:p-8 bg-ncp/5 border-2 border-dashed border-ncp/20 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
               <CheckCircle className="w-6 h-6 text-ncp/10" />
            </div>
            <h4 className="font-black text-ncp text-sm uppercase tracking-widest mb-4">অঙ্গীকারনামা (Oath)</h4>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "আমি দৃঢ়চিত্তে শপথ করছি যে, আমি দলের আদর্শ ও শৃঙ্খলা মেনে চলবো। ন্যায়, সত্য ও জনগণের কল্যাণে অবিচল থাকবো। দেশের স্বাধীনতা, সার্বভৌমত্ব ও গণতান্ত্রিক মূল্যবোধ সমুন্নত রাখবো। আমার বিরুদ্ধে দলীয় শৃঙ্খলা পরিপন্থী কোনো অভিযোগ প্রমাণিত হলে দল আমার বিরুদ্ধে যেকোনো সিদ্ধান্ত নিতে পারবে।"
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-5 bg-ncp text-white font-black rounded shadow-2xl shadow-ncp/20 transition-all uppercase tracking-[0.2em] text-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800 active:scale-98'}`}
            >
              {isSubmitting ? 'অপেক্ষা করুন...' : 'জমা দিন (Submit Application)'}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6">জাতীয় নাগরিক পার্টি (এনসিপি) • ভূরুঙ্গামারী শাখা</p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Components
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-6">
    <h3 className="text-xs font-black text-ncp uppercase tracking-[0.12em] sm:tracking-[0.3em] flex items-center gap-3 leading-relaxed">
      <div className="w-2 h-2 bg-ncp-red rotate-45"></div>
      {title}
    </h3>
    {children}
  </div>
);

const Input = React.forwardRef(({ label, error, className = '', ...props }: any, ref) => (
  <div className="space-y-2 w-full">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <input 
      ref={ref} 
      {...props} 
      className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded outline-none focus:ring-1 focus:ring-ncp focus:border-ncp transition-all placeholder:text-slate-300 text-sm ${className}`}
    />
    {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-1">{error}</p>}
  </div>
));

const Select = React.forwardRef(({ label, options, error, ...props }: any, ref) => (
  <div className="space-y-2 w-full">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <select 
      ref={ref} 
      {...props} 
      className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded outline-none focus:ring-1 focus:ring-ncp focus:border-ncp transition-all text-sm`}
    >
      <option value="">নির্বাচন করুন</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-1">{error}</p>}
  </div>
));

const Checkbox = React.forwardRef(({ label, onChange, ...props }: any, ref: any) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative">
      <input 
        type="checkbox" 
        ref={ref} 
        {...props} 
        className="peer sr-only" 
        onChange={onChange}
      />
      <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-ncp peer-checked:border-ncp transition-all flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    </div>
    <span className="text-xs font-bold text-slate-600 group-hover:text-ncp uppercase tracking-tighter leading-relaxed">{label}</span>
  </label>
));

const AddressFields = ({ prefix, register, errors }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input label="গ্রাম/রাস্তা" {...register(`${prefix}.village`)} error={errors[prefix]?.village?.message} />
    <Input label="ইউনিয়ন/ওয়ার্ড" {...register(`${prefix}.union`)} error={errors[prefix]?.union?.message} />
    <Input label="ডাকঘর" {...register(`${prefix}.post`)} error={errors[prefix]?.post?.message} />
    <Input label="থানা" {...register(`${prefix}.thana`)} error={errors[prefix]?.thana?.message} />
    <Input label="উপজেলা" {...register(`${prefix}.upazila`)} error={errors[prefix]?.upazila?.message} />
    <Input label="জেলা" {...register(`${prefix}.district`)} error={errors[prefix]?.district?.message} />
  </div>
);
