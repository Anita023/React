from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import PQR, Usuario
from ..schemas import PQRCreate, PQREstadoUpdate, PQRRespuestaUpdate, pqr_a_out

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def _cargar_pqr_con_usuario(db: Session, id_pqr: int) -> Optional[PQR]:
    return (
        db.query(PQR)
        .options(joinedload(PQR.usuario).joinedload(Usuario.cliente))
        .filter(PQR.id == id_pqr)
        .first()
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_pqr(
    datos: PQRCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Cualquier usuario logueado (normalmente un cliente) puede registrar una PQR."""
    nueva = PQR(
        usuario_id=usuario_actual.id,
        tipo=datos.tipo,
        asunto=datos.asunto,
        descripcion=datos.descripcion,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    completa = _cargar_pqr_con_usuario(db, nueva.id)
    return pqr_a_out(completa)


@router.get("/mias")
def mis_pqr(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El cliente consulta sus propias PQR y su estado."""
    pqrs = (
        db.query(PQR)
        .options(joinedload(PQR.usuario).joinedload(Usuario.cliente))
        .filter(PQR.usuario_id == usuario_actual.id)
        .order_by(PQR.creado_en.desc())
        .all()
    )
    return {"pqr": [pqr_a_out(p) for p in pqrs]}


@router.get("")
def listar_pqr(
    estado: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Panel de gestión: admin/empleado ven todas las PQR, con filtros."""
    consulta = db.query(PQR).options(joinedload(PQR.usuario).joinedload(Usuario.cliente))

    if estado:
        consulta = consulta.filter(PQR.estado == estado)
    if tipo:
        consulta = consulta.filter(PQR.tipo == tipo)

    pqrs = consulta.order_by(PQR.creado_en.desc()).all()
    return {"pqr": [pqr_a_out(p) for p in pqrs]}


@router.get("/{id_pqr}")
def obtener_pqr(
    id_pqr: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    pqr = _cargar_pqr_con_usuario(db, id_pqr)
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    # Un cliente solo puede ver sus propias PQR; admin/empleado ven cualquiera.
    if usuario_actual.rol == "cliente" and pqr.usuario_id != usuario_actual.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta PQR")

    return pqr_a_out(pqr)


@router.patch("/{id_pqr}/estado")
def cambiar_estado_pqr(
    id_pqr: int,
    datos: PQREstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Cambia el estado sin necesariamente responder (ej: marcar 'en_proceso')."""
    pqr = db.query(PQR).filter(PQR.id == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    pqr.estado = datos.estado
    db.commit()
    db.refresh(pqr)

    completa = _cargar_pqr_con_usuario(db, pqr.id)
    return pqr_a_out(completa)


@router.patch("/{id_pqr}/responder")
def responder_pqr(
    id_pqr: int,
    datos: PQRRespuestaUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Registra la respuesta de un empleado/administrador y cambia el estado
    a 'respondida' (o 'cerrada' si así se indica)."""
    pqr = db.query(PQR).filter(PQR.id == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    pqr.respuesta = datos.respuesta
    pqr.estado = datos.estado
    pqr.respondido_por = usuario_actual.id

    db.commit()
    db.refresh(pqr)

    completa = _cargar_pqr_con_usuario(db, pqr.id)
    return pqr_a_out(completa)