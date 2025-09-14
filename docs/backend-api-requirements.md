# 後端 API 實作需求清單

## 🔥 **Brand 管理 - 必須實作**

### 1. Brand CRUD 操作
```
GET    /api/v1/brands              # 獲取 Brand 列表
POST   /api/v1/brands              # 新增 Brand
GET    /api/v1/brands/{id}         # 獲取單個 Brand
PUT    /api/v1/brands/{id}         # 更新 Brand
DELETE /api/v1/brands/{id}         # 刪除 Brand
```

### 2. Brand 資源管理
```
GET    /api/v1/brands/{id}/workspaces  # 獲取 Brand 的 Workspace 列表
GET    /api/v1/brands/{id}/bots        # 獲取 Brand 的 Bot 列表
GET    /api/v1/brands/{id}/agents      # 獲取 Brand 的 Agent 列表
POST   /api/v1/brands/{id}/sync        # 同步 Brand 資源
```

### 3. Brand 連接驗證
```
POST   /api/v1/brands/validate-connection  # 驗證 Brand 連接
```

## 🔧 **系統設定 - 必須實作**

### 1. 系統設定管理
```
GET    /api/v1/system/settings     # 獲取系統設定
PUT    /api/v1/system/settings     # 更新系統設定
```

### 2. 系統統計和備份
```
GET    /api/v1/system/stats        # 獲取系統統計
POST   /api/v1/system/backup       # 建立系統備份
```

## 📊 **資料格式規範**

### Brand 資料格式
```json
{
  "id": 1,
  "name": "Brand Name",
  "description": "Brand Description",
  "apiUrl": "https://api.example.com",
  "username": "username",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Workspace 資料格式
```json
{
  "id": "workspace_id",
  "name": "Workspace Name",
  "status": "active"
}
```

### Bot 資料格式
```json
{
  "id": "bot_id", 
  "name": "Bot Name",
  "status": "online"
}
```

### Agent 資料格式
```json
{
  "id": "agent_id",
  "name": "Agent Name", 
  "status": "online"
}
```

### 系統設定資料格式
```json
{
  "siteName": "HRM 管理系統",
  "defaultLanguage": "zh-TW",
  "timezone": "Asia/Taipei",
  "debugMode": false,
  "maxLoginAttempts": 5,
  "sessionTimeout": 24,
  "emailNotifications": true,
  "maintenanceMode": false
}
```

### 系統統計資料格式
```json
{
  "totalUsers": 156,
  "activeUsers": 89,
  "systemUptime": "15 天 8 小時",
  "lastBackup": "2024-01-15 02:00:00",
  "diskUsage": "45%",
  "memoryUsage": "68%"
}
```

## 🚨 **優先級分類**

### 🔴 **高優先級（立即需要）**
1. `GET /api/v1/brands` - Brand 列表顯示
2. `POST /api/v1/brands` - 新增 Brand 功能
3. `DELETE /api/v1/brands/{id}` - 刪除 Brand 功能
4. `GET /api/v1/system/settings` - 系統設定載入
5. `PUT /api/v1/system/settings` - 系統設定保存

### 🟡 **中優先級（近期需要）**
1. `GET /api/v1/brands/{id}/workspaces` - Workspace 管理
2. `GET /api/v1/brands/{id}/bots` - Bot 管理  
3. `GET /api/v1/brands/{id}/agents` - Agent 管理
4. `POST /api/v1/brands/{id}/sync` - 資源同步
5. `GET /api/v1/system/stats` - 系統統計

### 🟢 **低優先級（後續實作）**
1. `PUT /api/v1/brands/{id}` - 更新 Brand
2. `GET /api/v1/brands/{id}` - 單個 Brand 詳情
3. `POST /api/v1/brands/validate-connection` - 連接驗證
4. `POST /api/v1/system/backup` - 系統備份

## 🛡️ **安全要求**

### 1. 認證授權
- 所有 API 需要 Bearer Token 認證
- 檢查用戶權限（Owner/Admin 才能管理 Brand）

### 2. 輸入驗證
- 驗證必填欄位
- 檢查資料格式和長度
- 防止 SQL 注入

### 3. 錯誤處理
- 統一的錯誤回應格式
- 適當的 HTTP 狀態碼
- 清楚的錯誤訊息

## 📝 **實作建議**

### 1. 資料庫設計
```sql
-- brands 表
CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    api_url VARCHAR(500) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- system_settings 表
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name VARCHAR(255) DEFAULT 'HRM 管理系統',
    default_language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    debug_mode BOOLEAN DEFAULT FALSE,
    max_login_attempts INTEGER DEFAULT 5,
    session_timeout INTEGER DEFAULT 24,
    email_notifications BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. API 回應格式
```json
// 成功回應
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}

// 錯誤回應  
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料有誤"
  }
}
```

這些 API 是前端正常運作的基礎，建議按優先級順序實作。