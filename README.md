# HRM Frontend

基於 React 18 + Vite + Tailwind + shadcn/ui 的 HRM 前端管理平台

## 🚀 技術架構

- **前端框架**：React 18 + Vite + TypeScript
- **UI 框架**：TailwindCSS + shadcn/ui + lucide-react
- **日曆系統**：FullCalendar（資源視圖、拖曳指派、跨日排班）
- **圖表視覺化**：Recharts
- **狀態管理**：Zustand + React Query
- **國際化**：react-i18next（支援中英日三語）
- **部署方案**：Docker + Nginx + AWS EC2

## ✨ 核心功能

### 🔧 系統管理
- **Runtime Config**：免重建映像即可切換 API 端點
- **首次設定頁面**：`/setup` 頁面設定後端 API 並驗證連接
- **雙重登入系統**：系統管理者 + Agent 分離登入
- **RBAC 權限管理**：Owner/Admin/TeamLeader/Agent/Auditor

### 👥 HRM 核心模組
- **Brand 管理**：多品牌支援與資源同步
- **使用者管理**：角色權限與帳號管理
- **排班管理**：視覺化日曆排班與班別模板
- **請假管理**：請假申請、審核與餘額追蹤
- **薪資管理**：薪資等級、計算引擎、調整記錄、統計報表
- **智能打卡系統**：自動化出勤監控、API 整合、異常偵測、統計報表、連線測試
- **公告管理**：系統公告發布與管理
- **Agent Monitor**：即時 Agent 狀態監控

### 🎯 Agent 專用介面
- **Agent Dashboard**：個人排班日曆與請假餘額
- **請假申請**：簡化的請假申請流程
- **公告查看**：最新系統公告顯示

## 🛠 快速開始

### 開發環境
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:3000
```

### Docker 本地測試
```bash
# 建置並啟動
docker compose up -d

# 訪問 http://localhost/setup 進行首次設定
```

### 生產環境部署
```bash
# EC2 一鍵部署
./ops/deploy/build-and-deploy.sh <EC2_IP> ubuntu

# 或使用生產配置
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 專案結構

```
src/
├── components/           # 共用組件
│   ├── ui/              # shadcn/ui 基礎組件
│   ├── agent/           # Agent 專用組件
│   └── calendar/        # 日曆組件
├── features/            # 功能模組
│   ├── auth/           # 認證系統
│   ├── dashboard/      # 儀表板
│   ├── brand/          # Brand 管理
│   ├── user/           # 使用者管理
│   ├── monitor/        # Agent 監控
│   ├── agent/          # Agent 介面
│   └── hrm/            # HRM 核心功能
│       ├── schedule/   # 排班管理
│       ├── leave/      # 請假管理
│       ├── attendance/ # 智能打卡系統
│       └── notice/     # 公告管理
├── services/           # API 服務層
├── store/              # 狀態管理
├── locales/            # 國際化
└── config/             # 配置管理

ops/
├── deploy/             # 部署腳本
├── nginx/              # Nginx 配置
└── config/             # Runtime 配置
```

## ⚙️ 配置管理

### Runtime Config
系統使用動態配置機制，支援免重建容器更新設定：

```json
{
  "initialized": false,
  "api": {
    "baseUrl": "https://api.your-domain.com",
    "authPath": "/api/v1/auth/sign-in",
    "brandsPath": "/api/v1/brands",
    "workspacesPath": "/api/v1/workspaces-by-brand",
    "botsPath": "/api/v1/bots/all-bots",
    "membersPath": "/api/v1/workspaces/:id/members"
  },
  "hrm": { "enabled": true },
  "security": { "enforceHttps": true },
  "envName": "PRODUCTION"
}
```

### 環境配置
- **開發環境**：`.env.example`
- **生產環境**：`.env.production`
- **Docker 配置**：`docker-compose.yml` / `docker-compose.prod.yml`

## 🚀 部署指南

### 首次設定流程
1. **環境準備**：Ubuntu 22.04 + Docker + Docker Compose
2. **部署應用**：執行部署腳本或 Docker Compose
3. **首次設定**：訪問 `http://your-domain/setup`
4. **API 配置**：填入後端 API URL 並測試連接
5. **完成設定**：系統自動導向登入頁面

