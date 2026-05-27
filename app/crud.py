from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import ClothingItem
from app.schemas import ClothingItemCreate, ClothingItemUpdate

def get_item(db: Session, item_id: int) -> Optional[ClothingItem]:
    return db.query(ClothingItem).filter(ClothingItem.id == item_id).first()

def get_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None, 
    status: Optional[str] = None
) -> List[ClothingItem]:
    query = db.query(ClothingItem)
    if category:
        query = query.filter(ClothingItem.category == category)
    if status:
        query = query.filter(ClothingItem.status == status)
    return query.order_by(ClothingItem.created_at.desc()).offset(skip).limit(limit).all()

def create_item(db: Session, item: ClothingItemCreate) -> ClothingItem:
    db_item = ClothingItem(
        name=item.name,
        category=item.category,
        status=item.status,
        color=item.color,
        image_base64=item.image_base64
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, item: ClothingItemUpdate) -> Optional[ClothingItem]:
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item_status(db: Session, item_id: int, status: str) -> Optional[ClothingItem]:
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    db_item.status = status
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int) -> bool:
    db_item = get_item(db, item_id)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True
