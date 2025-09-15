/**
 * 本地儲存工具類
 * 用於管理 localStorage 和 sessionStorage 的資料存取
 * 提供快取機制以減少 API 調用次數
 */

// 快取鍵值常數定義
export const CACHE_KEYS = {
  BRANDS: 'hrm_brands',
  WORKSPACES: 'hrm_workspaces',
  SHIFT_CATEGORIES: 'hrm_shift_categories',
  LEAVE_TYPES: 'hrm_leave_types',
  USER_PREFERENCES: 'hrm_user_preferences',
  DASHBOARD_SETTINGS: 'hrm_dashboard_settings'
};

// 快取過期時間設定（毫秒）
export const CACHE_EXPIRY = {
  BRANDS: 24 * 60 * 60 * 1000,        // 24小時 - Brand 資料不常變更
  WORKSPACES: 12 * 60 * 60 * 1000,    // 12小時 - Workspace 資料較穩定
  SHIFT_CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7天 - 班別類別很少變更
  LEAVE_TYPES: 7 * 24 * 60 * 60 * 1000,      // 7天 - 請假類型很少變更
  USER_PREFERENCES: 30 * 24 * 60 * 60 * 1000, // 30天 - 使用者偏好設定
  DASHBOARD_SETTINGS: 7 * 24 * 60 * 60 * 1000 // 7天 - Dashboard 設定
};

/**
 * 檢查快取數據是否有效
 * @param {any} cached - 快取數據
 * @returns {boolean} 是否有效
 */
function isValidCacheData(cached) {
  if (!cached) return false;
  if (Array.isArray(cached)) return cached.length > 0;
  if (typeof cached === 'object') return Object.keys(cached).length > 0;
  return true;
}

/**
 * 本地儲存管理類
 */
class StorageManager {
  /**
   * 設定快取資料
   * @param {string} key - 快取鍵值
   * @param {any} data - 要快取的資料
   * @param {number} expiry - 過期時間（毫秒）
   */
  setCache(key, data, expiry = CACHE_EXPIRY.BRANDS) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('設定快取失敗:', error);
    }
  }

  /**
   * 取得快取資料
   * @param {string} key - 快取鍵值
   * @returns {any|null} 快取資料或 null
   */
  getCache(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // 檢查是否過期
      if (now - cacheData.timestamp > cacheData.expiry) {
        this.removeCache(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('讀取快取失敗:', error);
      return null;
    }
  }

  /**
   * 移除快取資料
   * @param {string} key - 快取鍵值
   */
  removeCache(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('移除快取失敗:', error);
    }
  }

  /**
   * 清除所有快取
   */
  clearAllCache() {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('清除快取失敗:', error);
    }
  }

  /**
   * 設定使用者偏好設定
   * @param {object} preferences - 偏好設定物件
   */
  setUserPreferences(preferences) {
    this.setCache(CACHE_KEYS.USER_PREFERENCES, preferences, CACHE_EXPIRY.USER_PREFERENCES);
  }

  /**
   * 取得使用者偏好設定
   * @returns {object} 偏好設定物件
   */
  getUserPreferences() {
    return this.getCache(CACHE_KEYS.USER_PREFERENCES) || {
      language: 'en',
      theme: 'light',
      autoRefresh: true,
      refreshInterval: 30
    };
  }

  /**
   * 設定 Dashboard 設定
   * @param {object} settings - Dashboard 設定
   */
  setDashboardSettings(settings) {
    this.setCache(CACHE_KEYS.DASHBOARD_SETTINGS, settings, CACHE_EXPIRY.DASHBOARD_SETTINGS);
  }

  /**
   * 取得 Dashboard 設定
   * @returns {object} Dashboard 設定
   */
  getDashboardSettings() {
    return this.getCache(CACHE_KEYS.DASHBOARD_SETTINGS) || {
      selectedBrand: '',
      selectedWorkspace: '',
      warningTime: 30,
      refreshInterval: 60
    };
  }

  /**
   * 檢查快取是否有效
   * @param {string} key - 快取鍵值
   * @returns {boolean} 是否有效
   */
  isCacheValid(key) {
    const cached = this.getCache(key);
    return isValidCacheData(cached);
  }

  /**
   * 檢查快取數據是否有效（靜態方法）
   * @param {any} cached - 快取數據
   * @returns {boolean} 是否有效
   */
  static isValidData(cached) {
    return isValidCacheData(cached);
  }
}

// 匯出單例實例
export const storageManager = new StorageManager();
export default storageManager;