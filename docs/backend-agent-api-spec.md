# Agent 介面 API 規格文件

## API 端點

### 1. Agent 個人資料
```http
GET /api/v1/agent/profile
Authorization: Bearer {token}
```

**回應格式:**
```json
{
  "id": "agent_123",
  "name": "Agent Alice",
  "email": "alice@company.com",
  "role": "Agent",
  "department": "Customer Service",
  "status": "Available"
}
```

### 2. 更新 Agent 狀態
```http
PUT /api/v1/agent/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Available|Busy|Break|Offline"
}
```

### 3. 獲取 Agent 排班
```http
GET /api/v1/agent/schedule?date=2024-01-15
Authorization: Bearer {token}
```

**回應格式:**
```json
[
  {
    "id": "schedule_1",
    "shift": "早班",
    "start_time": "08:00",
    "end_time": "16:00",
    "status": "confirmed",
    "breaks": [
      {
        "start_time": "12:00",
        "end_time": "13:00",
        "type": "lunch"
      }
    ]
  }
]
```

### 4. 獲取 Agent 公告
```http
GET /api/v1/agent/notices
Authorization: Bearer {token}
```

**回應格式:**
```json
[
  {
    "id": "notice_1",
    "title": "系統維護通知",
    "content": "系統將於今晚進行維護...",
    "created_at": "2024-01-15T10:00:00Z",
    "is_read": false,
    "priority": "high"
  }
]
```

### 5. 獲取假期餘額
```http
GET /api/v1/agent/leave-balance
Authorization: Bearer {token}
```

**回應格式:**
```json
{
  "annual": {
    "total": 14,
    "used": 2,
    "remaining": 12
  },
  "sick": {
    "total": 7,
    "used": 2,
    "remaining": 5
  },
  "personal": {
    "total": 5,
    "used": 2,
    "remaining": 3
  }
}
```

### 6. 申請請假
```http
POST /api/v1/agent/leave-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "annual",
  "start_date": "2024-01-20",
  "end_date": "2024-01-22",
  "reason": "家庭事務",
  "is_half_day": false
}
```

### 7. 標記公告已讀
```http
POST /api/v1/agent/notices/{notice_id}/read
Authorization: Bearer {token}
```

## 實作建議

### 權限控制
- 所有 API 需要 Agent 角色權限
- Agent 只能查看/修改自己的資料
- 狀態更新需要即時同步到監控系統

### 資料驗證
- 狀態值限制在預定義選項
- 日期格式驗證
- 請假申請需檢查餘額

### 錯誤處理
- 401: 未授權
- 403: 權限不足
- 400: 參數錯誤
- 404: 資源不存在