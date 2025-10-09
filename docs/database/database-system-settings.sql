-- 系統設定相關資料表

-- 系統設定表
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name VARCHAR(255) DEFAULT 'HRM 管理系統',
    default_language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    debug_mode BOOLEAN DEFAULT FALSE,
    max_login_attempts INTEGER DEFAULT 5,
    session_timeout INTEGER DEFAULT 24,
    email_notifications BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系統備份記錄表
CREATE TABLE IF NOT EXISTS system_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_path VARCHAR(500) NOT NULL,
    backup_size INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設系統設定
INSERT OR IGNORE INTO system_settings (id, site_name, default_language, timezone, debug_mode) 
VALUES (1, 'HRM 管理系統', 'zh-TW', 'Asia/Taipei', FALSE);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at);