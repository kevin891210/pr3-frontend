# HRM Backend API 開發指南

## 概述

本文檔詳細說明 HRM 前端系統所需的所有後端 API 端點，包括請求格式、響應格式和業務邏輯要求。

## 技術規範

### 基本要求
- **協議**: HTTP/HTTPS
- **數據格式**: JSON
- **認證方式**: JWT Token
- **字符編碼**: UTF-8
- **CORS**: 支援跨域請求

### 統一響應格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 錯誤響應格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "參數驗證失敗",
    "details": ["用戶名不能為空"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API 端點清單

### 1. 健康檢查

#### GET /health
系統健康狀態檢查

**請求**
```http
GET /health
```

**響應**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

### 2. 認證系統

#### POST /api/v1/auth/sign-in
管理員登入

**請求**
```json
{
  "email": "admin@hrm.com",
  "password": "password123"
}
```

**響應**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "系統管理員",
      "email": "admin@hrm.com",
      "role": "Admin",
      "permissions": ["user.read", "user.write", "system.admin"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

#### POST /api/v1/auth/agent-sign-in
Agent 登入

**請求**
```json
{
  "email": "agent@hrm.com",
  "password": "password123",
  "brand_id": 1
}
```

**響應**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "客服專員",
      "email": "agent@hrm.com",
      "role": "Agent",
      "brand_id": 1,
      "permissions": ["schedule.read", "leave.create"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

#### POST /api/v1/admin/init
系統初始化（創建第一個管理員）

**請求**
```json
{
  "name": "系統管理員",
  "email": "admin@hrm.com",
  "password": "password123"
}
```

**響應**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "系統管理員",
      "email": "admin@hrm.com",
      "role": "Owner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Dashboard 統計

#### GET /api/v1/dashboard/stats
獲取 Dashboard 統計數據

**請求**
```http
GET /api/v1/dashboard/stats
Authorization: Bearer {token}
```

**響應**
```json
{
  "success": true,
  "data": {
    "total_brands": 5,
    "total_workspaces": 12,
    "total_bots": 8,
    "total_agents": 24,
    "active_agents": 18,
    "online_agents": 15
  }
}
```

#### GET /api/v1/dashboard/agent-monitor
獲取 Agent 監控統計

**請求**
```http
GET /api/v1/dashboard/agent-monitor
Authorization: Bearer {token}
```

**響應**
```json
{
  "success": true,
  "data": {
    "on_service": [
      {"id": 1, "name": "Agent A", "status": "busy", "current_sessions": 3}
    ],
    "on_line": [
      {"id": 2, "name": "Agent B", "status": "available", "last_activity": "2024-01-15T10:25:00Z"}
    ],
    "warning": [
      {"id": 3, "name": "Agent C", "status": "idle", "idle_time": 1800}
    ],
    "offline": [
      {"id": 4, "name": "Agent D", "status": "offline", "last_seen": "2024-01-15T09:00:00Z"}
    ]
  }
}
```

---

### 4. 使用者管理

#### GET /api/v1/users
獲取使用者列表

**請求參數**
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 20)
- `role`: 角色篩選
- `search`: 搜尋關鍵字

**請求**
```http
GET /api/v1/users?page=1&limit=20&role=Agent
Authorization: Bearer {token}
```

**響應**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "張三",
        "email": "zhang@hrm.com",
        "role": "Agent",
        "status": "active",
        "brand_id": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-15T09:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 100,
      "per_page": 20
    }
  }
}
```

#### POST /api/v1/users
創建新使用者

**請求**
```json
{
  "name": "李四",
  "email": "li@hrm.com",
  "password": "password123",
  "role": "Agent",
  "brand_id": 1,
  "permissions": ["schedule.read", "leave.create"]
}
```

**響應**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "李四",
    "email": "li@hrm.com",
    "role": "Agent",
    "status": "active",
    "brand_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/v1/users/{id}
更新使用者資料

**請求**
```json
{
  "name": "李四（更新）",
  "role": "TeamLeader",
  "status": "active",
  "permissions": ["schedule.read", "schedule.write", "leave.approve"]
}
```

#### DELETE /api/v1/users/{id}
刪除使用者

**響應**
```json
{
  "success": true,
  "message": "使用者已成功刪除"
}
```

---

### 5. Brand 管理

#### GET /api/v1/brands
獲取 Brand 列表

**請求參數**
- `page`: 頁碼
- `limit`: 每頁數量
- `status`: 狀態篩選 (active/inactive)
- `search`: 搜尋關鍵字

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "品牌 A",
      "description": "客服品牌 A",
      "api_url": "https://api.brand-a.com",
      "status": "active",
      "workspace_count": 3,
      "bot_count": 2,
      "agent_count": 15,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/v1/brands
創建新 Brand

**請求**
```json
{
  "name": "品牌 B",
  "description": "新的客服品牌",
  "api_url": "https://api.brand-b.com",
  "username": "api_user",
  "password": "api_password",
  "status": "active"
}
```

#### PUT /api/v1/brands/{id}
更新 Brand 資料

#### DELETE /api/v1/brands/{id}
刪除 Brand

#### GET /api/v1/brands/{id}
獲取單一 Brand 詳細資料

#### POST /api/v1/brands/validate-connection
驗證 Brand API 連接

**請求**
```json
{
  "api_url": "https://api.brand-test.com",
  "username": "test_user",
  "password": "test_password"
}
```

**響應**
```json
{
  "success": true,
  "data": {
    "connection_status": "success",
    "response_time": 150,
    "api_version": "v1.2.0"
  }
}
```

---

### 6. Brand 資源管理

#### GET /api/v1/workspaces-by-brand/{brand_id}
獲取指定 Brand 的 Workspace 列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "客服部門",
      "brand_id": 1,
      "status": "active",
      "agent_count": 10,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/v1/brands/{id}/bots
獲取 Brand 的 Bot 列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "智能客服 Bot",
      "brand_id": 1,
      "status": "online",
      "type": "chatbot",
      "last_active": "2024-01-15T10:25:00Z"
    }
  ]
}
```

