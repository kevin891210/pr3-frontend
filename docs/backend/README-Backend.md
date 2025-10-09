# HRM Backend 開發文件

## 📋 專案概覽

基於 Python FastAPI 的 HRM 後端系統，支援排班管理、請假審核、公告發布等核心功能。

### 技術棧
- **框架**: FastAPI 0.104+
- **資料庫**: MySQL 8.0 (AWS RDS)
- **部署**: AWS ECS + Docker
- **認證**: JWT Token
- **ORM**: SQLAlchemy 2.0+

## 🚀 快速開始

### 1. 環境設定
```bash
# 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安裝依賴
pip install -r requirements.txt

# 設定環境變數
cp .env.example .env
# 編輯 .env 文件
```

### 2. 資料庫設定
```bash
# 創建資料庫
mysql -u root -p
CREATE DATABASE hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 執行遷移
alembic upgrade head
```

### 3. 啟動服務
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📁 專案結構

```
backend/
├── main.py              # FastAPI 應用入口
├── requirements.txt     # Python 依賴
├── Dockerfile          # Docker 配置
├── alembic/            # 資料庫遷移
├── app/
│   ├── models/         # SQLAlchemy 模型
│   ├── schemas/        # Pydantic 模型
│   ├── api/            # API 路由
│   ├── core/           # 核心配置
│   ├── services/       # 業務邏輯
│   └── utils/          # 工具函數
├── tests/              # 測試文件
└── docs/               # API 文件
```

## 🔑 核心功能實作

### 1. 認證系統
- JWT Token 認證
- RBAC 權限控制
- 雙重登入（系統/Agent）

### 2. 排班管理
- 班別模板 CRUD
- 排班指派與衝突檢測
- 跨日班別支援

### 3. 請假系統
- 假別類型管理
- 餘額計算與檢查
- 多級審核流程

### 4. 公告系統
- 範圍發布（全體/Brand/Team）
- 必讀追蹤
- 已讀統計

## 🗄️ 資料庫設計

### 核心表格
- `users` - 使用者資料
- `brands` - Brand 管理
- `workspaces` - 工作區
- `shift_templates` - 班別模板
- `schedule_assignments` - 排班指派
- `leave_types` - 假別類型
- `leave_requests` - 請假申請
- `notices` - 公告
- `notice_reads` - 已讀記錄

### 關鍵約束
- 排班時間不可重疊（同一使用者）
- 請假餘額不可超支
- 公告範圍權限控制

## 🔒 安全考量

### 認證授權
```python
# JWT Token 驗證
def verify_token(token: str) -> dict:
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload

# 權限檢查
def check_permission(user_role: str, required_permission: str) -> bool:
    role_permissions = {
        "Owner": ["*"],
        "Admin": ["system.*", "brand.*", "schedule.*"],
        "TeamLeader": ["schedule.read", "leave.approve"],
        "Agent": ["schedule.read", "leave.create"]
    }
    return has_permission(role_permissions[user_role], required_permission)
```

### 資料驗證
- Pydantic 模型驗證
- SQL 注入防護
- XSS 防護

## 🚀 部署流程

### 1. Docker 建置
```bash
docker build -t hrm-backend .
docker tag hrm-backend:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hrm-backend:latest
```

### 2. AWS ECS 部署
```bash
# 推送到 ECR
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hrm-backend:latest

# 更新 ECS 服務
aws ecs update-service --cluster hrm-cluster --service hrm-backend-service --force-new-deployment
```

### 3. GitHub Actions 自動部署
- 推送到 `main` 分支自動觸發
- 建置 Docker 映像
- 推送到 ECR
- 更新 ECS 服務

## 📊 監控與日誌

### CloudWatch 設定
- 應用日誌：`/ecs/hrm-backend`
- 錯誤告警：HTTP 5xx > 10/min
- 效能監控：CPU/Memory 使用率

### 健康檢查
```python
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow(),
        "database": await check_database_connection(),
        "version": "1.0.0"
    }
```

## 🧪 測試

### 單元測試
```bash
pytest tests/unit/
```

### 整合測試
```bash
pytest tests/integration/
```

### API 測試
```bash
pytest tests/api/
```

## 📚 API 文件

### Swagger UI
- 開發環境：http://localhost:8000/docs
- 生產環境：https://api.yourdomain.com/docs

### 核心端點
- `GET /health` - 健康檢查
- `POST /api/v1/auth/sign-in` - 登入
- `GET /api/v1/schedule-assignments` - 取得排班
- `POST /api/v1/leave-requests` - 申請請假
- `GET /api/v1/notices` - 取得公告

## 🔧 開發工具

### 程式碼品質
```bash
# 格式化
black .
isort .

# 檢查
flake8 .
mypy .
```

### 資料庫遷移
```bash
# 創建遷移
alembic revision --autogenerate -m "Add new table"

# 執行遷移
alembic upgrade head

# 回滾
alembic downgrade -1
```

## 📞 支援

### 常見問題
1. **資料庫連接失敗** - 檢查 RDS 安全群組設定
2. **JWT Token 過期** - 調整 `JWT_EXPIRE_HOURS` 設定
3. **CORS 錯誤** - 確認 `CORS_ORIGINS` 包含前端域名

### 聯絡方式
- 技術問題：開 GitHub Issue
- 緊急問題：聯絡 DevOps 團隊