# 智能打卡系統

## 📋 系統概述

智能打卡系統是 HRM 平台的核心模組之一，提供全方位的出勤監控與管理功能。系統透過第三方 API 整合，實現自動化打卡檢查、異常偵測和報表生成。

## 🏗️ 架構設計

### 主要組件
- `AttendancePage.jsx` - 主頁面，包含所有子模組導航
- `AttendanceDashboard.jsx` - 儀表板，顯示統計數據和即時監控
- `AttendanceRecords.jsx` - 打卡記錄管理，支援篩選和查詢
- `AttendanceSettings.jsx` - 系統設定，配置檢查參數和工作區
- `AttendanceApiLogs.jsx` - API 記錄查詢，提供日誌和證明文件
- `AttendanceMonitor.jsx` - 監控中心，系統健康狀態和即時檢查

### 功能模組

#### 1. 📊 Dashboard (儀表板)
- **統計卡片**: 今日出勤、週出勤率、平均工時、加班統計
- **即時監控**: 各工作區檢查狀態、線上人數對比
- **趨勢圖表**: 出勤率趨勢分析
- **快速操作**: 常用功能快速入口

#### 2. 🕐 打卡記錄管理
- **記錄列表**: 支援多維度篩選和分頁
- **詳情查看**: 完整打卡資訊和相關 API 記錄
- **統計報表**: 多種圖表分析和匯出功能
- **異常處理**: 遲到、早退、缺勤狀況追蹤

#### 3. ⚙️ 系統設定
- **檢查時間**: 上下班檢查窗口、自動檢查間隔
- **容忍設定**: 遲到、早退、休息時間容忍範圍
- **API 連線**: 超時、重試、間隔參數配置
- **自動化**: 自動檢查和異常通知開關
- **工作區**: 各工作區打卡功能管理

#### 4. 📋 API 記錄查詢
- **日誌列表**: 所有第三方 API 呼叫記錄
- **詳情檢視**: 請求/回應完整資訊
- **證明匯出**: 法律證明文件生成
- **效能分析**: 回應時間和成功率統計

#### 5. 📈 監控中心
- **系統健康**: 整體狀態、成功率、回應時間
- **告警管理**: 異常告警和處理狀態
- **即時檢查**: 檢查進度和佇列狀態
- **效能趨勢**: 歷史效能數據分析

## 🔧 技術特色

### 響應式設計
- 桌面版: 完整功能展示，多欄位佈局
- 平板版: 簡化佈局，重要資訊優先
- 手機版: 單欄佈局，手勢操作友好

### 國際化支援
- 中文繁體 (zh)
- 英文 (en)
- 日文 (ja)

### 權限控制
- 系統管理員: 所有功能存取
- HR 管理員: 記錄管理、設定配置
- 部門主管: 部門員工記錄查看
- 一般員工: 個人記錄查看

## 📡 API 整合

### 核心端點
```javascript
// 出勤統計
GET /api/v1/attendance/statistics/{workspace_id}

// 打卡記錄
GET /api/v1/attendance/records
GET /api/v1/attendance/records/{record_id}

// 系統設定
GET /api/v1/attendance/settings/{workspace_id}
PUT /api/v1/attendance/settings/{workspace_id}

// API 日誌
GET /api/v1/attendance/api-logs

// 系統監控
GET /api/v1/attendance/system-health
GET /api/v1/attendance/check-status

// 證明文件
POST /api/v1/attendance/export-proof
```

### 資料格式
```javascript
// 打卡記錄
{
  "id": "record_id",
  "employee_name": "員工姓名",
  "work_date": "2025-01-17",
  "shift_time": "09:00-18:00",
  "clock_in_status": "success|late|absent|leave",
  "clock_in_time": "08:58",
  "clock_out_status": "success|late|absent|leave", 
  "clock_out_time": "18:15",
  "total_hours": 8.3,
  "overtime_hours": 0.25,
  "workspace": "Customer Service A"
}

// API 日誌
{
  "id": "log_id",
  "timestamp": "2025-01-17 09:00:15",
  "workspace": "Customer Service A",
  "endpoint": "/api/v1/workspaces/cs-a/members",
  "method": "GET",
  "status_code": 200,
  "response_time": 245,
  "online_count": 12,
  "scheduled_count": 15,
  "status": "success|error|timeout"
}
```

## 🚀 使用指南

### 快速開始
1. 確保後端 API 服務正常運行
2. 在系統設定中配置各工作區參數
3. 啟用自動檢查功能
4. 監控儀表板查看即時狀態

### 常見操作
- **查看今日出勤**: Dashboard → 統計卡片
- **檢查異常記錄**: Records → 篩選異常狀態
- **匯出報表**: Records → 匯出功能
- **配置檢查時間**: Settings → 檢查設定
- **查看 API 日誌**: API Logs → 篩選查詢
- **監控系統狀態**: Monitor → 系統健康

### 故障排除
1. **API 連線失敗**: 檢查網路連線和端點配置
2. **檢查超時**: 調整 API 超時設定
3. **資料不準確**: 確認時區設定正確
4. **效能問題**: 檢查系統負載和資料庫效能

## 📊 效能優化

### 前端優化
- 虛擬滾動處理大量資料
- 圖表延遲載入和資料降採樣
- 快取常用資料減少 API 呼叫
- 防抖處理頻繁更新

### 後端建議
- 資料庫索引優化
- API 回應快取
- 分頁查詢大量資料
- 非同步處理耗時操作

## 🔒 安全考量

### 資料保護
- 敏感資料加密傳輸
- 存取權限嚴格控制
- 操作日誌完整記錄
- 定期資料備份

### 隱私合規
- 個人資料匿名化
- 資料保留期限管理
- 使用者同意機制
- 資料刪除權實現

## 📈 未來規劃

### 功能擴展
- AI 異常偵測算法
- 生物識別整合
- 地理位置驗證
- 行動端 APP

### 技術升級
- 微服務架構
- 即時通訊整合
- 大數據分析
- 雲端部署優化

---

**版本**: v1.0.0  
**最後更新**: 2025-01-17  
**維護團隊**: HRM 開發組