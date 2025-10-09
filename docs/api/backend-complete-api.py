from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime, timedelta
import jwt
import httpx

app = FastAPI(title="HRM Backend API", version="1.0.0")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    default_timezone: str = "Asia/Taipei"

class LoginResponse(BaseModel):
    user: User
    token: str
    expires_at: datetime

class Brand(BaseModel):
    id: Optional[str] = None
    name: str
    api_url: str
    token: str
    status: str = "active"

# 權限驗證
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            os.getenv("JWT_SECRET_KEY", "your-secret-key"), 
            algorithms=["HS256"]
        )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# 健康檢查
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

# 認證 API
@app.post("/api/v1/auth/sign-in", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.username == "admin" and request.password == "password":
        user = User(
            id="user_123",
            name="Admin User",
            email="admin@example.com",
            role="Admin"
        )
        
        token_data = {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_data, os.getenv("JWT_SECRET_KEY", "your-secret-key"), algorithm="HS256")
        
        return LoginResponse(
            user=user,
            token=token,
            expires_at=token_data["exp"]
        )
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Brand 管理 API
@app.get("/api/v1/brands")
async def get_brands(token_data: dict = Depends(verify_token)):
    return [
        {
            "id": "brand_1",
            "name": "CS System 009",
            "api_url": "https://api.cs-system-009.cxgenie.app",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": "brand_2", 
            "name": "Demo Brand",
            "api_url": "https://api.demo.cxgenie.app",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]

@app.get("/api/v1/brands/{brand_id}/token")
async def get_brand_token(brand_id: str, token_data: dict = Depends(verify_token)):
    # TODO: 從資料庫查詢實際 token
    return {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_token"
    }

@app.get("/api/v1/brands/{brand_id}/workspaces")
async def get_brand_workspaces(brand_id: str, token_data: dict = Depends(verify_token)):
    return [
        {
            "id": "workspace_1",
            "name": "Customer Service",
            "brand_id": brand_id,
            "status": "active"
        },
        {
            "id": "workspace_2", 
            "name": "Sales Support",
            "brand_id": brand_id,
            "status": "active"
        }
    ]

# Agent Status API
@app.get("/api/v1/agent-status")
async def get_agent_status(
    workspace_id: str = Query(...),
    brand_id: str = Query(...),
    token_data: dict = Depends(verify_token)
):
    """獲取指定 Workspace 的 Agent 狀態"""
    try:
        # TODO: 從資料庫查詢實際 brand token
        brand_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_token"
        
        # 調用外部 API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.cs-system-009.cxgenie.app/api/v1/users/status",
                params={"workspace_id": workspace_id},
                headers={
                    "Authorization": f"Bearer {brand_token}",
                    "Accept": "application/json"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                # 外部 API 失敗時返回模擬數據
                raise Exception(f"External API error: {response.status_code}")
                
    except Exception as e:
        # 返回模擬數據
        print(f"使用模擬數據，原因: {e}")
        return [
            {
                "id": "agent_1",
                "name": "Agent Alice",
                "user_id": "user_1", 
                "username": "alice",
                "status": "Available",
                "online": True,
                "is_online": True,
                "available": True,
                "is_available": True,
                "last_activity": "2024-01-15T10:30:00Z"
            },
            {
                "id": "agent_2",
                "name": "Agent Bob",
                "user_id": "user_2",
                "username": "bob", 
                "status": "Busy",
                "online": True,
                "is_online": True,
                "available": False,
                "is_available": False,
                "last_activity": "2024-01-15T10:25:00Z"
            },
            {
                "id": "agent_3",
                "name": "Agent Charlie",
                "user_id": "user_3",
                "username": "charlie",
                "status": "Available", 
                "online": False,
                "is_online": False,
                "available": True,
                "is_available": True,
                "last_activity": "2024-01-15T09:45:00Z"
            },
            {
                "id": "agent_4",
                "name": "Agent David",
                "user_id": "user_4",
                "username": "david",
                "status": "Offline", 
                "online": False,
                "is_online": False,
                "available": False,
                "is_available": False,
                "last_activity": "2024-01-15T08:30:00Z"
            },
            {
                "id": "agent_5",
                "name": "Agent Eve",
                "user_id": "user_5",
                "username": "eve",
                "status": "Available", 
                "online": True,
                "is_online": True,
                "available": True,
                "is_available": True,
                "last_activity": "2024-01-15T10:28:00Z"
            }
        ]

# Dashboard API
@app.get("/api/v1/dashboard/agent-monitor")
async def get_agent_monitor(token_data: dict = Depends(verify_token)):
    return {
        "total_agents": 15,
        "online_agents": 12,
        "available_agents": 8,
        "busy_agents": 4,
        "offline_agents": 3,
        "warning_agents": 2,
        "last_updated": datetime.utcnow()
    }

@app.get("/api/v1/dashboard/stats")
async def get_dashboard_stats(token_data: dict = Depends(verify_token)):
    return {
        "brand_count": 5,
        "workspace_count": 12,
        "bot_count": 8,
        "agent_count": 24
    }

# 其他必要的 API 端點
@app.get("/api/v1/users/workspaces")
async def get_workspaces(token_data: dict = Depends(verify_token)):
    return {"workspaces": []}

@app.get("/api/v1/bots/all-bots")
async def get_all_bots(token_data: dict = Depends(verify_token)):
    return {"bots": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)