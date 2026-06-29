import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listarReclamos, listarPendientes, resolverReclamo } from "../../services/pedidoService";

const ESTADO_COLOR = {
  solicitado:  "bg-yellow-100 text-yellow-700",
  en_revision: "bg-blue-100 text-blue-700",
  aprobado:    "bg-green-100 text-green-700",
  rechazado:   "bg-red-100 text-red-600",
  reembolsado: "bg-purple-100 text-purple-700",
};

const DEVOLUCION_OPTS = ["efectivo","reverso_tarjeta","credito_cuenta"];

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab]               = useState("pendientes");
  const [reclamos, setReclamos]     = useState([]);
  const [reclamoActivo, setReclamoActivo] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // Formulario de resolución
  const [estadoResolucion, setEstadoResolucion]   = useState("aprobado");
  const [comentario, setComentario]               = useState("");
  const [metodoDev, setMetodoDev]                 = useState("efectivo");

  const fetchReclamos = async () => {
    setLoading(true);
    try {
      const fn = tab === "pendientes" ? listarPendientes : listarReclamos;
      const r = await fn();
      setReclamos(r.data);
    } catch { setError("Error cargando reclamos"); }
    setLoading(false);
  };

  useEffect(() => { fetchReclamos(); }, [tab]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const abrirReclamo = (r) => {
    setReclamoActivo(r);
    setComentario("");
    setEstadoResolucion("aprobado");
    setMetodoDev("efectivo");
    setError(""); setSuccess("");
  };

  const resolver = async () => {
    if (!comentario.trim()) return setError("El comentario es obligatorio");
    try {
      setLoading(true);
      await resolverReclamo(reclamoActivo.id_reclamo, {
        id_supervisor: user?.id_empleado,
        estado_reclamo: estadoResolucion,
        comentario_resolucion: comentario,
        metodo_devolucion: estadoResolucion === "aprobado" ? metodoDev : null,
      });
      setSuccess(`Reclamo #${reclamoActivo.id_reclamo} ${estadoResolucion} correctamente`);
      setReclamoActivo(null);
      fetchReclamos();
    } catch (e) {
      setError(e.response?.data?.message || "Error al resolver reclamo");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧑‍💼</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Supervisor — D&apos;Alicias</h1>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("pendientes"); setReclamoActivo(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab==="pendientes" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Pendientes
          </button>
          <button onClick={() => { setTab("todos"); setReclamoActivo(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab==="todos" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Todos los reclamos
          </button>
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition">Salir</button>
        </div>
      </header>

      {(error || success) && (
        <div className="px-6 pt-4">
          {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-3 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-3 text-sm">{success}</div>}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto p-4">
          {loading ? <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
          : reclamos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">Sin reclamos pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reclamos.map(r => (
                <button key={r.id_reclamo} onClick={() => abrirReclamo(r)}
                  className={`w-full text-left rounded-xl border p-3 transition hover:shadow-md ${
                    reclamoActivo?.id_reclamo === r.id_reclamo
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-800">Reclamo #{r.id_reclamo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[r.estado_reclamo]}`}>
                      {r.estado_reclamo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">👤 {r.nombre_cliente}</p>
                  <p className="text-xs text-gray-400">Pedido #{r.id_pedido}</p>
                  {Number(r.monto_seleccionado) > 0 && (
                    <p className="text-xs text-orange-600 font-semibold mt-1">S/ {Number(r.monto_seleccionado).toFixed(2)}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel detalle */}
        <div className="flex-1 overflow-y-auto p-6">
          {!reclamoActivo ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-3">👈</p>
                <p>Selecciona un reclamo para revisar</p>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-5">
              {/* Info del reclamo */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">Reclamo #{reclamoActivo.id_reclamo}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[reclamoActivo.estado_reclamo]}`}>
                    {reclamoActivo.estado_reclamo}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>👤 <span className="font-medium">{reclamoActivo.nombre_cliente}</span></p>
                  <p>🧾 Pedido #{reclamoActivo.id_pedido}</p>
                  <p>📅 {new Date(reclamoActivo.fecha_solicitud).toLocaleString("es-PE")}</p>
                  <p>👷 Registrado por: {reclamoActivo.solicitado_por}</p>
                  {reclamoActivo.producto_afectado && (
                    <p>🍽️ Producto: {reclamoActivo.producto_afectado}</p>
                  )}
                  {Number(reclamoActivo.monto_seleccionado) > 0 && (
                    <p className="text-orange-600 font-semibold">💰 Monto reclamado: S/ {Number(reclamoActivo.monto_seleccionado).toFixed(2)}</p>
                  )}
                </div>
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Motivo:</p>
                  <p className="text-sm text-gray-700">{reclamoActivo.motivo}</p>
                </div>
                {reclamoActivo.comentario_resolucion && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Resolución previa:</p>
                    <p className="text-sm text-blue-800">{reclamoActivo.comentario_resolucion}</p>
                  </div>
                )}
              </div>

              {/* Formulario de resolución */}
              {["solicitado","en_revision"].includes(reclamoActivo.estado_reclamo) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">Resolver reclamo</h3>

                  <div className="flex gap-2 mb-4">
                    {["aprobado","rechazado","en_revision"].map(est => (
                      <button key={est} onClick={() => setEstadoResolucion(est)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition border ${
                          estadoResolucion === est
                            ? est === "aprobado" ? "bg-green-500 text-white border-green-500"
                              : est === "rechazado" ? "bg-red-500 text-white border-red-500"
                              : "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}>
                        {est === "aprobado" ? "✅ Aprobar" : est === "rechazado" ? "❌ Rechazar" : "🔍 Revisar"}
                      </button>
                    ))}
                  </div>

                  {estadoResolucion === "aprobado" && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 font-medium block mb-1">Método de devolución</label>
                      <select value={metodoDev} onChange={e => setMetodoDev(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                        {DEVOLUCION_OPTS.map(d => <option key={d} value={d}>{d.replace("_"," ")}</option>)}
                      </select>
                    </div>
                  )}

                  <label className="text-xs text-gray-500 font-medium block mb-1">Comentario de resolución *</label>
                  <textarea rows={3} placeholder="Justificación obligatoria..." value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4"
                  />

                  <button onClick={resolver} disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-40 bg-orange-500 hover:bg-orange-600">
                    {loading ? "Guardando..." : "Confirmar resolución"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}