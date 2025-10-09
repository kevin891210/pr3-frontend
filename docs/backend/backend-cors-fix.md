# 後端 CORS 問題修復

## 🚨 **問題**
前端 `http://localhost:3000` 無法訪問後端 `http://localhost:8000` API，出現 CORS 錯誤。

## 🔧 **後端修復方案**

### 1. FastAPI CORS 設定
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允許前端域名
    allow_credentials=True,
    allow_methods=["*"],  # 允許所有 HTTP 方法
    allow_headers=["*"],  # 允許所有標頭
)
```

### 2. 生產環境設定
```python
# 生產環境更嚴格的設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 3. 環境變數設定
```python
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📋 **必須實作的 API 端點**

### 排班管理
- `GET /api/v1/shift-templates`
- `GET /api/v1/schedule-assignments`

### 請假管理  
- `GET /api/v1/leave-types`
- `GET /api/v1/leave-requests`
- `GET /api/v1/users/{id}/leave-balance`

### Brand 管理
- `GET /api/v1/brands/{id}/token` - 獲取 Brand Token

## 🛠️ **完整範例**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HRM API", version="1.0.0")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/shift-templates")
async def get_shift_templates():
    return [
        {"id": 1, "name": "早班", "start_time": "08:00", "end_time": "16:00"},
        {"id": 2, "name": "夜班", "start_time": "22:00", "end_time": "06:00"}
    ]

@app.get("/api/v1/schedule-assignments")
async def get_schedule_assignments():
    return []

@app.get("/api/v1/leave-types")
async def get_leave_types():
    return [
        {"id": 1, "code": "ANNUAL", "name": "年假", "quota": 14},
        {"id": 2, "code": "SICK", "name": "病假", "quota": 30}
    ]
```

修復 CORS 後前端就能正常調用 API。