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
  Shield,
  Video,
  Megaphone,
  Truck,
  Radio,
  Download,
  Grid3x3,
  AlertTriangle,
  Settings,
  TrendingUp,
  ShoppingCart,
  Image as ImageIcon
  } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TeamChat from '@/components/chat/TeamChat';
import NotificationsMenu from '@/components/notifications/NotificationsMenu';
import UserPresence from '@/components/UserPresence';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { Toaster } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import UserSettingsDialog from '@/components/settings/UserSettingsDialog';

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Listen for open-chat events from notifications
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('open-chat', handleOpenChat);

    // Add PWA meta tags for iOS and others
    const addMeta = (name, content) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    addMeta("apple-mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    addMeta("theme-color", "#4f46e5");

    return () => {
      window.removeEventListener('open-chat', handleOpenChat);
    };
    }, []);

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard, permission: 'page_dashboard' },
    { name: 'Shop Customization', href: 'ShopCustomization', icon: Settings, permission: 'page_shop_customization' },
    { name: 'Customer Shop Link', href: 'Shop', icon: ShoppingCart, permission: 'page_customer_shop' },
    { name: 'Customer Orders', href: 'Orders', icon: Package, permission: 'page_orders' },
    { name: 'Business Analytics', href: 'BusinessAnalytics', icon: TrendingUp, permission: 'page_business_analytics' },
    { name: 'Quick Sale', href: 'QuickSale', icon: Receipt, permission: 'page_quick_sale' },
    { name: 'Sales', href: 'Sales', icon: DollarSign, permission: 'page_sales' },
    { name: 'Sales by Section', href: 'SalesBySections', icon: DollarSign, permission: 'page_sales_by_sections' },
    { name: 'Product Sales Report', href: 'ProductSalesReport', icon: DollarSign, permission: 'page_product_sales_report' },
    { name: 'Expenditures', href: 'Expenditures', icon: Receipt, permission: 'page_expenditures' },
    { name: 'Inventory', href: 'Inventory', icon: Package, permission: 'page_inventory' },
    { name: 'Sections View', href: 'InventorySections', icon: Grid3x3, permission: 'page_inventory_sections' },
    { name: 'Damaged Inventory', href: 'DamagedInventory', icon: AlertTriangle, permission: 'page_damaged_inventory' },
    { name: 'Employees', href: 'Employees', icon: Users, permission: 'page_employees' },
    { name: 'Customers', href: 'Customers', icon: Users, permission: 'page_customers' },
    { name: 'Suppliers', href: 'Suppliers', icon: Truck, permission: 'page_suppliers' },
    { name: 'Transactions', href: 'Transactions', icon: History, permission: 'page_transactions' },
    { name: 'Meetings', href: 'VideoConference', icon: Video, permission: 'page_meetings' },
    { name: 'Marketing', href: 'AdvertGenerator', icon: Megaphone, permission: 'page_marketing' },
    { name: 'Shop Gallery', href: 'ShopGallery', icon: ImageIcon, permission: 'page_shop_gallery' },
    { name: 'Announcements', href: 'Announcements', icon: Radio, permission: 'page_announcements' },
    ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Users', href: 'Users', icon: Shield, permission: 'manage_users' });
  }

  const filteredNavigation = navigation.filter(item => {
    if (item.permission === 'manage_users') return user?.role === 'admin';
    return true;
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
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
              className="w-full justify-start text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 mb-1"
              onClick={() => setIsSettingsOpen(true)}
              >
              <Settings className="w-4 h-4 mr-2" />
              Settings
              </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mb-1"
              onClick={() => window.dispatchEvent(new Event('open-install-prompt'))}
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
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

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => window.dispatchEvent(new Event('open-install-prompt'))}
              title="Install App"
            >
              <Download className="w-5 h-5" />
            </Button>

            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 relative transition-colors ${isChatOpen ? 'text-indigo-600 bg-indigo-50 rounded-md' : 'text-gray-400 hover:text-gray-600'}`}
              title="Team Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <NotificationsMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <TeamChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <UserPresence />
      <PWAInstallPrompt />
      <UserSettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />
      <Toaster />
      </div>
      );
      }