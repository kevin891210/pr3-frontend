import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Menu, X, Home, Settings, Building2, Calendar, 
  FileText, Bell, Users, LogOut, User, Monitor, DollarSign, Clock, Shield,
  ChevronDown, ChevronUp
} from 'lucide-react';

const MobileLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
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

  const toggleSection = (sectionIndex) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // 底部導航項目 - 只顯示最重要的功能
  const bottomNavItems = [
    { path: '/dashboard', icon: Home, label: t('dashboard') },
    { path: '/schedule', icon: Calendar, label: t('schedules') },
    { path: '/leave', icon: FileText, label: t('leaves') },
    { path: '/agent-monitor-v2', icon: Monitor, label: t('agentMonitorV2') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* 手機版頂部導航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 top-nav">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold truncate">
              {settings.siteName}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">
                {user?.name || user?.username || user?.email || 'User'} ({user?.role || 'Guest'})
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 手機版側邊欄覆蓋層 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 手機版側邊欄 */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50 md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('navigation.menu')}</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-8 h-8 text-gray-400" />
            <div>
              <div className="font-medium text-sm">
                {user?.name || user?.username || user?.email || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full flex items-center justify-between p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <span>{section.title}</span>
                {expandedSections[sectionIndex] ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>
              
              {expandedSections[sectionIndex] && (
                <div className="mt-2 space-y-1 pl-4">
                  {section.items.map((item) => {
                    if (item.permission === 'owner.only' && !hasRole('Owner')) {
                      return null;
                    }
                    
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* 桌面版側邊欄 */}
      <div className="hidden md:flex min-h-[calc(100vh-73px)]">
        <aside className="w-64 bg-white shadow-sm">
          <nav className="p-4 space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.permission === 'owner.only' && !hasRole('Owner')) {
                      return null;
                    }
                    
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
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
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

      {/* 手機版主內容 */}
      <main className="md:hidden p-4">
        {children}
      </main>

      {/* 手機版底部導航欄 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-30 bottom-nav">
        <div className="flex">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;