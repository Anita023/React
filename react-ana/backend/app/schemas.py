import re
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# ---------------------------------------------------------------------------
# USUARIOS  (usuarios + clientes combinados de cara al frontend)
# ---------------------------------------------------------------------------
class UsuarioCreate(BaseModel):
    """Coincide con el formulario RegisterForm.jsx del frontend."""

    nombre: str = Field(min_length=2, max_length=60)
    apellido: str = Field(min_length=2, max_length=60)
    tipoDocumento: str
    numeroDocumento: str = Field(min_length=5, max_length=20)
    direccion: str = Field(min_length=3, max_length=150)
    telefono: str
    correo: EmailStr
    password: str = Field(min_length=8, max_length=72)
    confirmarPassword: Optional[str] = None

    @field_validator("tipoDocumento")
    @classmethod
    def validar_tipo_documento(cls, v: str) -> str:
        v = v.upper()
        if v not in ("CC", "TI", "CE", "PA"):
            raise ValueError("tipoDocumento debe ser uno de: CC, TI, CE, PA")
        return v

    @field_validator("numeroDocumento")
    @classmethod
    def validar_numero_documento(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("El número de documento solo debe contener dígitos")
        return v

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str) -> str:
        if not re.fullmatch(r"\d{7,15}", v):
            raise ValueError("El teléfono debe contener entre 7 y 15 dígitos")
        return v

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe tener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial")
        return v


class UsuarioUpdate(BaseModel):
    """PUT /usuarios/:id — admin puede incluir 'rol'; el propio usuario solo sus datos."""

    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    apellido: Optional[str] = Field(default=None, min_length=2, max_length=60)
    direccion: Optional[str] = Field(default=None, max_length=150)
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[str] = None

    @field_validator("rol")
    @classmethod
    def validar_rol(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("cliente", "empleado", "administrador"):
            raise ValueError("rol debe ser uno de: cliente, empleado, administrador")
        return v


class UsuarioEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ("activo", "inactivo"):
            raise ValueError("estado debe ser 'activo' o 'inactivo'")
        return v


class UsuarioOut(BaseModel):
    """Forma que espera el frontend: id, nombre, apellido, correo, rol (plano)."""

    id: int
    nombre: str
    apellido: Optional[str] = None
    correo: EmailStr
    rol: str
    estado: str
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    cliente_id: Optional[int] = None  # id de la tabla clientes (distinto del usuario_id)

    model_config = ConfigDict(from_attributes=True)


def usuario_a_out(usuario) -> UsuarioOut:
    cliente = usuario.cliente
    return UsuarioOut(
        id=usuario.id,
        nombre=cliente.nombre if cliente else usuario.nombre,
        apellido=cliente.apellido if cliente else None,
        correo=usuario.correo,
        rol=usuario.rol,
        estado=usuario.estado,
        tipo_documento=cliente.tipo_documento if cliente else None,
        numero_documento=cliente.numero_documento if cliente else None,
        direccion=cliente.direccion if cliente else None,
        telefono=cliente.telefono if cliente else None,
        fecha_registro=usuario.fecha_registro,
        cliente_id=cliente.id if cliente else None,
    )


# ---------------------------------------------------------------------------
# AUTENTICACIÓN
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    correo: EmailStr
    password: str
    recordar: Optional[bool] = False


class TokenResponse(BaseModel):
    token: str
    usuario: UsuarioOut


class SolicitarRecuperacionRequest(BaseModel):
    correo: EmailStr


class VerificarCodigoRequest(BaseModel):
    correo: EmailStr
    codigo: str = Field(min_length=6, max_length=6)


class CambiarPasswordRequest(BaseModel):
    correo: EmailStr
    codigo: Optional[str] = None
    token: Optional[str] = None  # alias legado, por si llega desde un enlace antiguo
    nuevaPassword: str = Field(min_length=8, max_length=72)

    @field_validator("nuevaPassword")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe tener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial")
        return v


# ---------------------------------------------------------------------------
# PRODUCTOS
# ---------------------------------------------------------------------------
class ProductoCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=40)
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=2, max_length=255)
    precio: Decimal = Field(gt=0)
    imagen_url: Optional[str] = None


class ProductoUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=2, max_length=40)
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=255)
    precio: Optional[Decimal] = Field(default=None, gt=0)
    imagen_url: Optional[str] = None
    disponible: Optional[bool] = None


