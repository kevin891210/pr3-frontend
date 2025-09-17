import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';

export const useSystemStore = create(
  persist(
    (set, get) => ({
      settings: {
        siteName: 'HRM Management System',
        defaultLanguage: 'zh',
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
        systemUptime: '0 days',
        lastBackup: 'Unknown',
        diskUsage: '0%',
        memoryUsage: '0%'
      },
      
      loading: false,
      lastSyncTime: null,
      isInitialized: false,
      
      loadSettings: async (forceRefresh = false) => {
        const { isInitialized, lastSyncTime, settings } = get();
        
        if (isInitialized && !forceRefresh && settings && Object.keys(settings).length > 0) {
          // console.log('Using cached system settings');
          get().applySettingsToGlobal(settings);
          return settings;
        }
        
        set({ loading: true });
        try {
          const response = await apiClient.getSystemSettings();
          const data = response.data || response;
          set({ 
            settings: data, 
            lastSyncTime: Date.now(),
            isInitialized: true 
          });
          
          get().applySettingsToGlobal(data);
          // console.log('System settings loaded from backend successfully');
          return data;
        } catch (error) {
          console.error('Failed to load system settings:', error);
          // Use default settings if backend fails
          const defaultSettings = get().settings;
          get().applySettingsToGlobal(defaultSettings);
          set({ isInitialized: true });
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
          const response = await apiClient.updateSystemSettings(updatedSettings);
          
          set({ 
            settings: updatedSettings,
            lastSyncTime: Date.now()
          });
          
          get().applySettingsToGlobal(updatedSettings);
          
          window.dispatchEvent(new CustomEvent('systemSettingsUpdated', {
            detail: updatedSettings
          }));
          
          // console.log('System settings saved and synced successfully');
          return updatedSettings;
        } catch (error) {
          console.error('Failed to save settings:', error);
          // If backend fails, still update local state
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
          const response = await apiClient.getSystemStats();
          const data = response.data || response;
          set({ stats: data });
          // console.log('System stats loaded successfully');
          return data;
        } catch (error) {
          console.error('Failed to load system stats:', error);
          // Keep existing stats if API fails
          return get().stats;
        }
      },
      
      createBackup: async () => {
        set({ loading: true });
        try {
          const response = await apiClient.createBackup();
          const result = response.data || response;
          // Reload stats to update backup time
          await get().loadStats();
          // console.log('System backup created successfully');
          return result;
        } catch (error) {
          console.error('Failed to create backup:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      updateSetting: (key, value) => {
        set(state => ({
          settings: { ...state.settings, [key]: value }
        }));
      },
      
      // Reset local cache, force next load from backend
      resetCache: () => {
        set({ 
          isInitialized: false, 
          lastSyncTime: null 
        });
      },
      
      // Check if sync is needed (for periodic checks)
      shouldSync: () => {
        const { lastSyncTime } = get();
        if (!lastSyncTime) return true;
        
        // Auto sync after 1 hour
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