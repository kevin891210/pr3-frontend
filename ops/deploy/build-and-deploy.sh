#!/bin/bash
# 本地建置並部署到 EC2

set -e

EC2_HOST=${1:-"your-ec2-ip"}
EC2_USER=${2:-"ubuntu"}
IMAGE_NAME="hrm-frontend:latest"

if [ "$EC2_HOST" = "your-ec2-ip" ]; then
    echo "使用方式: $0 <EC2_IP> [EC2_USER]"
    echo "範例: $0 54.123.45.67 ubuntu"
    exit 1
fi

echo "=== 建置並部署到 EC2: $EC2_HOST ==="

# 1. 本地建置 Docker 映像
echo "建置 Docker 映像..."
docker build -t $IMAGE_NAME .

# 2. 匯出映像
echo "匯出映像..."
docker save $IMAGE_NAME > hrm-frontend.tar

# 3. 上傳到 EC2
echo "上傳映像到 EC2..."
scp hrm-frontend.tar $EC2_USER@$EC2_HOST:~/
scp ops/deploy/ec2-setup.sh $EC2_USER@$EC2_HOST:~/

# 4. 在 EC2 上執行部署
echo "在 EC2 上執行部署..."
ssh $EC2_USER@$EC2_HOST << 'EOF'
# 執行設定腳本
chmod +x ~/ec2-setup.sh
~/ec2-setup.sh

# 載入映像
docker load < ~/hrm-frontend.tar

# 啟動服務
cd ~/hrm-frontend
docker compose down || true
docker compose up -d

# 檢查狀態
sleep 5
docker compose ps
curl -f http://localhost/health && echo "✅ 服務啟動成功"
EOF

# 5. 清理本地檔案
rm -f hrm-frontend.tar

echo ""
echo "🎉 部署完成！"
echo "訪問: http://$EC2_HOST/setup"