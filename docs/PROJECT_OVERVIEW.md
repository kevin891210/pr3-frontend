# HRM Frontend 專案說明文件

## 專案概述

HRM Frontend 是一個基於 React 18 的人力資源管理系統前端，提供完整的員工管理、排班管理、請假管理和 Agent 監控功能。

## 技術架構

### 核心技術棧
- **React 18** - 前端框架，使用 Hooks 和函數式組件
- **Vite** - 建置工具，提供快速開發和熱重載
- **Tailwind CSS** - CSS 框架，提供響應式設計
- **shadcn/ui** - UI 組件庫，提供一致的設計系統
- **Zustand** - 狀態管理，輕量級的狀態管理解決方案
- **React Query** - 伺服器狀態管理（未來規劃）
- **react-i18next** - 國際化支援
- **React Router** - 路由管理

### 專案結構

```
src/
├── components/          # 共用組件
│   ├── ui/             # shadcn/ui 基礎組件
│   ├── agent/          # Agent 相關組件
│   ├── calendar/       # 日曆組件
│   └── Layout.jsx      # 主要佈局組件
├── features/           # 功能模組
│   ├── auth/          # 認證模組
│   ├── dashboard/     # 儀表板模組
│   ├── brand/         # Brand 管理模組
│   ├── user/          # 使用者管理模組
│   ├── monitor/       # Agent 監控模組
│   └── hrm/           # HRM 核心功能
│       ├── schedule/  # 排班管理
│       ├── leave/     # 請假管理
│       └── notice/    # 公告管理
├── store/             # 狀態管理
│   ├── authStore.jsx  # 認證狀態
│   └── systemStore.jsx # 系統設定狀態
├── services/          # API 服務
│   └── api.js         # API 客戶端
├── config/            # 配置文件
│   └── runtime.js     # Runtime 配置
├── locales/           # 國際化資源
│   ├── i18n.jsx       # i18n 配置
│   └── translations.json # 翻譯資源
└── utils/             # 工具函數
    └── storage.js     # 本地儲存管理
```

## 核心功能模組

### 1. 認證系統 (Authentication)
- **位置**: `src/features/auth/`
- **功能**: 
  - 雙重登入系統（系統管理者 + Agent）
  - JWT Token 管理
  - 角色權限控制 (RBAC)
- **權限等級**: Owner > Admin > TeamLeader > Agent > Auditor

### 2. 儀表板 (Dashboard)
- **位置**: `src/features/dashboard/`
- **功能**:
  - 系統統計資料顯示
  - Agent 監控概覽
  - 最新公告顯示
  - 快速操作入口

### 3. Brand 管理
- **位置**: `src/features/brand/`
- **功能**:
  - Brand CRUD 操作
  - 外部 API 整合
  - Workspace/Bot/Agent 資源管理
  - 資源同步功能

### 4. 使用者管理
- **位置**: `src/features/user/`
- **功能**:
  - 使用者 CRUD 操作
  - 角色指派
  - 權限管理
  - 狀態管理

### 5. Agent 監控
- **位置**: `src/features/monitor/`
- **功能**:
  - 即時 Agent 狀態監控
  - 狀態分類 (On Service/On Line/Warning/Offline)
  - 自動刷新機制
  - 多 Brand/Workspace 支援

### 6. 排班管理 (Schedule Management)
- **位置**: `src/features/hrm/schedule/`
- **功能**:
  - 班別模板管理
  - 班別類別管理
  - 排班指派
  - 自製日曆組件（無版權問題）

### 7. 請假管理 (Leave Management)
- **位置**: `src/features/hrm/leave/`
- **功能**:
  - 請假類別管理
  - 請假申請
  - 請假審核
  - 請假餘額追蹤

### 8. 公告管理 (Notice Management)
- **位置**: `src/features/hrm/notice/`
- **功能**:
  - 公告 CRUD 操作
  - 公告狀態管理
  - 品牌/工作區篩選
  - 公告顯示控制

## 狀態管理

### AuthStore (認證狀態)
- **位置**: `src/store/authStore.jsx`
- **功能**:
  - 使用者認證狀態
  - JWT Token 管理
  - 權限檢查
  - 登入/登出處理

### SystemStore (系統狀態)
- **位置**: `src/store/systemStore.jsx`
- **功能**:
  - 系統設定管理
  - 本地快取策略
  - 全域配置同步

## API 整合

