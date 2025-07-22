"use client";
import React from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar/NavBar";
import { PiMagnifyingGlassBold } from "react-icons/pi";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 text-gray-800 px-6">
        <section className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Bienvenido 
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10">
            Plataforma intuitiva para gestionar contratos y cotizaciones de forma clara, rápida y eficiente.
          </p>
        </section>

        {/* Buscador rápido */}
        <section className="w-full max-w-2xl mt-10">
          <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-3 border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500">
            <PiMagnifyingGlassBold className="text-gray-500 text-xl mr-3" />
            <input
              type="text"
              placeholder="Buscar contratos o cotizaciones..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </section>

        {/* Bloques principales */}
        <section className="mt-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/cotizacion">
            <div className="bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 shadow-lg rounded-xl p-8 text-center cursor-pointer transition-all duration-200">
              <h2 className="text-2xl font-bold text-yellow-700 mb-3">🧾 Cotizaciones para Arricam</h2>
              <p className="text-gray-700">
                Crea, edita o descarga cotizaciones para tus clientes de forma rápida.
              </p>
            </div>
          </Link>

          <Link href="/contratos">
            <div className="bg-blue-100 hover:bg-blue-200 border border-blue-300 shadow-lg rounded-xl p-8 text-center cursor-pointer transition-all duration-200">
              <h2 className="text-2xl font-bold text-blue-700 mb-3">📄 Contratos de sitios</h2>
              <p className="text-gray-700">
                Gestiona contratos de subarriendo y genera documentos oficiales.
              </p>
            </div>
          </Link>
        </section>
      </main>
    </>
  );
}