class ProductoOut(BaseModel):
    id: int
    slug: str
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    imagen_url: Optional[str] = None
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


def producto_a_out(p) -> ProductoOut:
    return ProductoOut(
        id=p.id,
        slug=p.slug,
        nombre=p.nombre,
        descripcion=p.descripcion,
        precio=p.precio,
        imagen_url=p.imagen_url,
        disponible=bool(p.disponible),
    )


# ---------------------------------------------------------------------------
# SERVICIOS
# ---------------------------------------------------------------------------
class ServicioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=2, max_length=255)
    precio: Decimal = Field(ge=0)


class ServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=255)
    precio: Optional[Decimal] = Field(default=None, ge=0)
    disponible: Optional[bool] = None


class ServicioOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


def servicio_a_out(s) -> ServicioOut:
    return ServicioOut(
        id=s.id,
        nombre=s.nombre,
        descripcion=s.descripcion,
        precio=s.precio,
        disponible=bool(s.disponible),
    )


# ---------------------------------------------------------------------------
# CARRITO
# ---------------------------------------------------------------------------
class CarritoAgregarRequest(BaseModel):
    productoId: Optional[int] = None
    servicioId: Optional[int] = None
    cantidad: int = Field(default=1, ge=1)

    @field_validator("servicioId")
    @classmethod
    def validar_uno_solo(cls, v, info):
        producto_id = info.data.get("productoId")
        if bool(v) == bool(producto_id):
            raise ValueError("Debes enviar productoId o servicioId (uno solo, no ambos)")
        return v


class CarritoCantidadRequest(BaseModel):
    cantidad: int = Field(ge=1)


class CarritoItemOut(BaseModel):
    item_id: int
    id_producto: Optional[int] = None
    id_servicio: Optional[int] = None
    tipo: str  # "producto" o "servicio"
    nombre: str
    precio: Decimal
    cantidad: int


class CarritoOut(BaseModel):
    items: list[CarritoItemOut]
    total: Decimal


# ---------------------------------------------------------------------------
# PEDIDOS
# ---------------------------------------------------------------------------
class PedidoCrear(BaseModel):
    metodo_pago: str = "efectivo"

    @field_validator("metodo_pago")
    @classmethod
    def validar_metodo_pago(cls, v: str) -> str:
        permitidos = {"efectivo", "tarjeta", "transferencia"}
        if v not in permitidos:
            raise ValueError(f"metodo_pago debe ser uno de: {', '.join(permitidos)}")
        return v


class PedidoEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        permitidos = {"pendiente", "en_proceso", "entregado", "cancelado"}
        if v not in permitidos:
            raise ValueError(f"estado debe ser uno de: {', '.join(permitidos)}")
        return v


class DetallePedidoOut(BaseModel):
    nombre: str
    precio: Decimal
    cantidad: int


class PedidoOut(BaseModel):
    id: int
    total: Decimal
    estado: str
    metodo_pago: str
    creado_en: Optional[datetime] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[str] = None
    detalles: Optional[list[DetallePedidoOut]] = None


# ---------------------------------------------------------------------------
# VENTAS
# ---------------------------------------------------------------------------
class VentaItemCreate(BaseModel):
    """Un item de la venta: debe traer producto_id O servicio_id, nunca ambos ni ninguno."""

    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    cantidad: int = Field(gt=0, default=1)

    @field_validator("servicio_id")
    @classmethod
    def validar_uno_solo(cls, v, info):
        producto_id = info.data.get("producto_id")
        if bool(v) == bool(producto_id):
            raise ValueError("Cada item debe tener producto_id o servicio_id (uno solo, no ambos)")
        return v


class VentaCreate(BaseModel):
    cliente_id: int
    pedido_id: Optional[int] = None
    descuento: Decimal = Field(default=Decimal("0"), ge=0)
    impuestos: Decimal = Field(default=Decimal("0"), ge=0)
    items: list[VentaItemCreate] = Field(min_length=1)


class VentaEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        permitidos = {"pendiente", "completada", "anulada"}
        if v not in permitidos:
            raise ValueError(f"estado debe ser uno de: {', '.join(permitidos)}")
        return v


