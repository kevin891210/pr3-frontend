# HRM Frontend Deployment Guide

## 部署環境準備

### 系統需求
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 10GB+ 磁碟空間

## 快速部署

### 1. 本地開發環境
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

### 2. Docker 本地測試
```bash
# 建置並啟動
docker compose up -d

# 檢查狀態
docker compose ps
curl http://localhost/health
```

### 3. EC2 部署
```bash
# 一鍵部署到 EC2
./ops/deploy/build-and-deploy.sh <EC2_IP> ubuntu

# 手動部署
scp -r . ubuntu@<EC2_IP>:~/hrm-frontend/
ssh ubuntu@<EC2_IP>
cd ~/hrm-frontend
docker compose up -d
```

### 4. 生產環境部署
```bash
# 設定環境變數
export REGISTRY=your-registry.com
export VERSION=v1.0.0

# 執行生產部署
./ops/deploy/production-deploy.sh

# 使用生產配置啟動
docker-compose -f docker-compose.prod.yml up -d
```

## 配置管理

### Runtime Config
系統使用 Runtime Config 機制，支援免重建容器即可更新配置：

```json
{
  "initialized": false,
  "api": {
    "baseUrl": "https://api.your-domain.com",
    "authPath": "/api/v1/auth/sign-in",
    "workspacesPath": "/api/v1/users/workspaces",
    "botsPath": "/api/v1/bots/all-bots",
    "membersPath": "/api/v1/workspaces/:id/members"
  },
  "hrm": { "enabled": true },
  "security": { "enforceHttps": true },
  "envName": "PRODUCTION",
  "buildVersion": "0.1.0"
}
```

### 首次設定流程
1. 訪問 `http://your-domain/setup`
2. 填入後端 API URL
3. 測試連接並保存配置
4. 系統自動導向登入頁面

## 監控與維護

### 健康檢查
```bash
# 檢查服務狀態
curl http://localhost/health

# 檢查容器狀態
docker compose ps
docker compose logs -f
```

### 日誌管理
```bash
# 查看應用日誌
docker compose logs frontend

# 查看 Nginx 日誌
docker exec hrm-frontend tail -f /var/log/nginx/access.log
```

### 備份與恢復
```bash
# 備份配置
cp /path/to/app-config.json ./backup/

# 恢復配置
cp ./backup/app-config.json /path/to/app-config.json
docker compose restart
```

## 故障排除

### 常見問題

1. **配置未載入**
   - 檢查 `/config/app-config.json` 是否存在
   - 確認 JSON 格式正確

2. **API 連接失敗**
   - 檢查 `baseUrl` 配置
   - 確認網路連通性
   - 檢查 CORS 設定

3. **容器啟動失敗**
   - 檢查端口是否被佔用
   - 確認 Docker 資源充足
   - 查看容器日誌

### 效能調優

1. **資源限制**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **快取策略**
   - 啟用 Nginx gzip 壓縮
   - 設定靜態資源快取
   - 使用 CDN 加速

## 安全考量

### HTTPS 配置
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
    }
}
```

### 環境變數
- 避免在映像中包含敏感資訊
- 使用 Docker secrets 管理密鑰
- 定期更新依賴套件

## 版本管理

### 標籤策略
- `latest`: 最新穩定版本
- `v1.0.0`: 語義化版本標籤
- `dev`: 開發版本

### 回滾流程
```bash
# 回滾到上一版本
docker tag hrm-frontend:v1.0.0 hrm-frontend:latest
docker-compose up -d

# 或使用特定版本
docker-compose -f docker-compose.prod.yml up -d
```