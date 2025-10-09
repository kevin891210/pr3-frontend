# 後端部署指南 (AWS ECS + Docker)

## 架構概覽
```
[ALB] → [ECS Service] → [ECS Tasks] → [RDS MySQL]
                     ↓
              [CloudWatch Logs]
```

## 1. Docker 配置

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式
COPY . .

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
alembic==1.13.0
pymysql==1.1.0
cryptography==41.0.8
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
boto3==1.34.0
redis==5.0.1
celery==5.3.4
```

## 2. AWS RDS 設定

### RDS 實例配置
```yaml
Engine: MySQL 8.0
Instance Class: db.t3.micro (開發) / db.r5.large (生產)
Storage: 20GB SSD (開發) / 100GB SSD (生產)
Multi-AZ: Yes (生產環境)
Backup Retention: 7 days
```

### 安全群組
```yaml
Inbound Rules:
  - Type: MySQL/Aurora
    Port: 3306
    Source: ECS Security Group
```

## 3. ECS 配置

### Task Definition (JSON)
```json
{
  "family": "hrm-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "hrm-backend",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/hrm-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "APP_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/hrm/database-url"
        },
        {
          "name": "JWT_SECRET_KEY",
          "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/hrm/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hrm-backend",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Service 配置
```yaml
Service Name: hrm-backend-service
Launch Type: FARGATE
Platform Version: LATEST
Desired Count: 2
Subnets: Private Subnets
Security Groups: ECS Security Group
Load Balancer: Application Load Balancer
Target Group: hrm-backend-tg
Health Check Path: /health
```

## 4. ALB 配置

### Target Group
```yaml
Name: hrm-backend-tg
Protocol: HTTP
Port: 8000
Health Check:
  Path: /health
  Interval: 30s
  Timeout: 5s
  Healthy Threshold: 2
  Unhealthy Threshold: 5
```

### Listener Rules
```yaml
Port 80:
  - Redirect to HTTPS (443)

Port 443:
  - Path: /api/* → hrm-backend-tg
  - Path: /health → hrm-backend-tg
  - Default: Return 404
```

## 5. 環境變數管理 (AWS Systems Manager)

### Parameter Store
```bash
# 資料庫連接
aws ssm put-parameter \
  --name "/hrm/database-url" \
  --value "mysql://admin:password@rds-endpoint:3306/hrm_db" \
  --type "SecureString"

# JWT 密鑰
aws ssm put-parameter \
  --name "/hrm/jwt-secret" \
  --value "your-super-secret-key" \
  --type "SecureString"

# AWS 設定
aws ssm put-parameter \
  --name "/hrm/aws-region" \
  --value "ap-northeast-1" \
  --type "String"
```

## 6. 監控與日誌

### CloudWatch 設定
```yaml
Log Groups:
  - /ecs/hrm-backend
  - /aws/rds/instance/hrm-db/error
  - /aws/rds/instance/hrm-db/slowquery

Alarms:
  - CPU Utilization > 80%
  - Memory Utilization > 80%
  - HTTP 5xx Errors > 10/min
  - Database Connections > 80%
```

## 7. 部署腳本

### deploy.sh
```bash
#!/bin/bash
set -e

# 變數設定
AWS_REGION="ap-northeast-1"
ECR_REPO="123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/hrm-backend"
ECS_CLUSTER="hrm-cluster"
ECS_SERVICE="hrm-backend-service"

# 建置並推送映像
echo "Building Docker image..."
docker build -t hrm-backend .

echo "Tagging image..."
docker tag hrm-backend:latest $ECR_REPO:latest
docker tag hrm-backend:latest $ECR_REPO:$GITHUB_SHA

echo "Pushing to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
docker push $ECR_REPO:latest
docker push $ECR_REPO:$GITHUB_SHA

echo "Updating ECS service..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment completed!"
```