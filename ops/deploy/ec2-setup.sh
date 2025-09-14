#!/bin/bash
# EC2 Ubuntu 22.04 部署腳本

set -e

echo "=== HRM Frontend EC2 部署腳本 ==="

# 更新系統
sudo apt-get update

# 安裝 Docker
if ! command -v docker &> /dev/null; then
    echo "安裝 Docker..."
    sudo apt-get install -y docker.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker 安裝完成，請重新登入以生效群組權限"
fi

# 創建應用目錄
APP_DIR="$HOME/hrm-frontend"
mkdir -p $APP_DIR/config

echo "應用目錄: $APP_DIR"

# 創建初始配置文件
cat > $APP_DIR/config/app-config.json << 'EOF'
{
  "initialized": false,
  "api": {
    "baseUrl": "",
    "authPath": "/api/v1/auth/sign-in",
    "workspacesPath": "/api/v1/users/workspaces",
    "botsPath": "/api/v1/bots/all-bots",
    "membersPath": "/api/v1/workspaces/:id/members"
  },
  "hrm": { "enabled": true },
  "security": { "enforceHttps": false },
  "envName": "EC2",
  "buildVersion": "0.1.0"
}
EOF

# 創建 docker-compose.yml
cat > $APP_DIR/docker-compose.yml << 'EOF'
version: "3.9"
services:
  frontend:
    image: hrm-frontend:latest
    container_name: hrm-frontend
    ports:
      - "80:80"
    volumes:
      - ./config/app-config.json:/usr/share/nginx/html/config/app-config.json:rw
      - hrm-logs:/var/log
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/health"]
      interval: 30s
      timeout: 2s
      retries: 3

volumes:
  hrm-logs:
EOF

echo "配置文件已創建"
echo ""
echo "下一步："
echo "1. 上傳 Docker 映像: docker load < hrm-frontend.tar"
echo "2. 啟動服務: cd $APP_DIR && docker compose up -d"
echo "3. 訪問 http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/setup"
echo ""
echo "部署腳本執行完成！"