#### GET /api/v1/brands/{id}/agents
獲取 Brand 的 Agent 列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "客服專員 A",
      "email": "agent-a@brand.com",
      "brand_id": 1,
      "workspace_id": 1,
      "status": "online",
      "current_sessions": 2,
      "last_activity": "2024-01-15T10:20:00Z"
    }
  ]
}
```

#### POST /api/v1/brands/{id}/sync
同步 Brand 資源

**響應**
```json
{
  "success": true,
  "data": {
    "workspaces": 3,
    "bots": 2,
    "agents": 15,
    "sync_time": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. 工作區管理

#### GET /api/v1/users/workspaces
獲取使用者可存取的工作區

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "客服部門",
      "brand_id": 1,
      "brand_name": "品牌 A",
      "role": "member",
      "permissions": ["schedule.read", "leave.create"]
    }
  ]
}
```

#### GET /api/v1/workspaces/{id}/members
獲取工作區成員列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "張三",
      "email": "zhang@hrm.com",
      "role": "Agent",
      "status": "active",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 8. Bot 管理

#### GET /api/v1/bots/all-bots
獲取所有 Bot 列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "智能客服 Bot",
      "brand_id": 1,
      "brand_name": "品牌 A",
      "type": "chatbot",
      "status": "online",
      "capabilities": ["text", "image", "file"],
      "last_active": "2024-01-15T10:25:00Z"
    }
  ]
}
```

---

### 9. 排班管理

#### GET /api/v1/shift-templates
獲取班別模板列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "早班",
      "start_time": "09:00",
      "end_time": "17:00",
      "break_duration": 60,
      "description": "標準早班時段",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/v1/shift-templates
創建班別模板

**請求**
```json
{
  "name": "晚班",
  "start_time": "18:00",
  "end_time": "02:00",
  "break_duration": 60,
  "description": "夜間班別",
  "is_active": true
}
```

#### PUT /api/v1/shift-templates/{id}
更新班別模板

#### DELETE /api/v1/shift-templates/{id}
刪除班別模板

