# EC2 部署指南

## 快速部署

### 1. 準備 EC2 實例
- **作業系統**: Ubuntu 22.04 LTS
- **實例類型**: t3.micro 或以上
- **安全群組**: 開放 80 (HTTP), 443 (HTTPS), 22 (SSH)

### 2. 自動部署
```bash
# 從本地建置並部署到 EC2
./ops/deploy/build-and-deploy.sh <EC2_IP> [EC2_USER]

# 範例
./ops/deploy/build-and-deploy.sh 54.123.45.67 ubuntu
```

### 3. 手動部署
```bash
# 1. 在 EC2 上執行設定
scp ops/deploy/ec2-setup.sh ubuntu@<EC2_IP>:~/
ssh ubuntu@<EC2_IP>
chmod +x ~/ec2-setup.sh
~/ec2-setup.sh

# 2. 建置並上傳映像
docker build -t hrm-frontend:latest .
docker save hrm-frontend:latest > hrm-frontend.tar
scp hrm-frontend.tar ubuntu@<EC2_IP>:~/

# 3. 在 EC2 上載入並啟動
ssh ubuntu@<EC2_IP>
docker load < ~/hrm-frontend.tar
cd ~/hrm-frontend
docker compose up -d
```

## 首次設定

1. 訪問 `http://<EC2_IP>/setup`
2. 填入後端 API 資訊
3. 測試連接並保存配置
4. 系統自動導向登入頁

## 配置管理

### 更新 API 端點
```bash
# 編輯配置文件
ssh ubuntu@<EC2_IP>
cd ~/hrm-frontend
vi config/app-config.json

# 重新整理頁面即可生效（無需重啟容器）
```

### 查看服務狀態
```bash
ssh ubuntu@<EC2_IP>
cd ~/hrm-frontend
docker compose ps
docker compose logs -f
```

### 重啟服務
```bash
ssh ubuntu@<EC2_IP>
cd ~/hrm-frontend
docker compose restart
```

## 故障排除

### 檢查健康狀態
```bash
curl http://<EC2_IP>/health
curl http://<EC2_IP>/__ops/health
```

### 查看日誌
```bash
docker compose logs frontend
docker exec hrm-frontend tail -f /var/log/nginx.out.log
docker exec hrm-frontend tail -f /var/log/ops-server.out.log
```

### 重置配置
```bash
# 重置為未初始化狀態
cd ~/hrm-frontend
cp config/app-config.json config/app-config.json.bak
echo '{"initialized": false}' > config/app-config.json
# 重新整理頁面會導向 /setup
```