import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import ConfirmModal from "../../components/admin/ConfirmModal";
import {
  obtenerUsuarios,
  crearUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../../lib/api";

const ROLES = ["cliente", "empleado", "administrador"];

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  { value: "activo", etiqueta: "Activos" },
  { value: "inactivo", etiqueta: "Inactivos" },
];

const TIPOS_DOCUMENTO = [
  { value: "", etiqueta: "Tipo de documento..." },
  { value: "CC", etiqueta: "Cédula de ciudadanía" },
  { value: "TI", etiqueta: "Tarjeta de identidad" },
  { value: "CE", etiqueta: "Cédula de extranjería" },
  { value: "PA", etiqueta: "Pasaporte" },
];

// Mismas validaciones que RegisterForm.jsx (crear cuenta pública),
// para que "agregar usuario" desde el admin pida y valide lo mismo.
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const REGEX_DOCUMENTO = /^[0-9]{6,12}$/;
const REGEX_TELEFONO = /^[0-9]{7,10}$/;

const FORMULARIO_VACIO = {
  nombre: "",
  apellido: "",
  tipoDocumento: "",
  numeroDocumento: "",
  direccion: "",
  telefono: "",
  correo: "",
  password: "",
  confirmarPassword: "",
  rol: "cliente",
};

const CAMPOS_A_VALIDAR = [
  "nombre",
  "apellido",
  "tipoDocumento",
  "numeroDocumento",
  "direccion",
  "telefono",
  "correo",
  "password",
  "confirmarPassword",
];