#### GET /api/v1/schedule-assignments
獲取排班指派列表

**請求參數**
- `start_date`: 開始日期 (YYYY-MM-DD)
- `end_date`: 結束日期 (YYYY-MM-DD)
- `user_id`: 使用者 ID
- `brand_id`: Brand ID

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "張三",
      "shift_template_id": 1,
      "shift_name": "早班",
      "date": "2024-01-15",
      "start_time": "09:00",
      "end_time": "17:00",
      "status": "confirmed",
      "created_at": "2024-01-10T00:00:00Z"
    }
  ]
}
```

#### POST /api/v1/schedule-assignments
創建排班指派

**請求**
```json
{
  "user_id": 1,
  "shift_template_id": 1,
  "date": "2024-01-16",
  "notes": "臨時調班"
}
```

#### POST /api/v1/schedule-assignments/batch
批量創建排班指派

**請求**
```json
{
  "assignments": [
    {
      "user_id": 1,
      "shift_template_id": 1,
      "date": "2024-01-16"
    },
    {
      "user_id": 2,
      "shift_template_id": 2,
      "date": "2024-01-16"
    }
  ]
}
```

---

### 10. 請假管理

#### GET /api/v1/leave-types
獲取請假類型列表

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "年假",
      "code": "ANNUAL",
      "days_per_year": 14,
      "requires_approval": true,
      "advance_notice_days": 3,
      "description": "年度休假",
      "is_active": true
    }
  ]
}
```

#### POST /api/v1/leave-types
創建請假類型

#### PUT /api/v1/leave-types/{id}
更新請假類型

#### DELETE /api/v1/leave-types/{id}
刪除請假類型

#### GET /api/v1/users/{user_id}/leave-balance
獲取使用者請假餘額

**請求參數**
- `year`: 年份 (預設: 當前年份)

**響應**
```json
{
  "success": true,
  "data": [
    {
      "leave_type_id": 1,
      "leave_type_name": "年假",
      "total_days": 14,
      "used_days": 3,
      "pending_days": 1,
      "remaining_days": 10,
      "year": 2024
    }
  ]
}
```

#### GET /api/v1/leave-requests
獲取請假申請列表

**請求參數**
- `user_id`: 使用者 ID
- `status`: 狀態 (pending/approved/rejected)
- `start_date`: 開始日期
- `end_date`: 結束日期
- `page`: 頁碼
- `limit`: 每頁數量

