import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';

export const useSystemStore = create(
  persist(
    (set, get) => ({
      settings: {
        siteName: 'HRM 管理系統',
        defaultLanguage: 'zh-TW',
        timezone: 'Asia/Taipei',
        debugMode: false,
        maxLoginAttempts: 5,
        sessionTimeout: 24,
        emailNotifications: true,
        maintenanceMode: false
      },
      
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        systemUptime: '0 天',
        lastBackup: '未知',
        diskUsage: '0%',
        memoryUsage: '0%'
      },
      
      loading: false,
      lastSyncTime: null,
      isInitialized: false,
      
      loadSettings: async (forceRefresh = false) => {
        const { isInitialized, lastSyncTime, settings } = get();
        
        // 如果已初始化且不是強制刷新，且有有效設定數據
        if (isInitialized && !forceRefresh && settings && Object.keys(settings).length > 0) {
          console.log('使用本地快取的系統設定');
          get().applySettingsToGlobal(settings);
          return settings;
        }
        
        set({ loading: true });
        try {
          const data = await apiClient.getSystemSettings();
          set({ 
            settings: data, 
            lastSyncTime: Date.now(),
            isInitialized: true 
          });
          
          get().applySettingsToGlobal(data);
          console.log('從後端載入系統設定成功');
          return data;
        } catch (error) {
          console.error('載入系統設定失敗:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      applySettingsToGlobal: (settings) => {
        // Update全局配置
        if (window.__APP_CONFIG__) {
          window.__APP_CONFIG__.siteName = settings.siteName;
          window.__APP_CONFIG__.defaultLanguage = settings.defaultLanguage;
          window.__APP_CONFIG__.timezone = settings.timezone;
          window.__APP_CONFIG__.debugMode = settings.debugMode;
        }
      },
      
      saveSettings: async (newSettings) => {
        set({ loading: true });
        try {
          const updatedSettings = { ...get().settings, ...newSettings };
          await apiClient.updateSystemSettings(updatedSettings);
          
          // Update本地Status和同步時間
          set({ 
            settings: updatedSettings,
            lastSyncTime: Date.now()
          });
          
          get().applySettingsToGlobal(updatedSettings);
          
          // 觸發全局Update事件
          window.dispatchEvent(new CustomEvent('systemSettingsUpdated', {
            detail: updatedSettings
          }));
          
          console.log('系統設定已Save並同步到本地');
          return updatedSettings;
        } catch (error) {
          console.error('Save設定失敗:', error);
          // 如果後端失敗，仍Update本地Status
          const updatedSettings = { ...get().settings, ...newSettings };
          set({ settings: updatedSettings });
          
          get().applySettingsToGlobal(updatedSettings);
          
          window.dispatchEvent(new CustomEvent('systemSettingsUpdated', {
            detail: updatedSettings
          }));
          
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      loadStats: async () => {
        try {
          const data = await apiClient.getSystemStats();
          set({ stats: data });
          return data;
        } catch (error) {
          console.error('載入系統統計失敗:', error);
          throw error;
        }
      },
      
      createBackup: async () => {
        try {
          const result = await apiClient.createBackup();
          // 重新載入統計以Update備份時間
          await get().loadStats();
          return result;
        } catch (error) {
          console.error('建立備份失敗:', error);
          throw error;
        }
      },
      
      updateSetting: (key, value) => {
        set(state => ({
          settings: { ...state.settings, [key]: value }
        }));
      },
      
      // 重置本地快取，強制下次載入時從後端獲取
      resetCache: () => {
        set({ 
          isInitialized: false, 
          lastSyncTime: null 
        });
      },
      
      // 檢查是否需要同步（可用於定期檢查）
      shouldSync: () => {
        const { lastSyncTime } = get();
        if (!lastSyncTime) return true;
        
        // 超過 1 小時自動同步
        const oneHour = 60 * 60 * 1000;
        return Date.now() - lastSyncTime > oneHour;
      }
    }),
    {
      name: 'system-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        lastSyncTime: state.lastSyncTime,
        isInitialized: state.isInitialized
      })
    }
  )
);