import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Submission, SubmissionStatus } from '../../types';
import { Download, Trash2, CheckCircle, XCircle, Printer, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const submissionId = id || (location.state as { submissionId?: string } | null)?.submissionId;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [authoritySignature, setAuthoritySignature] = useState('');
  const navigate = useNavigate();

  const printableRef = useRef<HTMLDivElement>(null);
  const pdfPrintableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    if (!db || !submissionId) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'submissions', submissionId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setSubmission({ id: snapshot.id, ...snapshot.data() } as Submission);
      }
    } catch (err) {
      console.error("Error fetching submission:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: SubmissionStatus, signature?: string) => {
    if (!db || !submissionId) return;
    setIsUpdating(true);
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (signature) updates.authoritySignature = signature;
      await updateDoc(doc(db, 'submissions', submissionId), updates);
      setSubmission(prev => prev ? { ...prev, status: newStatus, ...updates } : null);
      setShowApprovalModal(false);
      setAuthoritySignature('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveClick = () => {
    setAuthoritySignature(submission?.authoritySignature || '');
    setShowApprovalModal(true);
  };

  const handleApproveSubmit = () => {
    const trimmedSignature = authoritySignature.trim();
    if (!trimmedSignature) {
      alert('কর্তৃপক্ষের স্বাক্ষর লিখুন');
      return;
    }
    handleUpdateStatus(SubmissionStatus.Approved, trimmedSignature);
  };

  const handleDelete = async () => {
    if (!db || !submissionId || !window.confirm('আপনি কি নিশ্চিত যে এই আবেদনটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      navigate('/admin/submissions');
    } catch (err) {
       handleFirestoreError(err, OperationType.DELETE, `submissions/${submissionId}`);
    }
  };

  const handleExportPDF = async () => {
    if (!submission || !pdfPrintableRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const element = pdfPrintableRef.current;
      await document.fonts?.ready;
      await waitForImages(element);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 10000,
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (clonedDoc) => {
          // Fix for "oklch" error in html2canvas
          // This replaces any oklch color with a fallback hex color in the cloned document
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            
            // 1. Check computed style
            const style = clonedDoc.defaultView?.getComputedStyle(el);
            if (style) {
              ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach(prop => {
                const value = (style as any)[prop];
                if (value && value.includes('oklch')) {
                  if (prop === 'color') el.style.color = '#334155'; 
                  if (prop === 'backgroundColor' && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                    el.style.backgroundColor = '#f8fafc'; 
                  }
                  if (prop === 'borderColor') el.style.borderColor = '#e2e8f0';
                }
              });
            }
            
            // 2. Clear out any inline styles that might have oklch
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && inlineStyle.includes('oklch')) {
              el.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, '#64748b'));
            }
          }
          
          const watermark = clonedDoc.getElementById('pdf-printable-watermark-logo') as HTMLImageElement | null;
          if (watermark) {
            watermark.style.opacity = '0.12';
            watermark.style.filter = 'grayscale(1)';
            watermark.style.mixBlendMode = 'normal';
            watermark.style.width = '420px';
            watermark.style.height = '420px';
            watermark.style.position = 'relative';
            watermark.style.zIndex = '0';
          }

          const watermarkWrap = clonedDoc.getElementById('pdf-printable-watermark-wrap');
          if (watermarkWrap) {
            watermarkWrap.style.zIndex = '0';
            watermarkWrap.style.opacity = '1';
          }

          const printableForm = clonedDoc.getElementById('pdf-printable-form');
          if (printableForm) {
            printableForm.style.boxShadow = 'none';
            printableForm.style.border = '1px solid #e2e8f0';
            printableForm.style.width = '800px';
            printableForm.style.maxWidth = '800px';
            printableForm.style.minHeight = 'auto';
            printableForm.style.padding = '48px';
            printableForm.classList.add('pdf-export-target');
          }
        }
      });
      await drawWatermarkOnCanvas(canvas);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6.35;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const imgHeight = (canvas.height * maxWidth) / canvas.width;
      const renderHeight = Math.min(imgHeight, maxHeight);
      const renderWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : maxWidth;
      const x = (pageWidth - renderWidth) / 2;
      
      pdf.addImage(imgData, 'JPEG', x, margin, renderWidth, renderHeight, undefined, 'FAST');
      pdf.save(`${getPdfFileName(submission)}.pdf`);
      
    } catch (error: any) {
      console.error("PDF Error:", error);
      alert("PDF ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে 'প্রিন্ট' বাটনটি ব্যবহার করে 'Save as PDF' অপশনটি ট্রাই করুন।");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    // Check if we are in an iframe (AI Studio environment)
    const isIframe = window.self !== window.top;
    
    if (isIframe) {
      // In some iframe environments, we might need to inform the user 
      // or try to trigger print on the parent if possible, 
      // but standard window.print() is the best attempt.
      alert("প্রিন্ট উইন্ডো ওপেন হচ্ছে। যদি না হয়, তবে ব্রাউজারের পপ-আপ সেটিংস চেক করুন অথবা নতুন ট্যাবে অ্যাপটি ওপেন করুন।");
    }
    
    window.print();
  };

  if (loading) return <AdminLayout><div className="text-center py-20">লোড হচ্ছে...</div></AdminLayout>;
  if (!submission) return (
    <AdminLayout>
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500">সাবমিশন পাওয়া যায়নি</p>
        <button
          onClick={() => navigate('/admin/submissions')}
          className="px-4 py-2 bg-ncp text-white rounded text-xs font-bold"
        >
          আবেদন তালিকায় ফিরুন
        </button>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* Detail Header Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 border rounded-xl shadow-sm print:hidden">
           <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
              <span className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
              <h1 className="text-sm font-medium text-slate-400">
                সদস্য বিস্তারিত <span className="text-slate-300">/</span> <span className="text-slate-800 font-bold">Submission #NCP-{submission.formNo}</span>
              </h1>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleApproveClick} 
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs font-semibold bg-white border rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-ncp disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> অনুমোদন
              </button>
              <button 
                onClick={() => handleUpdateStatus(SubmissionStatus.Rejected)} 
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs font-semibold bg-white border rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-ncp-red disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> বাতিল
              </button>
              <button 
                onClick={handleExportPDF} 
                disabled={isGeneratingPDF}
                className="px-4 py-1.5 text-xs font-semibold bg-ncp-red text-white rounded shadow-sm hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>লোড হচ্ছে...</>
                ) : (
                  <><Download className="w-4 h-4" /> PDF ডাউনলোড</>
                )}
              </button>
              <button onClick={handlePrint} className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded shadow-sm hover:bg-black flex items-center gap-2">
                <Printer className="w-4 h-4" /> প্রিন্ট
              </button>
              <button onClick={handleDelete} className="p-2 bg-slate-50 text-slate-400 hover:text-ncp-red rounded border transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Geometric Document View */}
        <div className="py-4 sm:py-10 bg-slate-100/50 border rounded-2xl print:bg-transparent print:border-0 print:py-0">
          <div 
            ref={printableRef}
            className="mx-auto w-full sm:w-[800px] bg-white border shadow-2xl p-4 sm:p-12 flex flex-col relative overflow-hidden font-sans printable-content print:shadow-none print:border-0 print:w-full print:p-0" 
            id="printable-form"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                id="printable-watermark-logo"
                src="/ncp-logo-watermark.svg"
                alt=""
                className="w-64 h-64 sm:w-[420px] sm:h-[420px] object-contain opacity-[0.12] grayscale"
                style={{ opacity: 0.12, filter: 'grayscale(1)' }}
              />
            </div>

            {/* Form Header */}
            <div className="text-center border-b-2 border-ncp pb-5 sm:pb-6 mb-6 sm:mb-8 relative z-10">
              <div className="sm:pr-32">
                <h2 className="text-lg sm:text-2xl font-bold text-ncp tracking-wide mb-1 leading-snug">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h2>
                <p className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-slate-600">প্রাথমিক সদস্য ফরম</p>
              </div>
              
              <div className="mx-auto mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-0 w-24 h-28 sm:w-28 sm:h-32 border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-[10px] text-slate-400 text-center uppercase tracking-tighter">
                {submission.personal.photoUrl ? (
                  <img src={submission.personal.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <>পাসপোর্ট সাইজ<br/>ছবি</>
                )}
              </div>
              
              <div className="mt-4 sm:mt-0 sm:absolute sm:bottom-2 sm:left-0 text-center sm:text-left">
                <p className="text-xs text-slate-600 uppercase font-bold">তারিখ: {submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>

            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm">
              <span className="font-bold text-slate-500">ফরম নম্বর:</span>
              <span className="font-mono font-black text-ncp-red text-base">NCP-{submission.formNo}</span>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 sm:gap-y-5 text-sm relative z-10">
              <div className="sm:col-span-2 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">A. পরিচিতি (Personal Info)</div>
              <DataRow label="নাম" value={submission.personal.name} />
              <DataRow label="NID নম্বর" value={submission.personal.nid} />
              <DataRow label="পিতার নাম" value={submission.personal.fatherName} />
              <DataRow label="মাতার নাম" value={submission.personal.motherName} />
              <DataRow label="জন্ম তারিখ" value={submission.personal.dob} />
              <DataRow label="রক্তের গ্রুপ" value={submission.personal.bloodGroup} />
              
              <div className="sm:col-span-2 mt-4 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">B. ঠিকানা (Address)</div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-5">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">বর্তমান ঠিকানা</p>
                    <DataRow label="গ্রাম/রাস্তা" value={submission.presentAddress.village} />
                    <DataRow label="ইউনিয়ন" value={submission.presentAddress.union} />
                    <DataRow label="উপজেলা" value={submission.presentAddress.upazila} />
                    <DataRow label="জেলা" value={submission.presentAddress.district} />
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">স্থায়ী ঠিকানা</p>
                    <DataRow label="গ্রাম/রাস্তা" value={submission.permanentAddress.village} />
                    <DataRow label="ইউনিয়ন" value={submission.permanentAddress.union} />
                    <DataRow label="উপজেলা" value={submission.permanentAddress.upazila} />
                    <DataRow label="জেলা" value={submission.permanentAddress.district} />
                 </div>
              </div>

              <div className="sm:col-span-2 mt-4 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">C. যোগাযোগ ও পেশা (Contact & Profession)</div>
              <DataRow label="মোবাইল" value={submission.contact.mobile} />
              <DataRow label="পেশা" value={submission.profession.occupation} />
              <div className="sm:col-span-2 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    <DataRow label="রাজনৈতিক সংশ্লিষ্টতা" value={submission.experience.politicalAffiliation ? 'হ্যাঁ' : 'না'} />
                    {submission.experience.politicalAffiliation && (submission as any).experience.politicalOrgName && (
                      <DataRow label="সংগঠনের নাম" value={(submission as any).experience.politicalOrgName} />
                    )}
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    <DataRow label="সামাজিক সম্পৃক্ততা" value={submission.experience.orgExperience ? 'হ্যাঁ' : 'না'} />
                    {submission.experience.orgExperience && (submission as any).experience.socialOrgName && (
                      <DataRow label="সংগঠনের নাম" value={(submission as any).experience.socialOrgName} />
                    )}
                 </div>
              </div>
              <div className="sm:col-span-2">
                 <DataRow label="অবদান রাখতে চান" value={submission.intent.contribution} isArea />
              </div>
            </div>

            {/* Signature & Date */}
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-6 sm:gap-0 sm:justify-between sm:items-end relative z-10">
               <div className="space-y-1">
                  <div className="w-40 min-h-8 border-b-2 border-slate-200 applicant-signature text-2xl text-slate-800">
                    {submission.applicantSignature || ''}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">আবেদনকারীর স্বাক্ষর</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-xs font-mono text-slate-800">{submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">তারিখ</p>
               </div>
            </div>

            {/* Member Slip Part */}
            <div className="mt-8 sm:mt-auto pt-6 sm:pt-8 border-t-2 border-dashed border-slate-200 relative z-10">
              <div className="text-center mb-3">
                <h3 className="text-sm sm:text-base font-black text-ncp leading-snug">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">সদস্য স্লিপ</p>
              </div>
              <div className="bg-slate-50 p-4 sm:p-6 rounded border border-slate-200 flex flex-col sm:flex-row gap-5 sm:gap-0 sm:justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-ncp"></div>
                <div className="text-[11px] space-y-2">
                  <p className="font-black underline uppercase text-ncp tracking-tighter">FORM NO: NCP-{submission.formNo}</p>
                  <p><span className="font-bold">নাম:</span> {submission.personal.name}</p>
                  <p><span className="font-bold">NID নম্বর:</span> {submission.personal.nid}</p>
                  <p><span className="font-bold">তারিখ:</span> {submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="flex flex-col items-center sm:items-end justify-between">
                  <div className="official-seal w-24 h-16 border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center">
                    <span>জাতীয় নাগরিক পার্টি</span>
                    <strong>ভূরুঙ্গামারী শাখা</strong>
                    <span>অনুমোদিত</span>
                  </div>
                  {submission.authoritySignature && (
                    <p className="authority-signature text-2xl leading-none text-slate-800 mt-2">{submission.authoritySignature}</p>
                  )}
                  <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase border-t border-slate-200 pt-1">কর্তৃপক্ষের স্বাক্ষর</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PdfExportForm submission={submission} printableRef={pdfPrintableRef} />
      </div>

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 print:hidden">
          <div className="w-full max-w-md bg-white rounded-xl border shadow-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-black text-ncp">কর্তৃপক্ষের স্বাক্ষর</h2>
              <p className="text-xs text-slate-500 mt-1">অনুমোদনের জন্য কর্তৃপক্ষের স্বাক্ষর লিখুন। এটি মেম্বার স্লিপে বসবে।</p>
            </div>
            <input
              value={authoritySignature}
              onChange={(e) => setAuthoritySignature(e.target.value)}
              placeholder="কর্তৃপক্ষের স্বাক্ষর"
              className="w-full px-4 py-3 border rounded outline-none focus:ring-1 focus:ring-ncp focus:border-ncp authority-signature-input text-xl"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-xs font-bold border rounded text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-bold rounded bg-ncp text-white hover:bg-slate-800 disabled:opacity-50"
              >
                অনুমোদন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const DataRow = ({ label, value, isArea }: any) => (
  <div className={`flex flex-col ${isArea ? 'mt-2' : ''}`}>
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2 border-b border-dotted border-slate-400 pb-1 sm:pb-0.5">
      <span className="font-bold text-slate-500 sm:whitespace-nowrap sm:min-w-[100px]">{label}:</span>
      {!isArea && <span className="text-slate-800 font-medium break-words">{value || '—'}</span>}
    </div>
    {isArea && (
      <div className="mt-2 text-slate-700 bg-slate-50/50 p-3 border rounded text-xs italic break-words">
        {value || 'কোন তথ্য প্রদান করা হয়নি'}
      </div>
    )}
  </div>
);

const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      img.decode?.().then(done).catch(() => undefined);
    });
  }));
};

