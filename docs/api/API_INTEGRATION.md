# API 整合文件

## API 客戶端架構

### 基礎配置

API 客戶端位於 `src/services/api.js`，提供統一的 API 調用介面和快取機制。

```javascript
// 基本使用方式
import apiClient from '../services/api';

// 調用 API
const response = await apiClient.getBrands();
const data = response.data || response;
```

### 快取策略

系統實作了智能快取機制以減少網路請求：

| 資料類型 | 快取時間 | 說明 |
|---------|---------|------|
| Brand 資料 | 24小時 | Brand 資料變更頻率低 |
| Workspace 資料 | 12小時 | Workspace 相對穩定 |
| 班別類別 | 7天 | 班別類別很少變更 |
| 請假類型 | 7天 | 請假類型設定穩定 |
| 使用者偏好 | 30天 | 個人設定長期有效 |

## API 端點清單

### 認證相關 API

#### POST /api/v1/auth/sign-in
管理員登入

**請求格式:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**回應格式:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "admin",
      "role": "Admin",
      "email": "admin@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/v1/auth/agent-sign-in
Agent 登入

**請求格式:**
```json
{
  "username": "agent001",
  "password": "password123"
}
```

### Brand 管理 API

#### GET /api/v1/brands
取得 Brand 列表

**回應格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9317607e-6656-409f-89e1-bb50b64901ed",
      "name": "New Test Brand",
      "description": "測試用 Brand",
      "api_url": "https://api.baji.cxgenie.app",
      "is_active": true,
      "created_at": "2025-01-13T10:44:10Z"
    }
  ]
}
```

#### POST /api/v1/brands
建立新 Brand

**請求格式:**
```json
{
  "name": "New Brand",
  "description": "Brand 描述",
  "apiUrl": "https://api.example.com",
  "username": "api_user",
  "password": "api_password",
  "status": "active"
}
```

#### PUT /api/v1/brands/{brandId}
更新 Brand 資訊

#### DELETE /api/v1/brands/{brandId}
刪除 Brand

### Workspace 管理 API

#### GET /api/v1/workspaces-by-brand/{brandId}
取得指定 Brand 的 Workspace 列表

**回應格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "034e7e17-9a73-4396-ae5d-5df766a8baab",
      "name": "baji",
      "description": "客服工作區",
      "status": "active"
    }
  ]
}
```

#### GET /api/v1/workspaces/{workspaceId}/members
取得 Workspace 成員列表

**回應格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "member_1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Agent",
      "status": "active"
    }
  ]
}
```

### Agent 監控 API

#### GET /api/v1/monitor-brands
取得監控用 Brand 列表

**回應格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9317607e-6656-409f-89e1-bb50b64901ed",
      "name": "New Test Brand"
    }
  ]
}
```

#### GET /api/v1/agent-monitor
取得 Agent 監控資料

**請求參數:**
- `brand_id` (必填): Brand ID
- `workspace_id` (必填): Workspace ID  
- `refresh_interval` (必填): 刷新間隔（秒）
- `warning_time` (必填): 警告時間閾值（分鐘）

**回應格式:**
```json
{
  "success": true,
  "data": {
    "brand_id": "9317607e-6656-409f-89e1-bb50b64901ed",
    "workspace_id": "034e7e17-9a73-4396-ae5d-5df766a8baab",
    "brand_name": "New Test Brand",
    "workspace_name": "baji",
    "on_service": [
      {
        "id": "agent_1",
        "name": "Agent Alice",
        "email": "alice@example.com"
      }
    ],
    "on_line": [],
    "warning": [],
    "offline": [],
    "summary": {
      "on_service_count": 1,
      "on_line_count": 0,
      "warning_count": 0,
      "offline_count": 0,
      "total_agents": 1
    }
  }
}
```

### 使用者管理 API

#### GET /api/v1/users
取得使用者列表

#### POST /api/v1/users
建立新使用者

#### PUT /api/v1/users/{userId}
更新使用者資訊

#### DELETE /api/v1/users/{userId}
刪除使用者

### 排班管理 API

#### GET /api/v1/shift-templates
取得班別模板列表

#### POST /api/v1/shift-templates
建立班別模板

**請求格式:**
```json
{
  "name": "Morning Shift",
  "category": "full_day",
  "start_time": "09:00",
  "end_time": "18:00",
  "is_cross_day": false,
  "timezone": "Asia/Taipei",
  "total_break_minutes": 60,
  "break_periods": [
    {
      "start_time": "12:00",
      "end_time": "13:00"
    }
  ]
}
```

#### GET /api/v1/schedule-assignments
取得排班指派列表

**回應格式:**
```json
{
  "success": true,
  "data": [
    {
      "id": "assignment_1",
      "title": "Morning Shift - John Doe",
      "start": "2024-01-15T09:00:00Z",
      "end": "2024-01-15T18:00:00Z",
      "brand_id": "brand_1",
      "workspace_id": "workspace_1",
      "member_id": "member_1",
      "template_id": "template_1"
    }
  ]
}
```

#### POST /api/v1/schedule-assignments
建立排班指派

**請求格式:**
```json
{
  "brand_id": "brand_1",
  "workspace_id": "workspace_1",
  "member_id": "member_1",
  "template_id": "template_1",
  "date": "2024-01-15",
  "break_schedule": []
}
```

### 請假管理 API

#### GET /api/v1/leave-types
取得請假類型列表

#### POST /api/v1/leave-types
建立請假類型

