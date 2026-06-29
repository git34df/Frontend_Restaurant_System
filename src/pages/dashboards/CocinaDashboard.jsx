import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listarPedidos, cambiarEstado, obtenerPedido } from "../../services/pedidoService";

const COLUMNAS = [
  { estado: "registrado",     label: "Nuevos",        color: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  { estado: "en_preparacion", label: "En preparación",color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
  { estado: "listo",          label: "Listo",         color: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700" },
];

const SIGUIENTE_ESTADO = {
  registrado:     { label: "Iniciar preparación", next: "en_preparacion" },
  en_preparacion: { label: "Marcar listo",         next: "listo" },
};

export default function CocinaDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [pedidos, setPedidos]     = useState([]);
  const [detalles, setDetalles]   = useState({});
  const [loading, setLoading]     = useState(false);

  const fetchPedidos = async () => {
    setLoading(true);
    const r = await listarPedidos();
    const activos = r.data.filter(p => ["registrado","en_preparacion","listo"].includes(p.estado_pedido));
    setPedidos(activos);

    // Cargar detalles de cada pedido
    const detMap = {};
    await Promise.all(activos.map(async p => {
      try {
        const r2 = await obtenerPedido(p.id_pedido);
        detMap[p.id_pedido] = r2.data.detalles;
      } catch {}
    }));
    setDetalles(detMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 30000); // auto-refresh 30s
    return () => clearInterval(interval);
  }, []);

  const avanzarEstado = async (id, nextEstado) => {
    await cambiarEstado(id, nextEstado);
    fetchPedidos();
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <h1 className="text-xl font-bold">Cocina — D&apos;Alicias</h1>
            <p className="text-xs text-gray-400">{user?.username} · Actualiza cada 30 seg</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPedidos} className="px-4 py-2 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 transition">
            ↻ Actualizar
          </button>
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm bg-red-900 text-red-300 hover:bg-red-800 transition">Salir</button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Cargando pedidos...</div>
      ) : (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNAS.map(col => {
            const pedidosCol = pedidos.filter(p => p.estado_pedido === col.estado);
            return (
              <div key={col.estado}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-200">{col.label}</h2>
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{pedidosCol.length}</span>
                </div>
                <div className="space-y-3">
                  {pedidosCol.length === 0 && (
                    <div className="text-center py-10 text-gray-600 text-sm border border-gray-700 rounded-xl border-dashed">
                      Sin pedidos
                    </div>
                  )}
                  {pedidosCol.map(p => (
                    <div key={p.id_pedido} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">#{p.id_pedido}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(p.fecha_hora).toLocaleTimeString("es-PE", {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">👤 {p.nombre_cliente}</p>

                      {/* Items del pedido */}
                      <div className="bg-gray-900 rounded-lg p-3 mb-3 space-y-1">
                        {(detalles[p.id_pedido] || []).map(d => (
                          <div key={d.id_detalle_pedido} className="flex justify-between text-sm">
                            <span className="text-gray-200">
                              <span className="font-bold text-orange-400">{d.cantidad}x</span> {d.nombre_producto}
                            </span>
                          </div>
                        ))}
                        {!detalles[p.id_pedido] && <p className="text-gray-500 text-xs">Cargando items...</p>}
                      </div>

                      {p.notas_pedido && (
                        <p className="text-xs text-yellow-400 bg-yellow-900/30 rounded px-2 py-1 mb-3">
                          📝 {p.notas_pedido}
                        </p>
                      )}

                      {SIGUIENTE_ESTADO[p.estado_pedido] && (
                        <button
                          onClick={() => avanzarEstado(p.id_pedido, SIGUIENTE_ESTADO[p.estado_pedido].next)}
                          className="w-full py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 transition text-white"
                        >
                          {SIGUIENTE_ESTADO[p.estado_pedido].label}
                        </button>
                      )}
                      {p.estado_pedido === "listo" && (
                        <div className="w-full py-2 rounded-lg text-sm font-semibold bg-green-600 text-center text-white">
                          ✓ Listo para servir
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
