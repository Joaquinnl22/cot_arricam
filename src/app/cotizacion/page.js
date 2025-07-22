"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button"; // Asegúrate de que el path sea correcto
import Navbar from "../../components/Navbar/NavBar";

const Cotizacion = () => {
  useEffect(() => {
    fetch("https://arricam-pdf-service.onrender.com/")
      .then(() => console.log("🔄 API de Render activada"))
      .catch(() => console.warn("⚠️ No se pudo hacer pre-warm"));
  }, []);
};

const QuotePage = () => {
  const [form, setForm] = useState({
    company: "",
    quoteNumber: "",
    client: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [tipoCotizacion, setTipoCotizacion] = useState("venta");
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customItem, setCustomItem] = useState({
    name: "",
    price: 0,
    description: "",
  });
  const [products, setProducts] = useState([]);
  const [guarantee, setGuarantee] = useState(0);
  const [dispatch, setDispatch] = useState(0);
  const [contador, setContador] = useState(null);
  const [persona, setPersona] = useState("paola");
  const personaData = {
    paola: { nombre: "Paola Hernandez", telefono: "+569 5816 8818" },
    alejandra: { nombre: "Alejandra Castro", telefono: "+569 5816 8819" },
  }[persona];

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/productos");
      if (!res.ok) {
        console.error(
          "❌ Error al obtener productos:",
          res.status,
          res.statusText
        );
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Respuesta inválida:", data);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchContador();
  }, []);

  const filteredProducts = products.filter((p) => p.estado === tipoCotizacion);

  const handleAddProduct = () => {
    const product = products.find(
      (p) => p._id?.toString() === selectedProductId
    ); // ✅ Comparar por _id
    if (product) {
      setItems((prev) => [
        ...prev,
        {
          name: product.nombre,
          price: product.precio,
          quantity: 1,
          description: product.descripcion || "-",
        },
      ]);
      setSelectedProductId("");
    }
  };

  const handleAddCustom = () => {
    if (customItem.name && customItem.price > 0) {
      setItems((prev) => [
        ...prev,
        {
          ...customItem,
          description: customItem.description || "-",
          quantity: 1,
        },
      ]);
      setCustomItem({ name: "", price: 0 });
    }
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...items];
    updated[index].quantity = parseInt(value) || 1;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!tipoCotizacion) {
      alert("Tipo de cotización no definido");
      setIsDownloading(false);
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(
        "https://arricam-pdf-service.onrender.com/api/generatepdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: tipoCotizacion,
            date: form.date,
            quoteNumber: form.quoteNumber,
            client: form.client,
            company: form.company,
            items,
            guarantee,
            dispatch,
            responsable: personaData.nombre,
            telefono: personaData.telefono,
          }),
        }
      );

      if (!res.ok) {
        alert("Error al generar PDF");
        setIsDownloading(false);
        return;
      }

      await fetch("/api/contador", { method: "PATCH" });
      setContador((prev) => prev + 1);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      let filename = "cotizacion.pdf";

      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Ocurrió un error al descargar PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Al cargar página, traemos número actual

  async function fetchContador() {
    try {
      const res = await fetch("/api/contador");
      const data = await res.json();
      setForm((f) => ({ ...f, quoteNumber: data.valor?.toString() || "2500" }));
    } catch (error) {
      console.error("❌ Error obteniendo contador", error);
    }
  }

  // Ajustar garantía automáticamente
  useEffect(() => {
    if (tipoCotizacion === "arriendo") {
      const containerCount = items.reduce((sum, item) => {
        return (
          sum +
          (item.name.toLowerCase().includes("container") ? item.quantity : 0)
        );
      }, 0);
      setGuarantee(containerCount * 350000);
    } else {
      setGuarantee(0);
    }
  }, [tipoCotizacion, items]);

  const resetForm = () => {
    setForm({
      company: "",
      quoteNumber: "",
      client: "",
      date: new Date().toISOString().split("T")[0],
    });
    setItems([]);
    setGuarantee(0);
    setDispatch(0);
    setCustomItem({ name: "", price: 0 });
    setSelectedProductId("");
  };
  // Cambia la edición de un item
  const toggleEdit = (i, val) => {
    setItems((items) =>
      items.map((item, idx) => (idx === i ? { ...item, isEditing: val } : item))
    );
  };

  // Actualiza la descripción de un item
  const handleDescChange = (i, val) => {
    setItems((items) =>
      items.map((item, idx) =>
        idx === i ? { ...item, description: val } : item
      )
    );
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-6 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full border border-gray-200">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
            🧾 Nueva Cotización
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              placeholder="Empresa"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="N° Cotización"
              value={form.quoteNumber}
              onChange={(e) =>
                setForm({ ...form, quoteNumber: e.target.value })
              }
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="Cliente"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="mb-6">
            <label className="font-medium text-gray-700 mr-4">
              Responsable:
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="paola">Paola (12345678)</option>
              <option value="alejandra">Alejandra (87654321)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="font-medium text-gray-700 mr-4">
              Tipo de cotización:
            </label>
            <select
              value={tipoCotizacion}
              onChange={(e) => setTipoCotizacion(e.target.value)}
              className="border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="venta">Venta</option>
              <option value="arriendo">Arriendo</option>
            </select>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-3">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Seleccionar producto</option>
              {filteredProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nombre} — ${p.precio.toLocaleString()}
                </option>
              ))}
            </select>
            <Button
              onClick={handleAddProduct}
              disabled={!selectedProductId}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              ➕ Agregar producto
            </Button>
          </div>

          <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ➕ Producto Personalizado
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del producto
                </label>
                <input
                  placeholder="Producto personalizado"
                  value={customItem.name}
                  onChange={(e) =>
                    setCustomItem({ ...customItem, name: e.target.value })
                  }
                  className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="w-full md:flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Escribe una línea por cada punto"
                  value={customItem.description ?? ""}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                />
              </div>

              <div className="w-full md:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Precio"
                  value={
                    customItem.price === 0
                      ? ""
                      : customItem.price.toLocaleString("es-CL")
                  }
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/\./g, "")
                      .replace(/\D/g, "");
                    setCustomItem({
                      ...customItem,
                      price: parseInt(val || "0"),
                    });
                  }}
                  className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-6">
                <Button
                  onClick={handleAddCustom}
                  disabled={!customItem.name || customItem.price <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 w-full md:w-auto"
                >
                  ➕ Agregar
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  <th className="px-4 py-2 text-left">Precio Unitario</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-yellow-50 border-b">
                    <td className="px-4 py-2">
                      <strong>{item.name}</strong>
                      <div className="mt-1">
                        {item.isEditing ? (
                          <>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) =>
                                handleDescChange(i, e.target.value)
                              }
                              className="w-full border p-1 rounded mt-1"
                              rows={3}
                            />
                            <button
                              onClick={() => toggleEdit(i, false)}
                              className="mt-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                          </>
                        ) : (
                          <div onDoubleClick={() => toggleEdit(i, true)}>
                            {item.description?.split("\n").map((line, idx) => (
                              <p key={idx} className="text-gray-600 text-sm">
                                • {line}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(i, e.target.value)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      ${(item.price * item.quantity).toLocaleString()}
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
            <div className="flex gap-6">
              {tipoCotizacion === "arriendo" && (
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-gray-700">
                    Garantía
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      guarantee === 0 ? "" : guarantee.toLocaleString("es-CL")
                    }
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\./g, "")
                        .replace(/\D/g, "");
                      setGuarantee(parseInt(val || "0"));
                    }}
                    className="border border-gray-300 bg-gray-100 px-4 py-2 rounded"
                  />
                </div>
              )}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold text-gray-700">
                  Despacho
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={dispatch === 0 ? "" : dispatch.toLocaleString("es-CL")}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/\./g, "")
                      .replace(/\D/g, "");
                    setDispatch(parseInt(val || "0"));
                  }}
                  className="border border-gray-300 bg-gray-100 px-4 py-2 rounded"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
            <div className="text-xl font-semibold text-gray-700">
              Total: $
              {items
                .reduce((acc, item) => acc + item.price * item.quantity, 0)
                .toLocaleString()}
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600"
              >
                ♻️ Limpiar
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
                  <>📥 Descargar PDF</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default QuotePage;
