import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      // Guardar sesión
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirigir al sistema
      navigate("/dashboard");

    } catch (err) {
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  // Si ya está logueado, no volver al login
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl"
      >

        {/* Título */}
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          Restaurant System
        </h2>

        <p className="text-center text-gray-300 mb-6 text-sm">
          Inicia sesión para continuar
        </p>

        {/* Usuario */}
        <input
          name="username"
          placeholder="Usuario"
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          onChange={handleChange}
          className="w-full mb-6 p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Botón */}
        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-lg text-white font-semibold shadow-lg disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

      </form>
    </div>
  );
}

export default Login;