export default function AdminUsuarios({
  esAdmin = true,
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token, usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [tocados, setTocados] = useState({});
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  function validarCampo(nombre, valor, formularioActual) {
    switch (nombre) {
      case "nombre":
      case "apellido":
        if (!valor.trim()) return "Este campo es obligatorio";
        if (valor.trim().length < 2) return "Mínimo 2 caracteres";
        if (valor.trim().length > 40) return "Máximo 40 caracteres";
        if (!REGEX_SOLO_LETRAS.test(valor)) return "Solo se permiten letras";
        return "";
      case "tipoDocumento":
        if (!valor) return "Selecciona un tipo de documento";
        return "";
      case "numeroDocumento":
        if (!valor.trim()) return "El número de documento es obligatorio";
        if (!REGEX_DOCUMENTO.test(valor)) return "Debe tener entre 6 y 12 dígitos numéricos";
        return "";
      case "direccion":
        if (!valor.trim()) return "La dirección es obligatoria";
        if (valor.trim().length < 5) return "Mínimo 5 caracteres";
        if (valor.trim().length > 80) return "Máximo 80 caracteres";
        return "";
      case "telefono":
        if (!valor.trim()) return "El teléfono es obligatorio";
        if (!REGEX_TELEFONO.test(valor)) return "Debe tener entre 7 y 10 dígitos numéricos";
        return "";
      case "correo":
        if (!valor.trim()) return "El correo es obligatorio";
        if (!REGEX_CORREO.test(valor)) return "Ingresa un correo válido";
        return "";
      case "password":
        if (!valor) return "La contraseña es obligatoria";
        if (valor.length < 8) return "Mínimo 8 caracteres";
        if (valor.length > 20) return "Máximo 20 caracteres";
        return "";
      case "confirmarPassword":
        if (!valor) return "Debes confirmar la contraseña";
        if (valor !== formularioActual.password) return "Las contraseñas no coinciden";
        return "";
      default:
        return "";
    }
  }

  function validarTodo(datos) {
    const nuevos = {};
    CAMPOS_A_VALIDAR.forEach((campo) => {
      const mensajeError = validarCampo(campo, datos[campo] ?? "", datos);
      if (mensajeError) nuevos[campo] = mensajeError;
    });
    return nuevos;
  }

  const formularioValido = Object.keys(erroresCampos).length === 0;

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const datos = await obtenerUsuarios(token);
      setUsuarios(datos.usuarios);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (esAdmin && abrirCrearInicial) {
      abrirFormulario();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const coincideTexto =
        !texto ||
        `${usuario.nombre || ""} ${usuario.apellido || ""}`
          .toLowerCase()
          .includes(texto) ||
        usuario.correo.toLowerCase().includes(texto);
      const coincideEstado =
        filtroEstado === "todos" || usuario.estado === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [usuarios, busqueda, filtroEstado]);

  function manejarCambioFormulario(e) {
    const { name, value } = e.target;

    // Igual que en RegisterForm: filtra caracteres no permitidos mientras se escribe
    let valorLimpio = value;
    if (name === "numeroDocumento" || name === "telefono") {
      valorLimpio = value.replace(/[^0-9]/g, "");
    }
    if (name === "nombre" || name === "apellido") {
      valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    }

    const nuevoFormulario = { ...formulario, [name]: valorLimpio };
    setFormulario(nuevoFormulario);
    setTocados((prev) => ({ ...prev, [name]: true }));

    setErroresCampos((prev) => {
      const siguiente = { ...prev };
      const mensajeError = validarCampo(name, valorLimpio, nuevoFormulario);
      if (mensajeError) siguiente[name] = mensajeError;
      else delete siguiente[name];

      // Si cambia la contraseña, revalida también la confirmación
      if (name === "password" && nuevoFormulario.confirmarPassword) {
        const errorConfirmar = validarCampo(
          "confirmarPassword",
          nuevoFormulario.confirmarPassword,
          nuevoFormulario
        );
        if (errorConfirmar) siguiente.confirmarPassword = errorConfirmar;
        else delete siguiente.confirmarPassword;
      }
      return siguiente;
    });
  }

  function abrirFormulario() {
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setTocados({});
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setTocados({});
  }

  async function manejarEnvioFormulario(e) {
    e.preventDefault();
    setErrorFormulario("");

    const erroresActuales = validarTodo(formulario);
    setErroresCampos(erroresActuales);
    setTocados(Object.fromEntries(CAMPOS_A_VALIDAR.map((campo) => [campo, true])));
    if (Object.keys(erroresActuales).length > 0) {
      setErrorFormulario("Revisa los campos marcados en rojo.");
      return;
    }

    setEnviando(true);
    try {
      await crearUsuario(token, formulario);
      setMensaje("Usuario creado correctamente");
      cerrarFormulario();
      cargarUsuarios();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarCambioEstado(usuario) {
    setMensaje("");
    setError("");
    const nuevoEstado = usuario.estado === "activo" ? "inactivo" : "activo";
    try {
      await cambiarEstadoUsuario(token, usuario.id, nuevoEstado);
      setMensaje(`Usuario marcado como ${nuevoEstado}`);
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  function manejarEliminar(usuario) {
    setUsuarioAEliminar(usuario);
  }

  async function confirmarEliminar() {
    if (!usuarioAEliminar) return;

    setMensaje("");
    setError("");
    try {
      await eliminarUsuario(token, usuarioAEliminar.id);
      setMensaje("Usuario eliminado");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setUsuarioAEliminar(null);
    }
  }

  function claseInput(nombre) {
    const conError = tocados[nombre] && erroresCampos[nombre];
    return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
      conError
        ? "border-[--color-strawberry-deep]"
        : "border-[--color-border-soft] focus:border-[--color-strawberry-deep]"
    }`;
  }

  function CampoError({ nombre }) {
    if (!tocados[nombre] || !erroresCampos[nombre]) return null;
    return <p className="mt-1 text-xs text-[--color-strawberry-deep]">{erroresCampos[nombre]}</p>;
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar por nombre o correo..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion={esAdmin ? "Agregar usuario" : undefined}
        onAccion={esAdmin ? abrirFormulario : undefined}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron usuarios con esos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0f2fe] bg-[#f0f9ff] text-left text-xs uppercase tracking-wide text-[#075985]/70">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Estado</th>
                  {esAdmin && <th className="px-4 py-3">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const esUsuarioActual = usuario.id === usuarioActual?.id;

                  return (
                    <tr
                      key={usuario.id}
                      className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                    >
                      <td className="px-4 py-3 font-medium text-[--color-choco]">
                        {usuario.nombre
                          ? `${usuario.nombre} ${usuario.apellido || ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        {usuario.correo}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            usuario.estado === "activo"
                              ? "bg-[#d1fae5] text-[#047857]"
                              : "bg-[--color-cream] text-[--color-choco-soft]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              usuario.estado === "activo" ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                            }`}
                          />
                          {usuario.estado === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {esAdmin && (
                        <td className="space-x-3 px-4 py-3">
                          <button
                            onClick={() => manejarCambioEstado(usuario)}
                            disabled={esUsuarioActual}
                            className="text-[#b45309] hover:underline disabled:text-[--color-choco-soft]/40"
                          >
                            {usuario.estado === "activo" ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => manejarEliminar(usuario)}
                            disabled={esUsuarioActual}
                            className="text-[--color-strawberry-deep] hover:underline disabled:text-[--color-choco-soft]/40"
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={esAdmin && mostrarFormulario}
        titulo="Agregar usuario"
        subtitulo="Los mismos datos que pide 'Crear cuenta', más el rol."
        onCerrar={cerrarFormulario}
      >
        <form onSubmit={manejarEnvioFormulario} className="grid gap-3 sm:grid-cols-2" noValidate>
          <div>
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambioFormulario}
              placeholder="Nombre"
              maxLength={40}
              className={claseInput("nombre")}
            />
            <CampoError nombre="nombre" />
          </div>

          <div>
            <input
              name="apellido"
              value={formulario.apellido}
              onChange={manejarCambioFormulario}
              placeholder="Apellido"
              maxLength={40}
              className={claseInput("apellido")}
            />
            <CampoError nombre="apellido" />
          </div>

          <div>
            <select
              name="tipoDocumento"
              value={formulario.tipoDocumento}
              onChange={manejarCambioFormulario}
              className={claseInput("tipoDocumento")}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.etiqueta}
                </option>
              ))}
            </select>
            <CampoError nombre="tipoDocumento" />
          </div>

          <div>
            <input
              name="numeroDocumento"
              value={formulario.numeroDocumento}
              onChange={manejarCambioFormulario}
              placeholder="Número de documento"
              maxLength={12}
              className={claseInput("numeroDocumento")}
            />
            <CampoError nombre="numeroDocumento" />
          </div>

          <div className="sm:col-span-2">
            <input
              name="direccion"
              value={formulario.direccion}
              onChange={manejarCambioFormulario}
              placeholder="Calle 10 # 20 - 30"
              maxLength={80}
              className={claseInput("direccion")}
            />
            <CampoError nombre="direccion" />
          </div>

          <div>
            <input
              name="telefono"
              value={formulario.telefono}
              onChange={manejarCambioFormulario}
              placeholder="3000000000"
              maxLength={10}
              className={claseInput("telefono")}
            />
            <CampoError nombre="telefono" />
          </div>

          <div>
            <select
              name="rol"
              value={formulario.rol}
              onChange={manejarCambioFormulario}
              className={claseInput("rol")}
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={manejarCambioFormulario}
              placeholder="correo@ejemplo.com"
              className={claseInput("correo")}
            />
            <CampoError nombre="correo" />
          </div>

          <div>
            <div className="relative">
              <input
                name="password"
                type={verPassword ? "text" : "password"}
                value={formulario.password}
                onChange={manejarCambioFormulario}
                placeholder="Mínimo 8 caracteres"
                maxLength={20}
                className={`${claseInput("password")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[--color-choco-soft]"
              >
                {verPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <CampoError nombre="password" />
          </div>

          <div>
            <div className="relative">
              <input
                name="confirmarPassword"
                type={verConfirmarPassword ? "text" : "password"}
                value={formulario.confirmarPassword}
                onChange={manejarCambioFormulario}
                placeholder="Repite la contraseña"
                maxLength={20}
                className={`${claseInput("confirmarPassword")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setVerConfirmarPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[--color-choco-soft]"
              >
                {verConfirmarPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <CampoError nombre="confirmarPassword" />
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
              {enviando ? "Creando..." : "Crear usuario"}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </PanelModal>

      <ConfirmModal
        abierto={Boolean(usuarioAEliminar)}
        titulo="Eliminar usuario"
        mensaje={
          usuarioAEliminar
            ? `¿Eliminar permanentemente a "${usuarioAEliminar.nombre || usuarioAEliminar.correo}"? Se recomienda usar "Desactivar" en su lugar.`
            : ""
        }
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setUsuarioAEliminar(null)}
      />
    </div>
  );
}