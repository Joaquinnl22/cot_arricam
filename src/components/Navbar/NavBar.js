"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [cotizacionOpen, setCotizacionOpen] = useState(false);

  const toggleCotizacion = () => {
    setCotizacionOpen(!cotizacionOpen);
  };

  return (
    <nav className="bg-[#121212] text-yellow-400 fixed top-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <div className="text-xl font-bold">
<Link href="/" className="text-xl font-bold">
  ARRICAM
</Link>


        </div>

        <div className="flex space-x-8 text-lg items-center relative">
          {/* Cotizacion dropdown */}
          <div className="relative">
            <button
              onClick={toggleCotizacion}
              className="hover:text-yellow-300 focus:outline-none"
              type="button"
            >
              Cotizacion ▾
            </button>
            {cotizacionOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black text-yellow-400 rounded shadow-lg w-48 z-50">
<Link href="/cotizacion" className="block px-4 py-2 hover:bg-yellow-700/20">
  ➕ Agregar cotizacion
</Link>


                <Link href="/cotizacion/nuevo" className="block px-4 py-2 hover:bg-yellow-700/20">
       
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

