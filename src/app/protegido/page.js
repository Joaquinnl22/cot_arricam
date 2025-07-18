"use client";
import React from 'react';
import Navbar from '../../components/Navbar/NavBar';
import { PiMagnifyingGlassBold } from "react-icons/pi";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 text-gray-800 px-6">
        <section className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Bienvenido a <span className="text-yellow-500">ARRICAM</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10">
            Plataforma intuitiva para gestionar contratos y facturas de forma clara, rápida y eficiente.
          </p>
        </section>

        {/* Buscador rápido */}
        <section className="w-full max-w-2xl mt-10">
          <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-3 border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500">
            <PiMagnifyingGlassBold className="text-gray-500 text-xl mr-3" />
            <input
              type="text"
              placeholder="Buscar contratos o facturas..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </section>

        {/* Sección informativa o acciones rápidas */}
        <section className="mt-16 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 text-center hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-yellow-600 mb-2">📄 Contratos</h3>
            <p className="text-sm text-gray-600">Revisa, crea o edita tus contratos activos y archivados.</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 text-center hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-yellow-600 mb-2">🧾 Facturas</h3>
            <p className="text-sm text-gray-600">Consulta y descarga facturas generadas para tus clientes.</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 text-center hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-yellow-600 mb-2">⚙️ Configuración</h3>
            <p className="text-sm text-gray-600">Personaliza la plataforma según las necesidades de tu empresa.</p>
          </div>
        </section>
      </main>
    </>
  );
}
