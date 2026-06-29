import api from './api';

// Pedidos
export const listarPedidos  = ()              => api.get('/pedidos');
export const obtenerPedido  = (id)            => api.get(`/pedidos/${id}`);
export const crearPedido    = (data)          => api.post('/pedidos', data);
export const cambiarEstado  = (id, estado)    => api.patch(`/pedidos/${id}/estado`, { estado_pedido: estado });
export const agregarItem    = (id, item)      => api.post(`/pedidos/${id}/items`, item);
export const eliminarItem   = (id, idDetalle) => api.delete(`/pedidos/${id}/items/${idDetalle}`);

// Clientes
export const listarClientes      = ()    => api.get('/clientes');
export const buscarPorDocumento  = (doc) => api.get(`/clientes/buscar?documento=${doc}`);
export const crearCliente        = (data)=> api.post('/clientes', data);

// Productos
export const listarDisponibles     = ()     => api.get('/productos/disponibles');
export const listarCategorias      = ()     => api.get('/productos/categorias');
export const listarProductos       = ()     => api.get('/productos');
export const crearProducto         = (data) => api.post('/productos', data);
export const cambiarEstadoProducto = (id, estado) => api.patch(`/productos/${id}/estado`, { estado_producto: estado });
export const editarProducto        = (id, data)   => api.put(`/productos/${id}`, data);

// Comprobantes
export const listarComprobantes = ()     => api.get('/comprobantes');
export const emitirComprobante  = (data) => api.post('/comprobantes', data);
export const comprobantePorPedido = (id) => api.get(`/comprobantes/pedido/${id}`);

// Pagos
export const registrarPago     = (data) => api.post('/pagos', data);
export const pagoPorComprobante = (id)  => api.get(`/pagos/comprobante/${id}`);

// Reclamos
export const listarReclamos    = ()     => api.get('/reclamos');
export const listarPendientes  = ()     => api.get('/reclamos/pendientes');
export const crearReclamo      = (data) => api.post('/reclamos', data);
export const resolverReclamo   = (id, data) => api.patch(`/reclamos/${id}/resolver`, data);

// Admin
export const kpisHoy           = ()          => api.get('/admin/kpis');
export const ventasSemanales   = ()          => api.get('/admin/ventas-semanales');
export const listarUsuarios    = ()          => api.get('/admin/usuarios');
export const toggleUsuario     = (id, activo) => api.patch(`/admin/usuarios/${id}/toggle`, { activo });
export const listarProductosAdmin = ()       => api.get('/admin/productos');

// Auth (Admin)
export const registrarUsuario = (data) => api.post('/auth/register', data);
export const listarRoles      = ()     => api.get('/auth/roles');