class DetalleVentaOut(BaseModel):
    id: int
    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    nombre_item: str
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class VentaOut(BaseModel):
    id: int
    cliente_id: int
    usuario_id: Optional[int] = None
    pedido_id: Optional[int] = None
    subtotal: Decimal
    descuento: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    creado_en: Optional[datetime] = None
    cliente_nombre: Optional[str] = None
    detalles: Optional[list[DetalleVentaOut]] = None

    model_config = ConfigDict(from_attributes=True)


def venta_a_out(v) -> VentaOut:
    cliente_nombre = None
    if v.cliente:
        cliente_nombre = f"{v.cliente.nombre} {v.cliente.apellido}"

    return VentaOut(
        id=v.id,
        cliente_id=v.cliente_id,
        usuario_id=v.usuario_id,
        pedido_id=v.pedido_id,
        subtotal=v.subtotal,
        descuento=v.descuento,
        impuestos=v.impuestos,
        total=v.total,
        estado=v.estado,
        creado_en=v.creado_en,
        cliente_nombre=cliente_nombre,
        detalles=[DetalleVentaOut.model_validate(d) for d in v.detalles] if v.detalles else None,
    )


# ---------------------------------------------------------------------------
# FACTURACIÓN (Quinto Avance)
# ---------------------------------------------------------------------------
class DetalleFacturaOut(BaseModel):
    id: int
    nombre_item: str
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class FacturaOut(BaseModel):
    id: int
    venta_id: int
    numero_factura: str
    subtotal: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    creado_en: Optional[datetime] = None
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    detalles: Optional[list[DetalleFacturaOut]] = None

    model_config = ConfigDict(from_attributes=True)


def factura_a_out(f) -> FacturaOut:
    cliente_nombre = None
    cliente_documento = None
    if f.venta and f.venta.cliente:
        cliente_nombre = f"{f.venta.cliente.nombre} {f.venta.cliente.apellido}"
        cliente_documento = f.venta.cliente.numero_documento

    return FacturaOut(
        id=f.id,
        venta_id=f.venta_id,
        numero_factura=f.numero_factura,
        subtotal=f.subtotal,
        impuestos=f.impuestos,
        total=f.total,
        estado=f.estado,
        creado_en=f.creado_en,
        cliente_nombre=cliente_nombre,
        cliente_documento=cliente_documento,
        detalles=[DetalleFacturaOut.model_validate(d) for d in f.detalles] if f.detalles else None,
    )


# ---------------------------------------------------------------------------
# PQR (Quinto Avance)
# ---------------------------------------------------------------------------
class PQRCreate(BaseModel):
    tipo: str
    asunto: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=5)

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        permitidos = {"peticion", "queja", "reclamo", "sugerencia"}
        if v not in permitidos:
            raise ValueError(f"tipo debe ser uno de: {', '.join(permitidos)}")
        return v


class PQREstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        permitidos = {"pendiente", "en_proceso", "respondida", "cerrada"}
        if v not in permitidos:
            raise ValueError(f"estado debe ser uno de: {', '.join(permitidos)}")
        return v


class PQRRespuestaUpdate(BaseModel):
    respuesta: str = Field(min_length=3)
    estado: str = "respondida"

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        permitidos = {"respondida", "cerrada"}
        if v not in permitidos:
            raise ValueError(f"Al responder, estado debe ser uno de: {', '.join(permitidos)}")
        return v


class PQROut(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    respondido_por: Optional[int] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    usuario_nombre: Optional[str] = None
    usuario_correo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


def pqr_a_out(p) -> PQROut:
    nombre = None
    correo = None
    if p.usuario:
        cliente = p.usuario.cliente
        nombre = f"{cliente.nombre} {cliente.apellido}" if cliente else p.usuario.nombre
        correo = p.usuario.correo

    return PQROut(
        id=p.id,
        usuario_id=p.usuario_id,
        tipo=p.tipo,
        asunto=p.asunto,
        descripcion=p.descripcion,
        estado=p.estado,
        respuesta=p.respuesta,
        respondido_por=p.respondido_por,
        creado_en=p.creado_en,
        actualizado_en=p.actualizado_en,
        usuario_nombre=nombre,
        usuario_correo=correo,
    )


# ---------------------------------------------------------------------------
# CHATBOT / IA
# ---------------------------------------------------------------------------
class ChatMensajeCreate(BaseModel):
    mensaje: str = Field(min_length=1, max_length=2000)
    conversacion_id: Optional[int] = None