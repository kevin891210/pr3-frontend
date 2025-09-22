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
      login: async (userData, token = null) => {
        if (token) {
          apiClient.setToken(token);
        }
        
        // 登入後獲取用戶權限
        let enhancedUserData = userData;
        if (token) {
          try {
            const permResponse = await apiClient.getUserPermissions();
            if (permResponse.success) {
              enhancedUserData = {
                ...userData,
                ...permResponse.data
              };
            }
          } catch (error) {
            console.warn('Failed to fetch user permissions:', error);
          }
        }
        
        set({
          user: enhancedUserData,
          token,
          isAuthenticated: true
        });
        
        // 儲存 Agent 相關資訊到 localStorage
        if (userData?.member_id) {
          localStorage.setItem('member_id', userData.member_id);
        }
        if (userData?.brand_id) {
          localStorage.setItem('brand_id', userData.brand_id);
        }
        if (userData?.third_party_token) {
          localStorage.setItem('third_party_token', userData.third_party_token);
        }
        if (userData?.member_name) {
          localStorage.setItem('member_name', userData.member_name);
        }
        
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
        
        // 清除 Agent 相關資訊
        localStorage.removeItem('member_id');
        localStorage.removeItem('brand_id');
        localStorage.removeItem('third_party_token');
        localStorage.removeItem('member_name');
        
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
       * 優先使用自訂角色權限，回退到固定角色權限
       * @param {string} permission - 權限名稱 (例: 'brand.create', 'schedule.read')
       * @returns {boolean} 是否具有權限
       */
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        // 優先使用自訂角色權限
        if (user.permissions && Array.isArray(user.permissions)) {
          return user.permissions.includes(permission);
        }
        
        // 回退到固定角色權限
        const rolePermissions = {
          Owner: ['*'],
          Admin: ['system.*', 'brand.*', 'schedule.*', 'leave.*', 'notice.*', 'user.*'],
          TeamLeader: ['schedule.read', 'schedule.write', 'leave.approve', 'notice.read', 'agent.read'],
          Agent: ['schedule.read', 'leave.create', 'leave.read', 'notice.read', 'agent.read'],
          Auditor: ['*.read']
        };
        
        const permissions = rolePermissions[user.role] || [];
        return permissions.includes('*') || 
               permissions.includes(permission) ||
               permissions.some(p => p.endsWith('.*') && permission.startsWith(p.slice(0, -1)));
      },
      
      /**
       * 角色檢查方法
       * 支援自訂角色和固定角色檢查
       * @param {string} role - 角色名稱
       * @returns {boolean} 是否具有該角色
       */
      hasRole: (role) => {
        const { user } = get();
        // 優先檢查自訂角色
        if (user?.custom_role) {
          return user.custom_role === role;
        }
        // 回退到固定角色
        return user?.role === role;
      },
      
      /**
       * 檢查是否有 CRUD 權限
       * @param {string} module - 模組名稱 (brand, user, leave, etc.)
       * @param {string} action - 動作 (view, create, edit, delete)
       * @returns {boolean} 是否具有權限
       */
      hasCrudPermission: (module, action) => {
        const { user } = get();
        if (!user) return false;
        
        // 使用自訂角色的 CRUD 權限
        if (user.crud_permissions) {
          return user.crud_permissions[module]?.[action] || false;
        }
        
        // 回退到基於權限字符串的檢查
        return get().hasPermission(`${module}.${action}`);
      },
      
      /**
       * 檢查是否可以審核請假
       * @returns {boolean} 是否可以審核請假
       */
      canApproveLeave: () => {
        const { user } = get();
        if (!user) return false;
        
        // 使用自訂角色的審核權限
        if (user.can_approve_leave !== undefined) {
          return user.can_approve_leave;
        }
        
        // 回退到角色檢查
        return get().hasPermission('leave.approve');
      },
      
      /**
       * 獲取角色顯示名稱
       * @returns {string} 角色名稱
       */
      getRoleName: () => {
        const { user } = get();
        return user?.role_display_name || user?.custom_role || user?.role || 'Unknown';
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