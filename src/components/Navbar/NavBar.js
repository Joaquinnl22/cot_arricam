"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isCotizacion = pathname.startsWith("/cotizacion");
  const isContratos = pathname.startsWith("/contratos");

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  return (
    <nav className="bg-[#121212] text-yellow-400 fixed top-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Link a inicio */}
        <div className="text-2xl font-bold tracking-wide">
          <Link
            href="/protegido"
            className="hover:text-yellow-300 transition-colors duration-200"
          >
            Inicio
          </Link>
        </div>

        <div className="flex space-x-8 text-lg items-center relative">
          {/* Dropdown Cotización */}
          {isCotizacion && (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-1 hover:text-yellow-300 transition-colors duration-200"
              >
                Cotización
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dropdownOpen && (
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
          )}

          {/* Dropdown Contratos */}
          {isContratos && (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-1 hover:text-yellow-300 transition-colors duration-200"
              >
                Contratos
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-black text-yellow-400 rounded shadow-lg w-56 z-50 border border-yellow-800">
                  <Link
                    href="/contratos"
                    className="block px-4 py-2 hover:bg-yellow-700/20 transition"
                  >
                    ➕ Nuevo contrato
                  </Link>
                  <Link
                    href="/contratos/listado"
                    className="block px-4 py-2 hover:bg-yellow-700/20 transition"
                  >
                    📄 Ver contratos
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
