# HRM Backend API 規格文件

## 技術架構
- **語言**: Python (FastAPI/Django REST Framework)
- **資料庫**: MySQL 8.0 (AWS RDS)
- **部署**: AWS ECS + Docker
- **認證**: JWT Token
- **API 風格**: RESTful

## 核心 API 端點

### 1. 健康檢查
```http
GET /health
```

### 2. 認證
```http
POST /api/v1/auth/sign-in
POST /api/v1/auth/agent-sign-in
POST /api/v1/admin/init
```

### 3. 使用者與工作區
```http
GET /api/v1/users/workspaces
GET /api/v1/workspaces/{id}/members
```

### 4. Bot 管理
```http
GET /api/v1/bots/all-bots
```

### 5. 排班管理
```http
GET/POST/PUT/DELETE /api/v1/shift-templates
GET/POST /api/v1/schedule-assignments
POST /api/v1/schedule-assignments/batch
```

### 6. 請假管理
```http
GET /api/v1/leave-types
GET /api/v1/users/{user_id}/leave-balance
GET/POST /api/v1/leave-requests
POST /api/v1/leave-requests/{id}/approve
POST /api/v1/leave-requests/{id}/reject
```

### 7. 公告管理
```http
GET/POST/PUT/DELETE /api/v1/notices
POST /api/v1/notices/{id}/read
```

### 8. Dashboard
```http
GET /api/v1/dashboard/stats
GET /api/v1/dashboard/agent-monitor
```

## 權限系統
- Owner: 全域權限
- Admin: 系統管理權限
- TeamLeader: 團隊管理權限
- Agent: 基本使用權限
- Auditor: 唯讀權限