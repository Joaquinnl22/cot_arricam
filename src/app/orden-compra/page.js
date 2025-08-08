"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import Navbar from "../../components/Navbar/NavBar";

const OrdenCompraPage = () => {
  const [form, setForm] = useState({
    numeroOrden: "",
    fecha: new Date().toISOString().split("T")[0],
    empresa: "",
    tipoEmpresa: "ferreteria", // Opciones: 'ferreteria', 'limiere', 'inmobiliaria'
    vendedor: "",
    emitidaPor: "",
    solicitadaPor: "BODEGA",
    atencionDe: "",
    transporte: "",
    observaciones: "",
    direccionDespacho: "",
    descuento: 0,
    incluirDespacho: false,
  });

  useEffect(() => {
    fetch("https://arricam-pdf-service.onrender.com/")
      .then(() => console.log("🔄 API activada"))
      .catch(() => console.warn("⚠️ No se pudo hacer pre-warm"));
  }, []);

  const [items, setItems] = useState([]);
  const [customItem, setCustomItem] = useState({
    descripcion: "",
    cantidad: 1,
    valor: 0,
  });
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  // Función para guardar estado temporal
  const saveTemporaryState = () => {
    const tempState = {
      form,
      items,
      customItem,
      showCustomItem,
      timestamp: Date.now()
    };
    localStorage.setItem('ordenCompraTemp', JSON.stringify(tempState));
    console.log("💾 Estado temporal guardado");
  };

  // Función para cargar estado temporal
  const loadTemporaryState = () => {
    try {
      const saved = localStorage.getItem('ordenCompraTemp');
      if (saved) {
        const tempState = JSON.parse(saved);
        const timeDiff = Date.now() - tempState.timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Solo cargar si tiene menos de 24 horas
        if (hoursDiff < 24) {
          setForm(tempState.form);
          setItems(tempState.items || []);
          setCustomItem(tempState.customItem || { descripcion: "", cantidad: 1, valor: 0 });
          setShowCustomItem(tempState.showCustomItem || false);
          console.log("📂 Estado temporal cargado");
          return true;
        } else {
          localStorage.removeItem('ordenCompraTemp');
          console.log("🗑️ Estado temporal expirado, eliminado");
        }
      }
    } catch (error) {
      console.error("❌ Error cargando estado temporal:", error);
      localStorage.removeItem('ordenCompraTemp');
    }
    return false;
  };

  // Función para limpiar estado temporal
  const clearTemporaryState = () => {
    localStorage.removeItem('ordenCompraTemp');
    console.log("🗑️ Estado temporal eliminado");
  };

  async function fetchContadorOrdenCompra() {
    try {
      console.log("🔄 Iniciando fetchContadorOrdenCompra...");
      const res = await fetch("/api/contador-orden-compra");
      const data = await res.json();
      console.log("📋 Respuesta completa:", data);
      console.log("📋 Obteniendo contador:", data.valor);
      console.log("📋 Tipo de valor:", typeof data.valor);
      setForm((f) => ({ ...f, numeroOrden: data.valor?.toString() || "1950" }));
      console.log("✅ Formulario actualizado con número:", data.valor?.toString() || "1950");
    } catch (error) {
      console.error("❌ Error obteniendo contador de orden de compra", error);
      // Si hay error, usar 1950 como fallback
      setForm((f) => ({ ...f, numeroOrden: "1950" }));
    }
  }



  useEffect(() => {
    // Intentar cargar estado temporal primero
    const tempLoaded = loadTemporaryState();
    
    // Si no hay estado temporal, cargar contador normal
    if (!tempLoaded) {
      fetchContadorOrdenCompra();
    }
  }, []);

  // Guardar estado temporal automáticamente cuando cambie
  useEffect(() => {
    // Solo guardar si hay datos en el formulario
    if (form.empresa || items.length > 0) {
      saveTemporaryState();
    }
  }, [form, items, customItem, showCustomItem]);

  const handleAddCustomItem = () => {
    if (customItem.descripcion && customItem.valor > 0) {
      setItems((prev) => [
        ...prev,
        {
          descripcion: customItem.descripcion,
          cantidad: customItem.cantidad,
          valor: customItem.valor,
        },
      ]);
      setCustomItem({ descripcion: "", cantidad: 1, valor: 0 });
    }
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...items];
    updated[index].cantidad = parseInt(value) || 1;
    setItems(updated);
  };

  const handleValueChange = (index, value) => {
    const updated = [...items];
    updated[index].valor = parseInt(value) || 0;
    setItems(updated);
  };

  const handleDownloadPDF = async () => {
    if (!form.numeroOrden || !form.fecha || !form.empresa || items.length === 0) {
      alert("Por favor completa: Número de orden, fecha, empresa y al menos un item");
      setIsDownloading(false);
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(
        "https://arricam-pdf-service.onrender.com/api/generateordencompra",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numeroOrden: form.numeroOrden,
            fecha: form.fecha,
            empresa: form.empresa,
            emitidaPor: form.emitidaPor,
            solicitadaPor: form.solicitadaPor,
            atencionDe: form.atencionDe,
            transporte: form.transporte,
            items: items,
            observaciones: form.observaciones,
            direccionDespacho: form.incluirDespacho ? form.direccionDespacho : "",
            descuento: form.descuento,
            tipoEmpresa: form.tipoEmpresa,
            vendedor: form.vendedor,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error al generar PDF: ${errorData.message || 'Error desconocido'}`);
        setIsDownloading(false);
        return;
      }

      // Incrementar contador después de generar PDF exitosamente
      console.log("🔄 Incrementando contador...");
      const contadorRes = await fetch("/api/contador-orden-compra", { method: "PATCH" });
      const contadorData = await contadorRes.json();
      console.log("📊 Nuevo valor del contador:", contadorData.valor);
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeNumero = form.numeroOrden.replace(/[^\w\d\-_]/g, "_");
      a.download = `orden-compra-${safeNumero}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Actualizar el formulario con el nuevo número de orden
      await fetchContadorOrdenCompra();
      
      // Limpiar estado temporal después de generar PDF exitosamente
      clearTemporaryState();
      
      // Mostrar mensaje de éxito
      setDownloadSuccess(true);
      setDownloadMessage(`✅ Orden de compra ${form.numeroOrden} generada y descargada exitosamente`);
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        setDownloadSuccess(false);
        setDownloadMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setDownloadSuccess(false);
      setDownloadMessage("❌ Error al generar PDF: " + (error.message || "Error desconocido"));
      
      // Ocultar mensaje de error después de 5 segundos
      setTimeout(() => {
        setDownloadSuccess(false);
        setDownloadMessage("");
      }, 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const resetForm = async () => {
    setForm({
      numeroOrden: "",
      fecha: new Date().toISOString().split("T")[0],
      empresa: "",
      tipoEmpresa: "ferreteria",
      vendedor: "",
      emitidaPor: "",
      solicitadaPor: "BODEGA",
      atencionDe: "",
      transporte: "",
      observaciones: "",
      direccionDespacho: "",
      descuento: 0,
      incluirDespacho: false,
    });
    setItems([]);
    setCustomItem({ descripcion: "", cantidad: 1, valor: 0 });
    setShowCustomItem(false);
    clearTemporaryState(); // Limpiar estado temporal
    await fetchContadorOrdenCompra(); // Obtener nuevo número de orden
  };

  const formatCLP = (value) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.valor), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const subtotalConDescuento = subtotal + form.descuento;
    const iva = Math.round(subtotalConDescuento * 0.19);
    return subtotalConDescuento + iva;
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-6 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-5xl w-full border border-gray-200">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
            📋 Nueva Orden de Compra
          </h1>

          {/* Mensaje de confirmación */}
          {downloadMessage && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              downloadSuccess 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{downloadMessage}</p>
                <button
                  onClick={() => {
                    setDownloadSuccess(false);
                    setDownloadMessage("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <input
              placeholder="N° Orden de Compra"
              value={form.numeroOrden}
              onChange={(e) => setForm({ ...form, numeroOrden: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="Empresa"
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <select
              value={form.tipoEmpresa}
              onChange={(e) => setForm({ ...form, tipoEmpresa: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="ferreteria">FERRETERIA Y COMERCIALIZADORA ARRICAM DOS SPA</option>
              <option value="limiere">ARRICAM SPA (LIMIERE)</option>
              <option value="inmobiliaria">Inmobiliaria Arricam Spa</option>
            </select>
            <input
              placeholder="Vendedor"
              value={form.vendedor}
              onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <select
              value={form.emitidaPor}
              onChange={(e) => setForm({ ...form, emitidaPor: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Seleccionar quien emite</option>
              <option value="Alejandra Castro">Alejandra Castro</option>
              <option value="Paola Hernandez">Paola Hernandez</option>
            </select>
            <input
              placeholder="Solicitada por"
              value={form.solicitadaPor}
              onChange={(e) => setForm({ ...form, solicitadaPor: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="Atención de"
              value={form.atencionDe}
              onChange={(e) => setForm({ ...form, atencionDe: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="Transporte"
              value={form.transporte}
              onChange={(e) => setForm({ ...form, transporte: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="incluirDespacho"
                checked={form.incluirDespacho}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm({ 
                    ...form, 
                    incluirDespacho: checked,
                    direccionDespacho: checked ? "CAMINO LONQUEN, PARCELA 48, MAIPU (PORTON AMARILLO ORILLA A CALLE LONQUEN) LUNES A VIERNES DE 9 A 13 Y 14 A 17 HRS. OFICINA 958168819" : ""
                  });
                }}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor="incluirDespacho" className="text-sm font-medium text-gray-700">
                Incluir despacho
              </label>
            </div>
            <div className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500">
              {form.incluirDespacho ? (
                <input
                  placeholder="Dirección de despacho"
                  value={form.direccionDespacho}
                  onChange={(e) => setForm({ ...form, direccionDespacho: e.target.value })}
                  className="w-full bg-transparent outline-none"
                />
              ) : (
                <span className="text-gray-600 font-medium">RETIRO</span>
              )}
            </div>
          </div>

          {/* Información de la empresa seleccionada */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🏢 Información de la Empresa Seleccionada
            </h3>
            {(() => {
              let datosEmpresa;
              switch (form.tipoEmpresa) {
                case 'limiere':
                  datosEmpresa = {
                    nombre: 'ARRICAM SPA',
                    direccion: 'LIMIERE #0280-MAIPU',
                    ciudad: 'SANTIAGO',
                    telefono: '225356022-222329030',
                    rut: '760.050457-2'
                  };
                  break;
                case 'inmobiliaria':
                  datosEmpresa = {
                    nombre: 'Inmobiliaria Arricam Spa',
                    direccion: 'Camino Lonquen parcela 48, Maipu',
                    ciudad: 'Giro Inmobiliaria',
                    telefono: '',
                    rut: '96.876.650-3'
                  };
                  break;
                case 'ferreteria':
                default:
                  datosEmpresa = {
                    nombre: 'FERRETERIA Y COMERCIALIZADORA ARRICAM DOS SPA',
                    direccion: 'GENERAL ORDOÑEZ #155',
                    ciudad: 'MAIPU',
                    telefono: '225356022-225359030',
                    rut: '77,779,321-7'
                  };
                  break;
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-blue-700">Nombre:</span>
                    <p className="text-blue-800">{datosEmpresa.nombre}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Dirección:</span>
                    <p className="text-blue-800">{datosEmpresa.direccion}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Ciudad/Giro:</span>
                    <p className="text-blue-800">{datosEmpresa.ciudad}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">Teléfono:</span>
                    <p className="text-blue-800">{datosEmpresa.telefono || 'No disponible'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-700">RUT:</span>
                    <p className="text-blue-800">{datosEmpresa.rut}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowCustomItem(!showCustomItem)}
              className="text-yellow-700 font-semibold mb-2 hover:underline"
            >
              {showCustomItem
                ? "➖ Ocultar item personalizado"
                : "➕ Item personalizado"}
            </button>

            {showCustomItem && (
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  ➕ Item Personalizado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      placeholder="Descripción del item"
                      value={customItem.descripcion}
                      onChange={(e) =>
                        setCustomItem({ ...customItem, descripcion: e.target.value })
                      }
                      className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customItem.cantidad}
                      onChange={(e) =>
                        setCustomItem({ ...customItem, cantidad: parseInt(e.target.value) || 1 })
                      }
                      className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Unitario
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Valor"
                      value={
                        customItem.valor === 0
                          ? ""
                          : customItem.valor.toLocaleString("es-CL")
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\./g, "")
                          .replace(/\D/g, "");
                        setCustomItem({
                          ...customItem,
                          valor: parseInt(val || "0"),
                        });
                      }}
                      className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      onClick={handleAddCustomItem}
                      disabled={!customItem.descripcion || customItem.valor <= 0}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                    >
                      ➕ Agregar Item
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Valor Unitario</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-yellow-50 border-b">
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(i, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[i].descripcion = e.target.value;
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.valor === 0 ? "" : item.valor.toLocaleString("es-CL")}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\./g, "")
                            .replace(/\D/g, "");
                          handleValueChange(i, val);
                        }}
                        className="w-32 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      ${(item.cantidad * item.valor).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveItem(i)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">
                Descuento/Despacho
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.descuento === 0 ? "" : form.descuento.toLocaleString("es-CL")}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/\./g, "")
                    .replace(/\D/g, "");
                  setForm({ ...form, descuento: parseInt(val || "0") });
                }}
                className="border border-gray-300 bg-gray-100 px-4 py-2 rounded"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              placeholder="Escribe observaciones adicionales..."
              value={form.observaciones || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, observaciones: e.target.value }))
              }
              rows={5}
              className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>



            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
              <div className="text-xl font-semibold text-gray-700">
                Total: {formatCLP(calculateTotal())}
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <Button
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  ♻️ Limpiar
                </Button>
                <Button
                  onClick={clearTemporaryState}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  🗑️ Limpiar Temporal
                </Button>

                <Button
                  onClick={handleDownloadPDF}
                  disabled={items.length === 0 || isDownloading}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Generando PDF...
                    </div>
                  ) : (
                    <>✅ Confirmar y Descargar PDF</>
                  )}
                </Button>
              </div>
            </div>
        </div>
      </main>
    </>
  );
};

export default OrdenCompraPage; 