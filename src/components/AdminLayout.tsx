import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileEdit, Settings, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'ড্যাশবোর্ড', path: '/admin', icon: LayoutDashboard },
    { name: 'সাবমিশন লিস্ট', path: '/admin/submissions', icon: Users },
    { name: 'হোম পেজ এডিটর', path: '/admin/cms', icon: Settings },
    { name: 'ফর্ম বিল্ডার', path: '/admin/form-builder', icon: FileEdit },
  ];

  return (
    <div className="flex min-h-screen bg-[#fdfdfb] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-ncp text-white flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg overflow-hidden border border-white/30">
            <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold leading-tight">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h1>
          <p className="text-xs opacity-70">ভূরুঙ্গামারী শাখা</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-white/10 border-r-4 border-ncp-red' 
                    : 'hover:bg-white/5 opacity-80'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-white/70 hover:text-white transition-all text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">লগআউট (Logout)</span>
          </button>
          <p className="mt-4 text-[10px] opacity-40">© ২০২৪ এনসিপি অ্যাডমিন</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 flex flex-col bg-[#fdfdfb] pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center justify-between px-4 md:hidden">
           <button
             type="button"
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 -ml-2 text-ncp rounded-lg hover:bg-slate-50"
             aria-label="Open admin menu"
           >
             <Menu className="w-6 h-6" />
           </button>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-slate-100">
               <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
             </div>
             <h2 className="text-xl font-black text-ncp">NCP Admin</h2>
           </div>
           <button onClick={handleLogout} className="p-2 -mr-2 text-red-500 rounded-lg hover:bg-red-50" aria-label="Logout"><LogOut className="w-6 h-6" /></button>
        </header>

        {/* Global Header (Desktop) */}
        <header className="hidden md:flex h-16 bg-white border-b items-center justify-between px-8 shadow-sm">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-slate-400">অ্যাডমিন</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium">ড্যাশবোর্ড</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{auth?.currentUser?.email}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">সুপার অ্যাডমিন</p>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close admin menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-ncp text-white shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg overflow-hidden border border-white/30">
                  <img src="/ncp-logo-watermark.svg" alt="NCP logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-base font-bold leading-tight">জাতীয় নাগরিক পার্টি (এনসিপি) ভূরুঙ্গামারী শাখা</h1>
                <p className="text-xs opacity-70 mt-1">ভূরুঙ্গামারী শাখা</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 -mt-2 text-white/80 rounded-lg hover:bg-white/10"
                aria-label="Close admin menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-5 py-3 transition-colors ${
                      isActive
                        ? 'bg-white/10 border-r-4 border-ncp-red'
                        : 'hover:bg-white/5 opacity-80'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3 shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-5 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">লগআউট (Logout)</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 border-t border-slate-200 bg-white shadow-2xl md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-bold ${
                isActive ? 'text-ncp' : 'text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="max-w-full truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;
