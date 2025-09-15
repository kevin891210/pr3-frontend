/**
 * 認證狀態管理 Store
 * 使用 Zustand 管理使用者認證狀態、權限和 JWT Token
 * 整合本地儲存以維持登入狀態
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';
import { storageManager } from '../utils/storage';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      /**
       * 使用者登入方法
       * @param {Object} userData - 使用者資料
       * @param {string} token - JWT Token
       */
      login: (userData, token) => {
        apiClient.setToken(token);
        set({
          user: userData,
          token,
          isAuthenticated: true
        });
        
        // 儲存使用者偏好設定
        const preferences = storageManager.getUserPreferences();
        storageManager.setUserPreferences({
          ...preferences,
          language: (userData && userData.language) || preferences.language || 'en',
          lastLoginTime: new Date().toISOString()
        });
      },
      
      /**
       * 使用者登出方法
       * 清除認證狀態和相關快取資料
       */
      logout: () => {
        apiClient.setToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        
        // 清除 API 快取但保留使用者偏好設定
        apiClient.clearAllCache();
        
        // 更新最後登出時間
        const preferences = storageManager.getUserPreferences();
        storageManager.setUserPreferences({
          ...preferences,
          lastLogoutTime: new Date().toISOString()
        });
        
        // 登出時清除系統設定快取
        if (window.useSystemStore) {
          window.useSystemStore.getState().resetCache();
        }
      },
      
      /**
       * 權限檢查方法
       * 根據使用者角色檢查是否具有特定權限
       * @param {string} permission - 權限名稱 (例: 'brand.create', 'schedule.read')
       * @returns {boolean} 是否具有權限
       */
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        // 角色權限對應表
        const rolePermissions = {
          Owner: ['*'], // 擁有者：所有權限
          Admin: ['system.*', 'brand.*', 'schedule.*', 'leave.*', 'notice.*', 'user.*'], // 管理員：大部分權限
          TeamLeader: ['schedule.read', 'schedule.write', 'leave.approve', 'notice.read', 'agent.read'], // 組長：排班和請假審核
          Agent: ['schedule.read', 'leave.create', 'leave.read', 'notice.read', 'agent.read'], // 專員：基本操作
          Auditor: ['*.read'] // 稽核員：僅讀取權限
        };
        
        const permissions = rolePermissions[user.role] || [];
        return permissions.includes('*') || 
               permissions.includes(permission) ||
               permissions.some(p => p.endsWith('.*') && permission.startsWith(p.slice(0, -1)));
      },
      
      /**
       * 角色檢查方法
       * 檢查使用者是否具有特定角色
       * @param {string} role - 角色名稱 (Owner/Admin/TeamLeader/Agent/Auditor)
       * @returns {boolean} 是否具有該角色
       */
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      }
    }
  )
);