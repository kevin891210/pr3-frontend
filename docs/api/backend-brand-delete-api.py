# 後端 Brand 刪除 API 實作範例

from fastapi import APIRouter, HTTPException, Depends
import sqlite3
from datetime import datetime

router = APIRouter(prefix="/api/v1/brands", tags=["brands"])

@router.delete("/{brand_id}")
async def delete_brand(brand_id: int):
    """刪除 Brand"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        # 檢查 Brand 是否存在
        cursor.execute("SELECT id, name FROM brands WHERE id = ?", (brand_id,))
        brand = cursor.fetchone()
        
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        # 檢查是否有關聯資源（可選：軟刪除或強制刪除）
        cursor.execute("SELECT COUNT(*) FROM brand_workspaces WHERE brand_id = ?", (brand_id,))
        workspace_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM brand_bots WHERE brand_id = ?", (brand_id,))
        bot_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM brand_agents WHERE brand_id = ?", (brand_id,))
        agent_count = cursor.fetchone()[0]
        
        # 如果有關聯資源，可以選擇：
        # 1. 拒絕刪除
        # 2. 級聯刪除
        # 3. 軟刪除（標記為已刪除）
        
        # 方案1：拒絕刪除（如果有關聯資源）
        if workspace_count > 0 or bot_count > 0 or agent_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete brand with associated resources: {workspace_count} workspaces, {bot_count} bots, {agent_count} agents"
            )
        
        # 方案2：級聯刪除（刪除所有關聯資源）
        # cursor.execute("DELETE FROM brand_workspaces WHERE brand_id = ?", (brand_id,))
        # cursor.execute("DELETE FROM brand_bots WHERE brand_id = ?", (brand_id,))
        # cursor.execute("DELETE FROM brand_agents WHERE brand_id = ?", (brand_id,))
        
        # 刪除 Brand
        cursor.execute("DELETE FROM brands WHERE id = ?", (brand_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        conn.commit()
        
        return {
            "message": "Brand deleted successfully",
            "brand_id": brand_id,
            "brand_name": brand[1]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 軟刪除版本（推薦用於生產環境）
@router.put("/{brand_id}/soft-delete")
async def soft_delete_brand(brand_id: int):
    """軟刪除 Brand（標記為已刪除，不實際刪除資料）"""
    try:
        conn = sqlite3.connect("hrm.db")
        cursor = conn.cursor()
        
        # 檢查 Brand 是否存在且未被刪除
        cursor.execute("SELECT id, name, deleted_at FROM brands WHERE id = ?", (brand_id,))
        brand = cursor.fetchone()
        
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        if brand[2]:  # deleted_at 不為空
            raise HTTPException(status_code=400, detail="Brand already deleted")
        
        # 軟刪除：設置 deleted_at 時間戳
        cursor.execute(
            "UPDATE brands SET deleted_at = ?, status = 'deleted' WHERE id = ?",
            (datetime.now(), brand_id)
        )
        
        conn.commit()
        
        return {
            "message": "Brand soft deleted successfully",
            "brand_id": brand_id,
            "brand_name": brand[1],
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()