### API 端點驗證
設定頁面會自動驗證以下後端端點：
- `GET /health` - 服務健康檢查
- `POST /api/v1/auth/sign-in` - 管理者認證
- `POST /api/v1/agent/auth/agent-sign-in` - Agent 認證
- `GET /api/v1/brands` - 品牌列表
- `GET /api/v1/workspaces-by-brand/{brand_id}` - 品牌工作區列表
- `GET /api/v1/bots/all-bots` - Bot 列表
- `GET /api/v1/workspaces/:id/members` - 成員列表

**注意**：`/api/v1/users/workspaces` 端點已棄用，改用品牌相關 API

### Agent 登入流程
Agent 登入需要以下必要回應欄位：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "brand_id": "e729d768-515b-468d-9cb0-adbb9d511814",
    "member_id": "119f6166-c105-489b-993e-9388cc68b956",
    "member_name": "Kevin",
    "third_party_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Agent 專用 API 端點
```json
GET /api/v1/agent/brands - Agent 可用品牌列表
GET /api/v1/agent/schedule-assignments - Agent 排班查詢 (包含 member_name)
GET /api/v1/agent/leave-types - Agent 請假類型列表
POST /api/v1/agent/auth/agent-sign-in - Agent 登入認證
```

### 請假管理 API
**查詢請假申請**：
```json
GET /api/v1/leave-requests
參數:
- member_id (可選): 指定用戶 ID，只返回該用戶的請假申請
- status (可選): 過濾特定狀態的申請
- page (可選): 頁碼，預設為 1
- limit (可選): 每頁筆數，預設為 10

使用範例:
# Agent 查詢自己的請假申請
GET /api/v1/leave-requests?member_id=7a2d0624-96d2-4501-958c-55b52111b8e9

# HRM 管理者查詢所有請假申請（分頁）
GET /api/v1/leave-requests?page=1&limit=10

# 查詢所有待審核的申請
GET /api/v1/leave-requests?status=pending

# 查詢特定用戶的待審核申請
GET /api/v1/leave-requests?member_id=7a2d0624-96d2-4501-958c-55b52111b8e9&status=pending

回應格式 (分頁):
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "pages": 15,
    "current_page": 1,
    "per_page": 10
  }
}
```

**創建請假申請**：
```json
POST /api/v1/leave-requests
{
  "member_id": "string (required)",
  "leave_type_id": "string (required)",
  "start_date": "string (required)",
  "end_date": "string (required)",
  "days": "number (required)",
  "reason": "string (optional)"
}
```

**查詢請假餘額**：
```json
# Agent 查詢個人餘額
GET /api/v1/leave-balance/{member_id}?year=2025

# HRM 管理者查詢所有員工餘額
GET /api/v1/leave-balances?year=2025

回應格式:
{
  "success": true,
  "data": [
    {
      "id": "balance_id",
      "member_id": "member_id",
      "member_name": "Employee Name",
      "leave_type_id": "leave_type_id",
      "leave_type_name": "Annual Leave",
      "year": 2024,
      "total_days": 14.0,
      "used_days": 5.0,
      "remaining_days": 9.0
    }
  ]
}

注意：每個成員的餘額是獨立計算的
例如：
- 事假 1 年 12 天
- Kevin 用過 1 天，餘額 11 天
- YC 用過 3 天，餘額 9 天
```

### 排班管理 API
**班別分類管理**：
```json
GET /api/v1/shift-categories
POST /api/v1/shift-categories
PUT /api/v1/shift-categories/{id}
DELETE /api/v1/shift-categories/{id}

回應格式:
{
  "success": true,
  "data": [
    {
      "id": "full_day",
      "name": "Full Day Shift",
      "description": "標準9小時工作日",
      "default_start_time": "09:00",
      "default_end_time": "18:00",
      "default_break_minutes": 60
    },
    {
      "id": "rotating",
      "name": "Rotating Shift", 
      "description": "夜班或跨日班",
      "default_start_time": "22:00",
      "default_end_time": "06:00",
      "default_break_minutes": 30
    }
  ]
}

創建/更新分類格式:
{
  "name": "Custom Shift",
  "description": "自定義班別",
  "default_start_time": "10:00",
  "default_end_time": "19:00",
  "default_break_minutes": 45
}
```

