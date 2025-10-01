import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Menu, X, Home, Settings, Building2, Calendar, 
  FileText, Bell, Users, LogOut, User, Monitor, DollarSign, Clock, Shield 
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useTranslation();
  const { user, logout, hasPermission, hasRole } = useAuthStore();
  const { settings, loadSettings } = useSystemStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  const menuSections = [
    {
      title: t('navigation.overview'),
      items: [
        { path: '/dashboard', icon: Home, label: t('dashboard'), permission: null }
      ]
    },
    {
      title: t('navigation.systemManagement'),
      items: [
        { path: '/system', icon: Settings, label: t('system'), permission: 'system.read' },
        { path: '/brands', icon: Building2, label: t('brands'), permission: 'brand.read' },
        { path: '/users', icon: Users, label: t('users'), permission: 'user.read' },
        { path: '/permissions', icon: Shield, label: t('navigation.permissions'), permission: 'owner.only' }
      ]
    },
    {
      title: t('navigation.hrmModules'),
      items: [
        { path: '/schedule', icon: Calendar, label: t('schedules'), permission: 'schedule.read' },
        { path: '/leave', icon: FileText, label: t('leaves'), permission: 'leave.read' },
        { path: '/attendance', icon: Clock, label: t('navigation.attendance'), permission: 'attendance.read' },
        { path: '/salary', icon: DollarSign, label: t('navigation.salaryManagement'), permission: 'salary.read' }
      ]
    },
    {
      title: t('navigation.communication'),
      items: [
        { path: '/notice', icon: Bell, label: t('notices'), permission: 'notice.read' },
        { path: '/agent-monitor-v2', icon: Monitor, label: t('agentMonitorV2'), permission: 'agent.read' }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">{settings.siteName}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">
              {user?.member_name || user?.name || user?.username || user?.email || 'User'} ({user?.role || 'Agent'})
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
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 overflow-hidden bg-white shadow-sm`}>
          <nav className="p-4 space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    // 權限檢查：只有 Owner 能看到權限管理
                    if (item.permission === 'owner.only' && !hasRole('Owner')) {
                      return null;
                    }
                    
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <div key={item.path} className="relative group">
                        <button
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2 rounded-md text-left transition-colors ${
                            isActive 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </button>
                        {!sidebarOpen && (
                          <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;