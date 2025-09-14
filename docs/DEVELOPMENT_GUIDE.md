# HRM Frontend 開發指南

## 快速開始

### 環境需求
- Node.js 18+ 
- npm 或 yarn
- Git

### 安裝與啟動
```bash
# 克隆專案
git clone <repository-url>
cd pr3

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 建置生產版本
npm run build
```

## 專案架構說明

### 目錄結構詳解

```
src/
├── components/          # 共用組件庫
│   ├── ui/             # 基礎 UI 組件 (shadcn/ui)
│   │   ├── button.jsx  # 按鈕組件
│   │   ├── card.jsx    # 卡片組件
│   │   ├── dialog.jsx  # 對話框組件
│   │   └── ...         # 其他基礎組件
│   ├── agent/          # Agent 相關組件
│   │   ├── AgentCard.jsx    # Agent 卡片
│   │   └── AgentGrid.jsx    # Agent 網格佈局
│   ├── calendar/       # 日曆組件
│   │   └── SimpleCalendar.jsx # 自製日曆組件
│   ├── Layout.jsx      # 主要佈局組件
│   ├── NoticeWidget.jsx # 公告小工具
│   └── LanguageSwitcher.jsx # 語言切換器
├── features/           # 功能模組 (按業務邏輯分組)
│   ├── auth/          # 認證模組
│   │   └── LoginPage.jsx
│   ├── dashboard/     # 儀表板模組
│   │   └── DashboardPage.jsx
│   ├── brand/         # Brand 管理模組
│   │   └── BrandPage.jsx
│   ├── user/          # 使用者管理模組
│   │   └── UserPage.jsx
│   ├── monitor/       # Agent 監控模組
│   │   └── AgentMonitorPage.jsx
│   └── hrm/           # HRM 核心功能
│       ├── schedule/  # 排班管理
│       │   └── SchedulePage.jsx
│       ├── leave/     # 請假管理
│       │   └── LeavePage.jsx
│       └── notice/    # 公告管理
│           └── NoticePage.jsx
├── store/             # 狀態管理 (Zustand)
│   ├── authStore.jsx  # 認證狀態
│   └── systemStore.jsx # 系統設定狀態
├── services/          # API 服務層
│   └── api.js         # API 客戶端
├── config/            # 配置文件
│   └── runtime.js     # Runtime 配置
├── locales/           # 國際化資源
│   ├── i18n.jsx       # i18n 配置
│   └── translations.json # 翻譯資源
├── utils/             # 工具函數
│   └── storage.js     # 本地儲存管理
└── App.jsx            # 應用程式入口
```

## 開發規範

### 命名規範

1. **組件命名**: PascalCase
   ```jsx
   // ✅ 正確
   const UserManagePage = () => { ... }
   
   // ❌ 錯誤
   const userManagePage = () => { ... }
   ```

2. **檔案命名**: PascalCase.jsx
   ```
   ✅ UserManagePage.jsx
   ❌ userManagePage.jsx
   ❌ user-manage-page.jsx
   ```

3. **函數命名**: camelCase
   ```jsx
   // ✅ 正確
   const handleUserSubmit = () => { ... }
   
   // ❌ 錯誤
   const HandleUserSubmit = () => { ... }
   ```

4. **常數命名**: UPPER_SNAKE_CASE
   ```jsx
   // ✅ 正確
   const API_BASE_URL = 'https://api.example.com';
   const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000;
   
   // ❌ 錯誤
   const apiBaseUrl = 'https://api.example.com';
   ```

### 程式碼結構

1. **組件結構**:
   ```jsx
   /**
    * 使用者管理頁面組件
    * 提供使用者的 CRUD 操作和角色管理功能
    */
   import React, { useState, useEffect } from 'react';
   import { useTranslation } from 'react-i18next';
   // ... 其他 imports
   
   const UserManagePage = () => {
     // 1. Hooks 和狀態定義
     const { t } = useTranslation();
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     
     // 2. useEffect
     useEffect(() => {
       loadUsers();
     }, []);
     
     // 3. 事件處理函數
     const handleUserCreate = async (userData) => {
       // 處理邏輯
     };
     
     // 4. 渲染函數
     const renderUserList = () => {
       // 渲染邏輯
     };
     
     // 5. 主要渲染
     return (
       <div className="space-y-6">
         {/* JSX 內容 */}
       </div>
     );
   };
   
   export default UserManagePage;
   ```