**響應**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 1,
        "user_id": 1,
        "user_name": "張三",
        "leave_type_id": 1,
        "leave_type_name": "年假",
        "start_date": "2024-01-20",
        "end_date": "2024-01-22",
        "days": 3,
        "reason": "家庭旅遊",
        "status": "pending",
        "applied_at": "2024-01-15T10:00:00Z",
        "approver_id": null,
        "approved_at": null,
        "notes": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_count": 25,
      "per_page": 20
    }
  }
}
```

#### POST /api/v1/leave-requests
創建請假申請

**請求**
```json
{
  "leave_type_id": 1,
  "start_date": "2024-01-25",
  "end_date": "2024-01-26",
  "reason": "個人事務",
  "notes": "緊急事務處理"
}
```

#### POST /api/v1/leave-requests/{id}/approve
批准請假申請

**請求**
```json
{
  "notes": "批准理由"
}
```

#### POST /api/v1/leave-requests/{id}/reject
拒絕請假申請

**請求**
```json
{
  "reason": "拒絕理由"
}
```

---

### 11. 公告管理

#### GET /api/v1/notices
獲取公告列表

**請求參數**
- `status`: 狀態 (draft/published/archived)
- `limit`: 數量限制
- `page`: 頁碼

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "系統維護通知",
      "content": "系統將於本週日凌晨 2:00-4:00 進行維護",
      "type": "maintenance",
      "priority": "high",
      "status": "published",
      "start_time": "2024-01-20T02:00:00Z",
      "end_time": "2024-01-20T04:00:00Z",
      "target_audience": "all",
      "created_by": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/v1/notices
創建公告

**請求**
```json
{
  "title": "新功能發布",
  "content": "我們發布了新的 Agent 監控功能",
  "type": "feature",
  "priority": "medium",
  "status": "published",
  "start_time": "2024-01-16T00:00:00Z",
  "end_time": "2024-01-30T23:59:59Z",
  "target_audience": "agents"
}
```

#### PUT /api/v1/notices/{id}
更新公告

#### DELETE /api/v1/notices/{id}
刪除公告

#### POST /api/v1/notices/{id}/read
標記公告為已讀

**響應**
```json
{
  "success": true,
  "message": "公告已標記為已讀"
}
```

---

### 12. 系統管理

#### GET /api/v1/system/settings
獲取系統設定

**響應**
```json
{
  "success": true,
  "data": {
    "site_name": "HRM 管理系統",
    "default_language": "zh-TW",
    "timezone": "Asia/Taipei",
    "session_timeout": 24,
    "max_login_attempts": 5,
    "email_notifications": true,
    "maintenance_mode": false,
    "debug_mode": false
  }
}
```

#### PUT /api/v1/system/settings
更新系統設定

**請求**
```json
{
  "site_name": "HRM 管理系統 v2",
  "session_timeout": 48,
  "email_notifications": false
}
```

#### GET /api/v1/system/stats
獲取系統統計資料

**響應**
```json
{
  "success": true,
  "data": {
    "total_users": 156,
    "active_users": 89,
    "system_uptime": "15 天 8 小時",
    "last_backup": "2024-01-15T02:00:00Z",
    "disk_usage": "45%",
    "memory_usage": "68%",
    "cpu_usage": "23%",
    "database_size": "2.3 GB"
  }
}
```

#### POST /api/v1/system/backup
創建系統備份

**響應**
```json
{
  "success": true,
  "data": {
    "backup_id": "backup_20240115_103000",
    "file_size": "1.2 GB",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "completed"
  }
}
```

---

### 13. Agent 專用 API

#### GET /api/v1/agent/profile
獲取 Agent 個人資料

**響應**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "張三",
    "email": "zhang@hrm.com",
    "brand_id": 1,
    "brand_name": "品牌 A",
    "workspace_id": 1,
    "workspace_name": "客服部門",
    "role": "Agent",
    "status": "active",
    "last_login": "2024-01-15T09:30:00Z"
  }
}
```

#### PUT /api/v1/agent/status
更新 Agent 狀態

**請求**
```json
{
  "status": "available"
}
```

#### GET /api/v1/agent/schedule
獲取 Agent 排班

**請求參數**
- `date`: 日期 (YYYY-MM-DD)

**響應**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "shift_name": "早班",
      "start_time": "09:00",
      "end_time": "17:00",
      "status": "confirmed"
    }
  ]
}
```

#### GET /api/v1/agent/notices
獲取 Agent 相關公告

**響應**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "排班異動通知",
      "content": "本週排班有所調整，請注意",
      "priority": "high",
      "created_at": "2024-01-15T10:00:00Z",
      "is_read": false
    }
  ]
}
```

#### GET /api/v1/agent/leave-balance
獲取 Agent 請假餘額

**響應**
```json
{
  "success": true,
  "data": [
    {
      "leave_type_name": "年假",
      "total_days": 14,
      "used_days": 3,
      "remaining_days": 11
    }
  ]
}
```

#### POST /api/v1/agent/notices/{id}/read
標記公告為已讀

---

### 14. Agent 監控 API

#### GET /api/v1/agent-monitor
獲取 Agent 監控數據

**請求參數**
- `brand_id`: Brand ID
- `workspace_id`: Workspace ID
- `refresh_interval`: 刷新間隔（秒）
- `warning_time`: 警告時間閾值（秒）

