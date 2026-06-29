import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarPedidos, obtenerPedido,
  emitirComprobante, comprobantePorPedido,
  registrarPago
} from "../../services/PedidoService";

const METODOS = ["efectivo","tarjeta_credito","tarjeta_debito","yape","plin","transferencia"];
const METODO_ICON = { efectivo:"💵", tarjeta_credito:"💳", tarjeta_debito:"💳", yape:"📱", plin:"📱", transferencia:"🏦" };

const ESTADO_BADGE = {
  registrado:     "bg-blue-100 text-blue-700",
  en_preparacion: "bg-yellow-100 text-yellow-700",
  listo:          "bg-green-100 text-green-700",
  entregado:      "bg-gray-200 text-gray-500",
  anulado:        "bg-red-100 text-red-400",
};

export default function CajeroDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [pedidos, setPedidos]           = useState([]);
  const [pedidoActivo, setPedidoActivo] = useState(null);  // pedido con detalles
  const [comprobante, setComprobante]   = useState(null);
  const [pagoOk, setPagoOk]            = useState(null);   // resultado del pago

  const [tipoComp, setTipoComp]         = useState("boleta");
  const [rucDni, setRucDni]             = useState("");
  const [metodos, setMetodos]           = useState([{ metodo_pago: "efectivo", monto: "", referencia_voucher: "" }]);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState("listos"); // "listos" | "historial"

  const fetchPedidos = async () => {
    const r = await listarPedidos();
    setPedidos(r.data);
  };

  useEffect(() => { fetchPedidos(); }, []);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // Abrir panel de cobro para un pedido
  const abrirCobro = async (p) => {
    setError(""); setPagoOk(null); setComprobante(null);
    setMetodos([{ metodo_pago: "efectivo", monto: "", referencia_voucher: "" }]);
    setRucDni(p.documento_identidad || "");
    setTipoComp("boleta");

    const r = await obtenerPedido(p.id_pedido);
    setPedidoActivo(r.data);

    // Ver si ya tiene comprobante
    try {
      const rc = await comprobantePorPedido(p.id_pedido);
      setComprobante(rc.data);
    } catch {}
  };

  // Emitir comprobante
  const emitir = async () => {
    setError("");
    if (!rucDni) return setError("Ingresa DNI o RUC");
    try {
      setLoading(true);
      const r = await emitirComprobante({
        id_pedido: pedidoActivo.id_pedido,
        id_cliente: pedidoActivo.id_cliente,
        tipo_comprobante: tipoComp,
        ruc_dni: rucDni,
      });
      setComprobante(r.data);
    } catch (e) {
      setError(e.response?.data?.message || "Error al emitir comprobante");
    } finally { setLoading(false); }
  };

  // Manejo de métodos de pago
  const agregarMetodo = () =>
    setMetodos(prev => [...prev, { metodo_pago: "efectivo", monto: "", referencia_voucher: "" }]);

  const quitarMetodo = (i) =>
    setMetodos(prev => prev.filter((_, idx) => idx !== i));

  const updateMetodo = (i, field, value) =>
    setMetodos(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const totalPagando = metodos.reduce((acc, m) => acc + (parseFloat(m.monto) || 0), 0);
  const totalComp    = comprobante ? Number(comprobante.total) : 0;
  const vuelto       = totalPagando - totalComp;

  // Registrar pago
  const cobrar = async () => {
    setError("");
    if (!comprobante) return setError("Primero emite el comprobante");
    if (metodos.some(m => !m.monto || parseFloat(m.monto) <= 0))
      return setError("Todos los montos deben ser mayores a 0");
    if (totalPagando < totalComp)
      return setError(`Monto insuficiente. Falta S/ ${(totalComp - totalPagando).toFixed(2)}`);

    try {
      setLoading(true);
      const r = await registrarPago({
        id_comprobante: comprobante.id_comprobante,
        metodos: metodos.map(m => ({
          metodo_pago: m.metodo_pago,
          monto: parseFloat(m.monto),
          referencia_voucher: m.referencia_voucher || null,
        })),
      });
      setPagoOk(r.data);
      fetchPedidos();
    } catch (e) {
      setError(e.response?.data?.message || "Error al registrar pago");
    } finally { setLoading(false); }
  };

  const pedidosListos    = pedidos.filter(p => p.estado_pedido === "listo");
  const pedidosHistorial = pedidos.filter(p => ["entregado","anulado"].includes(p.estado_pedido));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Caja — D&apos;Alicias</h1>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("listos"); setPedidoActivo(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab==="listos" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Listos para cobrar {pedidosListos.length > 0 && <span className="ml-1 bg-white text-green-600 rounded-full px-1.5 text-xs font-bold">{pedidosListos.length}</span>}
          </button>
          <button onClick={() => { setTab("historial"); setPedidoActivo(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab==="historial" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Historial
          </button>
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition">Salir</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de pedidos */}
        <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto p-4">
          {(tab === "listos" ? pedidosListos : pedidosHistorial).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">{tab === "listos" ? "⏳" : "📭"}</p>
              <p className="text-sm">{tab === "listos" ? "Sin pedidos listos aún" : "Sin historial"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(tab === "listos" ? pedidosListos : pedidosHistorial).map(p => (
                <button key={p.id_pedido} onClick={() => abrirCobro(p)}
                  className={`w-full text-left rounded-xl border p-3 transition hover:shadow-md ${
                    pedidoActivo?.id_pedido === p.id_pedido
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">#{p.id_pedido}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[p.estado_pedido]}`}>
                      {p.estado_pedido.replace("_"," ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">👤 {p.nombre_cliente}</p>
                  <p className="text-green-600 font-bold text-sm mt-1">S/ {Number(p.total).toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de cobro */}
        <div className="flex-1 overflow-y-auto p-6">
          {!pedidoActivo ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-3">👈</p>
                <p>Selecciona un pedido para cobrar</p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

              {/* Éxito del pago */}
              {pagoOk && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-5 text-center">
                  <p className="text-4xl mb-2">✅</p>
                  <p className="font-bold text-green-800 text-lg">Pago registrado</p>
                  <p className="text-green-700 text-sm mt-1">Total cobrado: <strong>S/ {Number(pagoOk.total_cobrado).toFixed(2)}</strong></p>
                  {Number(pagoOk.vuelto) > 0 && (
                    <p className="text-2xl font-bold text-green-900 mt-3">
                      Vuelto: S/ {Number(pagoOk.vuelto).toFixed(2)}
                    </p>
                  )}
                  <button onClick={() => { setPedidoActivo(null); setPagoOk(null); }}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                    Siguiente pedido
                  </button>
                </div>
              )}

              {!pagoOk && (
                <>
                  {/* Resumen del pedido */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-700 mb-3">Pedido #{pedidoActivo.id_pedido}</h3>
                    <p className="text-sm text-gray-500 mb-3">👤 {pedidoActivo.nombre_cliente}</p>
                    <div className="space-y-1 mb-3">
                      {pedidoActivo.detalles?.map(d => (
                        <div key={d.id_detalle_pedido} className="flex justify-between text-sm">
                          <span className="text-gray-700">{d.cantidad}x {d.nombre_producto}</span>
                          <span className="text-gray-600">S/ {Number(d.subtotal).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>S/ {Number(pedidoActivo.subtotal_general).toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>IGV 18%</span><span>S/ {Number(pedidoActivo.igv).toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span className="text-green-600">S/ {Number(pedidoActivo.total).toFixed(2)}</span></div>
                    </div>
                  </div>

                  {/* Comprobante */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-700 mb-3">Comprobante</h3>
                    {comprobante ? (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                        <p className="font-medium text-gray-700">
                          {comprobante.tipo_comprobante === "boleta" ? "🧾 Boleta" : "📄 Factura"} {comprobante.serie}-{String(comprobante.numero_correlativo).padStart(8,"0")}
                        </p>
                        <p className="text-gray-500">DNI/RUC: {comprobante.ruc_dni}</p>
                        <p className="text-green-600 font-semibold">Total: S/ {Number(comprobante.total).toFixed(2)}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <label className={`flex-1 flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${tipoComp==="boleta" ? "border-green-400 bg-green-50" : "border-gray-200"}`}>
                            <input type="radio" value="boleta" checked={tipoComp==="boleta"} onChange={() => setTipoComp("boleta")} className="accent-green-500" />
                            <span className="text-sm font-medium">🧾 Boleta</span>
                          </label>
                          <label className={`flex-1 flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${tipoComp==="factura" ? "border-green-400 bg-green-50" : "border-gray-200"}`}>
                            <input type="radio" value="factura" checked={tipoComp==="factura"} onChange={() => setTipoComp("factura")} className="accent-green-500" />
                            <span className="text-sm font-medium">📄 Factura</span>
                          </label>
                        </div>
                        <input
                          placeholder={tipoComp === "boleta" ? "DNI del cliente" : "RUC de la empresa"}
                          value={rucDni}
                          onChange={e => setRucDni(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                        <button onClick={emitir} disabled={loading}
                          className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition disabled:opacity-40">
                          {loading ? "Emitiendo..." : "Emitir comprobante"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Métodos de pago */}
                  {comprobante && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-700 mb-3">Métodos de pago</h3>
                      <div className="space-y-3">
                        {metodos.map((m, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <select value={m.metodo_pago} onChange={e => updateMetodo(i, "metodo_pago", e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none">
                              {METODOS.map(met => (
                                <option key={met} value={met}>{METODO_ICON[met]} {met.replace("_"," ")}</option>
                              ))}
                            </select>
                            <input type="number" placeholder="Monto" value={m.monto}
                              onChange={e => updateMetodo(i, "monto", e.target.value)}
                              className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                            {m.metodo_pago !== "efectivo" && (
                              <input placeholder="Voucher / referencia" value={m.referencia_voucher}
                                onChange={e => updateMetodo(i, "referencia_voucher", e.target.value)}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                              />
                            )}
                            {metodos.length > 1 && (
                              <button onClick={() => quitarMetodo(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={agregarMetodo} className="text-xs text-green-600 hover:underline mt-2">
                        + Agregar otro método
                      </button>

                      {/* Resumen de cobro */}
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Total a cobrar</span><span>S/ {totalComp.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Total ingresado</span><span>S/ {totalPagando.toFixed(2)}</span></div>
                        <div className={`flex justify-between font-bold text-base ${vuelto >= 0 ? "text-green-700" : "text-red-600"}`}>
                          <span>{vuelto >= 0 ? "Vuelto" : "Falta"}</span>
                          <span>S/ {Math.abs(vuelto).toFixed(2)}</span>
                        </div>
                      </div>

                      <button onClick={cobrar} disabled={loading || totalPagando < totalComp}
                        className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-bold text-base hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? "Procesando..." : `Cobrar S/ ${totalComp.toFixed(2)}`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}