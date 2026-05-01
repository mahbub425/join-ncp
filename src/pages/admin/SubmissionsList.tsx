import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { Search, Filter, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Submission, SubmissionStatus } from '../../types';

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filtered, setFiltered] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = submissions;
    if (searchTerm) {
      result = result.filter(s => 
        s.personal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact.mobile.includes(searchTerm) ||
        s.formNo?.includes(searchTerm)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, submissions]);

  const handleExportCSV = () => {
    const headers = ['Form No', 'Name', 'Mobile', 'NID', 'Upazila', 'Status', 'Date'];
    const rows = filtered.map(s => [
      s.formNo,
      s.personal.name,
      s.contact.mobile,
      s.personal.nid,
      s.presentAddress.upazila,
      s.status,
      s.submittedAt?.toDate().toLocaleDateString('bn-BD')
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ncp pb-4">
          <div>
            <h1 className="text-2xl font-bold text-ncp tracking-tight">আবেদন তালিকা (Submissions)</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Total Records: <span className="text-slate-800">{filtered.length}</span></p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="inline-flex w-full md:w-auto items-center justify-center gap-2 px-6 py-2 bg-ncp-red text-white text-xs font-bold rounded shadow-sm hover:opacity-90 transition-all active:scale-95 uppercase tracking-tighter"
          >
            <Download className="w-4 h-4" />
            CSV এক্সপোর্ট (Export)
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-6 border rounded-xl shadow-sm">
           <div className="md:col-span-8 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="নাম, মোবাইল অথবা ফর্ম নম্বর দিয়ে খুঁজুন..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-ncp focus:border-ncp transition-all"
             />
           </div>
           <div className="md:col-span-4">
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-ncp focus:border-ncp transition-all"
             >
               <option value="All">সকল স্ট্যাটাস (All States)</option>
               <option value={SubmissionStatus.New}>নতুন (New)</option>
               <option value={SubmissionStatus.Reviewed}>পর্যালোচনা (Reviewed)</option>
               <option value={SubmissionStatus.Approved}>অনুমোদিত (Approved)</option>
               <option value={SubmissionStatus.Rejected}>বাতিল (Rejected)</option>
             </select>
           </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ফর্ম নং</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">আবেদনকারী</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">মোবাইল ও ঠিকানা</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">তারিখ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : filtered.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate('/admin/submissions/details', { state: { submissionId: s.id } })}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-ncp-red text-sm">#{s.formNo}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{s.personal.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">NID: {s.personal.nid}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-medium text-slate-700">{s.contact.mobile}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">{s.presentAddress.union}, {s.presentAddress.upazila}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {s.submittedAt?.toDate().toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 bg-slate-50 text-slate-400 rounded border group-hover:bg-ncp group-hover:text-white group-hover:border-ncp transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic text-sm">কোনো সাবমিশন খুঁজে পাওয়া যায়নি</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {filtered.length} entries</span>
            <div className="flex items-center gap-1">
               <button className="p-1.5 border rounded bg-white text-slate-300 pointer-events-none hover:bg-slate-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
               <button className="p-1.5 border rounded bg-white text-slate-400 hover:text-ncp hover:border-ncp transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const getStatusColor = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.New: return 'bg-amber-100 text-amber-700';
    case SubmissionStatus.Reviewed: return 'bg-blue-100 text-blue-700';
    case SubmissionStatus.Approved: return 'bg-emerald-100 text-emerald-700';
    case SubmissionStatus.Rejected: return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
