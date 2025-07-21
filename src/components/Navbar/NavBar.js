"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const [cotizacionOpen, setCotizacionOpen] = useState(false);
  const [contratosOpen, setContratosOpen] = useState(false);

  const toggleCotizacion = () => {
    setCotizacionOpen(!cotizacionOpen);
    setContratosOpen(false); // Cierra el otro dropdown
  };

  const toggleContratos = () => {
    setContratosOpen(!contratosOpen);
    setCotizacionOpen(false); // Cierra el otro dropdown
  };

  return (
    <nav className="bg-[#121212] text-yellow-400 fixed top-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold tracking-wide">
          <Link href="/" className="hover:text-yellow-300 transition-colors duration-200">
            ARRICAM
          </Link>
        </div>

        <div className="flex space-x-8 text-lg items-center relative">
          {/* Contratos dropdown */}
          <div className="relative">
            <button
              onClick={toggleContratos}
              className="flex items-center gap-1 hover:text-yellow-300 transition-colors duration-200"
              type="button"
            >
              Contratos
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  contratosOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {contratosOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black text-yellow-400 rounded shadow-lg w-56 z-50 border border-yellow-800">
                <Link
                  href="/contratos"
                  className="block px-4 py-2 hover:bg-yellow-700/20 transition"
                >
                  ➕ Agregar contrato
                </Link>
              </div>
            )}
          </div>

          {/* Cotizacion dropdown */}
          <div className="relative">
            <button
              onClick={toggleCotizacion}
              className="flex items-center gap-1 hover:text-yellow-300 transition-colors duration-200"
              type="button"
            >
              Cotización
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  cotizacionOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {cotizacionOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black text-yellow-400 rounded shadow-lg w-56 z-50 border border-yellow-800">
                <Link
                  href="/cotizacion"
                  className="block px-4 py-2 hover:bg-yellow-700/20 transition"
                >
                  ➕ Agregar cotización
                </Link>
                <Link
                  href="/cotizacion/nuevo"
                  className="block px-4 py-2 hover:bg-yellow-700/20 transition"
                >
                  📄 Ver productos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
