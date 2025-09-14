from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime, timedelta
import jwt

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

class AgentLoginRequest(LoginRequest):
    brand_id: str

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    default_timezone: str = "Asia/Taipei"
    team_id: Optional[str] = None

class LoginResponse(BaseModel):
    user: User
    token: str
    expires_at: datetime

class ShiftTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    timezone: str = "Asia/Taipei"
    start_time: str
    end_time: str
    is_cross_day: bool = False
    breaks: List[dict] = []
    min_staff: int = 1
    max_staff: int = 10

class ScheduleAssignment(BaseModel):
    id: Optional[str] = None
    user_id: str
    shift_template_id: str
    date: str
    start_at: datetime
    end_at: datetime
    status: str = "pending"
    timezone: str = "Asia/Taipei"

class LeaveRequest(BaseModel):
    id: Optional[str] = None
    type_id: str
    start_at: datetime
    end_at: datetime
    reason: str
    attachment_urls: List[str] = []

class Notice(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    scope: dict
    starts_at: datetime
    ends_at: datetime
    require_ack: bool = False

# 權限驗證
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            os.getenv("JWT_SECRET_KEY"), 
            algorithms=["HS256"]
        )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# API 端點
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

@app.post("/api/v1/auth/sign-in", response_model=LoginResponse)
async def login(request: LoginRequest):
    # TODO: 實際驗證邏輯
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
        
        token = jwt.encode(token_data, os.getenv("JWT_SECRET_KEY"), algorithm="HS256")
        
        return LoginResponse(
            user=user,
            token=token,
            expires_at=token_data["exp"]
        )
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/v1/auth/agent-sign-in", response_model=LoginResponse)
async def agent_login(request: AgentLoginRequest):
    # TODO: 實際 Agent 驗證邏輯
    pass

@app.get("/api/v1/users/workspaces")
async def get_workspaces(token_data: dict = Depends(verify_token)):
    # TODO: 實際查詢邏輯
    return {"workspaces": []}

@app.get("/api/v1/bots/all-bots")
async def get_all_bots(token_data: dict = Depends(verify_token)):
    # TODO: 實際查詢邏輯
    return {"bots": []}

@app.get("/api/v1/shift-templates")
async def get_shift_templates(token_data: dict = Depends(verify_token)):
    # TODO: 實際查詢邏輯
    return {"shift_templates": []}

@app.post("/api/v1/shift-templates")
async def create_shift_template(
    template: ShiftTemplate, 
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際創建邏輯
    return {"id": "template_123", **template.dict()}

@app.get("/api/v1/schedule-assignments")
async def get_schedule_assignments(
    from_date: str = None,
    to_date: str = None,
    user_id: str = None,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際查詢邏輯
    return {"assignments": []}

@app.post("/api/v1/schedule-assignments")
async def create_schedule_assignment(
    assignment: ScheduleAssignment,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際創建邏輯與衝突檢測
    return {"id": "assignment_123", **assignment.dict()}

@app.get("/api/v1/leave-types")
async def get_leave_types(token_data: dict = Depends(verify_token)):
    # TODO: 實際查詢邏輯
    return {
        "leave_types": [
            {
                "id": "lt_1",
                "code": "ANNUAL",
                "name": "年假",
                "quota": 14,
                "allow_half_day": True,
                "require_attachment": False
            }
        ]
    }

@app.get("/api/v1/users/{user_id}/leave-balance")
async def get_leave_balance(
    user_id: str,
    year: int = None,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際查詢邏輯
    return {
        "balances": {
            "ANNUAL": {"total": 14, "used": 5, "remaining": 9}
        }
    }

@app.post("/api/v1/leave-requests")
async def create_leave_request(
    request: LeaveRequest,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際創建邏輯與餘額檢查
    return {"id": "leave_123", **request.dict()}

@app.get("/api/v1/notices")
async def get_notices(
    scope: str = None,
    require_ack: bool = None,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際查詢邏輯
    return {"notices": []}

@app.post("/api/v1/notices")
async def create_notice(
    notice: Notice,
    token_data: dict = Depends(verify_token)
):
    # TODO: 實際創建邏輯
    return {"id": "notice_123", **notice.dict()}

@app.get("/api/v1/dashboard/stats")
async def get_dashboard_stats(token_data: dict = Depends(verify_token)):
    # TODO: 實際統計邏輯
    return {
        "brand_count": 5,
        "workspace_count": 12,
        "bot_count": 8,
        "agent_count": 24
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)