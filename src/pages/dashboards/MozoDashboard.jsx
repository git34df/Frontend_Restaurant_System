import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarPedidos,
  crearPedido,
  cambiarEstado,
  buscarPorDocumento,
  crearCliente,
  listarDisponibles,
  crearReclamo,
} from "../../services/PedidoService";

const ESTADO_BADGE = {
  registrado:     "bg-blue-100 text-blue-700",
  en_preparacion: "bg-yellow-100 text-yellow-700",
  listo:          "bg-green-100 text-green-700",
  entregado:      "bg-gray-200 text-gray-600",
  anulado:        "bg-red-100 text-red-500",
};

export default function MozoDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab]             = useState("pedidos");
  const [pedidos, setPedidos]     = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [docBusqueda, setDocBusqueda]             = useState("");
  const [clienteResultados, setClienteResultados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarFormCliente, setMostrarFormCliente]   = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_cliente: "", documento_identidad: "", tipo_documento: "DNI",
    telefono_cliente: "", email_cliente: ""
  });

  const [carrito, setCarrito]         = useState([]);
  const [notasPedido, setNotasPedido] = useState("");
  const [tipoPedido, setTipoPedido]   = useState("salon");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Modal de reclamo
  const [modalReclamo, setModalReclamo]         = useState(false);
  const [pedidoReclamo, setPedidoReclamo]       = useState(null);
  const [motivoReclamo, setMotivoReclamo]       = useState("");
  const [productoAfectado, setProductoAfectado] = useState("");
  const [montoReclamo, setMontoReclamo]         = useState("");
  const [loadingReclamo, setLoadingReclamo]     = useState(false);
  const [errorReclamo, setErrorReclamo]         = useState("");

  useEffect(() => {
    fetchPedidos();
    listarDisponibles().then(r => setProductos(r.data));
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const r = await listarPedidos();
      setPedidos(r.data);
    } catch { setError("Error cargando pedidos"); }
    setLoading(false);
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const buscarCliente = async () => {
    if (!docBusqueda.trim()) return;
    const r = await buscarPorDocumento(docBusqueda);
    setClienteResultados(r.data);
    if (r.data.length === 0) setMostrarFormCliente(true);
  };

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setClienteResultados([]);
    setDocBusqueda("");
    setMostrarFormCliente(false);
  };

  const registrarCliente = async () => {
    if (!nuevoCliente.nombre_cliente || !nuevoCliente.documento_identidad) {
      return setError("Nombre y documento son obligatorios");
    }
    try {
      const r = await crearCliente(nuevoCliente);
      seleccionarCliente(r.data);
      setSuccess("Cliente registrado correctamente");
      setMostrarFormCliente(false);
    } catch (e) {
      setError(e.response?.data?.message || "Error al registrar cliente");
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto.id_producto === producto.id_producto);
      if (existe) return prev.map(i =>
        i.producto.id_producto === producto.id_producto
          ? { ...i, cantidad: i.cantidad + 1 } : i
      );
      return [...prev, { producto, cantidad: 1, notas: "" }];
    });
  };

  const quitarDelCarrito = (id) =>
    setCarrito(prev => prev.filter(i => i.producto.id_producto !== id));

  const cambiarCantidad = (id, delta) =>
    setCarrito(prev => prev.map(i =>
      i.producto.id_producto === id
        ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i
    ));

  const totalCarrito = carrito.reduce(
    (acc, i) => acc + i.producto.precio_producto * i.cantidad, 0
  );

  const enviarPedido = async () => {
    setError("");
    if (!clienteSeleccionado) return setError("Selecciona un cliente");
    if (carrito.length === 0) return setError("Agrega al menos un producto");
    try {
      setLoading(true);
      const items = carrito.map(i => ({
        id_producto:      i.producto.id_producto,
        cantidad:         i.cantidad,
        precio_unitario:  i.producto.precio_producto,
        notas_especiales: i.notas || null,
      }));
      await crearPedido({
        id_cliente:   clienteSeleccionado.id_cliente,
        id_empleado:  user?.id_empleado,
        notas_pedido: notasPedido || null,
        tipo_pedido:  tipoPedido,
        items,
      });
      setSuccess("Pedido registrado correctamente");
      setCarrito([]);
      setClienteSeleccionado(null);
      setNotasPedido("");
      setTipoPedido("salon");
      setTab("pedidos");
      fetchPedidos();
    } catch (e) {
      setError(e.response?.data?.message || "Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  const anularPedido = async (id) => {
    if (!confirm("Anular este pedido?")) return;
    await cambiarEstado(id, "anulado");
    fetchPedidos();
  };

  const abrirModalReclamo = (pedido) => {
    setPedidoReclamo(pedido);
    setMotivoReclamo("");
    setProductoAfectado("");
    setMontoReclamo("");
    setErrorReclamo("");
    setModalReclamo(true);
  };

  const cerrarModalReclamo = () => {
    setModalReclamo(false);
    setPedidoReclamo(null);
  };

  const enviarReclamo = async () => {
    if (!motivoReclamo.trim()) return setErrorReclamo("El motivo es obligatorio");
    try {
      setLoadingReclamo(true);
      await crearReclamo({
        id_pedido:               pedidoReclamo.id_pedido,
        id_cliente:              pedidoReclamo.id_cliente,
        id_empleado_solicitante: user?.id_empleado,
        motivo:                  motivoReclamo.trim(),
        producto_afectado:       productoAfectado.trim() || null,
        monto_seleccionado:      montoReclamo ? parseFloat(montoReclamo) : 0,
      });
      setSuccess(`Reclamo registrado para el pedido #${pedidoReclamo.id_pedido}`);
      cerrarModalReclamo();
    } catch (e) {
      setErrorReclamo(e.response?.data?.message || "Error al registrar el reclamo");
    } finally {
      setLoadingReclamo(false);
    }
  };

  const categorias = ["Todas", ...new Set(productos.map(p => p.nombre_categoria))];
  const productosFiltrados = filtroCategoria === "Todas"
    ? productos
    : productos.filter(p => p.nombre_categoria === filtroCategoria);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">D&apos;Alicias — Mozo</h1>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("pedidos"); setError(""); setSuccess(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "pedidos" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Mis Pedidos
          </button>
          <button onClick={() => { setTab("nuevo"); setError(""); setSuccess(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "nuevo" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            + Nuevo Pedido
          </button>
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition">Salir</button>
        </div>
      </header>

      <div className="px-6 pt-4">
        {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-3 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-3 text-sm">{success}</div>}
      </div>

      {tab === "pedidos" && (
        <div className="px-6 pb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Pedidos activos</h2>
          {loading ? <p className="text-gray-400 text-sm">Cargando...</p>
          : pedidos.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No hay pedidos aún. Crea el primero.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pedidos.map(p => (
                <div key={p.id_pedido} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">#{p.id_pedido}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[p.estado_pedido]}`}>
                          {p.estado_pedido.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">👤 {p.nombre_cliente}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(p.fecha_hora).toLocaleString("es-PE")}</p>
                      {p.notas_pedido && <p className="text-xs text-gray-500 italic mt-1">📝 {p.notas_pedido}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">S/ {Number(p.total).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">IGV: S/ {Number(p.igv).toFixed(2)}</p>
                      <div className="flex gap-3 justify-end mt-2">
                        {p.estado_pedido === "registrado" && (
                          <button onClick={() => anularPedido(p.id_pedido)} className="text-xs text-red-500 hover:underline">Anular</button>
                        )}
                        {p.estado_pedido !== "anulado" && (
                          <button
                            onClick={() => abrirModalReclamo(p)}
                            className="text-xs text-orange-500 hover:underline font-medium"
                          >
                            ⚠️ Reclamar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "nuevo" && (
        <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-5">

            {/* Paso 1: Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">1. Cliente</h3>
              {clienteSeleccionado ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-medium text-orange-800">{clienteSeleccionado.nombre_cliente}</p>
                    <p className="text-xs text-orange-600">{clienteSeleccionado.tipo_documento}: {clienteSeleccionado.documento_identidad}</p>
                  </div>
                  <button onClick={() => setClienteSeleccionado(null)} className="text-xs text-red-500 hover:underline">Cambiar</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Buscar por DNI / RUC..." value={docBusqueda}
                      onChange={e => setDocBusqueda(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && buscarCliente()}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <button onClick={buscarCliente} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition">Buscar</button>
                  </div>
                  {clienteResultados.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                      {clienteResultados.map(c => (
                        <button key={c.id_cliente} onClick={() => seleccionarCliente(c)}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm border-b last:border-0">
                          <span className="font-medium">{c.nombre_cliente}</span>
                          <span className="text-gray-400 ml-2">{c.tipo_documento}: {c.documento_identidad}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {mostrarFormCliente && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-600 mb-2">Registrar nuevo cliente</p>
                      <input placeholder="Nombre completo *" value={nuevoCliente.nombre_cliente}
                        onChange={e => setNuevoCliente({...nuevoCliente, nombre_cliente: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                      <div className="flex gap-2">
                        <select value={nuevoCliente.tipo_documento}
                          onChange={e => setNuevoCliente({...nuevoCliente, tipo_documento: e.target.value})}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                          <option>DNI</option><option>RUC</option><option>CE</option><option>PASAPORTE</option>
                        </select>
                        <input placeholder="Número *" value={nuevoCliente.documento_identidad}
                          onChange={e => setNuevoCliente({...nuevoCliente, documento_identidad: e.target.value})}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                      <input placeholder="Teléfono (opcional)" value={nuevoCliente.telefono_cliente}
                        onChange={e => setNuevoCliente({...nuevoCliente, telefono_cliente: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <button onClick={registrarCliente}
                        className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 transition mt-1">
                        Registrar cliente
                      </button>
                    </div>
                  )}
                  {!mostrarFormCliente && (
                    <button onClick={() => setMostrarFormCliente(true)} className="text-xs text-orange-500 hover:underline mt-1">
                      + Registrar nuevo cliente
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Paso 2: Productos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">2. Seleccionar productos</h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {categorias.map(cat => (
                  <button key={cat} onClick={() => setFiltroCategoria(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroCategoria === cat ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productosFiltrados.map(p => {
                  const enCarrito = carrito.find(i => i.producto.id_producto === p.id_producto);
                  return (
                    <button key={p.id_producto} onClick={() => agregarAlCarrito(p)}
                      className={`relative text-left border rounded-xl p-3 transition hover:shadow-md ${enCarrito ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
                      {enCarrito && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {enCarrito.cantidad}
                        </span>
                      )}
                      <p className="font-medium text-gray-800 text-sm leading-tight pr-6">{p.nombre_producto}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.nombre_categoria}</p>
                      <p className="text-orange-600 font-semibold text-sm mt-1">S/ {Number(p.precio_producto).toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 3: Tipo de pedido y notas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">3. Tipo de pedido</h3>
              <div className="flex gap-3 mb-4">
                <label className={`flex-1 flex items-center gap-2 border rounded-xl p-3 cursor-pointer transition ${tipoPedido === "salon" ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" value="salon" checked={tipoPedido === "salon"}
                    onChange={() => setTipoPedido("salon")} className="accent-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">🍽️ Salón</p>
                    <p className="text-xs text-gray-400">Mesa / local</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-2 border rounded-xl p-3 cursor-pointer transition ${tipoPedido === "delivery" ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" value="delivery" checked={tipoPedido === "delivery"}
                    onChange={() => setTipoPedido("delivery")} className="accent-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">🚚 Delivery</p>
                    <p className="text-xs text-gray-400">Envío a domicilio</p>
                  </div>
                </label>
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">Notas del pedido (opcional)</h3>
              <textarea rows={2} placeholder="Ej: sin cebolla, mesa 5, dirección de entrega..." value={notasPedido}
                onChange={e => setNotasPedido(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>
          </div>

          {/* Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-4">
              <h3 className="font-semibold text-gray-700 mb-4">Orden</h3>
              {carrito.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Agrega productos al pedido</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {carrito.map(item => (
                    <div key={item.producto.id_producto} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.producto.nombre_producto}</p>
                        <p className="text-xs text-gray-400">S/ {Number(item.producto.precio_producto).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => cambiarCantidad(item.producto.id_producto, -1)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold">−</button>
                        <span className="text-sm w-5 text-center">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item.producto.id_producto, +1)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold">+</button>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                        S/ {(item.producto.precio_producto * item.cantidad).toFixed(2)}
                      </span>
                      <button onClick={() => quitarDelCarrito(item.producto.id_producto)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>S/ {totalCarrito.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500"><span>IGV (18%)</span><span>S/ {(totalCarrito * 0.18).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-gray-800 text-base pt-1">
                  <span>Total</span><span className="text-orange-600">S/ {(totalCarrito * 1.18).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={enviarPedido} disabled={loading || carrito.length === 0 || !clienteSeleccionado}
                className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? "Registrando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECLAMO ── */}
      {modalReclamo && pedidoReclamo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">⚠️ Registrar Reclamo</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pedido #{pedidoReclamo.id_pedido} — {pedidoReclamo.nombre_cliente}
                </p>
              </div>
              <button
                onClick={cerrarModalReclamo}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info del pedido */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-5 text-sm text-gray-700 flex justify-between">
              <span>📅 {new Date(pedidoReclamo.fecha_hora).toLocaleString("es-PE")}</span>
              <span className="font-semibold text-orange-600">S/ {Number(pedidoReclamo.total).toFixed(2)}</span>
            </div>

            {/* Error */}
            {errorReclamo && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
                {errorReclamo}
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Motivo del reclamo <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe el problema con detalle..."
                  value={motivoReclamo}
                  onChange={e => setMotivoReclamo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Producto afectado <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lomo saltado, Chicha morada..."
                  value={productoAfectado}
                  onChange={e => setProductoAfectado(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Monto reclamado en S/ <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  placeholder="0.00"
                  value={montoReclamo}
                  onChange={e => setMontoReclamo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={cerrarModalReclamo}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarReclamo}
                disabled={loadingReclamo}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-40"
              >
                {loadingReclamo ? "Enviando..." : "Registrar reclamo"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}