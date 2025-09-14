# 系統設定本地快取策略

## 概述

為了節省網路流量並提升使用者體驗，系統設定採用本地快取策略。設定資料會在用戶登入後載入一次並存儲在本地，只有在變更時才會與後端同步。

## 快取機制

### 1. 初始載入
- 用戶登入後，系統會自動載入系統設定
- 首次載入會從後端 API 獲取最新設定
- 載入成功後標記為已初始化，並記錄同步時間

### 2. 本地快取
- 設定資料使用 Zustand persist 中間件存儲在 localStorage
- 包含以下資料：
  - `settings`: 系統設定內容
  - `lastSyncTime`: 最後同步時間
  - `isInitialized`: 是否已初始化

### 3. 快取策略
- **首次訪問**: 從後端載入並快取
- **後續訪問**: 直接使用本地快取
- **設定變更**: 立即同步到後端並更新本地快取
- **手動刷新**: 提供按鈕強制從後端重新載入

## 系統設定項目

| 設定項目 | 類型 | 預設值 | 說明 |
|---------|------|--------|------|
| siteName | string | 'HRM 管理系統' | 網站名稱 |
| defaultLanguage | string | 'zh-TW' | 預設語言 |
| timezone | string | 'Asia/Taipei' | 時區設定 |
| debugMode | boolean | false | 除錯模式 |
| maxLoginAttempts | number | 5 | 最大登入嘗試次數 |
| sessionTimeout | number | 24 | 會話超時時間(小時) |
| emailNotifications | boolean | true | Email 通知 |
| maintenanceMode | boolean | false | 維護模式 |

## API 端點

### 獲取系統設定
```
GET /api/v1/system/settings
```

### 更新系統設定
```
PUT /api/v1/system/settings
Content-Type: application/json

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

## 使用方式

### 在組件中使用系統設定

```jsx
import { useSystemStore } from '../store/systemStore';

const MyComponent = () => {
  const { settings, loadSettings, saveSettings, updateSetting } = useSystemStore();
  
  // 讀取設定
  const siteName = settings.siteName;
  
  // 更新單個設定
  const handleChange = (key, value) => {
    updateSetting(key, value);
  };
  
  // 保存所有設定
  const handleSave = async () => {
    try {
      await saveSettings(settings);
      alert('設定已保存');
    } catch (error) {
      alert('保存失敗: ' + error.message);
    }
  };
  
  // 強制刷新設定
  const handleRefresh = () => {
    loadSettings(true);
  };
};
```

### 全局配置同步

系統設定會自動同步到 `window.__APP_CONFIG__`，供其他組件使用：

```javascript
// 獲取當前網站名稱
const siteName = window.__APP_CONFIG__?.siteName || '預設名稱';

// 監聽設定更新事件
window.addEventListener('systemSettingsUpdated', (event) => {
  console.log('系統設定已更新:', event.detail);
});
```

## 快取管理

### 自動同步檢查
- 系統會檢查最後同步時間
- 超過 1 小時會自動標記需要同步
- 可通過 `shouldSync()` 方法檢查

### 手動清除快取
```javascript
import { useSystemStore } from '../store/systemStore';

// 清除快取，下次載入時會從後端重新獲取
useSystemStore.getState().resetCache();
```

### 登出時清除
- 用戶登出時會自動清除系統設定快取
- 確保下次登入時重新載入最新設定

## 錯誤處理

### 後端 API 不可用
- 如果後端 API 尚未實作或無法連接
- 系統會使用本地快取的設定
- 顯示相應的錯誤訊息給用戶

### 網路連接問題
- 載入失敗時會回退到本地設定
- 保存失敗時會更新本地設定但顯示錯誤
- 提供手動重試機制

## 性能優化

1. **減少網路請求**: 只在必要時從後端載入
2. **即時響應**: 本地設定變更立即生效
3. **後台同步**: 設定變更後台同步到後端
4. **智能快取**: 根據時間戳判斷是否需要更新

## 注意事項

1. 系統設定變更會影響全局配置
2. 某些設定（如維護模式）可能需要重新載入頁面
3. 多標籤頁面間的設定同步需要額外處理
4. 後端 API 需要實作對應的端點才能完整運作