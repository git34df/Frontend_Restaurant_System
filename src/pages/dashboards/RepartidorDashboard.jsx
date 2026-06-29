import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listarPedidos, cambiarEstado, obtenerPedido } from "../../services/PedidoService";

const ESTADO = {
  listo:     { label: "Listo para llevar", color: "bg-emerald-100 text-emerald-700 border-emerald-200",   dot: "bg-emerald-500" },
  entregado: { label: "Entregado",         color: "bg-slate-100 text-slate-500 border-slate-200",         dot: "bg-slate-400"  },
  anulado:   { label: "Anulado",           color: "bg-red-100 text-red-500 border-red-200",               dot: "bg-red-400"    },
};

export default function RepartidorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab]               = useState("pendientes"); // "pendientes" | "historial"
  const [pedidos, setPedidos]       = useState([]);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [detalles, setDetalles]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const r = await listarPedidos();
      setPedidos(r.data);
    } catch {
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const abrirPedido = async (p) => {
    setPedidoActivo(p);
    setDetalles(null);
    setError("");
    setSuccess("");
    try {
      const r = await obtenerPedido(p.id_pedido);
      setDetalles(r.data.detalles);
    } catch {
      setError("No se pudo cargar el detalle");
    }
  };

  const marcarEntregado = async () => {
    if (!pedidoActivo) return;
    setLoadingAccion(true);
    try {
      await cambiarEstado(pedidoActivo.id_pedido, "entregado");
      setSuccess(`Pedido #${pedidoActivo.id_pedido} marcado como entregado`);
      setPedidoActivo(null);
      setDetalles(null);
      fetchPedidos();
    } catch {
      setError("Error al actualizar el pedido");
    } finally {
      setLoadingAccion(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const pendientes = pedidos.filter(p => p.estado_pedido === "listo"     && p.tipo_pedido === "delivery");
  const historial  = pedidos.filter(p => ["entregado", "anulado"].includes(p.estado_pedido) && p.tipo_pedido === "delivery");
  const lista      = tab === "pendientes" ? pendientes : historial;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-lg">
            🚚
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Repartidor</h1>
            <p className="text-xs text-slate-400">{user?.username} · D&apos;Alicias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de pendientes */}
          {pendientes.length > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {pendientes.length} listo{pendientes.length > 1 ? "s" : ""}
            </span>
          )}
          <button onClick={fetchPedidos}
            className="px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            ↻
          </button>
          <button onClick={logout}
            className="px-3 py-2 rounded-lg text-sm bg-red-900/40 text-red-400 hover:bg-red-900/60 transition">
            Salir
          </button>
        </div>
      </header>

      {/* Notificaciones */}
      {(error || success) && (
        <div className="px-6 pt-4">
          {error   && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm mb-2">{error}</div>}
          {success && <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-2">{success}</div>}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* Panel izquierdo — lista */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button onClick={() => { setTab("pendientes"); setPedidoActivo(null); }}
              className={`flex-1 py-3 text-sm font-medium transition ${tab === "pendientes"
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-slate-500 hover:text-slate-300"}`}>
              🚦 Pendientes
              {pendientes.length > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendientes.length}
                </span>
              )}
            </button>
            <button onClick={() => { setTab("historial"); setPedidoActivo(null); }}
              className={`flex-1 py-3 text-sm font-medium transition ${tab === "historial"
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-slate-500 hover:text-slate-300"}`}>
              📋 Historial
            </button>
          </div>

          {/* Lista de pedidos */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && (
              <div className="text-center py-12 text-slate-600 text-sm">Cargando...</div>
            )}
            {!loading && lista.length === 0 && (
              <div className="text-center py-16 text-slate-600">
                <p className="text-3xl mb-2">{tab === "pendientes" ? "✅" : "📭"}</p>
                <p className="text-sm">{tab === "pendientes" ? "Sin pedidos pendientes" : "Sin historial aún"}</p>
              </div>
            )}
            {lista.map(p => {
              const est = ESTADO[p.estado_pedido] || ESTADO.listo;
              const activo = pedidoActivo?.id_pedido === p.id_pedido;
              return (
                <button key={p.id_pedido} onClick={() => abrirPedido(p)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    activo
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-white">#{p.id_pedido}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${est.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`}/>
                      {est.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 truncate">👤 {p.nombre_cliente}</p>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-xs text-slate-500">
                      {new Date(p.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm font-semibold text-orange-400">S/ {Number(p.total).toFixed(2)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer con auto-refresh */}
          <div className="px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-600 text-center">↻ Actualiza automáticamente cada 30s</p>
          </div>
        </div>

        {/* Panel derecho — detalle */}
        <div className="flex-1 overflow-y-auto p-6">
          {!pedidoActivo ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-700">
                <p className="text-6xl mb-4">🛵</p>
                <p className="text-lg font-medium text-slate-500">Selecciona un pedido</p>
                <p className="text-sm text-slate-600 mt-1">para ver los detalles de entrega</p>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">

              {/* Cabecera del pedido */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Pedido #{pedidoActivo.id_pedido}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {new Date(pedidoActivo.fecha_hora).toLocaleString("es-PE")}
                    </p>
                  </div>
                  {(() => {
                    const est = ESTADO[pedidoActivo.estado_pedido] || ESTADO.listo;
                    return (
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${est.color}`}>
                        <span className={`w-2 h-2 rounded-full ${est.dot}`}/>
                        {est.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Datos del cliente */}
                <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Cliente</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-white font-medium text-sm">{pedidoActivo.nombre_cliente}</p>
                      <p className="text-slate-400 text-xs">{pedidoActivo.documento_identidad}</p>
                    </div>
                  </div>
                </div>

                {pedidoActivo.notas_pedido && (
                  <div className="mt-3 bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-3">
                    <p className="text-xs text-yellow-500 font-semibold mb-1">📝 Notas del pedido</p>
                    <p className="text-yellow-200 text-sm">{pedidoActivo.notas_pedido}</p>
                  </div>
                )}
              </div>

              {/* Detalle de productos */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">Productos</p>
                {!detalles ? (
                  <p className="text-slate-600 text-sm text-center py-4">Cargando productos...</p>
                ) : detalles.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-4">Sin productos</p>
                ) : (
                  <div className="space-y-2">
                    {detalles.map(d => (
                      <div key={d.id_detalle_pedido} className="flex justify-between items-start">
                        <div className="flex gap-2 flex-1">
                          <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            {d.cantidad}
                          </span>
                          <div>
                            <p className="text-white text-sm">{d.nombre_producto}</p>
                            {d.notas_especiales && (
                              <p className="text-yellow-400 text-xs mt-0.5">⚠ {d.notas_especiales}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm ml-3">S/ {Number(d.subtotal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totales */}
                <div className="border-t border-slate-800 mt-4 pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>S/ {Number(pedidoActivo.subtotal_general).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IGV 18%</span>
                    <span>S/ {Number(pedidoActivo.igv).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-white pt-1">
                    <span>Total</span>
                    <span className="text-orange-400">S/ {Number(pedidoActivo.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botón acción — solo si está listo */}
              {pedidoActivo.estado_pedido === "listo" && (
                <button
                  onClick={marcarEntregado}
                  disabled={loadingAccion}
                  className="w-full py-4 rounded-2xl font-bold text-base bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingAccion ? "Actualizando..." : "✓ Confirmar entrega"}
                </button>
              )}

              {pedidoActivo.estado_pedido === "entregado" && (
                <div className="w-full py-4 rounded-2xl font-bold text-base bg-emerald-900/40 border border-emerald-700 text-emerald-400 text-center">
                  ✓ Entregado
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}