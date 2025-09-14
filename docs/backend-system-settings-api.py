# 後端系統設定 API 實作範例

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import sqlite3
from datetime import datetime

router = APIRouter(prefix="/api/v1/system", tags=["system"])

class SystemSettings(BaseModel):
    siteName: str = "HRM 管理系統"
    defaultLanguage: str = "zh-TW"
    timezone: str = "Asia/Taipei"
    debugMode: bool = False
    maxLoginAttempts: int = 5
    sessionTimeout: int = 24
    emailNotifications: bool = True
    maintenanceMode: bool = False

class SystemStats(BaseModel):
    totalUsers: int
    activeUsers: int
    systemUptime: str
    lastBackup: str
    diskUsage: str
    memoryUsage: str

@router.get("/settings", response_model=SystemSettings)
async def get_system_settings():
    """獲取系統設定"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM system_settings ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            return SystemSettings(
                siteName=row[1],
                defaultLanguage=row[2],
                timezone=row[3],
                debugMode=bool(row[4]),
                maxLoginAttempts=row[5],
                sessionTimeout=row[6],
                emailNotifications=bool(row[7]),
                maintenanceMode=bool(row[8])
            )
        else:
            # 返回預設設定
            return SystemSettings()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/settings", response_model=SystemSettings)
async def update_system_settings(settings: SystemSettings):
    """更新系統設定"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        # 檢查是否已有設定記錄
        cursor.execute("SELECT COUNT(*) FROM system_settings")
        count = cursor.fetchone()[0]
        
        if count > 0:
            # 更新現有記錄
            cursor.execute("""
                UPDATE system_settings SET
                    site_name = ?,
                    default_language = ?,
                    timezone = ?,
                    debug_mode = ?,
                    max_login_attempts = ?,
                    session_timeout = ?,
                    email_notifications = ?,
                    maintenance_mode = ?,
                    updated_at = ?
                WHERE id = (SELECT MAX(id) FROM system_settings)
            """, (
                settings.siteName,
                settings.defaultLanguage,
                settings.timezone,
                settings.debugMode,
                settings.maxLoginAttempts,
                settings.sessionTimeout,
                settings.emailNotifications,
                settings.maintenanceMode,
                datetime.now()
            ))
        else:
            # 插入新記錄
            cursor.execute("""
                INSERT INTO system_settings (
                    site_name, default_language, timezone, debug_mode,
                    max_login_attempts, session_timeout, email_notifications,
                    maintenance_mode, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                settings.siteName,
                settings.defaultLanguage,
                settings.timezone,
                settings.debugMode,
                settings.maxLoginAttempts,
                settings.sessionTimeout,
                settings.emailNotifications,
                settings.maintenanceMode,
                datetime.now(),
                datetime.now()
            ))
        
        conn.commit()
        return settings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/stats", response_model=SystemStats)
async def get_system_stats():
    """獲取系統統計"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        # 獲取使用者統計
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE last_login > datetime('now', '-24 hours')")
        active_users = cursor.fetchone()[0]
        
        # 獲取最後備份時間
        cursor.execute("SELECT created_at FROM system_backups ORDER BY created_at DESC LIMIT 1")
        backup_row = cursor.fetchone()
        last_backup = backup_row[0] if backup_row else "未知"
        
        return SystemStats(
            totalUsers=total_users,
            activeUsers=active_users,
            systemUptime="15 天 8 小時",  # 實際應該計算系統啟動時間
            lastBackup=last_backup,
            diskUsage="45%",  # 實際應該檢查磁碟使用率
            memoryUsage="68%"  # 實際應該檢查記憶體使用率
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/backup")
async def create_backup():
    """建立系統備份"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        # 記錄備份
        cursor.execute("""
            INSERT INTO system_backups (backup_path, created_at)
            VALUES (?, ?)
        """, (f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db", datetime.now()))
        
        conn.commit()
        
        # 實際備份邏輯應該在這裡實作
        # 例如：複製資料庫檔案、壓縮等
        
        return {"message": "備份建立成功", "backup_id": cursor.lastrowid}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()