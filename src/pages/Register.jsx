import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [form, setForm] = useState({
    nombre: "",
    cargo: "",
    telefono: "",
    email: "",
    username: "",
    password: "",
    rol_id: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.rol_id) {
      alert("Selecciona un rol");
      return;
    }

    try {
      await api.post("/auth/register", {
        ...form,
        rol_id: Number(form.rol_id)
      });

      alert("Usuario creado 🚀");
    } catch (err) {
      alert("Error en registro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Crear Usuario
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input name="nombre" placeholder="Nombre" onChange={handleChange} className="input" />
          <input name="cargo" placeholder="Cargo" onChange={handleChange} className="input" />
          <input name="telefono" placeholder="Teléfono" onChange={handleChange} className="input" />
          <input name="email" placeholder="Email" onChange={handleChange} className="input" />

          <input name="username" placeholder="Usuario" onChange={handleChange} className="input col-span-2" />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} className="input col-span-2" />

          {/* 🔥 SELECT DE ROL */}
          <select name="rol_id" onChange={handleChange} className="input col-span-2">
            <option value="">Seleccionar rol</option>
            <option value="1">Administrador</option>
            <option value="2">Supervisor</option>
            <option value="3">Cajero</option>
            <option value="4">Mozo</option>
            <option value="5">Cocinero</option>
            <option value="6">Repartidor</option>
          </select>
        </div>

        <button className="w-full mt-6 bg-green-600 hover:bg-green-700 transition py-3 rounded-lg text-white font-semibold shadow-lg">
          Registrarse
        </button>

        <p className="text-center mt-5 text-sm text-gray-300">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;