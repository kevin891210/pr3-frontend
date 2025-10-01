import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, BarChart3, Settings, FileText, Monitor, 
  Calendar, Users, TrendingUp, AlertCircle 
} from 'lucide-react';
import AttendanceDashboard from './components/AttendanceDashboard';
import AttendanceRecords from './components/AttendanceRecords';
import AttendanceSettings from './components/AttendanceSettings';
import AttendanceApiLogs from './components/AttendanceApiLogs';
import AttendanceMonitor from './components/AttendanceMonitor';

const AttendancePage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // 監聽標籤頁切換事件
  useEffect(() => {
    const handleTabSwitch = (event) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };

    window.addEventListener('switchAttendanceTab', handleTabSwitch);
    return () => {
      window.removeEventListener('switchAttendanceTab', handleTabSwitch);
    };
  }, []);

  const tabs = [
    { 
      id: 'dashboard', 
      label: t('attendance.dashboard'), 
      icon: BarChart3,
      component: AttendanceDashboard 
    },
    { 
      id: 'records', 
      label: t('attendance.recordsManagement'), 
      icon: Clock,
      component: AttendanceRecords 
    },
    { 
      id: 'settings', 
      label: t('attendance.systemSettings'), 
      icon: Settings,
      component: AttendanceSettings 
    },
    { 
      id: 'api-logs', 
      label: t('attendance.apiRecords'), 
      icon: FileText,
      component: AttendanceApiLogs 
    },
    { 
      id: 'monitor', 
      label: t('attendance.monitorCenter'), 
      icon: Monitor,
      component: AttendanceMonitor 
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('attendance.intelligentSystem')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('attendance.systemDescription')}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AttendancePage;