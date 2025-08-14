"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import Navbar from "../../components/Navbar/NavBar";
import { PiAlignCenterVerticalSimple } from "react-icons/pi";

const QuotePage = () => {
  const [form, setForm] = useState({
    company: "",
    quoteNumber: "",
    client: "",
    date: new Date().toISOString().split("T")[0],
    city: "",
    mail: "",
    contacto: "",
    plano: "",
    condiciones: "Valor del traslado no incluye rigger, ni certificaciones",
  });
  useEffect(() => {
    fetch("https://arricam-pdf-service.onrender.com/")
      .then(() => console.log("🔄 API activada"))
      .catch(() => console.warn("⚠️ No se pudo hacer pre-warm"));
  }, []);

  const [tipoCotizacion, setTipoCotizacion] = useState("venta");
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customItem, setCustomItem] = useState({
    name: "",
    price: 0,
    description: "",
  });
  const [products, setProducts] = useState([]);
  const [dispatch, setDispatch] = useState(0);
  const [contador, setContador] = useState(null);
  const [persona, setPersona] = useState("paola");
  const [mesGarantia, setMesGarantia] = useState(0);
  const [userEditedGarantia, setUserEditedGarantia] = useState(false);
  const [showCustomProduct, setShowCustomProduct] = useState(false);
  const [cuenta, setCuenta] = useState("");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  // Función para calcular la garantía automáticamente
  const calcularGarantiaAutomatica = (itemsList) => {
    console.log(`🔍 calcularGarantiaAutomatica llamado con:`, itemsList);
    console.log(`🔍 tipoCotizacion: ${tipoCotizacion}, userEditedGarantia: ${userEditedGarantia}`);
    
    if (tipoCotizacion === "arriendo" && !userEditedGarantia) {
      const containerCount = itemsList.reduce((sum, item) => {
        // Buscar tanto "container" como abreviaciones comunes
        const itemName = item.name.toLowerCase();
        
        // Patrones para identificar containers basados en los productos reales
        const containerPatterns = [
          // Patrones principales
          "container", "contenedor", "modulo", "módulo", "casa", "habitat",
          // Abreviaciones específicas de ARRICAM
          "bba", "comaa", "ocbaa", "oplaa", "com", "cam", "opl",
          // Variaciones de dimensiones
          "caseta", "bod", "maritima", "marítima"
        ];
        
        // Buscar por dimensiones típicas de containers (ej: 3x3, 3mx2,4m, 1,8mx2,5m)
        const hasDimensions = /\d+[xX]\d+[,.]?\d*[m]?/i.test(item.name);
        
        // También buscar por números seguidos de "m" (metros)
        const hasMeters = /\d+[m]/i.test(item.name);
        
        const isContainer = containerPatterns.some(pattern => itemName.includes(pattern)) || hasDimensions || hasMeters;
        
        // Log detallado para debug
        const matchedPattern = containerPatterns.find(pattern => itemName.includes(pattern));
        console.log(`🔍 Item: ${item.name} (${itemName}), quantity: ${item.quantity}, isContainer: ${isContainer}, hasDimensions: ${hasDimensions}, hasMeters: ${hasMeters}, matchedPattern: ${matchedPattern || 'none'}`);
        return sum + (isContainer ? item.quantity : 0);
      }, 0);
      const nuevaGarantia = containerCount * 350000;
      console.log(`🔄 Garantía recalculada: ${containerCount} containers × $350.000 = $${nuevaGarantia.toLocaleString()}`);
      setMesGarantia(nuevaGarantia);
    } else {
      console.log(`❌ No se calcula garantía - tipoCotizacion: ${tipoCotizacion}, userEditedGarantia: ${userEditedGarantia}`);
    }
  };
  const personaData = {
    paola: { nombre: "Paola Hernandez", telefono: "+569 5816 8818" },
    alejandra: { nombre: "Alejandra Castro", telefono: "+569 5816 8819" },
  }[persona];
  const cuentasData = {
    "comercializadora-arriendo": {
      razon: "COMERCIALIZADORA Y ARRIENDOS ARRICAM SPA",
      rut: "76.050.457-2",
      direccion: "LUMIERE 0280, MAIPÚ",
      giro: "ARRENDAR CONTAINERS Y MÓDULOS",
      cuenta: "CUENTA CORRIENTE: 168-06824-09",
      banco: "BANCO DE CHILE",
    },
    "comercializadora-venta": {
      razon: "COMERCIALIZADORA Y ARRIENDOS ARRICAM SPA",
      rut: "76.050.457-2",
      direccion: "LUMIERE 0280, MAIPÚ",
      giro: "VENTA DE CONTAINERS",
      cuenta: "CUENTA CORRIENTE: 168-08475-09",
      banco: "BANCO DE CHILE",
    },
    "ferreteria-arriendo": {
      razon: "FERRETERIA Y COMERCIALIZADORA ARRICAM DOS SPA",
      rut: "77.779.321-7",
      direccion: "",
      giro: "",
      cuenta: "CUENTA CORRIENTE: 168-11115-02",
      banco: "BANCO DE CHILE",
    },
    "ferreteria-venta": {
      razon: "FERRETERIA Y COMERCIALIZADORA ARRICAM DOS SPA",
      rut: "77.779.321-7",
      direccion: "",
      giro: "",
      cuenta: "CUENTA CORRIENTE: 168-13961-08",
      banco: "BANCO DE CHILE",
    },
  };

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
    );
    if (product) {
      const newItems = [
        ...items,
        {
          name: product.nombre,
          price: product.precio,
          quantity: 1,
          description: product.descripcion || "-",
          mes: tipoCotizacion === "arriendo" ? 1 : undefined,
          image: null, // Nuevo campo para imagen
        },
      ];
      setItems(newItems);
      setSelectedProductId("");
      
      // Recalcular garantía automáticamente
      calcularGarantiaAutomatica(newItems);
    }
  };

  const handleAddCustom = () => {
    if (customItem.name && customItem.price > 0) {
      const newItems = [
        ...items,
        {
          ...customItem,
          description: customItem.description || "-",
          quantity: 1,
          mes: tipoCotizacion === "arriendo" ? 1 : undefined,
          image: null, // Nuevo campo para imagen
        },
      ];
      setItems(newItems);
      setCustomItem({ name: "", price: 0, description: "" });
      
      // Recalcular garantía automáticamente
      calcularGarantiaAutomatica(newItems);
    }
  };

  const handleQuantityChange = (index, value) => {
    console.log(`🔍 handleQuantityChange - index: ${index}, value: ${value}`);
    const updated = [...items];
    updated[index].quantity = parseInt(value) || 1;
    console.log(`🔍 Items actualizados:`, updated);
    setItems(updated);
    
    // Recalcular garantía automáticamente
    calcularGarantiaAutomatica(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    
    // Recalcular garantía automáticamente
    calcularGarantiaAutomatica(updated);
  };

  // Nueva función para manejar la subida de imágenes por item
  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resizedImage = await resizeImage(file, 400); // Redimensionar a 400px de ancho
      const updated = [...items];
      updated[index].image = resizedImage;
      setItems(updated);
    } catch (error) {
      console.error("Error al procesar imagen:", error);
      alert("Error al procesar la imagen");
    }
  };

  // Función para remover imagen de un item
  const handleRemoveImage = (index) => {
    const updated = [...items];
    updated[index].image = null;
    setItems(updated);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!tipoCotizacion) {
      alert("Tipo de cotización no definido");
      setIsDownloading(false);
      return;
    }
    if (!cuentaSeleccionada) {
      alert("Por favor selecciona una cuenta antes de generar el PDF.");
      setIsDownloading(false);
      return;
    }

    setIsDownloading(true);
    
    // Preparar los datos a enviar
    const requestData = {
      type: tipoCotizacion,
      date: form.date,
      quoteNumber: form.quoteNumber,
      client: form.client,
      company: form.company,
      items,
      city: form.city,
      dispatch,
      mesGarantia,
      responsable: personaData.nombre,
      telefono: personaData.telefono,
      mail: form.mail,
      contacto: form.contacto,
      condiciones: form.condiciones || "", // Campo principal que espera el backend
      observaciones: form.condiciones || "", // Campo alternativo
      planoDescripcion: form.plano || "",
      razon: cuentaSeleccionada?.razon || "",
      rut: cuentaSeleccionada?.rut || "",
      direccion: cuentaSeleccionada?.direccion || "",
      giro: cuentaSeleccionada?.giro || "",
      banco: cuentaSeleccionada?.banco || "",
      cuenta: cuentaSeleccionada?.cuenta || "",
    };
    
    console.log("📤 Datos enviados al servidor:", requestData);
    console.log("📤 Campo 'condiciones' específicamente:", requestData.condiciones);
    console.log("📤 Campo 'observaciones' específicamente:", requestData.observaciones);
    console.log("📤 form.condiciones original:", form.condiciones);
    console.log("📤 JSON.stringify completo:", JSON.stringify(requestData, null, 2));
    
    try {
      const res = await fetch(
        "https://arricam-pdf-service.onrender.com/api/generatepdf",
                {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error del servidor:", res.status, errorText);
        alert(`Error al generar PDF: ${res.status} - ${res.statusText}`);
        setIsDownloading(false);
        return;
      }

      await fetch("/api/contador", { method: "PATCH" });
      setContador((prev) => prev + 10);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const rawQuote = form.quoteNumber || "sin-folio";
      const safeQuote = rawQuote.replace(/[^\w\d\-_]/g, "_");
      a.download = `cotizacion-${safeQuote}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error completo:", error);
      alert(`Error al descargar PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  async function fetchContador() {
    try {
      const res = await fetch("/api/contador");
      const data = await res.json();
      setForm((f) => ({ ...f, quoteNumber: data.valor?.toString() || "2500" }));
    } catch (error) {
      console.error("❌ Error obteniendo contador", error);
    }
  }

  useEffect(() => {
    console.log(`🔄 useEffect principal - tipoCotizacion: ${tipoCotizacion}, items:`, items);
    if (tipoCotizacion === "arriendo") {
      calcularGarantiaAutomatica(items);
    } else {
      setMesGarantia(0);
      setUserEditedGarantia(false);
    }
  }, [tipoCotizacion, items]);

  // useEffect adicional para recalcular garantía cuando cambien las cantidades
  useEffect(() => {
    console.log(`🔄 useEffect adicional - items:`, items, `tipoCotizacion: ${tipoCotizacion}, userEditedGarantia: ${userEditedGarantia}`);
    if (tipoCotizacion === "arriendo" && !userEditedGarantia) {
      calcularGarantiaAutomatica(items);
    }
  }, [items, tipoCotizacion, userEditedGarantia]); // Se ejecuta cuando cambien los items o el tipo

  const resetForm = () => {
    setForm({
      company: "",
      quoteNumber: "",                      
      client: "",
      date: new Date().toISOString().split("T")[0],
    });
    setItems([]);
    setMesGarantia(0);
    setDispatch(0);
    setCustomItem({ name: "", price: 0 });
    setSelectedProductId("");
    setUserEditedGarantia(false);
  };

  const toggleEdit = (i, val) => {
    setItems((items) =>
      items.map((item, idx) => (idx === i ? { ...item, isEditing: val } : item))
    );
  };

  const handleDescChange = (i, val) => {
    setItems((items) =>
      items.map((item, idx) =>
        idx === i ? { ...item, description: val } : item
      )
    );
  };

  const formatCLP = (value) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const handleMesChange = (index, value) => {
    const updated = [...items];
    updated[index].mes = Math.max(parseInt(value) || 1, 1);
    setItems(updated);
  };

  const resizeImage = (file, maxWidth = 600) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-6 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-5xl w-full border border-gray-200">
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
              placeholder="Contacto"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              placeholder="Ciudad de despacho"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="email"
              placeholder="Mail"
              value={form.mail}
              onChange={(e) => setForm({ ...form, mail: e.target.value })}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />

            <input
              type="tel"
              placeholder="Numero"
              value={form.contacto}
              onChange={(e) => {
                const soloNumeros = e.target.value.replace(/\D/g, "");
                setForm({ ...form, contacto: soloNumeros });
              }}
              className="border border-gray-300 bg-gray-100 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={15}
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
              <option value="paola">Paola </option>
              <option value="alejandra">Alejandra </option>
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

            <label className="font-medium text-gray-700 mr-4">Cuenta:</label>

            <select
              value={cuenta}
              onChange={(e) => {
                const nuevaCuenta = e.target.value;

                if (!tipoCotizacion) {
                  alert("Primero selecciona el tipo de cotización");
                  return;
                }

                setCuenta(nuevaCuenta);

                const key = `${nuevaCuenta}-${tipoCotizacion}`;
                const cuentaData = cuentasData[key];

                if (!cuentaData) {
                  alert("No hay datos para esta combinación");
                  return;
                }

                setCuentaSeleccionada(cuentaData);
                console.log("Datos de cuenta seleccionada:", cuentaData);
              }}
              className="border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={!tipoCotizacion}
            >
              <option value="">Selecciona una cuenta</option>
              <option value="comercializadora">Comercializadora</option>
              <option value="ferreteria">Ferretería</option>
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

          <div className="mb-6">
            <button
              onClick={() => setShowCustomProduct(!showCustomProduct)}
              className="text-yellow-700 font-semibold mb-2 hover:underline"
            >
              {showCustomProduct
                ? "➖ Ocultar producto personalizado"
                : "➕ Producto personalizado"}
            </button>

            {showCustomProduct && (
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
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
            )}
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  {tipoCotizacion === "arriendo" && (
                    <th className="px-4 py-2 text-left">Meses</th>
                  )}
                  <th className="px-4 py-2 text-left">Precio Unitario</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                  <th className="px-4 py-2 text-left">Imagen</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-yellow-50 border-b">
                    <td className="px-4 py-2 align-top">
                      <strong className="block">{item.name}</strong>
                      {item.isEditing ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              handleDescChange(i, e.target.value)
                            }
                            className="w-full border p-2 rounded text-sm"
                            rows={3}
                          />
                          <input
                            type="text"
                            value={item.price.toLocaleString("es-CL")}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\./g, "")
                                .replace(/\D/g, "");
                              const parsed = parseInt(val || "0");
                              setItems((items) =>
                                items.map((it, idx) =>
                                  idx === i ? { ...it, price: parsed } : it
                                )
                              );
                            }}
                            className="w-full border p-2 rounded text-sm"
                          />
                          <button
                            onClick={() => toggleEdit(i, false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded shadow transition duration-200"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={() => toggleEdit(i, true)}
                          className="mt-1 cursor-pointer text-sm text-gray-700 space-y-1"
                        >
                          {item.description.split("\n").map((l, idx) => (
                            <p key={idx}>• {l}</p>
                          ))}
                          <p className="text-gray-500">
                            Precio: {formatCLP(item.price)}
                          </p>
                          <p className="text-xs text-gray-400 italic">
                            (Doble clic para editar)
                          </p>
                        </div>
                      )}
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
                    {tipoCotizacion === "arriendo" && (
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.mes || 1}
                          onChange={(e) => handleMesChange(i, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-4 py-2">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      $
                      {(
                        item.price *
                        item.quantity *
                        (item.mes || 1)
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-2">
                        {item.image ? (
                          <div className="relative">
                            <img
                              src={item.image}
                              alt={`Imagen de ${item.name}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <button
                              onClick={() => handleRemoveImage(i)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, i)}
                              className="text-xs"
                              id={`image-${i}`}
                            />
                            <label
                              htmlFor={`image-${i}`}
                              className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                            >
                              📷 Agregar imagen
                            </label>
                          </div>
                        )}
                      </div>
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
                <div className="flex flex-col w-full md:w-1/2">
                  <label className="mb-1 font-semibold text-gray-700">
                    Garantía sugerida:
                    <span className="text-gray-600 ml-1">
                      {formatCLP(
                        items.reduce(
                          (sum, item) => {
                            const itemName = item.name.toLowerCase();
                            
                            // Patrones para identificar containers basados en los productos reales
                            const containerPatterns = [
                              // Patrones principales
                              "container", "contenedor", "modulo", "módulo", "casa", "habitat",
                              // Abreviaciones específicas de ARRICAM
                              "bba", "comaa", "ocbaa", "oplaa", "com", "cam", "opl",
                              // Variaciones de dimensiones
                              "caseta", "bod", "maritima", "marítima"
                            ];
                            
                            // Buscar por dimensiones típicas de containers (ej: 3x3, 3mx2,4m, 1,8mx2,5m)
                            const hasDimensions = /\d+[xX]\d+[,.]?\d*[m]?/i.test(item.name);
                            
                            // También buscar por números seguidos de "m" (metros)
                            const hasMeters = /\d+[m]/i.test(item.name);
                            
                            const isContainer = containerPatterns.some(pattern => itemName.includes(pattern)) || hasDimensions || hasMeters;
                            
                            return isContainer ? sum + item.quantity * 350000 : sum;
                          },
                          0
                        )
                      )}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="mesGarantia"
                      value={
                        mesGarantia === 0
                          ? ""
                          : mesGarantia.toLocaleString("es-CL")
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\./g, "")
                          .replace(/\D/g, "");
                        setMesGarantia(parseInt(val || "0"));
                        setUserEditedGarantia(true);
                      }}
                      className={`border px-4 py-2 rounded w-full ${
                        userEditedGarantia 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-100'
                      }`}
                      placeholder="Se calcula automáticamente"
                    />
                    {userEditedGarantia && (
                      <div className="absolute -top-6 right-0 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        ✏️ Editado manualmente
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Se calcula automáticamente: 350.000 × cantidad de containers
                    {!userEditedGarantia && (
                      <span className="text-green-600 font-medium ml-2">
                        ✅ Calculando automáticamente
                      </span>
                    )}
                  </p>
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

          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-1">
              Observaciones / Condiciones personalizadas
            </label>
            <textarea
              placeholder="Escribe condiciones comerciales u observaciones..."
              value={form.condiciones || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, condiciones: e.target.value }))
              }
              rows={5}
              className="w-full border border-gray-300 bg-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
            <div className="text-xl font-semibold text-gray-700">
              Total: $
              {(
                items.reduce(
                  (acc, item) =>
                    acc + item.price * item.quantity * (item.mes || 1),
                  0
                ) +
                (mesGarantia || 0) +
                (dispatch || 0)
              ).toLocaleString("es-CL")}
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
