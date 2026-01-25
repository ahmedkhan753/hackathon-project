from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceList
from app.services import service_service

router = APIRouter(prefix="/services", tags=["services"])


@router.post("", response_model=ServiceResponse, status_code=201)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provider posts a new service listing."""
    import logging
    logging.getLogger(__name__).info(f"POST /services payload: {data.dict()}")
    svc = service_service.create(db, current_user.id, data)
    return svc


@router.get("", response_model=list[ServiceList])
def list_services(
    q: str | None = Query(None, description="Search in title, description, category"),
    category: str | None = Query(None, description="Filter by category"),
    provider_id: int | None = Query(None, description="Filter by provider user id"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List active services. Optional search and filters."""
    return service_service.list_services(db, q=q, category=category, provider_id=provider_id, skip=skip, limit=limit)


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Get a single service by id."""
    svc = service_service.get_by_id(db, service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update own service listing."""
    svc = service_service.update(db, service_id, current_user.id, data)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found or you are not the provider")
    return svc


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete own service listing."""
    ok = service_service.delete(db, service_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Service not found or you are not the provider")
    return None
