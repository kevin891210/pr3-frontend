import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Menu, X, Home, Settings, Building2, Calendar, 
  FileText, Bell, Users, LogOut, User, Monitor 
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();
  const { user, logout, hasPermission } = useAuthStore();
  const { settings, loadSettings } = useSystemStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 登入後初始化系統設定（只在首次或需要時從後端載入）
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  const menuItems = [
    { path: '/dashboard', icon: Home, label: t('dashboard'), permission: null },
    { path: '/system', icon: Settings, label: t('system'), permission: 'system.read' },
    { path: '/brands', icon: Building2, label: t('brands'), permission: 'brand.read' },
    { path: '/users', icon: Users, label: t('users'), permission: 'user.read' },
    { path: '/agent-monitor', icon: Monitor, label: t('agentMonitor'), permission: 'agent.read' },
    { path: '/schedule', icon: Calendar, label: t('schedules'), permission: 'schedule.read' },
    { path: '/leave', icon: FileText, label: t('leaves'), permission: 'leave.read' },
    { path: '/notice', icon: Bell, label: t('notices'), permission: 'notice.read' },
    { path: '/agent', icon: User, label: t('agent'), permission: 'agent.read' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-semibold">{settings.siteName}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-sm`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              // 暫時顯示所有選單項目供測試
              // if (item.permission && user?.role !== 'Admin' && !hasPermission(item.permission)) return null;
              
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;