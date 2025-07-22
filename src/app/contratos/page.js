"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import Navbar from "../../components/Navbar/NavBar";


const Contract = () => {
  useEffect(() => {
    fetch("https://arricam-pdf-service.onrender.com/")
      .then(() => console.log("🔄 API de Render activada"))
      .catch(() => console.warn("⚠️ No se pudo hacer pre-warm"));
  }, [])};

const ContractPage = () => {
  const [form, setForm] = useState({
    subarrendataria: "",
    representanteSubarrendataria: "",
    nacionalidadSubarrendataria: "",
    ciSubarrendataria: "",
    domicilioSubarrendataria: "",
    rutSubarrendataria: "",
    nombreSitio: "",
    renta: "",
    reajustePorcentaje: "",
    mesGarantia: "",
  });


  const [isDownloading, setIsDownloading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "ciSubarrendataria" || name === "rutSubarrendataria") {
      setForm((prev) => ({ ...prev, [name]: formatRut(value) }));
    } else if (name === "renta" || name === "mesGarantia") {
      const numeric = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: numeric }));
    } else if (name === "reajustePorcentaje") {
      const clamped = Math.max(1, Math.min(100, Number(value) || 0));
      setForm((prev) => ({ ...prev, [name]: clamped }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(
        "https://arricam-pdf-service.onrender.com/api/generatecontract",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("Error al generar el contrato");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contrato-subarriendo.pdf";
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("❌ Error al generar contrato: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };
  const formatRut = (rut) => {
    rut = rut.replace(/[^\dkK]/g, "").toUpperCase();
    if (rut.length <= 1) return rut;
    const cuerpo = rut.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const dv = rut.slice(-1);
    return `${cuerpo}-${dv}`;
  };

  const formatCLP = (value) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  const handleDownloadDocx = async () => {
    try {
      const res = await fetch(
        "https://arricam-pdf-service.onrender.com/api/plantilla-subarriendo"
      );

      if (!res.ok) throw new Error("No se pudo descargar el formato en blanco");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "formato-subarrendamiento.doc";
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("❌ Error al descargar formato: " + err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-gray-50 px-6 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full border border-gray-200">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
            📝 Generar Contrato Subarriendo
          </h1>

          {/* Datos de la Subarrendataria */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Datos de la Subarrendataria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="subarrendataria"
                placeholder="Subarrendataria"
                value={form.subarrendataria}
                onChange={handleChange}
                className="input"
              />
              <input
                name="rutSubarrendataria"
                placeholder="Rol de la empresa"
                value={form.rutSubarrendataria}
                onChange={handleChange}
                className="input"
              />
              <input
                name="domicilioSubarrendataria"
                placeholder="Domicilio Arrendataria"
                value={form.domicilioSubarrendataria}
                onChange={handleChange}
                className="input"
              />
              <input
                name="representanteSubarrendataria"
                placeholder="Representante"
                value={form.representanteSubarrendataria}
                onChange={handleChange}
                className="input"
              />
              <input
                name="ciSubarrendataria"
                placeholder="RUT"
                value={form.ciSubarrendataria}
                onChange={handleChange}
                className="input"
              />
              <input
                name="nacionalidadSubarrendataria"
                placeholder="Nacionalidad"
                value={form.nacionalidadSubarrendataria}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Datos del Sitio */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Datos del Sitio
            </h2>
            <input
              name="nombreSitio"
              placeholder="Nombre del sitio"
              value={form.nombreSitio}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          {/* Datos Económicos */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Datos de Renta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="renta"
                placeholder="Renta mensual"
                value={form.renta ? formatCLP(form.renta) : ""}
                onChange={handleChange}
                className="input"
              />

              <input
                name="mesGarantia"
                placeholder="Garantía"
                value={form.mesGarantia ? formatCLP(form.mesGarantia) : ""}
                onChange={handleChange}
                className="input"
              />
              <input
                name="reajustePorcentaje"
                type="number"
                min="1"
                max="100"
                placeholder="% Reajuste"
                value={form.reajustePorcentaje}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-4 mt-8">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 w-full md:w-auto"
            >
              {isDownloading ? "Generando..." : "📥 Generar Contrato PDF"}
            </Button>

            <Button
              onClick={handleDownloadDocx}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 w-full md:w-auto"
            >
              📄 Descargar Formato en Blanco (.DOC)
            </Button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .input {
          border: 1px solid #d1d5db;
          background-color: #f3f4f6;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.5);
        }
      `}</style>
    </>
  );
};

export default ContractPage;
