# Salary Management API 核對清單

## 📋 後端 API 實作核對清單

### 🔧 1. Salary Settings APIs
- [ ] **GET** `/api/v1/salary/settings/{workspace_id}` - 取得薪資設定
- [ ] **POST** `/api/v1/salary/settings/{workspace_id}` - 建立/更新薪資設定

### 💰 2. Salary Grades APIs  
- [ ] **GET** `/api/v1/salary/grades` - 取得所有薪資等級
- [ ] **POST** `/api/v1/salary/grades` - 建立新薪資等級
- [ ] **PUT** `/api/v1/salary/grades/{grade_id}` - 更新薪資等級
- [ ] **DELETE** `/api/v1/salary/grades/{grade_id}` - 刪除薪資等級

### 👥 3. Employee Salary APIs
- [ ] **GET** `/api/v1/salary/employees` - 取得所有員工薪資分配
- [ ] **POST** `/api/v1/salary/employees/{employee_id}` - 設定員工薪資
- [ ] **GET** `/api/v1/salary/employees/{employee_id}/history` - 取得員工薪資歷史

### 📊 4. Salary Adjustment APIs
- [ ] **GET** `/api/v1/salary/adjustment-types` - 取得所有調整類型
- [ ] **POST** `/api/v1/salary/adjustment-types` - 建立調整類型
- [ ] **GET** `/api/v1/salary/adjustments` - 取得薪資調整記錄
- [ ] **POST** `/api/v1/salary/adjustments` - 建立薪資調整

### 🧮 5. Salary Calculation APIs
- [ ] **GET** `/api/v1/salary/calculations` - 取得薪資計算記錄
- [ ] **POST** `/api/v1/salary/calculations` - 建立薪資計算
- [ ] **PUT** `/api/v1/salary/calculations/{calculation_id}/confirm` - 確認薪資計算
- [ ] **PUT** `/api/v1/salary/calculations/{calculation_id}/pay` - 標記為已支付

### 📈 6. Salary Reports APIs
- [ ] **GET** `/api/v1/salary/reports` - 取得薪資報表
- [ ] **GET** `/api/v1/salary/statistics` - 取得薪資統計

## 🗄️ 資料庫 Schema 核對清單

### 資料表建立
- [ ] `salary_settings` - 薪資設定表
- [ ] `salary_grades` - 薪資等級表  
- [ ] `employee_salaries` - 員工薪資表
- [ ] `salary_adjustment_types` - 薪資調整類型表
- [ ] `salary_adjustments` - 薪資調整表
- [ ] `salary_calculations` - 薪資計算表

### 索引建立
- [ ] `salary_settings.workspace_id` 索引
- [ ] `salary_grades.grade_name` 索引
- [ ] `employee_salaries.member_id` 索引
- [ ] `salary_adjustments.member_id` 索引
- [ ] `salary_calculations.member_id` 索引
- [ ] `salary_calculations.calculation_period` 索引

## 🔐 權限控制核對清單

### RBAC 權限定義
- [ ] `salary.read` - 查看薪資資料權限
- [ ] `salary.write` - 建立/更新薪資資料權限  
- [ ] `salary.admin` - 完整薪資管理權限

### API 權限驗證
- [ ] 所有 API 端點需要 JWT Token 驗證
- [ ] 實作角色權限檢查中間件
- [ ] Workspace 存取權限驗證

## 📝 業務邏輯核對清單

### 薪資計算邏輯
- [ ] 時薪計算：`hourly_rate = base_salary / 240`
- [ ] 加班費計算：`overtime_amount = overtime_hours * hourly_rate * 1.5`
- [ ] 稅額計算：`tax_amount = gross_salary * tax_rate`
- [ ] 淨薪資計算：`net_salary = gross_salary - tax_amount - transfer_fee`

### 資料驗證
- [ ] 薪資金額驗證（正數、合理範圍）
- [ ] 日期驗證（生效日期、計算期間）
- [ ] 稅率驗證（0-1 範圍）
- [ ] 員工 ID 驗證（對應現有成員）

## 🔄 整合點核對清單

### 外部 API 整合
- [ ] Brand/Workspace API - 驗證工作區存取權限
- [ ] Member API - 取得員工資訊
- [ ] Notification API - 發送薪資計算通知
- [ ] Report API - 產生 PDF/Excel 薪資報表

## 📊 回應格式核對清單

### 成功回應格式
```json
{
  "success": true,
  "data": { ... }
}
```

### 錯誤回應格式  
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## 🚀 效能優化核對清單

### 資料庫優化
- [ ] 建立適當索引
- [ ] 實作分頁機制
- [ ] 快取薪資設定和等級資料
- [ ] 使用資料庫交易處理薪資計算

### API 優化
- [ ] 實作查詢參數過濾
- [ ] 支援批次操作
- [ ] 回應資料壓縮

## 📋 測試核對清單

### 單元測試
- [ ] 薪資計算邏輯測試
- [ ] 資料驗證測試
- [ ] 權限檢查測試

### 整合測試
- [ ] API 端點測試
- [ ] 資料庫操作測試
- [ ] 外部整合測試

### 效能測試
- [ ] 大量資料查詢測試
- [ ] 並發操作測試
- [ ] 記憶體使用測試

## 📚 文件核對清單

### API 文件
- [ ] Swagger/OpenAPI 規格
- [ ] 請求/回應範例
- [ ] 錯誤代碼說明

### 部署文件
- [ ] 資料庫遷移腳本
- [ ] 環境設定說明
- [ ] 監控設定指南

---

**優先級建議：**
1. **高優先級**：Salary Settings, Salary Grades, Employee Salary APIs
2. **中優先級**：Salary Calculations, Salary Adjustments APIs  
3. **低優先級**：Salary Reports, Statistics APIs

**預估開發時間：** 2-3 週（包含測試和文件）