**請求格式:**
```json
{
  "name": "Annual Leave",
  "code": "ANNUAL",
  "quota": 14,
  "allow_half_day": true,
  "require_attachment": false,
  "description": "年假"
}
```

#### GET /api/v1/leave-requests
取得請假申請列表

#### POST /api/v1/leave-requests
建立請假申請

#### POST /api/v1/leave-requests/{requestId}/approve
核准請假申請

#### POST /api/v1/leave-requests/{requestId}/reject
拒絕請假申請

### 公告管理 API

#### GET /api/v1/notices
取得公告列表

#### POST /api/v1/notices
建立公告

#### PUT /api/v1/notices/{noticeId}
更新公告

#### DELETE /api/v1/notices/{noticeId}
刪除公告

### Dashboard API

#### GET /api/v1/dashboard/stats
取得 Dashboard 統計資料

**回應格式:**
```json
{
  "success": true,
  "data": {
    "total_brands": 1,
    "total_workspaces": 11,
    "total_bots": 37,
    "total_agents": 227
  }
}
```

## 錯誤處理

### 標準錯誤格式

所有 API 錯誤都遵循統一格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": {
      "field": "username",
      "reason": "使用者名稱不能為空"
    }
  }
}
```

### 常見錯誤碼

| 錯誤碼 | HTTP 狀態 | 說明 |
|-------|----------|------|
| VALIDATION_ERROR | 400 | 請求參數驗證失敗 |
| UNAUTHORIZED | 401 | 未授權，需要登入 |
| FORBIDDEN | 403 | 權限不足 |
| NOT_FOUND | 404 | 資源不存在 |
| CONFLICT | 409 | 資源衝突 |
| INTERNAL_ERROR | 500 | 伺服器內部錯誤 |

### 前端錯誤處理

```javascript
try {
  const response = await apiClient.getBrands();
  // 處理成功回應
} catch (error) {
  if (error.message.includes('401')) {
    // 處理未授權錯誤
    authStore.logout();
    navigate('/login');
  } else if (error.message.includes('403')) {
    // 處理權限不足錯誤
    showErrorDialog('權限不足', '您沒有執行此操作的權限');
  } else {
    // 處理其他錯誤
    showErrorDialog('操作失敗', error.message);
  }
}
```

## 快取機制使用

### 自動快取

API 客戶端會自動快取以下類型的資料：

```javascript
// 這些 API 會自動使用快取
const brands = await apiClient.getBrands(); // 24小時快取
const workspaces = await apiClient.getBrandWorkspaces(brandId); // 12小時快取
const leaveTypes = await apiClient.getLeaveTypes(); // 7天快取
```

### 手動快取控制

```javascript
// 強制重新載入，跳過快取
const brands = await apiClient.getBrands({}, false);

// 清除特定快取
storageManager.removeCache(CACHE_KEYS.BRANDS);

// 清除所有快取
apiClient.clearAllCache();
```

### 快取失效策略

當執行 CUD 操作時，相關快取會自動清除：

```javascript
// 建立新 Brand 後，Brand 列表快取會被清除
await apiClient.createBrand(brandData);

// 更新請假類型後，請假類型快取會被清除  
await apiClient.updateLeaveType(typeId, typeData);
```

## 認證與授權

### JWT Token 管理

```javascript
// Token 會自動附加到所有 API 請求
apiClient.setToken(jwtToken);

// 檢查 Token 有效性
const isValid = authStore.checkTokenValidity();
```

### 權限檢查

```javascript
// 在組件中檢查權限
const { hasPermission } = useAuthStore();

if (hasPermission('brand.create')) {
  // 顯示建立按鈕
}

// 在 API 調用前檢查權限
if (!hasPermission('user.delete')) {
  throw new Error('權限不足');
}
```

## 開發與測試

### Mock API 回應

```javascript
// 在開發環境中使用 Mock 資料
if (process.env.NODE_ENV === 'development') {
  // 模擬 API 延遲
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 回傳 Mock 資料
  return {
    success: true,
    data: mockData
  };
}
```

### API 測試

```javascript
// 測試 API 調用
describe('API Client', () => {
  it('should fetch brands successfully', async () => {
    const mockResponse = { success: true, data: [] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await apiClient.getBrands();
    expect(result).toEqual(mockResponse);
  });
});
```

## 效能優化建議

### 1. 批次請求

```javascript
// 使用 Promise.all 並行請求
const [brands, workspaces, users] = await Promise.all([
  apiClient.getBrands(),
  apiClient.getBrandWorkspaces(brandId),
  apiClient.getUsers()
]);
```

### 2. 請求去重

```javascript
// 避免重複請求
let pendingRequest = null;

const getBrands = async () => {
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = apiClient.getBrands();
  const result = await pendingRequest;
  pendingRequest = null;
  
  return result;
};
```

### 3. 分頁載入

```javascript
// 實作分頁載入
const loadUsers = async (page = 1, limit = 20) => {
  const response = await apiClient.getUsers({ page, limit });
  return response;
};
```

## 故障排除

### 常見問題

1. **CORS 錯誤**
   - 確認後端 CORS 設定
   - 檢查 API URL 是否正確

2. **Token 過期**
   - 實作自動重新整理機制
   - 提示使用者重新登入

3. **網路連接問題**
   - 實作重試機制
   - 提供離線提示

### 除錯工具

```javascript
// 啟用 API 除錯模式
localStorage.setItem('API_DEBUG', 'true');

// 在 API 客戶端中添加除錯日誌
if (localStorage.getItem('API_DEBUG')) {
  console.log('API Request:', url, options);
  console.log('API Response:', response);
}
```