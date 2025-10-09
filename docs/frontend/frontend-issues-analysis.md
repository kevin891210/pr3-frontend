# 前端頁面問題分析

## 🚨 **問題確認**

### 1. **使用者管理頁面** (`/users`)
**問題**: API 調用失敗導致頁面無法正常載入
- **API 端點**: `GET /api/v1/users`
- **錯誤**: CORS 或 500 Internal Server Error
- **影響**: 無法顯示使用者列表

### 2. **排班管理頁面** (`/schedule`)
**問題**: 多個 API 調用失敗
- **API 端點**: 
  - `GET /api/v1/shift-templates`
  - `GET /api/v1/schedule-assignments`
- **錯誤**: CORS 或 500 Internal Server Error
- **影響**: 無法顯示班別模板和排班資料

## 🔧 **後端需要修復的問題**

### 1. **CORS 設定** (必須修復)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **缺少的 API 端點** (必須實作)

#### 使用者管理 API
```python
@app.get("/api/v1/users")
async def get_users():
    return [
        {
            "id": 1,
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "Admin",
            "status": "active"
        }
    ]

@app.post("/api/v1/users")
async def create_user(user_data: dict):
    return {"id": 2, **user_data}

@app.put("/api/v1/users/{user_id}")
async def update_user(user_id: int, user_data: dict):
    return {"id": user_id, **user_data}

@app.delete("/api/v1/users/{user_id}")
async def delete_user(user_id: int):
    return {"message": "User deleted successfully"}
```

#### 排班管理 API
```python
@app.get("/api/v1/shift-templates")
async def get_shift_templates():
    return [
        {
            "id": 1,
            "name": "早班",
            "start_time": "08:00",
            "end_time": "16:00",
            "is_cross_day": False,
            "min_staff": 2,
            "max_staff": 5,
            "breaks": [{"start": "12:00", "end": "13:00"}]
        },
        {
            "id": 2,
            "name": "夜班",
            "start_time": "22:00",
            "end_time": "06:00",
            "is_cross_day": True,
            "min_staff": 1,
            "max_staff": 3,
            "breaks": [{"start": "02:00", "end": "02:30"}]
        }
    ]

@app.get("/api/v1/schedule-assignments")
async def get_schedule_assignments():
    return [
        {
            "id": "1",
            "title": "John - 早班",
            "start": "2024-01-15T08:00:00",
            "end": "2024-01-15T16:00:00",
            "backgroundColor": "#10b981",
            "extendedProps": {
                "userId": "user1",
                "shiftTemplateId": 1,
                "status": "confirmed"
            }
        }
    ]
```

### 3. **錯誤處理改進**
```python
@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "detail": "Endpoint not found"}
    )
```

## 📋 **檢查清單**

### 後端檢查項目
- [ ] CORS 中間件已設定
- [ ] `/api/v1/users` 端點已實作
- [ ] `/api/v1/shift-templates` 端點已實作  
- [ ] `/api/v1/schedule-assignments` 端點已實作
- [ ] 所有端點返回正確的 JSON 格式
- [ ] 錯誤處理機制已實作

### 測試方法
```bash
# 測試 API 端點
curl -X GET http://localhost:8000/api/v1/users
curl -X GET http://localhost:8000/api/v1/shift-templates
curl -X GET http://localhost:8000/api/v1/schedule-assignments
```

## 🎯 **解決方案優先級**

1. **高優先級**: 修復 CORS 設定
2. **高優先級**: 實作基本的 GET API 端點
3. **中優先級**: 實作 POST/PUT/DELETE 端點
4. **低優先級**: 完善錯誤處理和驗證

修復這些問題後，使用者管理和排班管理頁面應該能正常運作。