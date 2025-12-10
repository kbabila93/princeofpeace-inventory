import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  DollarSign,
  Menu,
  Receipt, 
  X,
  LogOut,
  User,
  Users,
  Bell,
  MessageSquare,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import TeamChat from '@/components/chat/TeamChat';
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'Sales', href: 'Sales', icon: DollarSign, permission: 'manage_sales' },
    { name: 'Expenditures', href: 'Expenditures', icon: Receipt, permission: 'manage_expenditures' },
    { name: 'Inventory', href: 'Inventory', icon: Package, permission: 'manage_inventory' },
    { name: 'Employees', href: 'Employees', icon: Users, permission: 'manage_employees' },
    { name: 'Transactions', href: 'Transactions', icon: History, permission: 'manage_transactions' },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Users', href: 'Users', icon: Shield, permission: 'manage_users' });
  }

  // Filter navigation based on user permissions
  // If no permissions array exists (legacy/new user), default to allowing basic access or just assume all for now if not restricted
  // For safety, let's assume if permissions array exists, check it. If not, fallback to default behavior (allow all for admin, restrict for user?)
  // Actually, let's make it simple: if 'permissions' property exists, use it.
  const filteredNavigation = navigation.filter(item => {
    if (user?.role === 'admin') return true; // Admins see everything by default
    if (!user) return false;
    if (!item.permission) return true;
    return (user.permissions || []).includes(item.permission);
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shadow-lg lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white/50">
            <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              <Package className="w-6 h-6 text-indigo-600" />
              <span>StockFlow</span>
            </div>
            <button 
              className="ml-auto lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'Loading...'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="text-xl font-semibold text-gray-900 ml-2 lg:ml-0">
            {currentPageName}
          </h1>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 relative transition-colors ${isChatOpen ? 'text-indigo-600 bg-indigo-50 rounded-md' : 'text-gray-400 hover:text-gray-600'}`}
              title="Team Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <TeamChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}