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
    "workspacesPath": "/api/v1/users/workspaces",
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
- `POST /api/v1/auth/agent-sign-in` - Agent 認證
- `GET /api/v1/users/workspaces` - 工作區列表
- `GET /api/v1/bots/all-bots` - Bot 列表
- `GET /api/v1/workspaces/:id/members` - 成員列表

### Agent 登入流程
Agent 登入需要以下必要回應欄位：
```json
{
  "success": true,
  "data": {
    "token": "local-uuid-token",
    "brand_id": "brand_id",
    "member_id": "third_party_user_id",
    "member_name": "third_party_user_name",
    "third_party_token": "third_party_jwt_token"
  }
}
```

### 請假管理 API
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
GET /api/v1/leave-balance/{member_id}
{
  "success": true,
  "data": [
    {
      "id": "balance_id",
      "leave_type_id": "leave_type_id",
      "leave_type_name": "Annual Leave",
      "year": 2024,
      "total_days": 14.0,
      "used_days": 5.0,
      "remaining_days": 9.0
    }
  ]
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
```

**薪資報表**：
```json
GET /api/v1/salary/reports
GET /api/v1/salary/statistics
```

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

**版本**: v0.2.0  
**最後更新**: 2025-01-17  
**技術支援**: 開發團隊

## 🔄 更新日誌

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