### API 客戶端
- **位置**: `src/services/api.js`
- **功能**:
  - 統一的 API 調用介面
  - 自動錯誤處理
  - JWT Token 自動附加
  - 回應格式標準化

### 主要 API 端點
- `/api/v1/auth/*` - 認證相關
- `/api/v1/brands/*` - Brand 管理
- `/api/v1/users/*` - 使用者管理
- `/api/v1/monitor/*` - Agent 監控
- `/api/v1/shift-templates/*` - 排班模板
- `/api/v1/leave-*` - 請假相關
- `/api/v1/notices/*` - 公告管理

## 本地儲存策略

### 快取機制
- **位置**: `src/utils/storage.js`
- **策略**:
  - Brand 資料：24小時快取
  - Workspace 資料：12小時快取
  - 班別類別：7天快取
  - 請假類型：7天快取
  - 使用者偏好：30天快取

### 快取資料類型
1. **靜態資料**: Brand、Workspace、班別類別
2. **使用者偏好**: 語言、主題、自動刷新設定
3. **Dashboard 設定**: 選擇的 Brand/Workspace、刷新間隔

## 國際化支援

### 語言支援
- **主要語言**: 英文 (預設)
- **次要語言**: 繁體中文、日文
- **配置**: `src/locales/i18n.jsx`
- **翻譯資源**: `src/locales/translations.json`

## 部署配置

### Runtime 配置
- **位置**: `public/config/app-config.json`
- **功能**: 免重建映像即可切換 API 端點
- **設定項目**:
  - API 基礎 URL
  - 各功能模組端點路徑
  - 初始化狀態

### Docker 部署
- **Nginx 配置**: `ops/nginx/`
- **部署腳本**: `ops/deploy/`
- **支援環境**: 本地開發、EC2 生產環境

## 開發指南

### 程式碼規範
1. **組件命名**: PascalCase
2. **檔案命名**: camelCase.jsx
3. **函數命名**: camelCase
4. **常數命名**: UPPER_SNAKE_CASE
5. **註解**: 中文註解說明功能用途

### 新增功能模組步驟
1. 在 `src/features/` 建立模組資料夾
2. 建立主要頁面組件
3. 新增 API 方法到 `src/services/api.js`
4. 更新路由配置
5. 新增權限檢查
6. 新增國際化翻譯

### 效能優化建議
1. 使用本地快取減少 API 調用
2. 實作 React.memo 避免不必要的重渲染
3. 使用 lazy loading 延遲載入組件
4. 優化圖片和靜態資源

## 測試策略

### 測試類型
1. **單元測試**: 組件和工具函數
2. **整合測試**: API 整合和狀態管理
3. **E2E 測試**: 完整使用者流程

### 測試工具
- **Jest**: 單元測試框架
- **React Testing Library**: 組件測試
- **Cypress**: E2E 測試（規劃中）

## 安全性考量

### 前端安全
1. **XSS 防護**: 輸入驗證和輸出編碼
2. **CSRF 防護**: JWT Token 驗證
3. **敏感資料**: 不在前端儲存敏感資訊
4. **權限控制**: 基於角色的存取控制

### API 安全
1. **認證**: JWT Token 機制
2. **授權**: 角色權限檢查
3. **資料驗證**: 前後端雙重驗證
4. **錯誤處理**: 統一錯誤回應格式

## 維護指南

### 日常維護
1. **依賴更新**: 定期更新 npm 套件
2. **安全性掃描**: 檢查已知漏洞
3. **效能監控**: 監控載入時間和 API 回應
4. **錯誤追蹤**: 收集和分析錯誤日誌

### 故障排除
1. **API 連接問題**: 檢查 runtime 配置
2. **認證失敗**: 檢查 JWT Token 有效性
3. **權限錯誤**: 檢查使用者角色設定
4. **快取問題**: 清除本地儲存快取

## 未來規劃

### 短期目標
1. 完善測試覆蓋率
2. 效能優化
3. 無障礙功能改善
4. 行動裝置適配

### 長期目標
1. 微前端架構遷移
2. PWA 支援
3. 離線功能
4. 即時通知系統

## 聯絡資訊

### 開發團隊
- **前端開發**: HRM Frontend Team
- **後端 API**: HRM Backend Team
- **DevOps**: Infrastructure Team

### 相關文件
- **API 文件**: `/docs/api/`
- **部署文件**: `/ops/deploy/README.md`
- **設計規範**: `/docs/design-system.md`