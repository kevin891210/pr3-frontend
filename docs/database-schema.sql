-- HRM 系統資料庫結構 (MySQL 8.0)

-- 使用者表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Owner', 'Admin', 'TeamLeader', 'Agent', 'Auditor') NOT NULL,
    default_timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    team_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_team (team_id)
);

-- Brand 表
CREATE TABLE brands (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    api_url VARCHAR(500),
    token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- 工作區表
CREATE TABLE workspaces (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workspace_token VARCHAR(255),
    owner_id VARCHAR(36) NOT NULL,
    brand_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    INDEX idx_owner (owner_id),
    INDEX idx_brand (brand_id)
);

-- 班別模板表
CREATE TABLE shift_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_cross_day BOOLEAN DEFAULT FALSE,
    breaks JSON,
    min_staff INT DEFAULT 1,
    max_staff INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- 排班指派表
CREATE TABLE schedule_assignments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    shift_template_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_user_time (user_id, start_at, end_at),
    INDEX idx_user_date (user_id, date),
    INDEX idx_date_range (date, start_at, end_at)
);

-- 假別類型表
CREATE TABLE leave_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    quota INT NOT NULL DEFAULT 0,
    allow_half_day BOOLEAN DEFAULT TRUE,
    require_attachment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
);

-- 請假申請表
CREATE TABLE leave_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    applicant_id VARCHAR(36) NOT NULL,
    type_id VARCHAR(36) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    days DECIMAL(3,1) NOT NULL,
    reason TEXT,
    attachment_urls JSON,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    reject_reason TEXT,
    approver_chain JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (type_id) REFERENCES leave_types(id),
    INDEX idx_applicant (applicant_id),
    INDEX idx_status (status),
    INDEX idx_date_range (start_at, end_at)
);

-- 公告表
CREATE TABLE notices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    scope JSON NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    require_ack BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_created_by (created_by),
    INDEX idx_date_range (starts_at, ends_at),
    INDEX idx_require_ack (require_ack)
);

-- 公告已讀記錄表
CREATE TABLE notice_reads (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    notice_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_notice_user (notice_id, user_id),
    INDEX idx_notice (notice_id),
    INDEX idx_user (user_id)
);

-- Bot 表
CREATE TABLE bots (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    workspace_id VARCHAR(36),
    config JSON,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
);

-- 系統設定表
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value JSON,
    description TEXT,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    INDEX idx_key (key_name)
);

-- 審計日誌表
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
);

-- 初始化資料
INSERT INTO leave_types (code, name, quota, allow_half_day, require_attachment) VALUES
('ANNUAL', '年假', 14, TRUE, FALSE),
('SICK', '病假', 30, TRUE, TRUE),
('PERSONAL', '事假', 14, TRUE, FALSE),
('MATERNITY', '產假', 56, FALSE, TRUE),
('PATERNITY', '陪產假', 5, FALSE, FALSE);

INSERT INTO system_settings (key_name, value, description) VALUES
('site_name', '"HRM 管理系統"', '網站名稱'),
('default_language', '"zh-TW"', '預設語言'),
('timezone', '"Asia/Taipei"', '系統時區'),
('debug_mode', 'false', '除錯模式');

-- 創建預設管理者（密碼需要在應用層加密）
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@example.com', '$2b$12$placeholder_hash', 'Owner');