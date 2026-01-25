from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.core.location_engine import get_h3_index
from app.core.search_engine import search_engine


def create(db: Session, provider_id: int, data: ServiceCreate) -> Service:
    # Generate H3 index if location provided
    h3_index = None
    if data.latitude is not None and data.longitude is not None:
        h3_index = get_h3_index(data.latitude, data.longitude)
    
    # Generate semantic embedding
    search_text = f"{data.title} {data.description or ''}"
    embedding = search_engine.generate_embedding(search_text)
    
    svc = Service(
        provider_id=provider_id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        category=data.category.strip() if data.category else None,
        latitude=data.latitude,
        longitude=data.longitude,
        h3_index=h3_index,
        embedding=embedding,
        status="active",
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


def list_services(
    db: Session,
    *,
    q: str | None = None,
    category: str | None = None,
    provider_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Service]:
    qry = db.query(Service).filter(Service.status == "active")
    if q:
        term = f"%{q.strip()}%"
        qry = qry.filter(
            or_(
                Service.title.ilike(term),
                (Service.description.isnot(None)) & (Service.description.ilike(term)),
                (Service.category.isnot(None)) & (Service.category.ilike(term)),
            )
        )
    if category:
        qry = qry.filter(Service.category.ilike(category.strip()))
    if provider_id is not None:
        qry = qry.filter(Service.provider_id == provider_id)
    qry = qry.order_by(Service.created_at.desc())
    return qry.offset(skip).limit(limit).all()


def get_by_id(db: Session, service_id: int) -> Service | None:
    return db.query(Service).filter(Service.id == service_id).first()


def update(db: Session, service_id: int, user_id: int, data: ServiceUpdate) -> Service | None:
    svc = get_by_id(db, service_id)
    if not svc or svc.provider_id != user_id:
        return None
    
    content_changed = False
    
    if data.title is not None:
        svc.title = data.title.strip()
        content_changed = True
    if data.description is not None:
        svc.description = data.description.strip() if data.description else None
        content_changed = True
    if data.category is not None:
        svc.category = data.category.strip() if data.category else None
    if data.status is not None:
        svc.status = data.status
    
    # Regenerate embedding if content changed
    if content_changed:
        search_text = f"{svc.title} {svc.description or ''}"
        svc.embedding = search_engine.generate_embedding(search_text)
    
    db.commit()
    db.refresh(svc)
    return svc


def delete(db: Session, service_id: int, user_id: int) -> bool:
    svc = get_by_id(db, service_id)
    if not svc or svc.provider_id != user_id:
        return False
    db.delete(svc)
    db.commit()
    return True