**班別模板管理**：
```json
GET /api/v1/shift-templates
POST /api/v1/shift-templates
PUT /api/v1/shift-templates/{id}
DELETE /api/v1/shift-templates/{id}

班別模板格式:
{
  "id": "template_id",
  "name": "Morning Shift",
  "category": "full_day",  // 對應 shift-categories 的 id
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
  ],
  "min_staff": 1,
  "max_staff": 5
}
```

**排班指派管理**：
```json
GET /api/v1/schedule-assignments
參數:
- member_id (可選): 指定用戶 ID，只返回該用戶的排班指派
- start_date (可選): 開始日期過濾
- end_date (可選): 結束日期過濾  
- template_id (可選): 班別模板 ID 過濾

回應格式 (使用 JOIN 查詢優化):
{
  "success": true,
  "data": [
    {
      "id": "4c2ee066-b7f4-4287-ad4b-66d3d7aa3be8",
      "member_id": "f3d341d4-6681-429a-b534-7426e236f24a",
      "member_name": "Kevin",
      "shift_template_id": "2",
      "date": "2025-09-23",
      "created_at": "2025-09-23T04:16:51Z",
      "shift_template": {
        "id": "2",
        "name": "Morning Shift",
        "category": "full_day",
        "start_time": "09:00",
        "end_time": "18:00",
        "is_cross_day": false,
        "timezone": "Asia/Taipei",
        "total_break_minutes": 60,
        "break_periods": [],
        "min_staff": 1,
        "max_staff": 5
      }
    }
  ]
}

POST /api/v1/schedule-assignments
PUT /api/v1/schedule-assignments/{id}
DELETE /api/v1/schedule-assignments/{id}
```

### 用戶管理 API
**用戶 CRUD 操作**：
```json
GET /api/v1/users
POST /api/v1/users
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}
GET /api/v1/users/{id}

# 密碼更新
PUT /api/v1/users/{id}/password
{
  "password": "new_password"
}
```

### 薪資管理 API
**薪資等級管理**：
```json
GET /api/v1/salary/grades
POST /api/v1/salary/grades
PUT /api/v1/salary/grades/{id}
DELETE /api/v1/salary/grades/{id}
```

**薪資計算**：
```json
POST /api/v1/salary/calculations
{
  "member_id": "string (required)",
  "period_start": "string (required)",
  "period_end": "string (required)",
  "overtime_weekday": "number",
  "overtime_weekend": "number",
  "overtime_holiday": "number",
  "absence_days": "number"
}

GET /api/v1/salary/calculations/{id} - 查詢特定薪資計算詳情
```

**薪資報表**：
```json
GET /api/v1/salary/reports
GET /api/v1/salary/statistics
```

### 智能打卡系統 API
**監控與測試**：
```json
GET /api/v1/attendance/monitoring/{workspace_id} - 檢查監控狀態
POST /api/v1/attendance/test-connection/{workspace_id} - 測試連線
POST /api/v1/attendance/sync/{workspace_id} - 手動同步資料
```

**API 記錄查詢**：
```json
GET /api/v1/attendance/api-logs?workspace_id={id}&brand_id={id}
參數:
- workspace_id: 工作區 ID
- brand_id: 品牌 ID
- start_date: 開始日期
- end_date: 結束日期
- status: API 狀態 (success/error/timeout)
```

### WebSocket 實時通知
**啟用 WebSocket**：
```javascript
// 在生產環境中啟用 WebSocket
localStorage.setItem('enableWebSocket', 'true');

// 禁用 WebSocket
localStorage.removeItem('enableWebSocket');
```

**連接 WebSocket**：
```javascript
// 前端整合方式
const ws = new WebSocket('ws://localhost:8000/ws?channel=leave_requests');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'leave_request_update') {
        // 刷新請假申請列表
        refreshLeaveRequestsList();
        
        // 顯示通知
        showNotification(`Leave request ${data.action} for ${data.data.member_name}`);
    }
};
```

**React Hook 使用**：
```javascript
import useWebSocket from '../hooks/useWebSocket';

const { subscribe } = useWebSocket('leave_requests');

useEffect(() => {
  const unsubscribe = subscribe('leave_request_update', (data) => {
    // 處理實時更新
    loadLeaveData();
    showNotification(data);
  });
  
  return unsubscribe;
}, [subscribe]);
```

**注意事項**：
- WebSocket 在開發環境中預設啟用
- 生產環境中需要手動啟用：`localStorage.setItem('enableWebSocket', 'true')`
- 如果 WebSocket 服務器不可用，系統會自動降級為手動刷新模式

