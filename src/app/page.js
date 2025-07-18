"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PiShippingContainerFill } from "react-icons/pi";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirige automáticamente si ya está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/session", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated) {
        router.replace("/protegido");
      }
    };
    checkSession();
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault(); // Evita que el formulario recargue la página

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();

      if (data.success) {
        router.replace('/protegido'); // Redirige con router de Next.js
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error al intentar ingresar');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-5">
          <PiShippingContainerFill className="text-yellow-500 text-5xl animate-bounce" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 mb-6">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg transition-all border border-yellow-600"
          >
            Ingresar
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          © {new Date().getFullYear()} Arricam
        </p>
      </div>
    </div>
  );
}