**響應**
```json
{
  "success": true,
  "data": {
    "on_service": [
      {
        "id": 1,
        "name": "張三",
        "status": "busy",
        "current_sessions": 3,
        "session_duration": 1800,
        "last_activity": "2024-01-15T10:25:00Z"
      }
    ],
    "on_line": [
      {
        "id": 2,
        "name": "李四",
        "status": "available",
        "idle_time": 300,
        "last_activity": "2024-01-15T10:20:00Z"
      }
    ],
    "warning": [
      {
        "id": 3,
        "name": "王五",
        "status": "idle",
        "idle_time": 1800,
        "warning_reason": "長時間閒置"
      }
    ],
    "offline": [
      {
        "id": 4,
        "name": "趙六",
        "status": "offline",
        "last_seen": "2024-01-15T09:00:00Z",
        "offline_duration": 5400
      }
    ],
    "summary": {
      "total_agents": 20,
      "online_count": 15,
      "busy_count": 8,
      "available_count": 7,
      "warning_count": 3,
      "offline_count": 5
    },
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

---

## 錯誤碼說明

### HTTP 狀態碼
- `200`: 成功
- `201`: 創建成功
- `400`: 請求參數錯誤
- `401`: 未授權
- `403`: 權限不足
- `404`: 資源不存在
- `409`: 資源衝突
- `422`: 參數驗證失敗
- `500`: 服務器內部錯誤

### 業務錯誤碼
```json
{
  "VALIDATION_ERROR": "參數驗證失敗",
  "AUTHENTICATION_FAILED": "認證失敗",
  "PERMISSION_DENIED": "權限不足",
  "RESOURCE_NOT_FOUND": "資源不存在",
  "DUPLICATE_RESOURCE": "資源已存在",
  "BUSINESS_RULE_VIOLATION": "業務規則違反",
  "EXTERNAL_API_ERROR": "外部 API 錯誤",
  "DATABASE_ERROR": "資料庫錯誤"
}
```

---

## 認證與授權

### JWT Token 格式
```json
{
  "sub": "1",
  "name": "張三",
  "email": "zhang@hrm.com",
  "role": "Agent",
  "brand_id": 1,
  "permissions": ["schedule.read", "leave.create"],
  "iat": 1642234567,
  "exp": 1642320967
}
```

### 權限列表
```
- user.read: 查看使用者
- user.write: 管理使用者
- brand.read: 查看 Brand
- brand.write: 管理 Brand
- schedule.read: 查看排班
- schedule.write: 管理排班
- leave.read: 查看請假
- leave.create: 申請請假
- leave.approve: 審批請假
- notice.read: 查看公告
- notice.write: 管理公告
- system.admin: 系統管理
- agent.monitor: Agent 監控
```

---

## 開發建議

### 1. 資料庫設計
- 使用 UUID 作為主鍵
- 添加 `created_at`, `updated_at`, `deleted_at` 時間戳
- 實現軟刪除機制
- 建立適當的索引

### 2. 快取策略
- 使用 Redis 快取頻繁查詢的數據
- 實現快取失效機制
- 設定合理的快取過期時間

### 3. 安全考慮
- 實現 API 限流
- 輸入參數驗證和清理
- SQL 注入防護
- XSS 攻擊防護
- CSRF 保護

### 4. 效能優化
- 資料庫查詢優化
- 分頁查詢實現
- 批量操作支援
- 異步處理長時間任務

### 5. 監控與日誌
- API 請求日誌記錄
- 錯誤日誌追蹤
- 效能監控指標
- 健康檢查端點

### 6. 測試要求
- 單元測試覆蓋率 > 80%
- API 集成測試
- 負載測試
- 安全測試

---

## 部署要求

### 環境變數
```bash
# 資料庫配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrm_db
DB_USER=hrm_user
DB_PASSWORD=secure_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 應用配置
APP_ENV=production
APP_DEBUG=false
APP_PORT=8000

# CORS 配置
CORS_ORIGINS=https://genie.pr3.ai,https://hrm.company.com
```

### Docker 部署
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 版本控制

### API 版本管理
- 使用 URL 路徑版本控制 (`/api/v1/`)
- 向後兼容性保證
- 版本廢棄通知機制

### 更新日誌
- 記錄 API 變更
- 標註破壞性變更
- 提供遷移指南

---

本文檔將隨著系統發展持續更新，請定期檢查最新版本。