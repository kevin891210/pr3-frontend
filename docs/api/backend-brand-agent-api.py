# Brand 和 Agent Monitor API 端點補充

from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
from datetime import datetime

class Brand(BaseModel):
    id: str
    name: str
    api_url: str
    token: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime

class BrandToken(BaseModel):
    token: str
    expires_at: Optional[datetime] = None

# Brand 管理 API
@app.get("/api/v1/brands")
async def get_brands(token_data: dict = Depends(verify_token)):
    """獲取所有 Brand 列表"""
    # TODO: 實際查詢邏輯
    return [
        {
            "id": "brand_1",
            "name": "CS System 009",
            "api_url": "https://api.cs-system-009.cxgenie.app",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": "brand_2", 
            "name": "Demo Brand",
            "api_url": "https://api.demo.cxgenie.app",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]

@app.post("/api/v1/brands")
async def create_brand(brand: Brand, token_data: dict = Depends(verify_token)):
    """創建新 Brand"""
    # TODO: 實際創建邏輯
    return {"id": "brand_new", **brand.dict()}

@app.get("/api/v1/brands/{brand_id}")
async def get_brand_by_id(brand_id: str, token_data: dict = Depends(verify_token)):
    """根據 ID 獲取 Brand"""
    # TODO: 實際查詢邏輯
    return {
        "id": brand_id,
        "name": "CS System 009",
        "api_url": "https://api.cs-system-009.cxgenie.app",
        "status": "active"
    }

@app.put("/api/v1/brands/{brand_id}")
async def update_brand(brand_id: str, brand: Brand, token_data: dict = Depends(verify_token)):
    """更新 Brand"""
    # TODO: 實際更新邏輯
    return {"id": brand_id, **brand.dict()}

@app.delete("/api/v1/brands/{brand_id}")
async def delete_brand(brand_id: str, token_data: dict = Depends(verify_token)):
    """刪除 Brand"""
    # TODO: 實際刪除邏輯
    return {"message": "Brand deleted successfully"}

@app.get("/api/v1/brands/{brand_id}/token")
async def get_brand_token(brand_id: str, token_data: dict = Depends(verify_token)):
    """獲取 Brand 的 API Token"""
    # TODO: 從資料庫查詢實際 token
    return {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_token",
        "expires_at": None
    }

@app.get("/api/v1/brands/{brand_id}/workspaces")
async def get_brand_workspaces(brand_id: str, token_data: dict = Depends(verify_token)):
    """獲取 Brand 下的所有 Workspace"""
    # TODO: 實際查詢邏輯或調用外部 API
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

@app.get("/api/v1/brands/{brand_id}/agents")
async def get_brand_agents(brand_id: str, token_data: dict = Depends(verify_token)):
    """獲取 Brand 下的所有 Agent"""
    # TODO: 實際查詢邏輯或調用外部 API
    return [
        {
            "id": "agent_1",
            "name": "Agent Alice",
            "workspace_id": "workspace_1",
            "status": "Available",
            "online": True,
            "available": True,
            "last_activity": "2024-01-15T10:30:00Z"
        },
        {
            "id": "agent_2",
            "name": "Agent Bob", 
            "workspace_id": "workspace_1",
            "status": "Busy",
            "online": True,
            "available": False,
            "last_activity": "2024-01-15T10:25:00Z"
        }
    ]

@app.post("/api/v1/brands/{brand_id}/sync")
async def sync_brand_resources(brand_id: str, token_data: dict = Depends(verify_token)):
    """同步 Brand 資源（Workspace、Agent 等）"""
    # TODO: 實際同步邏輯
    return {
        "message": "Sync completed",
        "synced_at": datetime.utcnow(),
        "workspaces_count": 2,
        "agents_count": 5
    }

# Agent Status API (代理外部 API 調用)
@app.get("/api/v1/agent-status")
async def get_agent_status(
    workspace_id: str,
    brand_id: str,
    token_data: dict = Depends(verify_token)
):
    """獲取指定 Workspace 的 Agent 狀態"""
    try:
        # 獲取 Brand Token
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
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"External API error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=408,
            detail="External API timeout"
        )
    except Exception as e:
        # 如果外部 API 失敗，返回模擬數據
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
                "status": "Offline", 
                "online": False,
                "is_online": False,
                "available": False,
                "is_available": False,
                "last_activity": "2024-01-15T09:45:00Z"
            }
        ]

# Dashboard Agent Monitor API
@app.get("/api/v1/dashboard/agent-monitor")
async def get_agent_monitor(token_data: dict = Depends(verify_token)):
    """獲取 Agent 監控統計數據"""
    # TODO: 實際統計邏輯
    return {
        "total_agents": 15,
        "online_agents": 12,
        "available_agents": 8,
        "busy_agents": 4,
        "offline_agents": 3,
        "warning_agents": 2,
        "last_updated": datetime.utcnow()
    }