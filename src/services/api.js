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
      body: {
        brand_id: credentials.brandId || credentials.brand_id,
        email: credentials.email,
        password: credentials.password
      },
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

  async updateScheduleAssignment(scheduleId, assignment) {
    return this.request(`/api/v1/schedule-assignments/${scheduleId}`, {
      method: 'PUT',
      body: assignment,
    });
  }

  async deleteScheduleAssignment(scheduleId) {
    return this.request(`/api/v1/schedule-assignments/${scheduleId}`, {
      method: 'DELETE',
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

  async getLeaveRequestsByDateRange(memberId, startDate, endDate, status = null) {
    const params = {
      member_id: memberId,
      start_date: startDate,
      end_date: endDate
    };
    if (status) {
      params.status = status;
    }
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/leave-requests?${query}`);
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

  async getSystemHealth() {
    return this.request('/api/v1/system/health');
  }

  async getSystemLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/system/logs${query ? `?${query}` : ''}`);
  }

  async restartSystem() {
    return this.request('/api/v1/system/restart', {
      method: 'POST',
    });
  }

  // Third-party Brand APIs for Test page and Agent Monitor V2
  async getThirdPartyTeams(brandApiUrl, brandToken, workspaceId) {
    const url = `${brandApiUrl}/api/v1/teams?workspace_id=${workspaceId}&activate_state=active`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${brandToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getThirdPartyTeamCapacity(brandApiUrl, brandToken, teamId) {
    const url = `${brandApiUrl}/api/v1/teams/${teamId}/workload-capacity`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${brandToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
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
        return { data: cached };
      }
    }

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
        return { data: cached };
      }
    }

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
        return { data: cached };
      }
    }

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
  async getAgentProfile(userId) {
    if (!userId) {
      throw new Error('User ID is required for agent profile');
    }
    return this.request(`/api/v1/agent/profile?user_id=${userId}`);
  }

  async updateAgentStatus(status) {
    return this.request('/api/v1/agent/status', {
      method: 'PUT',
      body: { status }
    });
  }

  async getAgentSchedule(memberId, date) {
    if (!memberId) {
      throw new Error('Member ID is required for agent schedule');
    }
    return this.request(`/api/v1/schedule-assignments?memberId=${memberId}&date=${date}`);
  }

  async getAgentNotices(workspaceId) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required for agent notices');
    }
    return this.request(`/api/v1/agent/notices?workspace_id=${workspaceId}`);
  }

  async getAgentLeaveBalance(memberId) {
    if (!memberId) {
      throw new Error('Member ID is required for agent leave balance');
    }
    return this.request(`/api/v1/leave-balance/${memberId}`);
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
        return { data: cached };
      }
    }

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

  // Salary Management APIs
  
  // Salary Settings APIs
  async getSalarySettings(workspaceId) {
    return this.request(`/api/v1/salary/settings/${workspaceId}`);
  }

  async updateSalarySettings(workspaceId, settings) {
    return this.request(`/api/v1/salary/settings/${workspaceId}`, {
      method: 'POST',
      body: settings,
    });
  }

  // Salary Grades APIs
  async getSalaryGrades() {
    return this.request('/api/v1/salary/grades');
  }

  async createSalaryGrade(grade) {
    return this.request('/api/v1/salary/grades', {
      method: 'POST',
      body: grade,
    });
  }

  async updateSalaryGrade(gradeId, grade) {
    return this.request(`/api/v1/salary/grades/${gradeId}`, {
      method: 'PUT',
      body: grade,
    });
  }

  async deleteSalaryGrade(gradeId) {
    return this.request(`/api/v1/salary/grades/${gradeId}`, {
      method: 'DELETE',
    });
  }

  // Employee Salary APIs
  async getEmployeeSalaries() {
    return this.request('/api/v1/salary/employees');
  }

  async setEmployeeSalary(employeeId, salaryData) {
    return this.request(`/api/v1/salary/employees/${employeeId}`, {
      method: 'POST',
      body: salaryData,
    });
  }

  async updateEmployeeSalary(employeeId, salaryData) {
    return this.request(`/api/v1/salary/employees/${employeeId}`, {
      method: 'PUT',
      body: salaryData,
    });
  }

  async deleteEmployeeSalary(employeeId) {
    return this.request(`/api/v1/salary/employees/${employeeId}`, {
      method: 'DELETE',
    });
  }

  async getEmployeeSalaryHistory(employeeId) {
    return this.request(`/api/v1/salary/employees/${employeeId}/history`);
  }

  // Salary Adjustment Type APIs
  async getSalaryAdjustmentTypes() {
    return this.request('/api/v1/salary/adjustment-types');
  }

  async createSalaryAdjustmentType(type) {
    return this.request('/api/v1/salary/adjustment-types', {
      method: 'POST',
      body: type,
    });
  }

  async updateSalaryAdjustmentType(typeId, type) {
    return this.request(`/api/v1/salary/adjustment-types/${typeId}`, {
      method: 'PUT',
      body: type,
    });
  }

  async deleteSalaryAdjustmentType(typeId) {
    return this.request(`/api/v1/salary/adjustment-types/${typeId}`, {
      method: 'DELETE',
    });
  }

  // Salary Adjustments APIs
  async getSalaryAdjustments() {
    return this.request('/api/v1/salary/adjustments');
  }

  async createSalaryAdjustment(adjustment) {
    return this.request('/api/v1/salary/adjustments', {
      method: 'POST',
      body: adjustment,
    });
  }

  async processSalaryAdjustment(adjustmentId) {
    return this.request(`/api/v1/salary/adjustments/${adjustmentId}/process`, {
      method: 'PUT',
    });
  }

  async deleteSalaryAdjustment(adjustmentId) {
    return this.request(`/api/v1/salary/adjustments/${adjustmentId}`, {
      method: 'DELETE',
    });
  }

  // Salary Calculations APIs
  async getSalaryCalculations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/salary/calculations${query ? `?${query}` : ''}`);
  }

  async getSalaryCalculationById(calculationId) {
    return this.request(`/api/v1/salary/calculations/${calculationId}`);
  }

  async createSalaryCalculation(calculation) {
    return this.request('/api/v1/salary/calculations', {
      method: 'POST',
      body: calculation,
    });
  }

  async updateSalaryCalculation(calculationId, calculation) {
    return this.request(`/api/v1/salary/calculations/${calculationId}`, {
      method: 'PUT',
      body: calculation,
    });
  }

  async deleteSalaryCalculation(calculationId) {
    return this.request(`/api/v1/salary/calculations/${calculationId}`, {
      method: 'DELETE',
    });
  }

  async confirmSalaryCalculation(calculationId) {
    return this.request(`/api/v1/salary/calculations/${calculationId}/confirm`, {
      method: 'PUT',
    });
  }

  async paySalaryCalculation(calculationId) {
    return this.request(`/api/v1/salary/calculations/${calculationId}/pay`, {
      method: 'PUT',
    });
  }

  // Salary Reports APIs
  async getSalaryReports(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for salary reports');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/salary/reports?${query}`);
  }

  async getSalaryStatistics(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for salary statistics');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/salary/statistics?${query}`);
  }

  // Attendance Management APIs
  
  // Attendance Records APIs
  async getAttendanceRecords(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance records');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/attendance/records?${query}`);
  }

  async createAttendanceRecord(record) {
    return this.request('/api/v1/attendance/records', {
      method: 'POST',
      body: record,
    });
  }

  async updateAttendanceRecord(recordId, record) {
    return this.request(`/api/v1/attendance/records/${recordId}`, {
      method: 'PUT',
      body: record,
    });
  }

  async deleteAttendanceRecord(recordId) {
    return this.request(`/api/v1/attendance/records/${recordId}`, {
      method: 'DELETE',
    });
  }

  // Attendance Settings APIs
  async getAttendanceSettings(workspaceId) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance settings');
    }
    return this.request(`/api/v1/attendance/settings/${workspaceId}`);
  }

  async updateAttendanceSettings(workspaceId, settings) {
    return this.request(`/api/v1/attendance/settings/${workspaceId}`, {
      method: 'PUT',
      body: settings,
    });
  }

  // Attendance API Logs APIs
  async getAttendanceApiLogs(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance API logs');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/attendance/api-logs?${query}`);
  }

  async exportAttendanceProof(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance proof export');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/attendance/export-proof?${query}`);
  }

  // Attendance Statistics APIs
  async getAttendanceStatistics(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance statistics');
    }
    const allParams = { workspace_id: workspaceId, ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request(`/api/v1/attendance/statistics?${query}`);
  }

  // Attendance Monitoring APIs
  async getAttendanceMonitoring(workspaceId) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance monitoring');
    }
    return this.request(`/api/v1/attendance/monitoring/${workspaceId}`);
  }

  async testAttendanceApiConnection(workspaceId) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance API test');
    }
    return this.request(`/api/v1/attendance/test-connection/${workspaceId}`, {
      method: 'POST',
    });
  }

  async syncAttendanceData(workspaceId, params = {}) {
    if (!workspaceId) {
      throw new Error('workspace_id is required for attendance sync');
    }
    return this.request(`/api/v1/attendance/sync/${workspaceId}`, {
      method: 'POST',
      body: params,
    });
  }

  /**
   * 清除所有快取
   * 用於登出或需要強制重新載入資料時
   */
  clearAllCache() {
    storageManager.clearAllCache();
  }
}

export const apiClient = new ApiClient();
export default apiClient;