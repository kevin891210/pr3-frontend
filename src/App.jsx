import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { loadAppConfig, isInitialized } from './config/bootstrap';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/toast.jsx';
import './locales/i18n';
import './mobile.css';
import Layout from './components/Layout.jsx';
import MobileLayout from './components/MobileLayout.jsx';
import SetupPage from './features/setup/SetupPage';
import LoginPage from './features/auth/LoginPage';
import AgentLoginPage from './features/auth/AgentLoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import SystemPage from './features/system/SystemPage';
import BrandPage from './features/brand/BrandPage';
import UserPage from './features/user/UserPage';
import SchedulePage from './features/hrm/schedule/SchedulePage';
import LeavePage from './features/hrm/leave/LeavePage';
import NoticePage from './features/hrm/notice/NoticePage';
import AgentPage from './features/agent/AgentPage';
import AgentDashboardPage from './features/agent/AgentDashboardPage';
import AgentMonitorPage from './features/monitor/AgentMonitorPage';
import AgentMonitorV2Page from './features/monitor/AgentMonitorV2Page';
import TestPage from './features/test/TestPage.jsx';
import MobileTestPage from './features/test/MobileTestPage.jsx';
import SalaryPage from './features/hrm/salary/SalaryPage.jsx';
import AttendancePage from './features/hrm/attendance/AttendancePage.jsx';
import PermissionPage from './features/permission/PermissionPage.jsx';
import { useSystemStore } from './store/systemStore';

function App() {
  const [configLoaded, setConfigLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadAppConfig()
      .then(() => {
        setInitialized(isInitialized());
        setConfigLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setConfigLoaded(true);
      });
  }, []);

  // 監聽配置變化
  useEffect(() => {
    const checkConfig = () => {
      const newInitialized = isInitialized();
      if (newInitialized !== initialized) {
        setInitialized(newInitialized);
      }
    };
    
    const handleSystemSettingsUpdate = (event) => {
      // 系統設定Update時重新檢查配置
      checkConfig();
      // 可以在這裡處理其他全局Update邏輯
    };
    
    window.addEventListener('configUpdated', checkConfig);
    window.addEventListener('systemSettingsUpdated', handleSystemSettingsUpdate);
    
    return () => {
      window.removeEventListener('configUpdated', checkConfig);
      window.removeEventListener('systemSettingsUpdated', handleSystemSettingsUpdate);
    };
  }, [initialized]);

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    // 使用 MobileLayout 來提供響應式體驗
    return <MobileLayout>{children}</MobileLayout>;
  };

  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入配置中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-2">配置Load Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route 
          path="/setup" 
          element={initialized ? <Navigate to="/" /> : <SetupPage />} 
        />
        <Route 
          path="/login" 
          element={
            !initialized ? <Navigate to="/setup" /> : 
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } 
        />
        <Route 
          path="/agent-login" 
          element={
            !initialized ? <Navigate to="/setup" /> : 
            isAuthenticated ? <Navigate to="/agent-dashboard" /> : <AgentLoginPage />
          } 
        />
        <Route 
          path="/agent-dashboard" 
          element={<AgentDashboardPage />} 
        />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
        />
        <Route 
          path="/system" 
          element={<ProtectedRoute><SystemPage /></ProtectedRoute>} 
        />
        <Route 
          path="/brands" 
          element={<ProtectedRoute><BrandPage /></ProtectedRoute>} 
        />
        <Route 
          path="/users" 
          element={<ProtectedRoute><UserPage /></ProtectedRoute>} 
        />
        <Route 
          path="/schedule" 
          element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} 
        />
        <Route 
          path="/leave" 
          element={<ProtectedRoute><LeavePage /></ProtectedRoute>} 
        />
        <Route 
          path="/notice" 
          element={<ProtectedRoute><NoticePage /></ProtectedRoute>} 
        />
        <Route 
          path="/agent" 
          element={<ProtectedRoute><AgentPage /></ProtectedRoute>} 
        />
        <Route 
          path="/agent-monitor" 
          element={<ProtectedRoute><AgentMonitorPage /></ProtectedRoute>} 
        />
        <Route 
          path="/agent-monitor-v2" 
          element={<ProtectedRoute><AgentMonitorV2Page /></ProtectedRoute>} 
        />
        <Route 
          path="/test" 
          element={<ProtectedRoute><TestPage /></ProtectedRoute>} 
        />
        <Route 
          path="/mobile-test" 
          element={<ProtectedRoute><MobileTestPage /></ProtectedRoute>} 
        />
        <Route 
          path="/salary" 
          element={<ProtectedRoute><SalaryPage /></ProtectedRoute>} 
        />
        <Route 
          path="/attendance" 
          element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} 
        />
        <Route 
          path="/permissions" 
          element={<ProtectedRoute><PermissionPage /></ProtectedRoute>} 
        />
        <Route 
          path="/" 
          element={
            !initialized ? <Navigate to="/setup" /> : 
            !isAuthenticated ? <Navigate to="/login" /> :
            <Navigate to="/dashboard" />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;