### 監控與維護
```bash
# 健康檢查
curl http://your-domain/health

# 查看日誌
docker compose logs -f

# 更新配置（免重啟）
vim /path/to/app-config.json
# 重新整理頁面即可生效
```

## 📚 文件資源

- [部署指南](./DEPLOYMENT.md) - 完整部署說明
- [開發指南](./docs/DEVELOPMENT_GUIDE.md) - 開發規範與指引
- [API 整合](./docs/API_INTEGRATION.md) - 後端 API 整合說明
- [專案概覽](./docs/PROJECT_OVERVIEW.md) - 架構與功能概覽

## 🐛 已知問題與解決方案

### API 相關
- **問題**：`/api/v1/users/workspaces` 返回 404
- **解決方案**：改用 `/api/v1/brands` + `/api/v1/workspaces-by-brand/{brand_id}`

### 日期顯示問題
- **問題**：排班管理中顯示 "Invalid Date"
- **解決方案**：已修復日期驗證和格式化邏輯

### 薪資計算
- **問題**：薪資詳情顯示過多零值欄位
- **解決方案**：優化顯示邏輯，只顯示非零值

## 🔧 開發注意事項

### API 整合
1. 使用 brands API 獲取 workspace 資料
2. 所有 API 調用都需要錯誤處理
3. 避免調用不存在的端點

### 日期處理
1. 所有日期都需要驗證有效性
2. 使用 `isNaN(new Date())` 檢查日期
3. 提供備用顯示選項

### 用戶體驗
1. 載入狀態指示器
2. 錯誤訊息友善化
3. 空狀態處理

### WebSocket 配置
1. 開發環境預設啟用 WebSocket
2. 生產環境需手動啟用：`localStorage.setItem('enableWebSocket', 'true')`
3. WebSocket 連接失敗不會影響正常功能

## 🔧 開發工具

```bash
# 程式碼檢查
npm run lint

# 建置生產版本
npm run build

# 預覽建置結果
npm run preview
```

## 📄 授權

本專案為私有專案，僅供內部使用。

---

**版本**: v0.4.0  
**最後更新**: 2025-01-17  
**技術支援**: 開發團隊

## 🔄 更新日誌

### v0.4.0 (2025-01-17) - 最新版本
- ✅ **智能打卡系統完整優化**
  - API Records 支援 Brand/Workspace 兩級選擇
  - 修復 workspace API 404 錯誤，改用 brands API
  - 新增 Test Connection 功能標籤
  - 實作監控狀態檢查、連線測試、手動同步功能
- ✅ **排班管理系統修復**
  - 修復 Recent Assignments 日期顯示問題
  - 改善日期時間處理和驗證機制
  - 優化事件創建的錯誤處理
- ✅ **薪資管理系統增強**
  - 薪資計算詳情對話框優化
  - 支援 getSalaryCalculationById API 整合
  - 清理顯示格式，只顯示非零值
- ✅ **API 整合優化**
  - 移除無效的 getAllLeaveBalances API 調用
  - 優化 API 參數處理，避免 422 錯誤
  - 改善錯誤處理和用戶體驗

### v0.3.0 (2025-01-17)
- ✅ 智能打卡系統完整實作
- ✅ 打卡記錄管理 (篩選、查詢、統計)
- ✅ 系統設定 (檢查參數、工作區配置)
- ✅ API 記錄查詢 (日誌、證明文件匯出)
- ✅ 監控中心 (系統健康、即時檢查)
- ✅ 響應式設計 (桌面/平板/手機)
- ✅ 多語系支援 (中英日)

### v0.2.0 (2025-01-17)
- ✅ Agent 登入流程完整整合
- ✅ 請假申請功能實作 (支援天數自動計算)
- ✅ 請假餘額顯示 (支援多種假期類型)
- ✅ Agent Dashboard 顯示真實資料
- ✅ 排班管理日曆整合
- ✅ Agent Monitor 即時狀態監控
- ✅ 薪資管理系統 (等級、計算、調整、報表)
- ✅ 多語系支援優化

### v0.1.0 (2024-01-15)
- 🎯 初始版本發布
- 🔧 基礎架構建立
- 👥 使用者管理系統
- 🏢 Brand 管理功能