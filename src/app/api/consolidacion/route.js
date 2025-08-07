import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generarReporteConsolidadoExcelJS } from './generar-excel-exceljs.js';

// Función para formatear números con puntos de miles
function formatearNumero(numero) {
  if (numero === null || numero === undefined || numero === '') return '';
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Función mejorada para detectar fechas en diferentes formatos
function esFechaValida(cell) {
  if (!cell || typeof cell !== 'string') return false;
  
  // Patrones de fecha más flexibles
  const patronesFecha = [
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // DD/MM/YY o DD-MM-YY
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/,   // DD/MM/YYYY o DD-MM-YYYY
    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,   // YYYY/MM/DD o YYYY-MM-DD
    /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,         // DD.MM.YY
    /^\d{1,2}\.\d{1,2}\.\d{4}$/            // DD.MM.YYYY
  ];
  
  for (const patron of patronesFecha) {
    if (patron.test(cell)) {
      return true;
    }
  }
  
  return false;
}

// Categorías de gastos con palabras clave específicas de Arricam basadas en el análisis del Excel
const CATEGORIAS = {
  FLETES: [
    'flete', 'hormazabal', 'vargas', 'rocha', 'peña', 'garcia', 'leo', 'rojas', 
    'transporte', 'carga', 'envio', 'acar', 'mvc', 'mys', 'alex', 'perez', 'pereira',
    'pago fact flete', 'fletes', 'galio'
  ],
  SUELDOS_IMPOSIC: [
    'sueldo', 'imposic', 'afp', 'fonasa', 'isapre', 'prevision', 'sol', 'ana', 
    'marcel', 'eric', 'cristian', 'daniel', 'paola', 'edgar', 'victor', 'cea', 
    'cristobal', 'remuneración', 'pago personal'
  ],
  MATERIALES: [
    'material', 'insumo', 'herramienta', 'equipo', 'suministro', 'sodimac', 'easy', 
    'ferreteria', 'jcf', 'imperial', 'oviedo', 'avalos', 'wurth', 'isesa', 'ferret',
    'repuesto', 'construmart', 'newen', 'dideval', 'rivet'
  ],
  VEHICULOS: [
    'vehiculo', 'auto', 'camion', 'ruta', 'patente', 'kia', 'dodge', 'ranger', 'musso', 
    'actyon', 'volvo', 'ford', 'mercedes', 'soap', 'rev tecnica', 'neumatico', 'bateria',
    'vehículo'
  ],
  VEHICULO_AUTOPISTAS: [
    'autopista', 'peaje', 'tag', 'concesionaria', 'costanera', 'vespucio', 'américo vespucio',
    'rutas del pacifico', 'autopista central', 'autopista del sol', 'autopista los andes',
    'autopista del maipo', 'autopista del itata', 'autopista del aconcagua'
  ],
  VEHICULO_SEGUROS: [
    'seguro', 'sura', 'hdi', 'liberty', 'bci', 'mapfre', 'zurich', 'chilena consolidada',
    'seguros generales', 'seguro automotriz', 'seguro vehicular', 'poliza', 'aseguradora'
  ],
  PUBLICIDAD: [
    'publicidad', 'google', 'facebook', 'instagram', 'marketing', 'promocion', 
    'tarj cred', 'visa', 'aldea logos', 'tarjeta crédito'
  ],
  ART_ESCRITORIO: [
    'escritorio', 'oficina', 'equifax', 'entel', 'claro', 'prisa', 'maipu', 'smapa', 
    'enel', 'gtos com', 'movistar', 'wom', 'telefono', 'celular', 'luz', 'agua', 
    'colacion', 'ofic'
  ],
  COMBUSTIBLE: [
    'combustible', 'copec', 'bencina', 'petroleo', 'gasolina', 'diesel', 'shell', 
    'petrobras', 'gas', 'carga'
  ],
  CONTADOR_ABOGADO_REDES: [
    'contador', 'abogado', 'honorario', 'legal', 'redes', 'internet', 'wifi', 
    'conexion', 'viking', 'gtd', 'vinicius', 'tricomp', 'serv redes', 'mantenc',
    'honorarios'
  ],
  IVA: [
    'iva', 'impuesto', 'sii'
  ],
  RENTA: [
    'renta', 'arriendo', 'alquiler', 'balance y renta'
  ],
  IMPTOS_BANCARIOS: [
    'banco', 'comision', 'mantencion', 'costo', 'cobranza', 'santander', 'chile', 
    'plan mantencion', 'com mantencion', 'comisión'
  ],
  REPUESTOS_REPARAC: [
    'repuesto', 'reparacion', 'mecanico', 'taller', 'neumatico', 'aceite', 
    'bobadilla', 'victor', 'castañeda', 'raco', 'autos ok', 'bruzzone', 'reparación', 
    'mecánico'
  ],
  CAJA_CHICA: [
    'caja chica', 'gasto menor', 'efectivo', 'quincena', 'fin mes', 'cajero', 
    'gastos menores'
  ],
  TRANSFERENCIAS: [
    'transferencia', 'transf', 'pago', 'abono', 'deposito', 'redepositos', 'arrdos'
  ],
  INVERSIONES: [
    'inversion', 'fondo', 'mutuo', 'accion', 'titulo', 'fdo mut', 'inversión', 
    'fondo mutuo', 'fdos mutuos'
  ],
  DEVOLUCION_GARANTIAS: [
    'devolucion', 'garantia', 'reembolso', 'devol', 'devolución', 'garantía'
  ],
  COMPRA_CONTAINERS: [
    'container', 'contenedor', 'compra', 'econtainer', 'contekner', 'agunsa', 
    'boxtam', 'mvc', 'matias', 'bod', 'bodega', 'compra container'
  ],
  OTROS_GASTOS: [
    'otros', 'varios', 'diversos'
  ]
};

// Función para categorizar automáticamente un gasto
function esMovimientoAbono(descripcion, monto) {
  if (!descripcion) return false;
  
  const descripcionLower = descripcion.toLowerCase();
  
  // Palabras clave que indican abonos
  const palabrasAbono = [
    'abono', 'deposito', 'transferencia', 'pago', 'ingreso', 'entrada',
    'credito', 'devolucion', 'reembolso', 'reintegro', 'compensacion'
  ];
  
  // Verificar si la descripción contiene palabras de abono
  for (const palabra of palabrasAbono) {
    if (descripcionLower.includes(palabra)) {
      return true;
    }
  }
  
  // También considerar movimientos con montos muy altos como posibles abonos
  // (esto es una heurística, se puede ajustar según los datos reales)
  if (monto > 1000000) { // Montos mayores a 1 millón
    return true;
  }
  
  return false;
}

function categorizarGasto(descripcion) {
  const descLower = descripcion.toLowerCase();
  
  for (const [categoria, palabrasClave] of Object.entries(CATEGORIAS)) {
    for (const palabra of palabrasClave) {
      if (descLower.includes(palabra.toLowerCase())) {
        return categoria;
      }
    }
  }
  
  return 'SIN_CATEGORIZAR';
}

// Función para procesar archivo Excel del banco
function procesarArchivoBanco(workbook, tipoBanco) {
  const movimientos = [];
  let totalAbonos = 0;
  let saldoInicial = 0;
  let numeroCuenta = '';
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Buscar el número de cuenta en las primeras filas
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row) {
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (cell && typeof cell === 'string') {
          // Buscar patrones de cuenta
          const match = cell.match(/cta:(\d+)/i) || cell.match(/cuenta:(\d+)/i) || cell.match(/(\d{3}-\d{5}-\d{2})/);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado: ${numeroCuenta}`);
            break;
          }
        }
      }
      if (numeroCuenta) break;
    }
  }
  
  // Procesar según el tipo de banco
  if (tipoBanco === 'chile') {
    // Formato específico del Banco de Chile - SOLO GASTOS (columna C desde fila 3)
    console.log('🏦 Procesando Banco de Chile - Solo gastos (columna C desde fila 3)');
    
    // Extraer saldo inicial: Columna E (saldo mayor) + Columna C (cargos) - Columna D (abonos) de la fila 3
    if (data.length > 2 && data[2] && data[2].length > 4) {
      const saldoMayorCell = data[2][4]; // Columna E (índice 4), Fila 3 (índice 2) - Saldo mayor
      const cargosCell = data[2][2]; // Columna C (índice 2), Fila 3 (índice 2) - Cargos
      const abonosCell = data[2][3]; // Columna D (índice 3), Fila 3 (índice 2) - Abonos
      
      let saldoMayor = 0;
      let cargos = 0;
      let abonos = 0;
      
      if (saldoMayorCell && (typeof saldoMayorCell === 'number' || (typeof saldoMayorCell === 'string' && saldoMayorCell.match(/^[\d\.,]+$/)))) {
        saldoMayor = parseFloat(saldoMayorCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
      }
      
      if (cargosCell && (typeof cargosCell === 'number' || (typeof cargosCell === 'string' && cargosCell.match(/^[\d\.,]+$/)))) {
        cargos = parseFloat(cargosCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
      }
      
      if (abonosCell && (typeof abonosCell === 'number' || (typeof abonosCell === 'string' && abonosCell.match(/^[\d\.,]+$/)))) {
        abonos = parseFloat(abonosCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
      }
      
      // Calcular saldo inicial: Saldo mayor + Cargos - Abonos
      saldoInicial = saldoMayor + cargos - abonos;
      console.log(`💰 Saldo mayor (Col E): ${formatearNumero(saldoMayor)}`);
      console.log(`💰 Cargos (Col C): ${formatearNumero(cargos)}`);
      console.log(`💰 Abonos (Col D): ${formatearNumero(abonos)}`);
      console.log(`💰 Saldo inicial Banco Chile calculado: ${formatearNumero(saldoInicial)} (${formatearNumero(saldoMayor)} + ${formatearNumero(cargos)} - ${formatearNumero(abonos)})`);
    }
    
    console.log(`📊 Total de filas en el archivo: ${data.length}`);
    console.log(`🔍 Procesando desde fila 3 hasta fila ${data.length}`);
    
    let ultimaFechaValida = null; // Para usar fecha anterior si la actual no es válida
    
    for (let i = 2; i < data.length; i++) { // Empezar desde fila 3 (índice 2)
      const row = data[i];
      console.log(`🔍 Analizando fila ${i + 1}: ${JSON.stringify(row)}`);
      
      if (row && row.length >= 3) {
        // Buscar fecha en diferentes columnas
        let fecha = null;
        let descripcion = '';
        let monto = 0;
        
        // Buscar fecha
        for (let j = 0; j < Math.min(row.length, 5); j++) {
          const cell = row[j];
          if (esFechaValida(cell)) {
            fecha = cell;
            console.log(`📅 Fecha encontrada en columna ${j}: "${fecha}"`);
            break;
          }
        }
        
        // Si no se encontró fecha, usar la fecha anterior
        if (!fecha && ultimaFechaValida) {
          fecha = ultimaFechaValida;
          console.log(`📅 Usando fecha anterior: "${fecha}"`);
        } else if (!fecha) {
          console.log(`⚠️ Fila ${i + 1} sin fecha válida`);
        } else {
          ultimaFechaValida = fecha; // Guardar esta fecha para usar en filas siguientes
        }
        
        // Buscar descripción (columna B típicamente para Banco de Chile)
        if (row.length > 1) {
          const cellDescripcion = row[1]; // Columna B
          if (cellDescripcion && typeof cellDescripcion === 'string' && cellDescripcion.length > 3) {
            descripcion = cellDescripcion;
          } else {
            // Buscar en otras columnas
            for (let j = 0; j < row.length; j++) {
              const cell = row[j];
              if (cell && typeof cell === 'string' && cell.length > 3 && 
                  !cell.match(/^\d+$/) && 
                  !esFechaValida(cell) &&
                  !cell.match(/^[\+\-\d\.,]+$/)) {
                descripcion = cell;
                break;
              }
            }
          }
        }
        
        // Procesar Columna C (índice 2) - CARGOS/GASTOS
        const columnaCargo = row[2]; // Columna C
        console.log(`🔍 Fila ${i + 1}: Fecha="${fecha}", Desc="${descripcion}", ColC="${columnaCargo}"`);
        
        if (columnaCargo && (typeof columnaCargo === 'number' || (typeof columnaCargo === 'string' && columnaCargo.match(/^[\+\-\d\.,]+$/)))) {
          const numValue = parseFloat(columnaCargo.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          console.log(`🔍 Valor parseado: ${numValue} (original: "${columnaCargo}")`);
          
          if (!isNaN(numValue) && numValue > 0) { // Solo valores mayores a 0
            monto = numValue;
            
            if (descripcion && monto > 0) {
              // Usar fecha anterior si no hay fecha válida
              const fechaFinal = fecha || ultimaFechaValida || 'Sin fecha';
              
              movimientos.push({
                fecha: fechaFinal,
                descripcion: descripcion,
                monto: monto,
                tipo: 'gasto',
                banco: 'Banco de Chile',
                tipoCuenta: '',
                categoria: categorizarGasto(descripcion)
              });
              console.log(`✅ Gasto Banco Chile (fila ${i + 1}): ${formatearNumero(monto)} - ${descripcion} (fecha: ${fechaFinal})`);
            } else {
              console.log(`⚠️ Fila ${i + 1} sin descripción o monto válido: desc="${descripcion}", monto=${monto}`);
            }
          } else {
            console.log(`⚠️ Fila ${i + 1} valor no válido: ${numValue} (original: "${columnaCargo}")`);
          }
        } else {
          console.log(`⚠️ Fila ${i + 1} columna C no válida: "${columnaCargo}"`);
        }
        
        // Procesar Columna D (índice 3) - ABONOS
        if (row.length > 3) {
          const columnaAbono = row[3]; // Columna D
          console.log(`🔍 Fila ${i + 1} Col D: "${columnaAbono}"`);
          
          if (columnaAbono && (typeof columnaAbono === 'number' || (typeof columnaAbono === 'string' && columnaAbono.match(/^[\d\.,]+$/)))) {
            const numValue = parseFloat(columnaAbono.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
            console.log(`🔍 Valor parseado Col D: ${numValue} (original: "${columnaAbono}")`);
            
            if (!isNaN(numValue) && numValue > 0) {
              totalAbonos += numValue;
              console.log(`✅ Abono Banco Chile (fila ${i + 1}): ${formatearNumero(numValue)} - ${descripcion}`);
            } else {
              console.log(`⚠️ Fila ${i + 1} valor no válido en Col D: ${numValue} (original: "${columnaAbono}")`);
            }
          } else {
            console.log(`⚠️ Fila ${i + 1} columna D no válida: "${columnaAbono}"`);
          }
        }
      }
    }
    
    console.log(`💰 Total abonos calculados para Banco Chile: ${formatearNumero(totalAbonos)}`);
  } else if (tipoBanco === 'santander') {
    // Formato específico del Banco Santander - Extraer ABONOS X PAGOS de fila 11, columna C
    console.log('🏦 Procesando Banco Santander - Extraer ABONOS X PAGOS de fila 11, columna C');
    
    // Mostrar las primeras filas para entender la estructura
    console.log('📊 Estructura del archivo Santander:');
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      if (row) {
        console.log(`Fila ${i + 1}:`, row);
      }
    }
    
    // Extraer ABONOS X PAGOS de fila 11, columna C
    if (data.length >= 11) {
      const fila11 = data[10]; // Fila 11 (índice 10)
      if (fila11 && fila11.length >= 3) {
        const abonosXPagosCell = fila11[2]; // Columna C (índice 2)
        console.log(`🔍 Buscando ABONOS X PAGOS en fila 11, columna C: "${abonosXPagosCell}"`);
        
        if (abonosXPagosCell && (typeof abonosXPagosCell === 'number' || (typeof abonosXPagosCell === 'string' && abonosXPagosCell.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(abonosXPagosCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          console.log(`🔍 Valor parseado ABONOS X PAGOS: ${numValue} (original: "${abonosXPagosCell}")`);
          
          if (!isNaN(numValue) && numValue > 0) {
            totalAbonos = numValue;
            console.log(`✅ ABONOS X PAGOS extraído: ${formatearNumero(totalAbonos)}`);
          } else {
            console.log(`⚠️ Valor no válido para ABONOS X PAGOS: ${numValue}`);
          }
        } else {
          console.log(`⚠️ Celda no válida para ABONOS X PAGOS: "${abonosXPagosCell}"`);
        }
      } else {
        console.log(`⚠️ Fila 11 no tiene suficientes columnas: ${fila11}`);
      }
    } else {
      console.log(`⚠️ El archivo no tiene suficientes filas (tiene ${data.length}, necesita al menos 11)`);
    }
    
    // Extraer saldo inicial de Santander (buscar "saldo inicial" y tomar el valor de la columna A de la siguiente fila)
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string') {
            const cellLower = cell.toLowerCase();
            if (cellLower.includes('saldo inicial') || cellLower.includes('saldo inicial:')) {
              // Buscar el valor en la columna A de la siguiente fila
              if (i + 1 < data.length && data[i + 1] && data[i + 1].length > 0) {
                const saldoInicialCell = data[i + 1][0]; // Columna A de la siguiente fila
                if (saldoInicialCell && (typeof saldoInicialCell === 'number' || (typeof saldoInicialCell === 'string' && saldoInicialCell.match(/^[\d\.,]+$/)))) {
                  saldoInicial = parseFloat(saldoInicialCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
                  console.log(`💰 Saldo inicial Banco Santander extraído: ${formatearNumero(saldoInicial)}`);
                  break;
                }
              }
            }
          }
        }
        if (saldoInicial > 0) break;
      }
    }
    
    // Procesar gastos desde fila 17 hasta "Resumen comisión"
    console.log('🔍 Procesando gastos Santander desde fila 17 hasta "Resumen comisión"');
    
    let inicioMovimientos = 16; // Fila 17 (índice 16)
    let finMovimientos = data.length;
    
    // Buscar "Resumen comisión" para determinar el fin
    for (let i = 17; i < data.length; i++) {
      const row = data[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string') {
            const cellLower = cell.toLowerCase();
            console.log(`🔍 Buscando en fila ${i + 1}, columna ${j + 1}: "${cell}"`);
            if (cellLower.includes('resumen comisión') || cellLower.includes('resumen comision')) {
              finMovimientos = i;
              console.log(`📍 Fin de movimientos encontrado en fila ${i + 1}: "${cell}"`);
              break;
            }
          }
        }
        if (finMovimientos !== data.length) break;
      }
    }
    
    console.log(`📊 Procesando gastos desde fila ${inicioMovimientos + 1} hasta fila ${finMovimientos}`);
    console.log(`📊 Total de filas a procesar: ${finMovimientos - inicioMovimientos}`);
    
    // Procesar solo las filas entre inicio y fin (solo gastos)
    for (let i = inicioMovimientos; i < finMovimientos && i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        // Buscar fecha y descripción
        let fecha = null;
        let descripcion = '';
        
        // Buscar fecha
        for (let j = 0; j < Math.min(row.length, 5); j++) {
          const cell = row[j];
          if (esFechaValida(cell)) {
            fecha = cell;
            break;
          }
        }
        
        // Buscar descripción
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.length > 3 && !cell.match(/^\d+$/) && !esFechaValida(cell)) {
            descripcion = cell;
            break;
          }
        }
        
        // Procesar solo valores NEGATIVOS de la columna A (gastos)
        const columnaA = row[0]; // Columna A
        console.log(`🔍 Fila ${i + 1}: Fecha="${fecha}", Desc="${descripcion}", Valor="${columnaA}"`);
        
        if (columnaA && (typeof columnaA === 'number' || (typeof columnaA === 'string' && columnaA.match(/^[\-\d\.,]+$/)))) {
          const numValue = parseFloat(columnaA.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          console.log(`🔍 Valor parseado: ${numValue} (original: "${columnaA}")`);
          
          if (!isNaN(numValue) && numValue < 0) { // Solo valores NEGATIVOS = GASTOS
            const monto = Math.abs(numValue); // Convertir a positivo para el reporte
            
            if (fecha && descripcion) {
              movimientos.push({
                fecha: fecha,
                descripcion: descripcion,
                monto: monto,
                tipo: 'gasto',
                banco: 'Banco Santander',
                tipoCuenta: '',
                categoria: categorizarGasto(descripcion)
              });
              console.log(`✅ Gasto Santander (fila ${i + 1}): ${formatearNumero(monto)} - ${descripcion}`);
            }
          } else {
            console.log(`⚠️ Valor no es gasto: ${numValue} (original: "${columnaA}")`);
          }
        } else {
          console.log(`⚠️ Celda no válida: "${columnaA}" (tipo: ${typeof columnaA})`);
        }
      }
    }
    
    console.log(`💰 Total abonos calculados para Banco Santander: ${formatearNumero(totalAbonos)}`);
  }
  
  console.log(`=== RESUMEN FINAL ${tipoBanco.toUpperCase()} ===`);
  console.log(`Total abonos: ${formatearNumero(totalAbonos)}`);
  console.log(`Total movimientos: ${movimientos.length}`);
  console.log(`Saldo inicial: ${formatearNumero(saldoInicial)}`);
  console.log(`Número de cuenta: ${numeroCuenta}`);
  console.log(`=== FIN RESUMEN ${tipoBanco.toUpperCase()} ===`);
  
  return { movimientos, totalAbonos, saldoInicial, numeroCuenta };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const bancoChileCount = parseInt(formData.get('bancoChileCount') || '0');
    const bancoSantanderFile = formData.get('bancoSantander');
    const formatoSalidaFile = formData.get('formatoSalida');
    const categorizacionesStr = formData.get('categorizaciones');
    const santanderCategorizacionesStr = formData.get('santanderCategorizaciones');
    const valoresFijosStr = formData.get('valoresFijos');
    
    // Parsear valores fijos si se proporcionan
    let valoresFijos = null;
    if (valoresFijosStr) {
      try {
        valoresFijos = JSON.parse(valoresFijosStr);
      } catch (error) {
        console.error('Error al parsear valores fijos:', error);
      }
    }
    
    if (bancoChileCount < 2 || !bancoSantanderFile) {
      return NextResponse.json(
        { success: false, error: 'Se requieren al menos 2 archivos del Banco de Chile y uno del Banco Santander' },
        { status: 400 }
      );
    }
    
    // Procesar múltiples archivos del Banco de Chile (.xls)
    let movimientosChile = [];
    let abonosChile = { venta: 0, arriendo: 0 };
    let saldosInicialesChile = { venta: 0, arriendo: 0 };
    
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        const movimientosArchivo = resultado.movimientos;
        const totalAbonos = resultado.totalAbonos;
        const saldoInicial = resultado.saldoInicial;
        const numeroCuenta = resultado.numeroCuenta;
        
        console.log(`📊 Archivo ${i + 1} procesado:`);
        console.log(`  - Movimientos encontrados: ${movimientosArchivo.length}`);
        console.log(`  - Total abonos: ${formatearNumero(totalAbonos)}`);
        console.log(`  - Saldo inicial: ${formatearNumero(saldoInicial)}`);
        console.log(`  - Número de cuenta: ${numeroCuenta || 'No detectado'}`);
        
        // Asignar tipo de cuenta según el número de cuenta detectado
        let tipoCuenta = '';
        if (numeroCuenta && (numeroCuenta.includes('16806824') || numeroCuenta.includes('168-06824'))) {
          tipoCuenta = 'arriendo';
          abonosChile.arriendo = totalAbonos;
          saldosInicialesChile.arriendo = saldoInicial;
          console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a bancoChileArriendo (cuenta: ${numeroCuenta})`);
        } else if (numeroCuenta && (numeroCuenta.includes('16808475') || numeroCuenta.includes('168-08475'))) {
          tipoCuenta = 'venta';
          abonosChile.venta = totalAbonos;
          saldosInicialesChile.venta = saldoInicial;
          console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a bancoChileVenta (cuenta: ${numeroCuenta})`);
        } else {
          console.log(`⚠️ No se pudo determinar el tipo de cuenta para: ${numeroCuenta || 'undefined'}`);
          // Fallback al método anterior
          tipoCuenta = i === 0 ? 'venta' : 'arriendo';
          if (tipoCuenta === 'venta') {
            abonosChile.venta = totalAbonos;
            saldosInicialesChile.venta = saldoInicial;
          } else {
            abonosChile.arriendo = totalAbonos;
            saldosInicialesChile.arriendo = saldoInicial;
          }
        }
        
        movimientosArchivo.forEach(mov => {
          mov.tipoCuenta = tipoCuenta;
        });
        
        movimientosChile = [...movimientosChile, ...movimientosArchivo];
      }
    }
    
    // Procesar archivo del Banco Santander (.xlsx)
    const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
    const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
    const resultadoSantander = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
    const movimientosSantander = resultadoSantander.movimientos;
    const abonosSantander = resultadoSantander.totalAbonos;
    const saldoInicialSantander = resultadoSantander.saldoInicial;
    
    // Consolidar todos los movimientos
    let todosLosMovimientos = [...movimientosChile, ...movimientosSantander];
    
    // Actualizar valores fijos con los abonos y saldos iniciales calculados automáticamente
    if (!valoresFijos) {
      valoresFijos = {
        bancoChileArriendo: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoChileVenta: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoSantander: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        abonosXPagos: 0,
        rescteFdosMut: 0
      };
    }
    
    // Actualizar abonos y saldos iniciales calculados automáticamente
    valoresFijos.bancoChileArriendo.abonos = abonosChile.arriendo;
    valoresFijos.bancoChileArriendo.saldoInicial = saldosInicialesChile.arriendo;
    valoresFijos.bancoChileVenta.abonos = abonosChile.venta;
    valoresFijos.bancoChileVenta.saldoInicial = saldosInicialesChile.venta;
    valoresFijos.bancoSantander.abonos = abonosSantander;
    valoresFijos.bancoSantander.saldoInicial = saldoInicialSantander;
    
    // Aplicar categorizaciones manuales si existen
    if (categorizacionesStr) {
      const categorizaciones = JSON.parse(categorizacionesStr);
      todosLosMovimientos = todosLosMovimientos.map((mov, index) => {
        if (categorizaciones[index]) {
          return { 
            ...mov, 
            categoria: categorizaciones[index].categoria || mov.categoria,
            tipoCuenta: categorizaciones[index].tipoCuenta || mov.tipoCuenta
          };
        }
        return mov;
      });
    }
    
    // Si no hay categorizaciones, devolver todos los movimientos para categorización
    if (!categorizacionesStr) {
      return NextResponse.json(
        { 
          success: false, 
          todosLosMovimientos: todosLosMovimientos,
          valoresFijos: valoresFijos,
          error: 'Debes categorizar todos los movimientos'
        },
        { status: 400 }
      );
    }
    
    // Calcular el mes anterior para el nombre del archivo
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const nombreMesAnteriorCorto = mesAnterior.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    const añoAnterior = mesAnterior.getFullYear();
    
    // Generar reporte consolidado con ExcelJS
    const buffer = await generarReporteConsolidadoExcelJS(todosLosMovimientos, valoresFijos);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="consolidacion_arricam_${nombreMesAnteriorCorto}_${añoAnterior}.xlsx"`
      }
    });
    
  } catch (error) {
    console.error('Error en consolidación:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar los archivos' },
      { status: 500 }
    );
  }
} 