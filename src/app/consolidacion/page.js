"use client";
import React, { useState } from "react";
import { PiFileXls, PiDownload, PiUpload, PiTrash } from "react-icons/pi";
import Navbar from "../../components/Navbar/NavBar";
import TodasCuentasModal from "../../components/TodasCuentasModal";

export default function ConsolidacionPage() {
  const [files, setFiles] = useState({
    bancoChile: [],
    bancoSantander: null,
    formatoSalida: null
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showTodasCuentasModal, setShowTodasCuentasModal] = useState(false);
  const [todosLosMovimientos, setTodosLosMovimientos] = useState([]);

  const handleFileUpload = (bankType, file) => {
    // Validar archivos Excel (.xlsx y .xls)
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel" // .xls
    ];
    
    if (file && (validTypes.includes(file.type) || file.name.match(/\.(xlsx|xls)$/i))) {
      if (bankType === 'bancoChile') {
        setFiles(prev => ({ 
          ...prev, 
          bancoChile: [...prev.bancoChile, file]
        }));
      } else {
        setFiles(prev => ({ ...prev, [bankType]: file }));
      }
      setError("");
    } else {
      setError("Por favor, sube un archivo Excel válido (.xlsx o .xls)");
    }
  };

  const removeFile = (bankType, index = null) => {
    if (bankType === 'bancoChile' && index !== null) {
      setFiles(prev => ({ 
        ...prev, 
        bancoChile: prev.bancoChile.filter((_, i) => i !== index)
      }));
    } else {
      setFiles(prev => ({ ...prev, [bankType]: null }));
    }
  };

  const processConsolidation = async () => {
    if (files.bancoChile.length < 2 || !files.bancoSantander) {
      setError("Por favor, sube al menos 2 archivos del Banco de Chile y uno del Banco Santander");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Agregar múltiples archivos del Banco de Chile
      files.bancoChile.forEach((file, index) => {
        formData.append(`bancoChile_${index}`, file);
      });
      formData.append("bancoChileCount", files.bancoChile.length);
      
      formData.append("bancoSantander", files.bancoSantander);
      if (files.formatoSalida) {
        formData.append("formatoSalida", files.formatoSalida);
      }

      const response = await fetch("/api/consolidacion", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setResult(blob);
      } else {
        const data = await response.json();
        if (data.todosLosMovimientos) {
          setTodosLosMovimientos(data.todosLosMovimientos);
          setShowTodasCuentasModal(true);
        } else {
          setError(data.error || "Error al procesar la consolidación");
        }
      }
    } catch (error) {
      setError("Error al procesar los archivos");
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCategorizarTodasCuentas = async (categorizaciones) => {
    setProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Agregar múltiples archivos del Banco de Chile
      files.bancoChile.forEach((file, index) => {
        formData.append(`bancoChile_${index}`, file);
      });
      formData.append("bancoChileCount", files.bancoChile.length);
      
      formData.append("bancoSantander", files.bancoSantander);
      if (files.formatoSalida) {
        formData.append("formatoSalida", files.formatoSalida);
      }
      formData.append("categorizaciones", JSON.stringify(categorizaciones));

      const response = await fetch("/api/consolidacion", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setResult(blob);
      } else {
        const data = await response.json();
        setError(data.error || "Error al procesar la consolidación");
      }
    } catch (error) {
      setError("Error al procesar los archivos");
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };



  const downloadResult = () => {
    if (result) {
      const blob = new Blob([result], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "consolidacion_arricam.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/consolidacion/template", {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_ejemplo_arricam.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError("Error al descargar el template");
      }
    } catch (error) {
      setError("Error al descargar el template");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 text-gray-800 px-6">
        <section className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Consolidación de Cuentas
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Procesa 2 archivos Excel del Banco de Chile (.xls) y un archivo del Banco Santander (.xlsx) para generar un reporte consolidado de gastos Arricam.
          </p>
        </section>

        {/* Área de carga de archivos */}
        <section className="w-full max-w-4xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Banco de Chile */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all">
              <div className="text-center">
                <PiFileXls className="text-blue-500 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Banco de Chile</h3>
                <p className="text-sm text-gray-600 mb-4">Archivos Excel (.xls) con movimientos (mínimo 2 archivos)</p>
                
                {files.bancoChile.length > 0 ? (
                  <div className="space-y-3">
                    {files.bancoChile.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700 font-medium truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile("bancoChile", index)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700"
                        >
                          <PiTrash className="text-sm" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 text-center">
                      {files.bancoChile.length} archivo(s) subido(s)
                    </p>
                    <label className="flex items-center justify-center w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer text-sm">
                      <PiUpload className="mr-2" />
                      Agregar otro archivo
                      <input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={(e) => handleFileUpload("bancoChile", e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <PiUpload className="mr-2" />
                      Subir archivo
                      <input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={(e) => handleFileUpload("bancoChile", e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 text-center">
                      Puedes subir múltiples archivos uno por uno
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Banco Santander */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-red-300 hover:border-red-400 transition-all">
              <div className="text-center">
                <PiFileXls className="text-red-500 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Banco Santander</h3>
                <p className="text-sm text-gray-600 mb-4">Archivo Excel (.xlsx) con movimientos</p>
                
                {files.bancoSantander ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600 font-medium">{files.bancoSantander.name}</p>
                    <p className="text-xs text-gray-500 text-center">
                      Los movimientos se categorizarán individualmente
                    </p>
                    <button
                      onClick={() => removeFile("bancoSantander")}
                      className="flex items-center justify-center w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <PiTrash className="mr-2" />
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                    <PiUpload className="mr-2" />
                    Subir archivo
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileUpload("bancoSantander", e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Información del template */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-300">
              <div className="text-center">
                <PiFileXls className="text-green-500 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Formato de Salida</h3>
                <p className="text-sm text-gray-600 mb-4">Template interno Arricam</p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✅ Template predefinido</p>
                  <p>✅ Formato estándar Arricam</p>
                  <p>✅ Múltiples hojas de resumen</p>
                  <p>✅ Categorización automática</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de procesamiento */}
          <div className="text-center space-y-4">
            <button
              onClick={processConsolidation}
              disabled={processing || !files.bancoChile || !files.bancoSantander}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center mx-auto"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <PiFileXls className="mr-2" />
                  Consolidar Cuentas
                </>
              )}
            </button>
            
            {/* Botón de descarga del template */}
            <div className="flex justify-center">
              <button
                onClick={downloadTemplate}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center"
              >
                <PiDownload className="mr-2" />
                Descargar Template de Ejemplo
              </button>
            </div>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span>Consolidación completada exitosamente</span>
                <button
                  onClick={downloadResult}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <PiDownload className="mr-2" />
                  Descargar
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Información adicional */}
        <section className="w-full max-w-4xl mt-10">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Información del Proceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Categorías Automáticas:</h4>
                <ul className="space-y-1">
                  <li>• FLETES</li>
                  <li>• SUELDOS/IMPOSIC</li>
                  <li>• MATERIALES</li>
                  <li>• VEHICULOS</li>
                  <li>• PUBLICIDAD</li>
                  <li>• ART. ESCRITORIO</li>
                  <li>• COMBUSTIBLE</li>
                  <li>• CONTADOR/ABOGADO/REDES</li>
                  <li>• IVA</li>
                  <li>• RENTA</li>
                </ul>
              </div>
                             <div>
                 <h4 className="font-semibold text-gray-800 mb-2">Características:</h4>
                 <ul className="space-y-1">
                   <li>• Procesamiento automático de movimientos</li>
                   <li>• Categorización inteligente de gastos</li>
                   <li>• Consolidación de múltiples archivos</li>
                   <li>• Template interno predefinido</li>
                   <li>• Formato estándar Arricam</li>
                 </ul>
               </div>
            </div>
          </div>
        </section>

        {/* Modal de todas las cuentas */}
        <TodasCuentasModal
          isOpen={showTodasCuentasModal}
          onClose={() => setShowTodasCuentasModal(false)}
          movimientos={todosLosMovimientos}
          onConfirmar={handleCategorizarTodasCuentas}
        />


      </main>
    </>
  );
} 