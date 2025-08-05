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
  
  // Nuevo estado para valores fijos
  const [valoresFijos, setValoresFijos] = useState({
    // Banco de Chile - Arriendo (168-06824-09)
    bancoChileArriendo: {
      saldoInicial: '',
      abonos: '',
      lineaCredito: ''
    },
    // Banco de Chile - Venta (168-08475-09)
    bancoChileVenta: {
      saldoInicial: '',
      abonos: '',
      lineaCredito: ''
    },
    // Banco Santander (6866228-1)
    bancoSantander: {
      saldoInicial: '',
      abonos: '',
      lineaCredito: ''
    },
    // Otros valores fijos
    abonosXPagos: '',
    rescteFdosMut: ''
  });

  const handleValorFijoChange = (seccion, campo, valor) => {
    setValoresFijos(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor === '' ? '' : parseFloat(valor) || 0
      }
    }));
  };

  const handleValorGeneralChange = (campo, valor) => {
    setValoresFijos(prev => ({
      ...prev,
      [campo]: valor === '' ? '' : parseFloat(valor) || 0
    }));
  };

  // Función para extraer saldos iniciales de los archivos
  const extraerSaldosIniciales = async () => {
    if (files.bancoChile.length === 0 && !files.bancoSantander) {
      return;
    }

    try {
      const formData = new FormData();
      
      // Agregar archivos para extraer saldos iniciales
      files.bancoChile.forEach((file, index) => {
        formData.append(`bancoChile_${index}`, file);
      });
      formData.append("bancoChileCount", files.bancoChile.length);
      
      if (files.bancoSantander) {
        formData.append("bancoSantander", files.bancoSantander);
      }

      const response = await fetch("/api/consolidacion/extract-saldo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.saldosIniciales) {
          setValoresFijos(prev => ({
            ...prev,
            bancoChileArriendo: {
              ...prev.bancoChileArriendo,
              saldoInicial: data.saldosIniciales.bancoChileArriendo || ''
            },
            bancoChileVenta: {
              ...prev.bancoChileVenta,
              saldoInicial: data.saldosIniciales.bancoChileVenta || ''
            },
            bancoSantander: {
              ...prev.bancoSantander,
              saldoInicial: data.saldosIniciales.bancoSantander || ''
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error al extraer saldos iniciales:", error);
    }
  };

  const handleFileUpload = async (bankType, file) => {
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
      
      // Extraer saldos iniciales después de subir los archivos
      setTimeout(() => {
        extraerSaldosIniciales();
      }, 500);
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

      // Agregar valores fijos
      formData.append("valoresFijos", JSON.stringify(valoresFijos));

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
      
      // Agregar valores fijos
      formData.append("valoresFijos", JSON.stringify(valoresFijos));

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

          {/* Sección de Valores Fijos */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-purple-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Valores Fijos para Cálculos</h3>
              <p className="text-sm text-gray-600">Los saldos iniciales se extraen automáticamente de los archivos Excel de las cartolas. Puedes modificarlos si es necesario.</p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">💡 Los saldos iniciales se detectan automáticamente de cada archivo de cartola</p>
                <button
                  onClick={extraerSaldosIniciales}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  🔄 Extraer Saldos Iniciales
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Banco de Chile - Arriendo */}
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-blue-700 text-lg">Banco de Chile - Arriendo</h4>
                  <p className="text-xs text-gray-500">Cuenta: 168-06824-09</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileArriendo.saldoInicial}
                      onChange={(e) => handleValorFijoChange('bancoChileArriendo', 'saldoInicial', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abonos</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileArriendo.abonos}
                      onChange={(e) => handleValorFijoChange('bancoChileArriendo', 'abonos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileArriendo.lineaCredito}
                      onChange={(e) => handleValorFijoChange('bancoChileArriendo', 'lineaCredito', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Banco de Chile - Venta */}
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-green-700 text-lg">Banco de Chile - Venta</h4>
                  <p className="text-xs text-gray-500">Cuenta: 168-08475-09</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileVenta.saldoInicial}
                      onChange={(e) => handleValorFijoChange('bancoChileVenta', 'saldoInicial', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abonos</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileVenta.abonos}
                      onChange={(e) => handleValorFijoChange('bancoChileVenta', 'abonos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoChileVenta.lineaCredito}
                      onChange={(e) => handleValorFijoChange('bancoChileVenta', 'lineaCredito', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Banco Santander */}
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-red-700 text-lg">Banco Santander</h4>
                  <p className="text-xs text-gray-500">Cuenta: 6866228-1</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoSantander.saldoInicial}
                      onChange={(e) => handleValorFijoChange('bancoSantander', 'saldoInicial', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abonos</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoSantander.abonos}
                      onChange={(e) => handleValorFijoChange('bancoSantander', 'abonos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={valoresFijos.bancoSantander.lineaCredito}
                      onChange={(e) => handleValorFijoChange('bancoSantander', 'lineaCredito', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Otros valores fijos */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <h4 className="font-bold text-purple-700 text-lg mb-4 text-center">Otros Valores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abonos X Pagos</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={valoresFijos.abonosXPagos}
                    onChange={(e) => handleValorGeneralChange('abonosXPagos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rescte Fdos Mut/otros</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={valoresFijos.rescteFdosMut}
                    onChange={(e) => handleValorGeneralChange('rescteFdosMut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
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
                   <li>• Saldos iniciales extraídos automáticamente de las cartolas</li>
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