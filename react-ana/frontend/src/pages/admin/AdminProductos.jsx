import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import {
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../../lib/api";

const FORMULARIO_VACIO = {
  slug: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen_url: "",
};

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  { value: "disponible", etiqueta: "Disponibles" },
  { value: "no_disponible", etiqueta: "No disponibles" },
];

export default function AdminProductos({
  esAdmin = true,
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token } = useAuth();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const [tocados, setTocados] = useState({});
  const [previewImagen, setPreviewImagen] = useState("");

  function validarCampo(nombre, valor) {
    switch (nombre) {
      case "slug":
        if (!valor.trim()) return "El slug es obligatorio";
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(valor.trim()))
          return "Solo minúsculas, números y guiones (ej: chocolate-oscuro)";
        return "";
      case "nombre":
        if (!valor.trim()) return "El nombre es obligatorio";
        if (valor.trim().length < 2) return "Muy corto";
        return "";
      case "precio":
        if (valor === "" || valor === null) return "El precio es obligatorio";
        if (Number.isNaN(Number(valor)) || Number(valor) <= 0)
          return "Debe ser un número mayor a 0";
        return "";
      case "descripcion":
        if (!valor.trim()) return "La descripción es obligatoria";
        if (valor.trim().length < 5) return "Escribe una descripción un poco más larga";
        return "";
      case "imagen_url":
        if (
          valor.trim() &&
          !/^https?:\/\/.+/i.test(valor.trim()) &&
          !/^data:image\/.+;base64,/.test(valor.trim())
        )
          return "Selecciona una imagen válida";
        return "";
      default:
        return "";
    }
  }

  function validarTodo(datos) {
    const nuevos = {};
    Object.keys(FORMULARIO_VACIO).forEach((campo) => {
      const mensajeError = validarCampo(campo, datos[campo] ?? "");
      if (mensajeError) nuevos[campo] = mensajeError;
    });
    return nuevos;
  }

  const formularioValido = Object.keys(erroresCampos).length === 0;

  async function cargarProductos() {
    setCargando(true);
    try {
      const datos = await obtenerProductosAdmin(token);
      setProductos(datos.productos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setTocados({});
    setMostrarFormulario(true);
  }

  useEffect(() => {
    if (esAdmin && abrirCrearInicial) {
      abrirCrear();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideTexto =
        !texto || producto.nombre.toLowerCase().includes(texto);
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "disponible" && producto.disponible) ||
        (filtroEstado === "no_disponible" && !producto.disponible);
      return coincideTexto && coincideEstado;
    });
  }, [productos, busqueda, filtroEstado]);

  function manejarCambio(e) {
    const { name, value } = e.target;
    const nuevoFormulario = { ...formulario, [name]: value };
    setFormulario(nuevoFormulario);
    setTocados((prev) => ({ ...prev, [name]: true }));
    setErroresCampos((prev) => {
      const siguiente = { ...prev };
      const mensajeError = validarCampo(name, value);
      if (mensajeError) siguiente[name] = mensajeError;
      else delete siguiente[name];
      return siguiente;
    });
  }

  function iniciarEdicion(producto) {
    setEditandoId(producto.id);
    const datosFormulario = {
      slug: producto.slug,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen_url: producto.imagen_url || "",
    };
    setFormulario(datosFormulario);
    setErroresCampos(validarTodo(datosFormulario));
    setTocados({});
    setPreviewImagen(producto.imagen_url || "");
    setMensaje("");
    setErrorFormulario("");
    setMostrarFormulario(true);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setTocados({});
    setPreviewImagen("");
    setMostrarFormulario(false);
  }

  function manejarSeleccionImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setTocados((prev) => ({ ...prev, imagen_url: true }));
      setErroresCampos((prev) => ({
        ...prev,
        imagen_url: "Selecciona un archivo de imagen (jpg, png, webp...)",
      }));
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setTocados((prev) => ({ ...prev, imagen_url: true }));
      setErroresCampos((prev) => ({
        ...prev,
        imagen_url: "La imagen debe pesar menos de 2 MB",
      }));
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result;
      setFormulario((prev) => ({ ...prev, imagen_url: resultado }));
      setPreviewImagen(resultado);
      setTocados((prev) => ({ ...prev, imagen_url: true }));
      setErroresCampos((prev) => {
        const siguiente = { ...prev };
        delete siguiente.imagen_url;
        return siguiente;
      });
    };
    lector.readAsDataURL(archivo);
  }

  function quitarImagen() {
    setFormulario((prev) => ({ ...prev, imagen_url: "" }));
    setPreviewImagen("");
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setMensaje("");
    setErrorFormulario("");

    const erroresActuales = validarTodo(formulario);
    setErroresCampos(erroresActuales);
    setTocados({
      slug: true,
      nombre: true,
      precio: true,
      descripcion: true,
      imagen_url: true,
    });
    if (Object.keys(erroresActuales).length > 0) {
      setErrorFormulario("Revisa los campos marcados en rojo.");
      return;
    }

    setEnviando(true);

    const datosAEnviar = {
      ...formulario,
      precio: Number(formulario.precio),
      imagen_url: formulario.imagen_url.trim() ? formulario.imagen_url.trim() : null,
    };

    try {
      if (editandoId) {
        await actualizarProducto(token, editandoId, datosAEnviar);
        setMensaje("Producto actualizado correctamente");
      } else {
        await crearProducto(token, datosAEnviar);
        setMensaje("Producto creado correctamente");
      }

      cancelarEdicion();
      cargarProductos();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarDisponibilidad(producto) {
    try {
      await actualizarProducto(token, producto.id, {
        disponible: producto.disponible ? 0 : 1,
      });
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await eliminarProducto(token, id);
      setMensaje("Producto eliminado");
      cargarProductos();
    } catch (err) {
      // Si ya tiene pedidos asociados, el backend devuelve un mensaje claro
      setError(err.message);
    }
  }

  function claseInput(nombre) {
    const conError = tocados[nombre] && erroresCampos[nombre];
    return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
      conError
        ? "border-[--color-strawberry-deep] focus:border-[--color-strawberry-deep]"
        : "border-[--color-border-soft] focus:border-[--color-strawberry-deep]"
    }`;
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar producto por nombre..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion={esAdmin ? "Agregar producto" : undefined}
        onAccion={abrirCrear}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron productos con esos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ffe4e6] bg-[#fff1f2] text-left text-xs uppercase tracking-wide text-[#9f1239]/70">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr
                    key={producto.id}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-4 py-3 font-medium text-[--color-choco]">
                      {producto.nombre}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      ${Number(producto.precio).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          producto.disponible
                            ? "bg-[#d1fae5] text-[#047857]"
                            : "bg-[--color-cream] text-[--color-choco-soft]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            producto.disponible ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                          }`}
                        />
                        {producto.disponible ? "Disponible" : "No disponible"}
                      </span>
                    </td>
                    <td className="space-x-3 px-4 py-3">
                      <button
                        onClick={() => iniciarEdicion(producto)}
                        className="text-[#0369a1] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarDisponibilidad(producto)}
                        className="text-[#b45309] hover:underline"
                      >
                        {producto.disponible ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => manejarEliminar(producto.id)}
                        className="text-[--color-strawberry-deep] hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={esAdmin && mostrarFormulario}
        titulo={editandoId ? "Editar producto" : "Agregar producto"}
        subtitulo={
          editandoId
            ? "Actualiza la información del producto."
            : "Complétalo para publicarlo en la tienda."
        }
        onCerrar={cancelarEdicion}
      >
        <form onSubmit={manejarEnvio} className="grid gap-3 sm:grid-cols-2" noValidate>
          <div>
            <input
              name="slug"
              value={formulario.slug}
              onChange={manejarCambio}
              placeholder="slug (ej: chocolate-oscuro)"
              disabled={Boolean(editandoId)}
              className={`${claseInput("slug")} disabled:bg-[--color-cream]`}
            />
            {tocados.slug && erroresCampos.slug && (
              <p className="mt-1 text-xs text-[--color-strawberry-deep]">{erroresCampos.slug}</p>
            )}
          </div>

          <div>
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Nombre"
              className={claseInput("nombre")}
            />
            {tocados.nombre && erroresCampos.nombre && (
              <p className="mt-1 text-xs text-[--color-strawberry-deep]">{erroresCampos.nombre}</p>
            )}
          </div>

          <div>
            <input
              name="precio"
              type="number"
              min="0"
              value={formulario.precio}
              onChange={manejarCambio}
              placeholder="Precio"
              className={claseInput("precio")}
            />
            {tocados.precio && erroresCampos.precio && (
              <p className="mt-1 text-xs text-[--color-strawberry-deep]">{erroresCampos.precio}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[--color-choco-soft]">
              Imagen del producto (opcional)
            </label>
            <div className="flex items-center gap-3">
              {previewImagen && (
                <img
                  src={previewImagen}
                  alt="Vista previa"
                  className="h-12 w-12 shrink-0 rounded-lg border border-[--color-border-soft] object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={manejarSeleccionImagen}
                className="w-full rounded-lg border border-[--color-border-soft] text-sm text-[--color-choco-soft] file:mr-3 file:rounded-md file:border-0 file:bg-[--color-cream] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[--color-choco] hover:file:bg-[--color-border-soft]"
              />
              {previewImagen && (
                <button
                  type="button"
                  onClick={quitarImagen}
                  className="shrink-0 text-xs text-[--color-strawberry-deep] hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
            {tocados.imagen_url && erroresCampos.imagen_url && (
              <p className="mt-1 text-xs text-[--color-strawberry-deep]">
                {erroresCampos.imagen_url}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              placeholder="Descripción"
              rows={3}
              className={claseInput("descripcion")}
            />
            {tocados.descripcion && erroresCampos.descripcion && (
              <p className="mt-1 text-xs text-[--color-strawberry-deep]">
                {erroresCampos.descripcion}
              </p>
            )}
          </div>

          {errorFormulario && (
            <p className="text-sm text-[--color-strawberry-deep] sm:col-span-2">
              {errorFormulario}
            </p>
          )}

          <div className="flex gap-3 pt-1 sm:col-span-2">
            <button
              type="submit"
              disabled={enviando || (Object.keys(tocados).length > 0 && !formularioValido)}
              className="rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:opacity-60"
            >
              {enviando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Agregar producto"}
            </button>
            <button
              type="button"
              onClick={cancelarEdicion}
              className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </PanelModal>
    </div>
  );
}