2. **註解規範**:
   ```jsx
   /**
    * 函數功能說明
    * @param {string} userId - 使用者 ID
    * @param {Object} userData - 使用者資料物件
    * @returns {Promise} 回傳 Promise 物件
    */
   const updateUser = async (userId, userData) => {
     // 實作邏輯
   };
   ```

### API 整合規範

1. **API 調用**:
   ```jsx
   // ✅ 正確 - 使用 try-catch 處理錯誤
   const loadUsers = async () => {
     try {
       setLoading(true);
       const response = await apiClient.getUsers();
       const data = response.data || response;
       setUsers(Array.isArray(data) ? data : []);
     } catch (error) {
       console.error('載入使用者失敗:', error);
       // 錯誤處理邏輯
     } finally {
       setLoading(false);
     }
   };
   ```

2. **快取使用**:
   ```jsx
   // 使用快取機制減少 API 調用
   const loadBrands = async () => {
     // useCache = true 會優先從快取讀取
     const response = await apiClient.getBrands({}, true);
     setBrands(response.data || response);
   };
   ```

### 狀態管理規範

1. **Zustand Store 結構**:
   ```jsx
   /**
    * 功能模組狀態管理
    * 管理特定功能的狀態和操作方法
    */
   export const useFeatureStore = create((set, get) => ({
     // 狀態定義
     data: [],
     loading: false,
     error: null,
     
     // 操作方法
     setData: (data) => set({ data }),
     setLoading: (loading) => set({ loading }),
     setError: (error) => set({ error }),
     
     // 異步操作
     fetchData: async () => {
       set({ loading: true, error: null });
       try {
         const data = await apiClient.getData();
         set({ data, loading: false });
       } catch (error) {
         set({ error: error.message, loading: false });
       }
     }
   }));
   ```

### 樣式規範

1. **Tailwind CSS 使用**:
   ```jsx
   // ✅ 正確 - 使用語義化的 class 組合
   <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
     <h2 className="text-lg font-semibold text-gray-900">標題</h2>
     <Button className="flex items-center gap-2">
       <Plus className="w-4 h-4" />
       新增
     </Button>
   </div>
   ```

2. **響應式設計**:
   ```jsx
   // 使用 Tailwind 的響應式前綴
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     {/* 內容 */}
   </div>
   ```

## 新功能開發流程

### 1. 建立新功能模組

```bash
# 建立功能目錄
mkdir src/features/new-feature

# 建立主要組件
touch src/features/new-feature/NewFeaturePage.jsx
```

### 2. 組件開發模板

```jsx
/**
 * 新功能頁面組件
 * 描述這個組件的主要功能和用途
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const NewFeaturePage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  
  // 狀態定義
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 載入資料
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getNewFeatureData();
      const responseData = response.data || response;
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('newFeature')}</h1>
        {hasPermission('feature.create') && (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('add')}
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('dataList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div>
              {/* 資料顯示邏輯 */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewFeaturePage;
```

### 3. 新增 API 方法

在 `src/services/api.js` 中新增對應的 API 方法：

```jsx
// 新功能 APIs
/**
 * 取得新功能資料列表
 * @param {Object} params - 查詢參數
 * @returns {Promise} API 回應
 */
async getNewFeatureData(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/api/v1/new-feature${query ? `?${query}` : ''}`);
},

/**
 * 建立新功能資料
 * @param {Object} data - 要建立的資料
 * @returns {Promise} API 回應
 */
async createNewFeatureData(data) {
  return this.request('/api/v1/new-feature', {
    method: 'POST',
    body: data,
  });
},
```

### 4. 新增路由

在 `src/App.jsx` 中新增路由：

```jsx
import NewFeaturePage from './features/new-feature/NewFeaturePage';

// 在路由配置中新增
<Route 
  path="/new-feature" 
  element={
    <ProtectedRoute requiredPermission="feature.read">
      <NewFeaturePage />
    </ProtectedRoute>
  } 
