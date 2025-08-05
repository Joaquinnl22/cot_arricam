"use client";
import React, { useState } from "react";
import { PiX, PiCheck } from "react-icons/pi";

const CATEGORIAS_DISPONIBLES = [
  { id: 'FLETES', nombre: 'FLETES', color: 'bg-blue-100 text-blue-800' },
  { id: 'SUELDOS_IMPOSIC', nombre: 'SUELDOS/IMPOSIC', color: 'bg-green-100 text-green-800' },
  { id: 'MATERIALES', nombre: 'MATERIALES', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'VEHICULOS', nombre: 'VEHICULOS', color: 'bg-red-100 text-red-800' },
  { id: 'VEHICULO_AUTOPISTAS', nombre: 'VEHICULO AUTOPISTAS', color: 'bg-orange-100 text-orange-800' },
  { id: 'VEHICULO_SEGUROS', nombre: 'VEHICULO SEGUROS', color: 'bg-pink-100 text-pink-800' },
  { id: 'PUBLICIDAD', nombre: 'PUBLICIDAD', color: 'bg-purple-100 text-purple-800' },
  { id: 'ART_ESCRITORIO', nombre: 'ART. ESCRITORIO', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'COMBUSTIBLE', nombre: 'COMBUSTIBLE', color: 'bg-orange-100 text-orange-800' },
  { id: 'CONTADOR_ABOGADO_REDES', nombre: 'CONTADOR/ABOGADO/REDES', color: 'bg-pink-100 text-pink-800' },
  { id: 'IVA', nombre: 'IVA', color: 'bg-gray-100 text-gray-800' },
  { id: 'RENTA', nombre: 'RENTA', color: 'bg-teal-100 text-teal-800' },
  { id: 'IMPTOS_BANCARIOS', nombre: 'IMPTOS BANCARIOS', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'REPUESTOS_REPARAC', nombre: 'REPUESTOS/REPARAC', color: 'bg-lime-100 text-lime-800' },
  { id: 'CAJA_CHICA', nombre: 'CAJA CHICA', color: 'bg-amber-100 text-amber-800' },
  { id: 'TRANSFERENCIAS', nombre: 'TRANSFERENCIAS', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'INVERSIONES', nombre: 'INVERSIONES/FDOS MUTUOS', color: 'bg-violet-100 text-violet-800' },
  { id: 'DEVOLUCION_GARANTIAS', nombre: 'DEVOLUCION GARANTIAS', color: 'bg-rose-100 text-rose-800' },
  { id: 'COMPRA_CONTAINERS', nombre: 'COMPRA CONTAINERS-INVERSIONES', color: 'bg-sky-100 text-sky-800' },
  { id: 'OTROS_GASTOS', nombre: 'OTROS GASTOS', color: 'bg-slate-100 text-slate-800' }
];

export default function TodasCuentasModal({ 
  isOpen, 
  onClose, 
  movimientos, 
  onConfirmar 
}) {
  const [categorizaciones, setCategorizaciones] = useState({});

  const handleCategorizar = (movimientoId, categoria, tipoCuenta = null) => {
    setCategorizaciones(prev => ({
      ...prev,
      [movimientoId]: {
        categoria,
        tipoCuenta: tipoCuenta || prev[movimientoId]?.tipoCuenta || ''
      }
    }));
  };

  const handleConfirmar = () => {
    onConfirmar(categorizaciones);
    setCategorizaciones({});
    onClose();
  };

  const handleCancelar = () => {
    setCategorizaciones({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Categorizar Todas las Cuentas
          </h2>
          <button
            onClick={handleCancelar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <PiX className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-gray-600 mb-6">
            Categoriza todos los movimientos. Los del Banco de Chile ya tienen tipo de cuenta predefinido por archivo.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Descripción</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Banco</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Monto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Tipo Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento, index) => {
                  const esBancoChile = movimiento.banco === 'Banco de Chile';
                  const esBancoSantander = movimiento.banco === 'Banco Santander';
                  const categoriaActual = categorizaciones[index]?.categoria || movimiento.categoria;
                  const tipoCuentaActual = categorizaciones[index]?.tipoCuenta || movimiento.tipoCuenta;

                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-800 text-sm">{movimiento.descripcion}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {movimiento.fecha}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {movimiento.banco}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        ${movimiento.monto.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={categoriaActual || ''}
                          onChange={(e) => handleCategorizar(index, e.target.value, tipoCuentaActual)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          {CATEGORIAS_DISPONIBLES.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {esBancoChile ? (
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            {movimiento.tipoCuenta === 'venta' ? 'VENTA' : 'ARRIENDO'}
                          </div>
                        ) : esBancoSantander ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCategorizar(index, categoriaActual, 'arriendo')}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                tipoCuentaActual === 'arriendo'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              Arriendo
                            </button>
                            <button
                              onClick={() => handleCategorizar(index, categoriaActual, 'venta')}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                tipoCuentaActual === 'venta'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              Venta
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancelar}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!movimientos.every((_, index) => {
              const cat = categorizaciones[index];
              const mov = movimientos[index];
              const categoria = cat?.categoria || mov.categoria;
              const tipoCuenta = cat?.tipoCuenta || mov.tipoCuenta;
              return categoria && categoria !== 'SIN_CATEGORIZAR' && 
                     (mov.banco !== 'Banco Santander' || tipoCuenta);
            })}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <PiCheck className="mr-2" />
            Confirmar Categorización
          </button>
        </div>
      </div>
    </div>
  );
} 