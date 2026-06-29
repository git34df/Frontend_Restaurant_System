import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  kpisHoy, ventasSemanales,
  listarUsuarios, toggleUsuario,
  listarProductosAdmin, crearProducto, cambiarEstadoProducto, editarProducto,
  listarCategorias, registrarUsuario, listarRoles
} from "../../services/PedidoService";

const ESTADO_PROD_COLOR = {
  disponible:    "bg-green-100 text-green-700",
  no_disponible: "bg-yellow-100 text-yellow-700",
  agotado:       "bg-red-100 text-red-600",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab] = useState("kpis"); // "kpis" | "productos" | "usuarios"

  // KPIs
  const [kpis, setKpis]           = useState(null);
  const [ventas, setVentas]       = useState([]);

  // Productos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showFormProd, setShowFormProd] = useState(false);
  const [nuevoProd, setNuevoProd] = useState({ id_categoria:"", nombre_producto:"", descripcion_producto:"", precio_producto:"" });

  // Modal editar producto
  const [modalEditProd, setModalEditProd]   = useState(false);
  const [prodEditando, setProdEditando]     = useState(null);
  const [loadingEdit, setLoadingEdit]       = useState(false);
  const [errorEdit, setErrorEdit]           = useState("");

  // Usuarios
  const [usuarios, setUsuarios]   = useState([]);
  const [roles, setRoles]         = useState([]);

  // Modal nuevo usuario
  const [modalUsuario, setModalUsuario]     = useState(false);
  const [nuevoUsuario, setNuevoUsuario]     = useState({
    nombre: '', cargo: '', telefono: '', email: '',
    username: '', password: '', rol_id: ''
  });
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario]     = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const logout = () => { localStorage.clear(); navigate("/login"); };

  useEffect(() => {
    if (tab === "kpis") {
      kpisHoy().then(r => setKpis(r.data));
      ventasSemanales().then(r => setVentas(r.data));
    }
    if (tab === "productos") {
      listarProductosAdmin().then(r => setProductos(r.data));
      listarCategorias().then(r => setCategorias(r.data));
    }
    if (tab === "usuarios") {
      listarUsuarios().then(r => setUsuarios(r.data));
      listarRoles().then(r => setRoles(r.data));
    }
  }, [tab]);

  const guardarProducto = async () => {
    if (!nuevoProd.id_categoria || !nuevoProd.nombre_producto || !nuevoProd.precio_producto)
      return setError("Categoría, nombre y precio son obligatorios");
    try {
      setLoading(true);
      await crearProducto({ ...nuevoProd, precio_producto: parseFloat(nuevoProd.precio_producto) });
      setSuccess("Producto creado correctamente");
      setShowFormProd(false);
      setNuevoProd({ id_categoria:"", nombre_producto:"", descripcion_producto:"", precio_producto:"" });
      listarProductosAdmin().then(r => setProductos(r.data));
    } catch (e) {
      setError(e.response?.data?.message || "Error al crear producto");
    } finally { setLoading(false); }
  };

  const cambiarEstProd = async (id, estado) => {
    await cambiarEstadoProducto(id, estado);
    listarProductosAdmin().then(r => setProductos(r.data));
  };

  const abrirEditarProd = (p) => {
    setProdEditando({ ...p, precio_producto: Number(p.precio_producto) });
    setErrorEdit("");
    setModalEditProd(true);
  };

  const guardarEdicion = async () => {
    if (!prodEditando.nombre_producto || !prodEditando.precio_producto)
      return setErrorEdit("Nombre y precio son obligatorios");
    try {
      setLoadingEdit(true);
      await editarProducto(prodEditando.id_producto, {
        id_categoria:         prodEditando.id_categoria,
        nombre_producto:      prodEditando.nombre_producto,
        descripcion_producto: prodEditando.descripcion_producto || null,
        precio_producto:      parseFloat(prodEditando.precio_producto),
      });
      setSuccess("Producto actualizado correctamente");
      setModalEditProd(false);
      listarProductosAdmin().then(r => setProductos(r.data));
    } catch (e) {
      setErrorEdit(e.response?.data?.message || "Error al editar producto");
    } finally {
      setLoadingEdit(false);
    }
  };

  const toggleUser = async (id, activo) => {
    await toggleUsuario(id, activo ? 0 : 1);
    listarUsuarios().then(r => setUsuarios(r.data));
  };

  const abrirModalUsuario = () => {
    setNuevoUsuario({ nombre: '', cargo: '', telefono: '', email: '', username: '', password: '', rol_id: '' });
    setErrorUsuario('');
    setModalUsuario(true);
  };

  const crearUsuario = async () => {
    const { nombre, cargo, username, password, rol_id } = nuevoUsuario;
    if (!nombre || !cargo || !username || !password || !rol_id)
      return setErrorUsuario('Nombre, cargo, username, contraseña y rol son obligatorios');
    try {
      setLoadingUsuario(true);
      await registrarUsuario(nuevoUsuario);
      setSuccess('Usuario creado correctamente');
      setModalUsuario(false);
      listarUsuarios().then(r => setUsuarios(r.data));
    } catch (e) {
      setErrorUsuario(e.response?.data?.message || 'Error al crear usuario');
    } finally {
      setLoadingUsuario(false);
    }
  };

  // Mini barra para ventas semanales
  const maxVenta = Math.max(...ventas.map(v => Number(v.total)), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Admin — D&apos;Alicias
            </h1>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["kpis", "productos", "usuarios"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {t === "kpis"
                ? "📊 Dashboard"
                : t === "productos"
                  ? "🍽️ Productos"
                  : "👥 Usuarios"}
            </button>
          ))}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="px-6 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-3 text-sm">
            {success}
          </div>
        )}
      </div>

      {/* ── TAB KPIs ── */}
      {tab === "kpis" && (
        <div className="px-6 pb-8">
          {!kpis ? (
            <p className="text-gray-400 text-sm mt-4">Cargando...</p>
          ) : (
            <>
              {/* Tarjetas KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 mb-8">
                {[
                  {
                    label: "Pedidos hoy",
                    value: kpis.total_pedidos,
                    icon: "🧾",
                    color: "text-indigo-600",
                  },
                  {
                    label: "Ingresos hoy",
                    value: `S/ ${Number(kpis.ingresos_brutos).toFixed(2)}`,
                    icon: "💰",
                    color: "text-green-600",
                  },
                  {
                    label: "IGV generado",
                    value: `S/ ${Number(kpis.igv_total).toFixed(2)}`,
                    icon: "📋",
                    color: "text-blue-600",
                  },
                  {
                    label: "Reclamos pendientes",
                    value: kpis.reclamos_pendientes,
                    icon: "⚠️",
                    color: "text-orange-500",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    <p className="text-2xl mb-1">{k.icon}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Ventas últimos 7 días */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Ventas — últimos 7 días
                </h3>
                {ventas.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin datos</p>
                ) : (
                  <div className="flex items-end gap-3 h-32">
                    {ventas.map((v) => {
                      const pct = (Number(v.total) / maxVenta) * 100;
                      return (
                        <div
                          key={v.fecha}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span className="text-xs text-gray-500 font-medium">
                            S/{Math.round(Number(v.total))}
                          </span>
                          <div
                            className="w-full bg-indigo-500 rounded-t-md transition-all"
                            style={{ height: `${pct}%`, minHeight: "4px" }}
                          />
                          <span className="text-xs text-gray-400">
                            {new Date(v.fecha).toLocaleDateString("es-PE", {
                              weekday: "short",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top productos */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Top productos hoy
                </h3>
                {kpis.top_productos.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin ventas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {kpis.top_productos.map((p, i) => (
                      <div
                        key={p.nombre_producto}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="font-bold text-indigo-400 w-5">
                          #{i + 1}
                        </span>
                        <span className="flex-1 text-gray-700">
                          {p.nombre_producto}
                        </span>
                        <span className="text-gray-400">{p.unidades} uds.</span>
                        <span className="text-green-600 font-semibold w-24 text-right">
                          S/ {Number(p.ingresos).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB PRODUCTOS ── */}
      {tab === "productos" && (
        <div className="px-6 pb-8 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Carta de productos
            </h2>
            <button
              onClick={() => setShowFormProd(!showFormProd)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              + Nuevo producto
            </button>
          </div>

          {showFormProd && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 grid grid-cols-2 gap-3">
              <select
                value={nuevoProd.id_categoria}
                onChange={(e) =>
                  setNuevoProd({ ...nuevoProd, id_categoria: e.target.value })
                }
                className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre_categoria}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nombre del producto *"
                value={nuevoProd.nombre_producto}
                onChange={(e) =>
                  setNuevoProd({
                    ...nuevoProd,
                    nombre_producto: e.target.value,
                  })
                }
                className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <input
                placeholder="Descripción (opcional)"
                value={nuevoProd.descripcion_producto}
                onChange={(e) =>
                  setNuevoProd({
                    ...nuevoProd,
                    descripcion_producto: e.target.value,
                  })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="number"
                placeholder="Precio S/ *"
                value={nuevoProd.precio_producto}
                onChange={(e) =>
                  setNuevoProd({
                    ...nuevoProd,
                    precio_producto: e.target.value,
                  })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <div className="col-span-2 flex gap-2 justify-end">
                <button
                  onClick={() => setShowFormProd(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarProducto}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.map((p) => (
                  <tr key={p.id_producto} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.nombre_producto}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.nombre_categoria}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      S/ {Number(p.precio_producto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_PROD_COLOR[p.estado_producto]}`}
                      >
                        {p.estado_producto}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={p.estado_producto}
                        onChange={(e) =>
                          cambiarEstProd(p.id_producto, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="disponible">Disponible</option>
                        <option value="no_disponible">No disponible</option>
                        <option value="agotado">Agotado</option>
                      </select>
                      <button
                        onClick={() => abrirEditarProd(p)}
                        className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mr-2"
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB USUARIOS ── */}
      {tab === "usuarios" && (
        <div className="px-6 pb-8 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Usuarios del sistema
            </h2>
            <button
              onClick={abrirModalUsuario}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              + Nuevo usuario
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Último acceso</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {u.nombre_empleado}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.nombre_rol}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.ultimo_acceso
                        ? new Date(u.ultimo_acceso).toLocaleString("es-PE")
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleUser(u.id_usuario, u.activo)}
                        className={`text-xs px-3 py-1 rounded-lg transition ${u.activo ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO USUARIO ── */}
      {modalUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  👤 Nuevo usuario
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se creará el empleado y su acceso al sistema
                </p>
              </div>
              <button
                onClick={() => setModalUsuario(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {errorUsuario && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
                {errorUsuario}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Datos del empleado */}
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Datos del empleado
                </p>
              </div>
              <input
                placeholder="Nombre completo *"
                value={nuevoUsuario.nombre}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                }
                className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                placeholder="Cargo *  (ej: Mozo de salón)"
                value={nuevoUsuario.cargo}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, cargo: e.target.value })
                }
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                placeholder="Teléfono (opcional)"
                value={nuevoUsuario.telefono}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })
                }
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <input
                placeholder="Email (opcional)"
                type="email"
                value={nuevoUsuario.email}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
                }
                className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />

              {/* Datos de acceso */}
              <div className="col-span-2 mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Acceso al sistema
                </p>
              </div>
              <input
                placeholder="Username *"
                value={nuevoUsuario.username}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })
                }
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                placeholder="Contraseña *"
                type="password"
                value={nuevoUsuario.password}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                }
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <select
                value={nuevoUsuario.rol_id}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, rol_id: e.target.value })
                }
                className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Seleccionar rol *</option>
                {roles.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>
                    {r.nombre_rol}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalUsuario(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={crearUsuario}
                disabled={loadingUsuario}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40"
              >
                {loadingUsuario ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditProd && prodEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                ✏️ Editar producto
              </h2>
              <button
                onClick={() => setModalEditProd(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            {errorEdit && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
                {errorEdit}
              </div>
            )}
            <div className="space-y-3">
              <select
                value={prodEditando.id_categoria}
                onChange={(e) =>
                  setProdEditando({
                    ...prodEditando,
                    id_categoria: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre_categoria}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nombre del producto *"
                value={prodEditando.nombre_producto}
                onChange={(e) =>
                  setProdEditando({
                    ...prodEditando,
                    nombre_producto: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                placeholder="Descripción (opcional)"
                value={prodEditando.descripcion_producto || ""}
                onChange={(e) =>
                  setProdEditando({
                    ...prodEditando,
                    descripcion_producto: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="number"
                placeholder="Precio S/ *"
                value={prodEditando.precio_producto}
                onChange={(e) =>
                  setProdEditando({
                    ...prodEditando,
                    precio_producto: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalEditProd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={loadingEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}