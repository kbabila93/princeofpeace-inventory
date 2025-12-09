import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import TeamChat from '@/components/chat/TeamChat';
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: 'Sales', icon: DollarSign },
    { name: 'Expenditures', href: 'Expenditures', icon: Receipt },
    { name: 'Inventory', href: 'Inventory', icon: Package },
    { name: 'Employees', href: 'Employees', icon: Users },
    { name: 'Transactions', href: 'Transactions', icon: History },
  ];

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
              <Package className="w-6 h-6" />
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
            {navigation.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Store Manager</p>
                <p className="text-xs text-gray-500 truncate">admin@store.com</p>
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