import { buildApiUrl } from '../config/runtime';
import { storageManager, CACHE_KEYS, CACHE_EXPIRY } from '../utils/storage';

/**
 * API 客戶端類
 * 提供統一的 API 調用介面，包含快取機制以減少網路請求
 * 自動處理認證 Token 和錯誤回應
 */
class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    const config = {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      if (response.status === 404) {
        errorMessage = `API endpoint not implemented: ${endpoint}`;
      } else if (response.status === 403) {
        errorMessage = 'API 存取被拒絕，請檢查認證權限';
      } else if (response.status === 401) {
        errorMessage = 'API 認證失敗，請重新登入';
      } else {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            errorMessage = `API endpoint returned non-JSON response: ${endpoint}`;
          }
        } catch (e) {
          errorMessage = `API endpoint error: ${endpoint} (${response.status})`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(`API endpoint returned non-JSON response: ${endpoint}`);
    }

    return response.json();
  }

  // Auth APIs
  async login(credentials) {
    return this.request('/api/v1/auth/sign-in', {
      method: 'POST',
      body: credentials,
    });
  }

  async agentLogin(credentials) {
    return this.request('/api/v1/auth/agent-sign-in', {
      method: 'POST',
      body: credentials,
    });
  }

  async initAdmin(adminData) {
    return this.request('/api/v1/admin/init', {
      method: 'POST',
      body: adminData,
    });
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.request('/api/v1/dashboard/stats');
  }

  // Workspace APIs
  async getWorkspaces() {
    return this.request('/api/v1/users/workspaces');
  }

  async getWorkspaceMembers(workspaceId) {
    return this.request(`/api/v1/workspaces/${workspaceId}/members`);
  }

  // Bot APIs
  async getAllBots() {
    return this.request('/api/v1/bots/all-bots');
  }

  // Schedule APIs
  async getShiftTemplates() {
    return this.request('/api/v1/shift-templates');
  }

  async createShiftTemplate(template) {
    return this.request('/api/v1/shift-templates', {
      method: 'POST',
      body: template,
    });
  }

  async updateShiftTemplate(templateId, template) {
    return this.request(`/api/v1/shift-templates/${templateId}`, {
      method: 'PUT',
      body: template,
    });
  }

  async deleteShiftTemplate(templateId) {
    return this.request(`/api/v1/shift-templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async getScheduleAssignments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/schedule-assignments${query ? `?${query}` : ''}`);
  }

  async createScheduleAssignment(assignment) {
    return this.request('/api/v1/schedule-assignments', {
      method: 'POST',
      body: assignment,
    });
  }

  async batchCreateScheduleAssignments(assignments) {
    return this.request('/api/v1/schedule-assignments/batch', {
      method: 'POST',
      body: { assignments },
    });
  }

  // Leave APIs - 已移至 Leave Type APIs 區段

  async getLeaveBalance(userId, year) {
    return this.request(`/api/v1/users/${userId}/leave-balance${year ? `?year=${year}` : ''}`);
  }

  async getLeaveRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/leave-requests${query ? `?${query}` : ''}`);
  }

  async createLeaveRequest(request) {
    return this.request('/api/v1/leave-requests', {
      method: 'POST',
      body: request,
    });
  }

  async approveLeaveRequest(requestId, reason = '') {
    return this.request(`/api/v1/leave-requests/${requestId}/approve`, {
      method: 'POST',
      body: { reason },
    });
  }

  async rejectLeaveRequest(requestId, reason) {
    return this.request(`/api/v1/leave-requests/${requestId}/reject`, {
      method: 'POST',
      body: { reason },
    });
  }

  // Notice APIs
  async getNotices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/notices${query ? `?${query}` : ''}`);
  }

  async createNotice(notice) {
    return this.request('/api/v1/notices', {
      method: 'POST',
      body: notice,
    });
  }

  async updateNotice(noticeId, notice) {
    return this.request(`/api/v1/notices/${noticeId}`, {
      method: 'PUT',
      body: notice,
    });
  }

  async deleteNotice(noticeId) {
    return this.request(`/api/v1/notices/${noticeId}`, {
      method: 'DELETE',
    });
  }

  async markNoticeAsRead(noticeId) {
    return this.request(`/api/v1/notices/${noticeId}/read`, {
      method: 'POST',
    });
  }

  // System APIs
  async getSystemSettings() {
    return this.request('/api/v1/system/settings');
  }

  async updateSystemSettings(settings) {
    return this.request('/api/v1/system/settings', {
      method: 'PUT',
      body: settings,
    });
  }

  async getSystemStats() {
    return this.request('/api/v1/system/stats');
  }

  async createBackup() {
    return this.request('/api/v1/system/backup', {
      method: 'POST',
    });
  }

  // Brand APIs - 使用快取機制
  /**
   * 取得 Brand 列表
   * 優先從快取讀取，快取過期才調用 API
   */
  async getBrands(params = {}, useCache = true) {
    // 檢查快取
    if (useCache && Object.keys(params).length === 0) {
      const cached = storageManager.getCache(CACHE_KEYS.BRANDS);
      if (cached && cached.length > 0) {
        console.log('從快取載入 Brand 資料');
        return { data: cached };
      }
    }

    console.log('向 API 請求 Brand 資料');
    const query = new URLSearchParams(params).toString();
    const response = await this.request(`/api/v1/brands${query ? `?${query}` : ''}`);
    
    // 儲存到快取（僅在無參數查詢時）
    if (useCache && Object.keys(params).length === 0 && response.data) {
      storageManager.setCache(CACHE_KEYS.BRANDS, response.data, CACHE_EXPIRY.BRANDS);
    }
    
    return response;
  }

  /**
   * 取得監控用的 Brand 列表
   * 使用獨立的快取鍵值
   */
  async getMonitorBrands(params = {}, useCache = true) {
    const cacheKey = 'monitor_brands';
    
    // 檢查快取
    if (useCache && Object.keys(params).length === 0) {
      const cached = storageManager.getCache(cacheKey);
      if (cached && cached.length > 0) {
        console.log('從快取載入監控 Brand 資料');
        return { data: cached };
      }
    }

    console.log('向 API 請求監控 Brand 資料');
    const query = new URLSearchParams(params).toString();
    const response = await this.request(`/api/v1/monitor-brands${query ? `?${query}` : ''}`);
    
    // 儲存到快取
    if (useCache && Object.keys(params).length === 0 && response.data) {
      storageManager.setCache(cacheKey, response.data, CACHE_EXPIRY.BRANDS);
    }
    
    return response;
  }

  async createBrand(brand) {
    return this.request('/api/v1/brands', {
      method: 'POST',
      body: brand,
    });
  }

  async updateBrand(brandId, brand) {
    const response = await this.request(`/api/v1/brands/${brandId}`, {
      method: 'PUT',
      body: brand,
    });
    
    // 清除 Brand 快取以確保資料一致性
    storageManager.removeCache(CACHE_KEYS.BRANDS);
    
    return response;
  }

  async deleteBrand(brandId) {
    return this.request(`/api/v1/brands/${brandId}`, {
      method: 'DELETE',
    });
  }

  async getBrandById(brandId) {
    return this.request(`/api/v1/brands/${brandId}`);
  }

  async validateBrandConnection(credentials) {
    return this.request('/api/v1/brands/validate-connection', {
      method: 'POST',
      body: credentials,
    });
  }

  // Brand Resource Management APIs - 使用快取機制
  /**
   * 取得指定 Brand 的 Workspace 列表
   * 使用 Brand ID 作為快取鍵值的一部分
   */
  async getBrandWorkspaces(brandId, useCache = true) {
    const cacheKey = `${CACHE_KEYS.WORKSPACES}_${brandId}`;
    
    // 檢查快取
    if (useCache) {
      const cached = storageManager.getCache(cacheKey);
      if (cached && cached.length > 0) {
        console.log(`從快取載入 Brand ${brandId} 的 Workspace 資料`);
        return { data: cached };
      }
    }

    console.log(`向 API 請求 Brand ${brandId} 的 Workspace 資料`);
    const response = await this.request(`/api/v1/workspaces-by-brand/${brandId}`);
    
    // 儲存到快取
    if (useCache && response.data) {
      storageManager.setCache(cacheKey, response.data, CACHE_EXPIRY.WORKSPACES);
    }
    
    return response;
  }

  async getBrandBots(brandId) {
    return this.request(`/api/v1/brands/${brandId}/bots`);
  }

  async getBrandAgents(brandId) {
    return this.request(`/api/v1/brands/${brandId}/agents`);
  }

  async syncBrandResources(brandId) {
    return this.request(`/api/v1/brands/${brandId}/sync`, {
      method: 'POST',
    });
  }

  // Agent Monitor API (新版本)
  async getAgentMonitor(brandId, workspaceId, refreshInterval, warningTime) {
    const params = new URLSearchParams({
      brand_id: brandId,
      workspace_id: workspaceId,
      refresh_interval: refreshInterval,
      warning_time: warningTime
    });
    return this.request(`/api/v1/agent-monitor?${params}`);
  }

  // User APIs
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/users${query ? `?${query}` : ''}`);
  }

  async createUser(user) {
    return this.request('/api/v1/users', {
      method: 'POST',
      body: user,
    });
  }

  async updateUser(userId, user) {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: user,
    });
  }

  async deleteUser(userId) {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserById(userId) {
    return this.request(`/api/v1/users/${userId}`);
  }

  async getBrandToken(brandId) {
    return this.request(`/api/v1/brands/${brandId}/token`);
  }

  // Agent Monitor Dashboard API
  async getAgentMonitorStats() {
    return this.request('/api/v1/dashboard/agent-monitor');
  }

  // Agent APIs
  async getAgentProfile() {
    return this.request('/api/v1/agent/profile');
  }

  async updateAgentStatus(status) {
    return this.request('/api/v1/agent/status', {
      method: 'PUT',
      body: { status }
    });
  }

  async getAgentSchedule(date) {
    return this.request(`/api/v1/agent/schedule?date=${date}`);
  }

  async getAgentNotices() {
    return this.request('/api/v1/agent/notices');
  }

  async getAgentLeaveBalance() {
    return this.request('/api/v1/agent/leave-balance');
  }

  async submitLeaveRequest(leaveData) {
    return this.request('/api/v1/leave-requests', {
      method: 'POST',
      body: leaveData
    });
  }

  // Leave Type APIs - 使用快取機制
  /**
   * 取得請假類型列表
   * 請假類型變更頻率低，使用長期快取
   */
  async getLeaveTypes(useCache = true) {
    // 檢查快取
    if (useCache) {
      const cached = storageManager.getCache(CACHE_KEYS.LEAVE_TYPES);
      if (cached && cached.length > 0) {
        console.log('從快取載入請假類型資料');
        return { data: cached };
      }
    }

    console.log('向 API 請求請假類型資料');
    const response = await this.request('/api/v1/leave-types');
    
    // 儲存到快取
    if (useCache && response.data) {
      storageManager.setCache(CACHE_KEYS.LEAVE_TYPES, response.data, CACHE_EXPIRY.LEAVE_TYPES);
    }
    
    return response;
  }

  /**
   * 建立請假類型
   * 建立後清除相關快取
   */
  async createLeaveType(leaveType) {
    const response = await this.request('/api/v1/leave-types', {
      method: 'POST',
      body: leaveType,
    });
    
    // 清除快取以確保資料一致性
    storageManager.removeCache(CACHE_KEYS.LEAVE_TYPES);
    
    return response;
  }

  /**
   * 更新請假類型
   * 更新後清除相關快取
   */
  async updateLeaveType(typeId, leaveType) {
    const response = await this.request(`/api/v1/leave-types/${typeId}`, {
      method: 'PUT',
      body: leaveType,
    });
    
    // 清除快取以確保資料一致性
    storageManager.removeCache(CACHE_KEYS.LEAVE_TYPES);
    
    return response;
  }

  /**
   * 刪除請假類型
   * 刪除後清除相關快取
   */
  async deleteLeaveType(typeId) {
    const response = await this.request(`/api/v1/leave-types/${typeId}`, {
      method: 'DELETE',
    });
    
    // 清除快取以確保資料一致性
    storageManager.removeCache(CACHE_KEYS.LEAVE_TYPES);
    
    return response;
  }

  /**
   * 清除所有快取
   * 用於登出或需要強制重新載入資料時
   */
  clearAllCache() {
    storageManager.clearAllCache();
    console.log('已清除所有快取資料');
  }
}

export const apiClient = new ApiClient();
export default apiClient;