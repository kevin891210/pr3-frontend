import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations.json';

// Use nested JSON structure directly for i18next
const resources = Object.keys(translations).reduce((acc, lang) => {
  acc[lang] = { translation: translations[lang] };
  return acc;
}, {});

// Get saved language or default to English
const savedLanguage = localStorage.getItem('language') || 'en';

const oldResources = {
  en: {
    translation: {
      // Navigation
      login: 'Login',
      dashboard: 'Dashboard',
      system: 'System Management',
      brands: 'Brand Management',
      users: 'User Management',
      agentMonitor: 'Agent Monitor',
      schedules: 'Schedule Management',
      leaves: 'Leave Management',
      notices: 'Notice Management',
      agent: 'Agent Interface',
      logout: 'Logout',
      
      // Common
      username: 'Username',
      password: 'Password',
      email: 'Email',
      name: 'Name',
      description: 'Description',
      status: 'Status',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      
      // Brand Management
      brand: 'Brand',
      brandName: 'Brand Name',
      selectBrand: 'Select Brand',
      addBrand: 'Add Brand',
      editBrand: 'Edit Brand',
      deleteBrand: 'Delete Brand',
      brandList: 'Brand List',
      
      // Agent Monitor
      onService: 'On Service',
      online: 'Online',
      warning: 'Warning',
      offline: 'Offline',
      workspace: 'Workspace',
      selectWorkspace: 'Select Workspace',
      refreshInterval: 'Refresh Interval',
      warningTime: 'Warning Time',
      autoRefresh: 'Auto Refresh',
      startAutoRefresh: 'Start Auto Refresh',
      stopAutoRefresh: 'Stop Auto Refresh',
      manualRefresh: 'Manual Refresh',
      
      // Login
      agentLogin: 'Agent Login',
      systemLogin: 'System Login',
      adminLogin: 'Admin Login',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      busy: 'Busy',
      
      // Brand Management Extended
      brandManagement: 'Brand Management',
      manageBrands: 'Manage all brands and their resources in the system',
      workspaceManagement: 'Workspace Management',
      botManagement: 'Bot Management',
      agentManagement: 'Agent Management',
      searchBrandName: 'Search brand name...',
      manage: 'Manage',
      sync: 'Sync',
      backToList: 'Back to List',
      
      // Form Labels
      brandNameRequired: 'Brand Name *',
      enterBrandName: 'Enter brand name',
      enterDescription: 'Enter brand description',
      apiUrlRequired: 'API URL *',
      usernameRequired: 'Username *',
      enterUsername: 'Enter brand username',
      passwordRequired: 'Password *',
      enterPassword: 'Enter brand password',
      
      // Messages
      loadFailed: 'Load Failed',
      cannotLoadBrandList: 'Cannot load brand list',
      resourceLoadFailed: 'Resource Load Failed',
      cannotLoadBrandResources: 'Cannot load brand resources',
      addSuccess: 'Add Success',
      brandAddedSuccessfully: 'Brand added successfully',
      addFailed: 'Add Failed',
      syncSuccess: 'Sync Success',
      syncFailed: 'Sync Failed',
      simulatedSync: 'Simulated Sync',
      backendNotImplemented: 'Backend API not implemented, using simulated data sync success!',
      deleteSuccess: 'Delete Success',
      brandDeletedSuccessfully: 'Brand deleted successfully',
      deleteFailed: 'Delete Failed',
      partialSuccess: 'Partial Success',
      removedFromFrontend: 'Backend API not implemented, removed from frontend',
      
      // Confirmation
      confirmDeleteBrand: 'Are you sure you want to delete',
      cannotUndo: 'This action cannot be undone.',
      
      // Empty States
      noBrandsFound: 'No Brands Found',
      noBrandData: 'No brand data available at the moment.',
      noWorkspaces: 'No Workspaces',
      noWorkspaceData: 'No workspace data available.',
      noBots: 'No Bots',
      noBotData: 'No bot data available.',
      noAgents: 'No Agents',
      noAgentData: 'No agent data available.'
    }
  },
  zh: {
    translation: {
      // Navigation
      login: '登入',
      dashboard: '儀表板',
      system: '系統管理',
      brands: 'Brand 管理',
      users: '使用者管理',
      agentMonitor: 'Agent Monitor',
      schedules: '排班管理',
      leaves: '請假管理',
      notices: '公告管理',
      agent: 'Agent 介面',
      logout: '登出',
      
      // Common
      username: '使用者名稱',
      password: '密碼',
      email: 'Email',
      name: 'Name',
      description: '描述',
      status: 'Status',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: '搜尋',
      loading: 'Loading...',
      
      // Brand Management
      brand: 'Brand',
      brandName: 'Brand 名稱',
      selectBrand: '選擇 Brand',
      addBrand: 'Add Brand',
      editBrand: 'Edit Brand',
      deleteBrand: 'Delete Brand',
      brandList: 'Brand 列表',
      
      // Agent Monitor
      onService: '服務中',
      online: 'Online',
      warning: '警告',
      offline: 'Offline',
      workspace: 'Workspace',
      selectWorkspace: '選擇 Workspace',
      refreshInterval: '刷新間隔',
      warningTime: 'Warning 時間',
      autoRefresh: '自動刷新',
      startAutoRefresh: '開始自動刷新',
      stopAutoRefresh: '停止自動刷新',
      manualRefresh: '手動刷新',
      
      // Login
      agentLogin: 'Agent 登入',
      systemLogin: '系統登入',
      adminLogin: '管理者登入',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Active',
      disabled: 'Inactive',
      busy: 'Busy',
      
      // Brand Management Extended
      brandManagement: 'Brand 管理',
      manageBrands: '管理系統中的所有 Brand 及其資源',
      workspaceManagement: 'Workspace 管理',
      botManagement: 'Bot 管理',
      agentManagement: 'Agent 管理',
      searchBrandName: '搜尋 Brand 名稱...',
      manage: '管理',
      sync: '同步',
      backToList: '返回列表',
      
      // Form Labels
      brandNameRequired: 'Brand 名稱 *',
      enterBrandName: '輸入 Brand 名稱',
      enterDescription: '輸入 Brand 描述',
      apiUrlRequired: 'API URL *',
      usernameRequired: '帳號 *',
      enterUsername: '輸入 Brand 帳號',
      passwordRequired: '密碼 *',
      enterPassword: '輸入 Brand 密碼',
      
      // Messages
      loadFailed: 'Load Failed',
      cannotLoadBrandList: 'Cannot load Brand 列表',
      resourceLoadFailed: '資源Load Failed',
      cannotLoadBrandResources: 'Cannot load Brand 資源',
      addSuccess: 'Add Success',
      brandAddedSuccessfully: 'Brand 已成功Add',
      addFailed: 'Add Failed',
      syncSuccess: '同步成功',
      syncFailed: '同步失敗',
      simulatedSync: '模擬同步',
      backendNotImplemented: '後端 API 尚未實作，使用模擬數據同步成功！',
      deleteSuccess: 'Delete Success',
      brandDeletedSuccessfully: 'Brand 已成功Delete',
      deleteFailed: 'Delete Failed',
      partialSuccess: '部分成功',
      removedFromFrontend: '後端 API 尚未實作，已從前端移除',
      
      // Confirmation
      confirmDeleteBrand: 'Are you sure you want to delete',
      cannotUndo: 'This action cannot be undone。',
      
      // Empty States
      noBrandsFound: '找不到 Brand',
      noBrandData: '目前沒有 Brand 資料。',
      noWorkspaces: '沒有 Workspace',
      noWorkspaceData: '沒有 Workspace 資料。',
      noBots: '沒有 Bot',
      noBotData: '沒有 Bot 資料。',
      noAgents: '沒有 Agent',
      noAgentData: '沒有 Agent 資料。'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    keySeparator: '.'
  });

export default i18n;