const drawWatermarkOnCanvas = async (canvas: HTMLCanvasElement) => {
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = '/ncp-logo-watermark.svg';

  await new Promise<void>((resolve) => {
    logo.onload = () => resolve();
    logo.onerror = () => resolve();
  });

  if (!logo.naturalWidth || !logo.naturalHeight) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = Math.min(canvas.width, canvas.height) * 0.48;
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.filter = 'grayscale(1)';
  ctx.drawImage(logo, x, y, size, size);
  ctx.restore();
};

const getPdfFileName = (submission: Submission) => {
  const applicantName = sanitizeFileName(submission.personal.name || 'NCP_Member');
  const formNo = sanitizeFileName(submission.formNo || 'Form');
  return `${applicantName}_NCP_${formNo}`;
};

const sanitizeFileName = (value: string) => (
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'NCP_Member'
);

const PdfExportForm = ({ submission, printableRef }: { submission: Submission; printableRef: React.Ref<HTMLDivElement> }) => (
  <div className="fixed left-[-10000px] top-0 w-[800px] pointer-events-none" aria-hidden="true">
    <div
      ref={printableRef}
      className="w-[800px] bg-white border shadow-2xl p-12 flex flex-col relative overflow-hidden font-sans printable-content"
      id="pdf-printable-form"
    >
      <div id="pdf-printable-watermark-wrap" className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          id="pdf-printable-watermark-logo"
          src="/ncp-logo-watermark.svg"
          alt=""
          crossOrigin="anonymous"
          className="w-[420px] h-[420px] object-contain opacity-[0.12] grayscale"
          style={{ opacity: 0.12, filter: 'grayscale(1)' }}
        />
      </div>

      <div className="text-center border-b-2 border-ncp pb-6 mb-8 relative z-10">
        <h2 className="text-2xl font-bold text-ncp tracking-wide mb-1">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h2>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">প্রাথমিক সদস্য ফরম</p>

        <div className="absolute top-0 right-0 w-28 h-32 border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-[10px] text-slate-400 text-center uppercase tracking-tighter">
          {submission.personal.photoUrl ? (
            <img src={submission.personal.photoUrl} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <>পাসপোর্ট সাইজ<br />ছবি</>
          )}
        </div>

        <div className="absolute bottom-2 left-0 text-left">
          <p className="text-xs text-slate-600 uppercase font-bold">তারিখ: {submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
        </div>
      </div>

      <div className="relative z-10 mb-4 flex items-center gap-2 text-sm">
        <span className="font-bold text-slate-500">ফরম নম্বর:</span>
        <span className="font-mono font-black text-ncp-red text-base">NCP-{submission.formNo}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-sm relative z-10">
        <div className="col-span-2 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">A. পরিচিতি (Personal Info)</div>
        <PdfDataRow label="নাম" value={submission.personal.name} />
        <PdfDataRow label="NID নম্বর" value={submission.personal.nid} />
        <PdfDataRow label="পিতার নাম" value={submission.personal.fatherName} />
        <PdfDataRow label="মাতার নাম" value={submission.personal.motherName} />
        <PdfDataRow label="জন্ম তারিখ" value={submission.personal.dob} />
        <PdfDataRow label="রক্তের গ্রুপ" value={submission.personal.bloodGroup} />

        <div className="col-span-2 mt-4 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">B. ঠিকানা (Address)</div>
        <div className="col-span-2 grid grid-cols-2 gap-x-12 gap-y-5">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">বর্তমান ঠিকানা</p>
            <PdfDataRow label="গ্রাম/রাস্তা" value={submission.presentAddress.village} />
            <PdfDataRow label="ইউনিয়ন" value={submission.presentAddress.union} />
            <PdfDataRow label="উপজেলা" value={submission.presentAddress.upazila} />
            <PdfDataRow label="জেলা" value={submission.presentAddress.district} />
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">স্থায়ী ঠিকানা</p>
            <PdfDataRow label="গ্রাম/রাস্তা" value={submission.permanentAddress.village} />
            <PdfDataRow label="ইউনিয়ন" value={submission.permanentAddress.union} />
            <PdfDataRow label="উপজেলা" value={submission.permanentAddress.upazila} />
            <PdfDataRow label="জেলা" value={submission.permanentAddress.district} />
          </div>
        </div>

        <div className="col-span-2 mt-4 bg-slate-100/80 px-3 py-1.5 font-bold text-ncp text-xs tracking-widest uppercase mb-2">C. যোগাযোগ ও পেশা (Contact & Profession)</div>
        <PdfDataRow label="মোবাইল" value={submission.contact.mobile} />
        <PdfDataRow label="পেশা" value={submission.profession.occupation} />
        <div className="col-span-2 space-y-4">
          <div className="flex gap-12">
            <PdfDataRow label="রাজনৈতিক সংশ্লিষ্টতা" value={submission.experience.politicalAffiliation ? 'হ্যাঁ' : 'না'} />
            {submission.experience.politicalAffiliation && (submission as any).experience.politicalOrgName && (
              <PdfDataRow label="সংগঠনের নাম" value={(submission as any).experience.politicalOrgName} />
            )}
          </div>
          <div className="flex gap-12">
            <PdfDataRow label="সামাজিক সম্পৃক্ততা" value={submission.experience.orgExperience ? 'হ্যাঁ' : 'না'} />
            {submission.experience.orgExperience && (submission as any).experience.socialOrgName && (
              <PdfDataRow label="সংগঠনের নাম" value={(submission as any).experience.socialOrgName} />
            )}
          </div>
        </div>
        <div className="col-span-2">
          <PdfDataRow label="অবদান রাখতে চান" value={submission.intent.contribution} isArea />
        </div>
      </div>

      <div className="mt-12 flex justify-between items-end relative z-10">
        <div className="space-y-1">
          <div className="w-40 min-h-8 border-b-2 border-slate-200 applicant-signature text-2xl text-slate-800">
            {submission.applicantSignature || ''}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">আবেদনকারীর স্বাক্ষর</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs font-mono text-slate-800">{submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">তারিখ</p>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t-2 border-dashed border-slate-200 relative z-10">
        <div className="text-center mb-3">
          <h3 className="text-base font-black text-ncp">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">সদস্য স্লিপ</p>
        </div>
        <div className="bg-slate-50 p-6 rounded border border-slate-200 flex justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-ncp"></div>
          <div className="text-[11px] space-y-2">
            <p className="font-black underline uppercase text-ncp tracking-tighter">FORM NO: NCP-{submission.formNo}</p>
            <p><span className="font-bold">নাম:</span> {submission.personal.name}</p>
            <p><span className="font-bold">NID নম্বর:</span> {submission.personal.nid}</p>
            <p><span className="font-bold">তারিখ:</span> {submission.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
          </div>
          <div className="flex flex-col items-end justify-between">
            <div className="official-seal w-24 h-16 border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center">
              <span>জাতীয় নাগরিক পার্টি</span>
              <strong>ভূরুঙ্গামারী শাখা</strong>
              <span>অনুমোদিত</span>
            </div>
            {submission.authoritySignature && (
              <p className="authority-signature text-2xl leading-none text-slate-800 mt-2">{submission.authoritySignature}</p>
            )}
            <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase border-t border-slate-200 pt-1">কর্তৃপক্ষের স্বাক্ষর</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PdfDataRow = ({ label, value, isArea }: any) => (
  <div className={`flex flex-col ${isArea ? 'mt-2' : ''}`}>
    <div className="flex items-baseline space-x-2 border-b border-dotted border-slate-400 pb-0.5">
      <span className="font-bold text-slate-500 whitespace-nowrap min-w-[100px]">{label}:</span>
      {!isArea && <span className="text-slate-800 font-medium">{value || '—'}</span>}
    </div>
    {isArea && (
      <div className="mt-2 text-slate-700 bg-slate-50/50 p-3 border rounded text-xs italic">
        {value || 'কোন তথ্য প্রদান করা হয়নি'}
      </div>
    )}
  </div>
);

const getStatusColor = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.New: return 'bg-amber-100 text-amber-700 border-amber-200';
    case SubmissionStatus.Reviewed: return 'bg-blue-100 text-blue-700 border-blue-200';
    case SubmissionStatus.Approved: return 'bg-ncp/10 text-ncp border-ncp/20';
    case SubmissionStatus.Rejected: return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
