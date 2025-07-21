"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar/NavBar";

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("venta");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    console.log("🔗 API:", process.env.NEXT_PUBLIC_PDF_API); // Se ejecuta en el navegador
    try {
      const res = await fetch("/api/productos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProductos(data);
        setError(null);
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch {
      setError("Error al cargar productos");
    }
  };

  const handleAddProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || precio === "") {
      setError("Completa nombre y precio");
      return;
    }

    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          descripcion,
          estado,
          precio: Number(precio),
        }),
      });

      if (!res.ok) throw new Error("Error al agregar producto");

      const nuevoProducto = await res.json();
      setProductos([nuevoProducto, ...productos]);
      setNombre("");
      setDescripcion("");
      setEstado("venta");
      setPrecio("");
      setError(null);
    } catch {
      setError("Error al agregar producto");
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-6 text-gray-800 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          🛒 Gestión de Productos
        </h1>

        <form
          onSubmit={handleAddProducto}
          className="mb-10 w-full max-w-4xl bg-white p-6 rounded-xl shadow-md border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ➕ Agregar Producto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Descripción
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Estado
              </label>
              <select
                className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="venta">Venta</option>
                <option value="arriendo">Arriendo</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Precio
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="$"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </form>

        <section className="w-full max-w-4xl bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📦 Lista de Productos
          </h2>
          <ul>
            {productos.map((prod, index) => (
              <li key={prod._id?.toString() || index} className="border-b py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      {prod.nombre}
                    </p>
                    <p className="italic text-sm text-gray-600">
                      {prod.descripcion}
                    </p>
                    <p className="text-sm font-semibold text-yellow-600 uppercase">
                      {prod.estado}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-gray-700">
                    {new Intl.NumberFormat("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    }).format(prod.precio)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {productos.length === 0 && (
            <p className="text-gray-500 text-center mt-6">
              No hay productos disponibles.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
