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
    // ARRICAM - Banco de Chile - Arriendo (168-06824-09)
    bancoChileArriendo: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // ARRICAM - Banco de Chile - Venta (168-08475-09)
    bancoChileVenta: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // ARRICAM - Banco Santander (6866228-1)
    bancoSantander: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // FERRETERIA - Banco de Chile - Arriendo (168-11115-02)
    ferreteriaBancoChileArriendo: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // FERRETERIA - Banco de Chile - Venta (168-13961-08)
    ferreteriaBancoChileVenta: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // FERRETERIA - Banco Santander (9208349-7)
    ferreteriaBancoSantander: {
      saldoInicial: 0,
      abonos: 0,
      lineaCredito: 0
    },
    // Otros valores fijos
    abonosXPagos: 0,
    rescteFdosMut: 0
  });
  
  // Estado para indicar si se están calculando abonos
  const [calculandoAbonos, setCalculandoAbonos] = useState(false);
  

  
  // Estado para seleccionar qué empresa consolidar
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('arricam'); // 'arricam' o 'ferreteria'
  
  // Función para formatear números con puntos
  const formatearNumero = (numero) => {
    if (typeof numero !== 'number') return '0';
    return numero.toLocaleString('es-CL');
  };

  const handleValorFijoChange = (seccion, campo, valor) => {
    setValoresFijos(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor === '' ? 0 : parseFloat(valor) || 0
      }
    }));
  };

  const handleValorGeneralChange = (campo, valor) => {
    setValoresFijos(prev => ({
      ...prev,
      [campo]: valor === '' ? 0 : parseFloat(valor) || 0
    }));
  };



  // Función para calcular abonos automáticamente
  const calcularAbonosAutomaticamente = async () => {
    if (files.bancoChile.length === 0 && !files.bancoSantander) {
      return;
    }

    setCalculandoAbonos(true);

    try {
      const formData = new FormData();
      
      // Agregar archivos para calcular abonos
      files.bancoChile.forEach((file, index) => {
        formData.append(`bancoChile_${index}`, file);
      });
      formData.append("bancoChileCount", files.bancoChile.length);
      
      if (files.bancoSantander) {
        formData.append("bancoSantander", files.bancoSantander);
      }
      
      // Agregar información de qué empresa se está consolidando
      formData.append("empresaSeleccionada", empresaSeleccionada);
      console.log('🚀 Empresa seleccionada en cálculo de abonos:', empresaSeleccionada);

      const response = await fetch("/api/consolidacion/calcular-abonos", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.abonosCalculados) {
          setValoresFijos(prev => ({
            ...prev,
            bancoChileArriendo: {
              ...prev.bancoChileArriendo,
              abonos: data.abonosCalculados.bancoChileArriendo || 0,
              saldoInicial: data.saldoInicialChileArriendoFormateado || prev.bancoChileArriendo.saldoInicial
            },
            bancoChileVenta: {
              ...prev.bancoChileVenta,
              abonos: data.abonosCalculados.bancoChileVenta || 0,
              saldoInicial: data.saldoInicialChileVentaFormateado || prev.bancoChileVenta.saldoInicial
            },
            bancoSantander: {
              ...prev.bancoSantander,
              abonos: data.abonosCalculados.bancoSantander || 0,
              saldoInicial: data.saldoInicialSantanderFormateado || prev.bancoSantander.saldoInicial
            },
                    ferreteriaBancoChileArriendo: {
          ...prev.ferreteriaBancoChileArriendo,
          abonos: data.abonosCalculados.ferreteriaBancoChileArriendo || 0,
          saldoInicial: data.saldoInicialFerreteriaArriendoFormateado || prev.ferreteriaBancoChileArriendo.saldoInicial
        },
        ferreteriaBancoChileVenta: {
          ...prev.ferreteriaBancoChileVenta,
          abonos: data.abonosCalculados.ferreteriaBancoChileVenta || 0,
          saldoInicial: data.saldoInicialFerreteriaVentaFormateado || prev.ferreteriaBancoChileVenta.saldoInicial
        },
        ferreteriaBancoSantander: {
          ...prev.ferreteriaBancoSantander,
          abonos: data.abonosCalculados.ferreteriaBancoSantander || 0,
          saldoInicial: data.saldoInicialFerreteriaSantanderFormateado || prev.ferreteriaBancoSantander.saldoInicial
        }
          }));
        }
      }
    } catch (error) {
      console.error("Error al calcular abonos automáticamente:", error);
    } finally {
      setCalculandoAbonos(false);
    }
  };

  // Función para calcular abonos automáticamente con archivos específicos
  const calcularAbonosAutomaticamenteConArchivos = async (archivosEspecificos) => {
    if (archivosEspecificos.bancoChile.length === 0 && !archivosEspecificos.bancoSantander) {
      console.log("No hay archivos para procesar");
      return;
    }

    console.log(`🔄 Procesando ${archivosEspecificos.bancoChile.length} archivo(s) del Banco de Chile y ${archivosEspecificos.bancoSantander ? '1' : '0'} del Banco Santander`);

    console.log("Calculando abonos con archivos:", {
      bancoChile: archivosEspecificos.bancoChile.length,
      bancoSantander: archivosEspecificos.bancoSantander ? "Sí" : "No"
    });

    setCalculandoAbonos(true);

    try {
      const formData = new FormData();
      
      // Agregar archivos para calcular abonos
      archivosEspecificos.bancoChile.forEach((file, index) => {
        formData.append(`bancoChile_${index}`, file);
      });
      formData.append("bancoChileCount", archivosEspecificos.bancoChile.length);
      
      if (archivosEspecificos.bancoSantander) {
        formData.append("bancoSantander", archivosEspecificos.bancoSantander);
      }
      
      // Agregar información de qué empresa se está consolidando
      formData.append("empresaSeleccionada", empresaSeleccionada);
      console.log('🚀 Empresa seleccionada en cálculo de abonos con archivos:', empresaSeleccionada);

      const response = await fetch("/api/consolidacion/calcular-abonos", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Datos recibidos del backend:", data);
        
        if (data.abonosCalculados) {
          console.log("💰 Abonos calculados:", data.abonosCalculados);
          console.log("💰 Saldos iniciales:", {
            chileArriendo: data.saldoInicialChileArriendoFormateado,
            chileVenta: data.saldoInicialChileVentaFormateado,
            santander: data.saldoInicialSantanderFormateado,
            ferreteriaArriendo: data.saldoInicialFerreteriaArriendoFormateado,
            ferreteriaVenta: data.saldoInicialFerreteriaVentaFormateado,
            ferreteriaSantander: data.saldoInicialFerreteriaSantanderFormateado
          });
          
          setValoresFijos(prev => {
            const nuevosValores = {
              ...prev,
              bancoChileArriendo: {
                ...prev.bancoChileArriendo,
                abonos: data.abonosCalculados.bancoChileArriendo || 0,
                saldoInicial: data.saldoInicialChileArriendoFormateado || prev.bancoChileArriendo.saldoInicial
              },
              bancoChileVenta: {
                ...prev.bancoChileVenta,
                abonos: data.abonosCalculados.bancoChileVenta || 0,
                saldoInicial: data.saldoInicialChileVentaFormateado || prev.bancoChileVenta.saldoInicial
              },
              bancoSantander: {
                ...prev.bancoSantander,
                abonos: data.abonosCalculados.bancoSantander || 0,
                saldoInicial: data.saldoInicialSantanderFormateado || prev.bancoSantander.saldoInicial
              },
                      ferreteriaBancoChileArriendo: {
          ...prev.ferreteriaBancoChileArriendo,
          abonos: data.abonosCalculados.ferreteriaBancoChileArriendo || 0,
          saldoInicial: data.saldoInicialFerreteriaArriendoFormateado || prev.ferreteriaBancoChileArriendo.saldoInicial
        },
        ferreteriaBancoChileVenta: {
          ...prev.ferreteriaBancoChileVenta,
          abonos: data.abonosCalculados.ferreteriaBancoChileVenta || 0,
          saldoInicial: data.saldoInicialFerreteriaVentaFormateado || prev.ferreteriaBancoChileVenta.saldoInicial
        },
        ferreteriaBancoSantander: {
          ...prev.ferreteriaBancoSantander,
          abonos: data.abonosCalculados.ferreteriaBancoSantander || 0,
          saldoInicial: data.saldoInicialFerreteriaSantanderFormateado || prev.ferreteriaBancoSantander.saldoInicial
        }
            };
            
            console.log("🔄 Nuevos valores fijos:", nuevosValores);
            return nuevosValores;
          });
        }
      }
    } catch (error) {
      console.error("Error al calcular abonos automáticamente:", error);
    } finally {
      setCalculandoAbonos(false);
    }
  };

  const handleFileUpload = async (bankType, file) => {
    // Validar archivos Excel (.xlsx y .xls) y CSV
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
      "application/csv" // .csv alternativo
    ];
    
    if (file && (validTypes.includes(file.type) || file.name.match(/\.(xlsx|xls|csv)$/i))) {
      let newFiles;
      if (bankType === 'bancoChile') {
        newFiles = { 
          ...files, 
          bancoChile: [...files.bancoChile, file]
        };
        setFiles(newFiles);
      } else {
        newFiles = { ...files, [bankType]: file };
        setFiles(newFiles);
      }
      setError("");
      
      // Calcular abonos automáticamente después de subir el archivo
      setTimeout(() => {
        calcularAbonosAutomaticamenteConArchivos(newFiles);
      }, 500);
    } else {
      setError("Por favor, sube un archivo válido (.xlsx, .xls o .csv)");
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
// En page.js, agrega este debug en processConsolidation
const processConsolidation = async () => {
  if (files.bancoChile.length === 0 || !files.bancoSantander) {
    setError("Por favor, sube al menos 1 archivo del Banco de Chile y uno del Banco Santander");
    return;
  }

  // Validar que se haya ingresado al menos un saldo inicial
  const tieneSaldoInicial = Object.values(valoresFijos).some(valor => {
    if (typeof valor === 'object' && valor.saldoInicial) {
      return valor.saldoInicial > 0;
    }
    return false;
  });

  if (!tieneSaldoInicial) {
    setError("Por favor, ingresa al menos un saldo inicial antes de procesar");
    return;
  }

  // 🔍 DEBUG: Verificar valores antes de enviar
  console.log('🚀 ENVIANDO A LA API - valoresFijos completos:', JSON.stringify(valoresFijos, null, 2));
  console.log('🚀 ENVIANDO A LA API - Saldos iniciales específicos:', {
    chileArriendo: valoresFijos.bancoChileArriendo.saldoInicial,
    chileVenta: valoresFijos.bancoChileVenta.saldoInicial,
    santander: valoresFijos.bancoSantander.saldoInicial,
            ferreteriaChileArriendo: valoresFijos.ferreteriaBancoChileArriendo.saldoInicial,
        ferreteriaChileVenta: valoresFijos.ferreteriaBancoChileVenta.saldoInicial,
        ferreteriaSantander: valoresFijos.ferreteriaBancoSantander.saldoInicial
  });

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

    // Agregar valores fijos - CRÍTICO
    const valoresFijosString = JSON.stringify(valoresFijos);
    console.log('🚀 JSON enviado:', valoresFijosString);
    formData.append("valoresFijos", valoresFijosString);
    
    // Agregar información de qué empresa se está consolidando
    formData.append("empresaSeleccionada", empresaSeleccionada);
    console.log('🚀 Empresa seleccionada:', empresaSeleccionada);

    const response = await fetch("/api/consolidacion", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      setResult(blob);
      console.log('✅ Excel generado correctamente');
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
      
      // Agregar información de qué empresa se está consolidando
      formData.append("empresaSeleccionada", empresaSeleccionada);
      console.log('🚀 Empresa seleccionada en categorización:', empresaSeleccionada);

      const response = await fetch("/api/consolidacion", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setResult(blob);
        return blob; // Retornar el resultado para el modal
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Error al procesar la consolidación";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = "Error al procesar los archivos";
      setError(errorMessage);
      console.error("Error:", error);
      throw error;
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
            Procesa archivos Excel del Banco de Chile (.xls) y Banco Santander (.xlsx) para generar un reporte consolidado de gastos. 
            Incluye cuentas de ARRICAM y ferreteria (cuentas que pueden no tener movimientos mensuales).
          </p>
        </section>

        {/* Sección de archivos */}
        <section className="w-full max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Seleccionar Empresa a Consolidar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  empresaSeleccionada === 'arricam' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => setEmpresaSeleccionada('arricam')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    empresaSeleccionada === 'arricam' ? 'border-green-500 bg-green-500' : 'border-gray-400'
                  }`}>
                    {empresaSeleccionada === 'arricam' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">🏢 ARRICAM SPA</h4>
                    <p className="text-sm text-gray-600">Cuentas principales de la empresa</p>
                    <p className="text-xs text-gray-500">Banco Chile: 168-06824-09, 168-08475-09</p>
                    <p className="text-xs text-gray-500">Banco Santander: 6866228-1</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  empresaSeleccionada === 'ferreteria' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => setEmpresaSeleccionada('ferreteria')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    empresaSeleccionada === 'ferreteria' ? 'border-blue-500 bg-blue-500' : 'border-blue-400'
                  }`}>
                    {empresaSeleccionada === 'ferreteria' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">🏢 FERRETERIA</h4>
                    <p className="text-sm text-gray-600">Cuentas adicionales de ferreteria</p>
                    <p className="text-xs text-gray-500">Banco Chile: 168-11115-02, 168-13961-08</p>
                    <p className="text-xs text-gray-500">Banco Santander: 9208349-7</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>💡 Nota:</strong> Solo se pueden consolidar 3 cuentas a la vez. 
                Selecciona la empresa cuyas cuentas deseas consolidar en este proceso.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cargar Archivos para {empresaSeleccionada.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sube los archivos Excel (.xls/.xlsx) o CSV con movimientos para la empresa seleccionada.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Banco de Chile */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all">
                <div className="text-center">
                  <PiFileXls className="text-blue-500 text-4xl mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Banco de Chile</h3>
                  <p className="text-sm text-gray-600 mb-4">Archivos Excel (.xls/.xlsx) o CSV con movimientos</p>
                  
                  {files.bancoChile.length > 0 ? (
                    <div className="space-y-3">
                      {files.bancoChile.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-700 font-medium truncate">{file.name}</span>
                            {file.name.toLowerCase().endsWith('.csv') && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">CSV</span>
                            )}
                          </div>
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
                  <p className="text-sm text-gray-600 mb-4">Archivo Excel (.xlsx/.xls) o CSV con movimientos</p>
                  
                  {files.bancoSantander ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <p className="text-sm text-green-600 font-medium">{files.bancoSantander.name}</p>
                        {files.bancoSantander.name.toLowerCase().endsWith('.csv') && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">CSV</span>
                        )}
                      </div>
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
          </div>

          {/* Valores Fijos - Solo mostrar los de la empresa seleccionada */}
          <div className="mt-8">
            {empresaSeleccionada === 'arricam' ? (
              // Valores Fijos ARRICAM
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">🏢 ARRICAM SPA - Valores Fijos</h3>
                  <p className="text-sm text-gray-600">Cuentas principales de la empresa</p>
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">💡 Consolidando cuentas de ARRICAM SPA</p>
                    <p className="text-xs text-green-600 mt-1">Banco Chile: 168-06824-09, 168-08475-09 | Banco Santander: 6866228-1</p>
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
                          type="text"
                          placeholder="0"
                          value={valoresFijos.bancoChileArriendo.saldoInicial}
                          onChange={(e) => handleValorFijoChange('bancoChileArriendo', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.bancoChileArriendo.abonos)}
                          onChange={(e) => handleValorFijoChange('bancoChileArriendo', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
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
                          type="text"
                          placeholder="0"
                          value={valoresFijos.bancoChileVenta.saldoInicial}
                          onChange={(e) => handleValorFijoChange('bancoChileVenta', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.bancoChileVenta.abonos)}
                          onChange={(e) => handleValorFijoChange('bancoChileVenta', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
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
                          type="text"
                          placeholder="0"
                          value={valoresFijos.bancoSantander.saldoInicial}
                          onChange={(e) => handleValorFijoChange('bancoSantander', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.bancoSantander.abonos)}
                          onChange={(e) => handleValorFijoChange('bancoSantander', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
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
              </div>
            ) : (
              // Valores Fijos FERRETERIA
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">🏢 FERRETERIA - Valores Fijos</h3>
                  <p className="text-sm text-gray-600">Cuentas adicionales de ferreteria</p>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">💡 Consolidando cuentas de FERRETERIA</p>
                    <p className="text-xs text-blue-600 mt-1">Banco Chile: 168-11115-02, 168-13961-08 | Banco Santander: 9208349-7</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Ferreteria - Banco de Chile - Arriendo */}
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-blue-700 text-lg">Ferreteria - Banco de Chile - Arriendo</h4>
                      <p className="text-xs text-gray-500">Cuenta: 168-11115-02</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoChileArriendo.saldoInicial}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileArriendo', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.ferreteriaBancoChileArriendo.abonos)}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileArriendo', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoChileArriendo.lineaCredito}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileArriendo', 'lineaCredito', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ferreteria - Banco de Chile - Venta */}
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-green-700 text-lg">Ferreteria - Banco de Chile - Venta</h4>
                      <p className="text-xs text-gray-500">Cuenta: 168-13961-08</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoChileVenta.saldoInicial}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileVenta', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.ferreteriaBancoChileVenta.abonos)}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileVenta', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoChileVenta.lineaCredito}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoChileVenta', 'lineaCredito', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ferreteria - Banco Santander */}
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-red-700 text-lg">Ferreteria - Banco Santander</h4>
                      <p className="text-xs text-gray-500">Cuenta: 9208349-7</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoSantander.saldoInicial}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoSantander', 'saldoInicial', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abonos
                          <span className="ml-1 text-xs text-green-600">(Calculado automáticamente)</span>
                          {calculandoAbonos && (
                            <span className="ml-1 text-xs text-blue-600">🔄 Calculando...</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={calculandoAbonos ? "Calculando..." : "0"}
                          value={calculandoAbonos ? "" : formatearNumero(valoresFijos.ferreteriaBancoSantander.abonos)}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoSantander', 'abonos', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm ${
                            calculandoAbonos 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Crédito</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={valoresFijos.ferreteriaBancoSantander.lineaCredito}
                          onChange={(e) => handleValorFijoChange('ferreteriaBancoSantander', 'lineaCredito', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

          {/* Información de validación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Requisitos para procesar</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Al menos 1 archivo del Banco de Chile</li>
                <li>• 1 archivo del Banco Santander</li>
                <li>• <strong>Al menos un saldo inicial ingresado</strong></li>
                <li>• Soporta archivos .xlsx, .xls y .csv</li>
              </ul>
              
              {/* Estado de validación */}
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="flex items-center justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${files.bancoChile.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Banco Chile: {files.bancoChile.length} archivo(s)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${files.bancoSantander ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Banco Santander: {files.bancoSantander ? '1 archivo' : '0 archivos'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${Object.values(valoresFijos).some(valor => typeof valor === 'object' && valor.saldoInicial > 0) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Saldo inicial: {Object.values(valoresFijos).some(valor => typeof valor === 'object' && valor.saldoInicial > 0) ? 'OK' : 'Pendiente'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de procesamiento */}
          <div className="text-center space-y-4">
            <button
              onClick={processConsolidation}
              disabled={processing || files.bancoChile.length === 0 || !files.bancoSantander}
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
                  <li>• VEHICULO AUTOPISTAS</li>
                  <li>• VEHICULO SEGUROS</li>
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
                   <li>• Abonos calculados automáticamente de las cartolas</li>
                   <li>• Saldos iniciales ingresados manualmente desde las cartolas</li>
                   <li>• Soporte para cuentas adicionales de ferreteria</li>
                   <li>• Manejo de cuentas sin movimientos mensuales</li>
                 </ul>
               </div>
            </div>
          </div>
        </section>
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