/>
```

### 5. 新增國際化翻譯

在 `src/locales/translations.json` 中新增翻譯：

```json
{
  "en": {
    "newFeature": "New Feature",
    "dataList": "Data List"
  },
  "zh": {
    "newFeature": "新功能",
    "dataList": "資料列表"
  }
}
```

## 效能優化指南

### 1. 本地快取使用

```jsx
// 使用本地快取減少 API 調用
import { storageManager, CACHE_KEYS } from '../utils/storage';

const MyComponent = () => {
  const loadData = async () => {
    // 優先從快取讀取
    const cached = storageManager.getCache(CACHE_KEYS.BRANDS);
    if (cached) {
      setData(cached);
      return;
    }
    
    // 快取不存在時調用 API
    const response = await apiClient.getBrands();
    const data = response.data || response;
    
    // 儲存到快取
    storageManager.setCache(CACHE_KEYS.BRANDS, data);
    setData(data);
  };
};
```

### 2. 組件優化

```jsx
// 使用 React.memo 避免不必要的重渲染
const UserCard = React.memo(({ user, onEdit, onDelete }) => {
  return (
    <Card>
      {/* 組件內容 */}
    </Card>
  );
});

// 使用 useCallback 優化事件處理函數
const MyComponent = () => {
  const handleEdit = useCallback((userId) => {
    // 編輯邏輯
  }, []);
  
  const handleDelete = useCallback((userId) => {
    // 刪除邏輯
  }, []);
};
```

### 3. 延遲載入

```jsx
// 使用 React.lazy 延遲載入組件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

const MyPage = () => {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <HeavyComponent />
    </Suspense>
  );
};
```

## 測試指南

### 1. 組件測試

```jsx
// UserCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import UserCard from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  };
  
  it('應該顯示使用者資訊', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('應該觸發編輯事件', () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('編輯'));
    expect(mockOnEdit).toHaveBeenCalledWith(1);
  });
});
```

### 2. API 測試

```jsx
// api.test.js
import apiClient from './api';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  it('應該正確調用 getBrands API', async () => {
    const mockResponse = { data: [{ id: 1, name: 'Test Brand' }] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    const result = await apiClient.getBrands();
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/brands'),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });
});
```

## 部署指南

### 1. 本地開發

```bash
# 啟動開發服務器
npm run dev

# 建置測試
npm run build
npm run preview
```

### 2. Docker 部署

```bash
# 建置 Docker 映像
docker build -t hrm-frontend .

# 啟動容器
docker run -p 3000:80 hrm-frontend
```

### 3. 生產部署

```bash
# 建置生產版本
npm run build

# 部署到 EC2
./ops/deploy/build-and-deploy.sh <EC2_IP> ubuntu
```

## 故障排除

### 常見問題

1. **API 連接失敗**
   - 檢查 `public/config/app-config.json` 中的 API URL
   - 確認後端服務是否正常運行

2. **認證失敗**
   - 檢查 JWT Token 是否有效
   - 確認使用者權限設定

3. **快取問題**
   - 清除瀏覽器 localStorage
   - 或調用 `apiClient.clearAllCache()`

4. **國際化問題**
   - 檢查翻譯檔案是否完整
   - 確認 i18n 配置正確

### 除錯工具

1. **瀏覽器開發者工具**
   - Network 標籤檢查 API 請求
   - Console 標籤查看錯誤訊息
   - Application 標籤檢查 localStorage

2. **React Developer Tools**
   - 檢查組件狀態和 props
   - 分析組件重渲染

3. **日誌記錄**
   ```jsx
   // 在關鍵位置添加日誌
   console.log('API 回應:', response);
   console.error('錯誤詳情:', error);
   ```

## 最佳實踐

1. **程式碼品質**
   - 使用 ESLint 和 Prettier
   - 定期進行程式碼審查
   - 保持組件單一職責

2. **效能優化**
   - 合理使用快取機制
   - 避免不必要的重渲染
   - 優化圖片和靜態資源

3. **安全性**
   - 驗證使用者輸入
   - 實施適當的權限控制
   - 定期更新依賴套件

4. **可維護性**
   - 編寫清晰的註解
   - 保持一致的程式碼風格
   - 建立完整的文件