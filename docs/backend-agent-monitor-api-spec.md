# Agent Monitor API 規格文件

## API 端點

### GET /api/v1/monitor/agent-monitor

獲取 Agent 監控數據，已按狀態分類。

#### 請求參數

| 參數名 | 類型 | 必填 | 說明 |
|--------|------|------|------|
| brand_id | string | 是 | Brand ID |
| workspace_id | string | 是 | Workspace ID |
| refresh_interval | integer | 是 | 刷新間隔（秒） |
| warning_time | integer | 是 | Warning 時間閾值（分鐘） |

#### 請求範例

```http
GET /api/v1/monitor/agent-monitor?brand_id=9317607e-6656-409f-89e1-bb50b64901ed&workspace_id=workspace_1&refresh_interval=60&warning_time=30
```

#### 回應格式

```json
{
  "success": true,
  "data": {
    "brand_id": "9317607e-6656-409f-89e1-bb50b64901ed",
    "workspace_id": "workspace_1",
    "brand_name": "New Test Brand",
    "workspace_name": "Workspace Name",
    "on_service": [
      {
        "id": "agent_1",
        "name": "Agent Alice",
        "email": "alice@example.com"
      }
    ],
    "on_line": [
      {
        "id": "agent_2", 
        "name": "Agent Bob",
        "email": "bob@example.com"
      }
    ],
    "warning": [
      {
        "id": "agent_3",
        "name": "Agent Charlie",
        "email": "charlie@example.com"
      }
    ],
    "offline": [
      {
        "id": "agent_4",
        "name": "Agent David",
        "email": "david@example.com"
      }
    ],
    "summary": {
      "on_service_count": 1,
      "on_line_count": 1,
      "warning_count": 1,
      "offline_count": 1
    }
  }
}
```

## 分類邏輯

### On Service
- Agent 在線且可用
- 最後活動時間在 warning_time 範圍內

### On Line  
- Agent 在線但不可用（忙碌狀態）

### Warning
- Agent 在線且可用
- 但最後活動時間超過 warning_time 閾值

### Offline
- Agent 離線或狀態為 Offline

## 實作建議

1. 根據 brand_id 和 workspace_id 調用外部 API
2. 使用 warning_time 參數計算 Warning 狀態
3. 按照上述邏輯分類 Agent
4. 返回分類後的結果

## 相關端點

### GET /api/v1/brands
獲取 Brand 列表

```json
[
  {
    "id": "9317607e-6656-409f-89e1-bb50b64901ed",
    "name": "New Test Brand",
    "api_url": "https://api.baji.cxgenie.app",
    "is_active": true,
    "created_at": "2025-09-13T10:44:10Z"
  }
]
```

### GET /api/v1/monitor/brands/{brandId}/workspaces
獲取指定 Brand 的 Workspace 列表

## 錯誤處理

- 外部 API 調用失敗時返回空數組
- 參數驗證失敗返回 400 錯誤
- Brand 或 Workspace 不存在返回 404 錯誤
- 網路連接失敗時前端應顯示適當錯誤訊息