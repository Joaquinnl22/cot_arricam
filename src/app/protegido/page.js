"use client";
import React from 'react';
import Navbar from '../../components/Navbar/NavBar';


export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-18 flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 text-gray-800 px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-6">
          Bienvenido a <span className="text-yellow-500">ARRICAM</span>
        </h1>
        <p className="mb-10 max-w-2xl text-center text-lg text-gray-600">
          Plataforma intuitiva para gestionar contratos y facturas de forma clara y eficiente.
        </p>

        {/* Buscador rápido */}
        <div className="w-full max-w-xl bg-white rounded-xl shadow p-4 flex items-center gap-2 mt-12">
  
          <input
            type="text"
            placeholder="Buscar contratos o facturas..."
            className="w-full border-none focus:outline-none text-gray-700"
          />
        </div>
      </main>
    </>
  );
}
