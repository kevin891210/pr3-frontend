-- Brand 刪除相關資料庫結構

-- 修改 brands 表，添加軟刪除支援
ALTER TABLE brands ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE brands ADD COLUMN deleted_by INTEGER NULL;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands(deleted_at);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);

-- 更新查詢視圖，排除已刪除的 Brand
CREATE VIEW active_brands AS
SELECT * FROM brands 
WHERE deleted_at IS NULL AND status != 'deleted';

-- 關聯資源表（如果需要級聯刪除）
-- 這些表應該有 brand_id 外鍵約束

-- 範例：Workspace 關聯表
CREATE TABLE IF NOT EXISTS brand_workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    workspace_id VARCHAR(100) NOT NULL,
    workspace_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 範例：Bot 關聯表
CREATE TABLE IF NOT EXISTS brand_bots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    bot_id VARCHAR(100) NOT NULL,
    bot_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 範例：Agent 關聯表
CREATE TABLE IF NOT EXISTS brand_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- 刪除記錄表（用於審計）
CREATE TABLE IF NOT EXISTS brand_deletion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    brand_name VARCHAR(255),
    deletion_type VARCHAR(20) NOT NULL, -- 'soft' 或 'hard'
    deleted_by INTEGER,
    deletion_reason TEXT,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    associated_resources JSON -- 記錄刪除時的關聯資源數量
);

-- 觸發器：記錄刪除操作
CREATE TRIGGER IF NOT EXISTS log_brand_deletion
AFTER UPDATE OF deleted_at ON brands
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
    INSERT INTO brand_deletion_log (
        brand_id, brand_name, deletion_type, deleted_at, associated_resources
    ) VALUES (
        NEW.id, 
        NEW.name, 
        'soft', 
        NEW.deleted_at,
        json_object(
            'workspaces', (SELECT COUNT(*) FROM brand_workspaces WHERE brand_id = NEW.id),
            'bots', (SELECT COUNT(*) FROM brand_bots WHERE brand_id = NEW.id),
            'agents', (SELECT COUNT(*) FROM brand_agents WHERE brand_id = NEW.id)
        )
    );
END;