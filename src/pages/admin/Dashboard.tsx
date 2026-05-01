import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { Users, CheckCircle, FileText, XCircle, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Submission, SubmissionStatus } from '../../types';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, new: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        
        setStats({
          total: data.length,
          new: data.filter(s => s.status === SubmissionStatus.New).length,
          approved: data.filter(s => s.status === SubmissionStatus.Approved).length,
          rejected: data.filter(s => s.status === SubmissionStatus.Rejected).length,
        });

        setRecent(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="border-b-2 border-ncp pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-ncp tracking-tight">ড্যাশবোর্ড (Dashboard)</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">NCP Admin Command Center • ভূরুঙ্গামারী</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="মোট আবেদন" 
            value={stats.total} 
            icon={Users} 
            color="bg-slate-100 text-ncp" 
            subtitle="সর্বমোট সদস্য পদপ্রার্থী"
          />
          <StatCard 
            title="নতুন আবেদন" 
            value={stats.new} 
            icon={FileText} 
            color="bg-amber-100 text-amber-600" 
            subtitle="পর্যালোচনার অপেক্ষায়"
          />
          <StatCard 
            title="অনুমোদিত" 
            value={stats.approved} 
            icon={CheckCircle} 
            color="bg-emerald-100 text-ncp" 
            subtitle="সক্রিয় এনসিপি সদস্য"
          />
          <StatCard 
            title="বাতিলকৃত" 
            value={stats.rejected} 
            icon={XCircle} 
            color="bg-red-100 text-ncp-red" 
            subtitle="অযোগ্য বিবেচিত"
          />
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">সাম্প্রতিক আবেদনসমূহ (Recent Submissions)</h3>
              <Link to="/admin/submissions" className="text-xs font-bold text-ncp-red hover:underline uppercase tracking-tighter">সব দেখুন (View All)</Link>
            </div>
            <div className="divide-y">
              {recent.length > 0 ? (
                recent.map((s) => (
                  <Link 
                    key={s.id} 
                    to="/admin/submissions/details"
                    state={{ submissionId: s.id }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-ncp group-hover:text-white transition-all">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{s.personal.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter break-all">ID: NCP-{s.formNo} • {s.submittedAt?.toDate().toLocaleDateString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(s.status)}`}>
                         {s.status}
                       </span>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-ncp group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400">
                   <p>কোন সাম্প্রতিক আবেদন নেই</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-ncp/5 rounded-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-ncp opacity-[0.03]"></div>
                <LayoutDashboard className="w-10 h-10 text-ncp relative z-10" />
             </div>
             <h3 className="font-bold text-lg text-slate-800">অ্যাডমিন কন্ট্রোল</h3>
             <p className="text-xs text-slate-500 leading-relaxed">এখান থেকে আপনি ওয়েবসাইট কনটেন্ট এবং মেম্বারশিপ ফর্ম ম্যানেজ করতে পারবেন।</p>
             <div className="flex flex-col w-full gap-2 pt-4">
                <Link to="/admin/cms" className="w-full py-2.5 bg-ncp text-white rounded text-xs font-bold shadow-sm hover:opacity-90">CMS এডিটর</Link>
                <Link to="/admin/form-builder" className="w-full py-2.5 bg-white border border-ncp text-ncp rounded text-xs font-bold hover:bg-slate-50">ফর্ম বিল্ডার</Link>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-ncp transition-colors">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-3xl font-black text-slate-800">{value}</p>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

const getStatusColor = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.New: return 'bg-amber-100 text-amber-700';
    case SubmissionStatus.Reviewed: return 'bg-blue-100 text-blue-700';
    case SubmissionStatus.Approved: return 'bg-ncp/10 text-ncp';
    case SubmissionStatus.Rejected: return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
