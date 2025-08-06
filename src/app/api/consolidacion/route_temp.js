import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generarReporteConsolidadoExcelJS } from './generar-excel-exceljs.js';

// Función para formatear números con puntos de miles
function formatearNumero(numero) {
  if (numero === null || numero === undefined || numero === '') return '';
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Procesar según el tipo de banco
  if (tipoBanco === 'chile') {
    // Formato específico del Banco de Chile - SOLO GASTOS (columna C desde fila 3)
    console.log('🏦 Procesando Banco de Chile - Solo gastos (columna C desde fila 3)');
    
    for (let i = 2; i < data.length; i++) { // Empezar desde fila 3 (índice 2)
      const row = data[i];
      if (row && row.length >= 3) {
        // Buscar fecha en diferentes columnas
        let fecha = null;
        let descripcion = '';
        let monto = 0;
        
        // Buscar fecha
        for (let j = 0; j < Math.min(row.length, 5); j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            fecha = cell;
            break;
          }
        }
        
        // Buscar descripción
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.length > 3 && !cell.match(/^\d+$/) && !cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            descripcion = cell;
            break;
          }
        }
        
        // SOLO procesar columna C (índice 2) - CARGOS/GASTOS
        const columnaCargo = row[2]; // Columna C
        if (columnaCargo && (typeof columnaCargo === 'number' || (typeof columnaCargo === 'string' && columnaCargo.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(columnaCargo.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue > 0) { // Solo valores mayores a 0
            monto = numValue;
            
            if (fecha && descripcion) {
              movimientos.push({
                fecha: fecha,
                descripcion: descripcion,
                monto: monto,
                tipo: 'gasto',
                banco: 'Banco de Chile',
                tipoCuenta: '',
                categoria: categorizarGasto(descripcion)
              });
              console.log(`✅ Gasto Banco Chile (fila ${i + 1}): ${formatearNumero(monto)} - ${descripcion}`);
            }
          }
        }
      }
    }
  } else if (tipoBanco === 'santander') {
    // Formato específico del Banco Santander - SOLO GASTOS (valores negativos columna A)
    console.log('🏦 Procesando Banco Santander - Solo gastos (valores negativos columna A)');
    
    // Encontrar las filas de inicio y fin para Santander
    let inicioMovimientos = -1;
    let finMovimientos = -1;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string') {
            const cellLower = cell.toLowerCase();
            if (cellLower.includes('detalle movimiento')) {
              inicioMovimientos = i + 1; // Comenzar desde la siguiente fila
              console.log(`📍 Inicio de movimientos encontrado en fila ${i + 1}: "${cell}"`);
            } else if (cellLower.includes('resumen comisiones')) {
              finMovimientos = i;
              console.log(`📍 Fin de movimientos encontrado en fila ${i + 1}: "${cell}"`);
              break;
            }
          }
        }
        if (finMovimientos !== -1) break;
      }
    }
    
    console.log(`📊 Procesando movimientos desde fila ${inicioMovimientos} hasta fila ${finMovimientos}`);
    
    // Procesar solo las filas entre inicio y fin
    for (let i = inicioMovimientos; i < finMovimientos && i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        // Buscar fecha y descripción
        let fecha = null;
        let descripcion = '';
        
        // Buscar fecha
        for (let j = 0; j < Math.min(row.length, 5); j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            fecha = cell;
            break;
          }
        }
        
        // Buscar descripción
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.length > 3 && !cell.match(/^\d+$/) && !cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            descripcion = cell;
            break;
          }
        }
        
        // SOLO procesar valores NEGATIVOS de la columna A (índice 0)
        const columnaA = row[0]; // Columna A
        if (columnaA && (typeof columnaA === 'number' || (typeof columnaA === 'string' && columnaA.match(/^[\-\d\.,]+$/)))) {
          const numValue = parseFloat(columnaA.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue < 0) { // Solo valores NEGATIVOS
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
          }
        }
      }
    }
  }
  
  return { movimientos, totalAbonos };
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
    
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        const movimientosArchivo = resultado.movimientos;
        const totalAbonos = resultado.totalAbonos;
        
        // Asignar tipo de cuenta según el índice
        const tipoCuenta = i === 0 ? 'venta' : 'arriendo';
        movimientosArchivo.forEach(mov => {
          mov.tipoCuenta = tipoCuenta;
        });
        
        // Guardar abonos según el tipo de cuenta
        if (tipoCuenta === 'venta') {
          abonosChile.venta = totalAbonos;
        } else {
          abonosChile.arriendo = totalAbonos;
        }
        
        movimientosChile = [...movimientosChile, ...movimientosArchivo];
      }
    }
    
    // Procesar archivo del Banco Santander (.xlsx)
    const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
    const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
    const resultadoSantander = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
    const movimientosSantander = resultadoSantander.movimientos;
    const abonosSantander = resultadoSantander.totalAbonos;
    
    // Consolidar todos los movimientos
    let todosLosMovimientos = [...movimientosChile, ...movimientosSantander];
    
    // Actualizar valores fijos con los abonos calculados automáticamente
    if (!valoresFijos) {
      valoresFijos = {
        bancoChileArriendo: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoChileVenta: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoSantander: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        abonosXPagos: 0,
        rescteFdosMut: 0
      };
    }
    
    // Actualizar abonos calculados automáticamente
    valoresFijos.bancoChileArriendo.abonos = abonosChile.arriendo;
    valoresFijos.bancoChileVenta.abonos = abonosChile.venta;
    valoresFijos.bancoSantander.abonos = abonosSantander;
    
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
    
    // Generar reporte consolidado con ExcelJS
    const buffer = await generarReporteConsolidadoExcelJS(todosLosMovimientos, valoresFijos);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="consolidacion_arricam.xlsx"'
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