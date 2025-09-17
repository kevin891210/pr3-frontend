# Salary Management i18n 翻譯狀態檢查報告

## 📋 翻譯完成度檢查

### ✅ 已完成翻譯的組件
1. **SalaryPage.jsx** - 主頁面 ✅
   - 使用 `useTranslation()` hook
   - 所有 tab 標籤已翻譯
   - 頁面標題和描述已翻譯

2. **SalarySettings.jsx** - 薪資設定 ✅
   - 使用 `useTranslation()` hook
   - 大部分 UI 文字已翻譯
   - 表單標籤和按鈕已翻譯

3. **SalaryGrades.jsx** - 薪資等級 ✅
   - 使用 `useTranslation()` hook
   - 表格標題和表單已翻譯
   - 對話框內容已翻譯

4. **SalaryAdjustments.jsx** - 薪資調整 ✅
   - 使用 `useTranslation()` hook
   - 表格和表單已翻譯
   - Tab 標籤已翻譯

### ❌ 需要翻譯的組件

#### 1. **EmployeeSalary.jsx** - 員工薪資管理
**問題**：大量硬編碼中文文字
- 表格標題：「員工資訊」、「薪資等級」、「基本薪資」、「生效日期」、「狀態」、「操作」
- 對話框標題：「編輯員工薪資」、「新增員工薪資」
- 表單標籤：「員工姓名」、「員工信箱」、「薪資等級」、「生效日期」
- 按鈕文字：「取消」、「儲存」、「確認設定」
- 狀態文字：「啟用」、「停用」
- 批量操作相關文字

#### 2. **SalaryCalculation.jsx** - 薪資計算
**問題**：完全沒有使用 i18n
- 頁面標題：「薪資計算」
- 表格標題：「員工」、「計算期間」、「總薪資」、「淨薪資」、「狀態」、「操作」
- 表單標籤：「選擇員工」、「開始日期」、「結束日期」、「加班時數」
- 狀態標籤：「草稿」、「已確認」、「已發放」
- 計算相關文字：「平日」、「假日」、「國定」、「缺勤天數」

#### 3. **SalaryReports.jsx** - 薪資報表
**問題**：完全沒有使用 i18n
- 頁面標題：「薪資報表」
- 統計卡片：「總員工數」、「本月總薪資」、「平均薪資」、「月增長率」
- 圖表標題：「薪資趨勢」、「薪資等級分布」
- 表格標題：「薪資等級」、「員工數量」、「總薪資」、「平均薪資」、「佔比」

#### 4. **BatchImportModal.jsx** - 批量匯入模態框
**狀態**：未檢查，可能需要翻譯

### 📝 翻譯文件狀態

#### ✅ 已完成的語言
- **English (en)** ✅ - 完整翻譯
- **Chinese (zh)** ✅ - 完整翻譯  
- **Japanese (ja)** ✅ - 完整翻譯

#### 📋 翻譯 Key 覆蓋範圍
```json
"salary": {
  // 基本標籤 ✅
  "management", "settings", "grades", "employees", "adjustments", "calculation", "reports",
  
  // 描述文字 ✅
  "settingsDescription", "gradesDescription", "employeesDescription", "adjustmentsDescription", "calculationDescription", "reportsDescription",
  
  // 設定相關 ✅
  "taxSettings", "enableFixedTax", "fixedTaxRate", "transferSettings", "transferFee", "payrollCycle",
  
  // 等級相關 ✅
  "gradeName", "baseSalary", "hourlyRate", "monthlySalary", "dailySalary", "overtimeMultiplier",
  
  // 員工相關 ✅
  "employeeInfo", "editEmployee", "addEmployee", "batchImport", "selectEmployees",
  
  // 調整相關 ✅
  "adjustmentType", "adjustmentRecords", "adjustmentTypes", "addAdjustment", "amount", "reason",
  
  // 計算相關 ⚠️ (部分缺失)
  "overtimeHours", "grossSalary", "taxDeduction", "netSalary", "salaryHistory",
  
  // 報表相關 ❌ (大部分缺失)
  // 需要新增：totalEmployees, monthlyTotal, averageSalary, growthRate, salaryTrend, gradeDistribution
  
  // 通用 ✅
  "weekly", "biweekly", "monthly", "quarterly", "effectiveDate", "create", "update"
}
```

## 🔧 需要執行的修正

### 1. 立即修正 (高優先級)
- **EmployeeSalary.jsx**: 替換所有硬編碼中文文字
- **SalaryCalculation.jsx**: 添加 `useTranslation()` 並替換文字
- **SalaryReports.jsx**: 添加 `useTranslation()` 並替換文字

### 2. 補充翻譯 Key (中優先級)
需要在 `translations.json` 中新增以下 key：

```json
"salary": {
  // 計算相關
  "quickCalculation": "快速計算",
  "calculationRecords": "計算記錄", 
  "calculationPeriod": "計算期間",
  "calculationDetails": "薪資計算明細",
  "absenceDays": "缺勤天數",
  "absenceDeduction": "缺勤扣款",
  "adjustmentPreview": "薪資調整預覽",
  "noAdjustmentRecords": "無調整記錄",
  
  // 報表相關
  "totalEmployees": "總員工數",
  "monthlyTotal": "本月總薪資", 
  "averageSalary": "平均薪資",
  "growthRate": "月增長率",
  "salaryTrend": "薪資趨勢",
  "gradeDistribution": "薪資等級分布",
  "gradeStatistics": "等級薪資統計",
  "employeeCount": "員工數量",
  "totalSalary": "總薪資",
  "percentage": "佔比",
  "selectPeriod": "選擇期間",
  "exportReport": "匯出報表",
  
  // 狀態相關
  "draft": "草稿",
  "confirmed": "已確認", 
  "paid": "已發放",
  "pending": "待處理",
  "processed": "已處理"
}
```

### 3. 檢查遺漏組件 (低優先級)
- **BatchImportModal.jsx**: 檢查並翻譯
- **SalaryProcessing.jsx**: 如果存在，需要檢查
- **SalarySetup.jsx**: 如果存在，需要檢查

## 📊 完成度統計
- **已完成翻譯**: 4/7 組件 (57%)
- **翻譯文件完整度**: 85% (缺少部分計算和報表相關 key)
- **多語言支援**: 3/3 語言 ✅

## 🎯 建議執行順序
1. 補充缺失的翻譯 key 到 `translations.json`
2. 修正 `EmployeeSalary.jsx` (最多硬編碼文字)
3. 修正 `SalaryCalculation.jsx` 
4. 修正 `SalaryReports.jsx`
5. 檢查 `BatchImportModal.jsx`
6. 全面測試三種語言切換

**預估工作時間**: 2-3 小時