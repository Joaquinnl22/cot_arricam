import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
    'vehiculo', 'auto', 'camion', 'ruta', 'autopista', 'peaje', 'patente', 'seguro', 
    'sura', 'hdi', 'kia', 'dodge', 'ranger', 'musso', 'actyon', 'volvo', 'ford', 
    'mercedes', 'liberty', 'bci', 'soap', 'rev tecnica', 'neumatico', 'bateria',
    'vehículo'
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
  let saldoInicial = 0;
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Buscar saldo inicial en las primeras filas
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (row) {
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (cell && typeof cell === 'string') {
          // Buscar patrones de saldo inicial
          if (cell.toLowerCase().includes('saldo inicial') || 
              cell.toLowerCase().includes('saldo anterior') ||
              cell.toLowerCase().includes('saldo') && cell.toLowerCase().includes('inicial')) {
            // Buscar el valor numérico en la misma fila o en la siguiente
            for (let k = j + 1; k < row.length; k++) {
              const valueCell = row[k];
              if (valueCell && (typeof valueCell === 'number' || (typeof valueCell === 'string' && valueCell.match(/^[\d\.,]+$/)))) {
                const numValue = parseFloat(valueCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
                if (!isNaN(numValue) && numValue > 0) {
                  saldoInicial = numValue;
                  break;
                }
              }
            }
            // Si no se encontró en la misma fila, buscar en la siguiente
            if (saldoInicial === 0 && i + 1 < data.length) {
              const nextRow = data[i + 1];
              for (let k = 0; k < nextRow.length; k++) {
                const valueCell = nextRow[k];
                if (valueCell && (typeof valueCell === 'number' || (typeof valueCell === 'string' && valueCell.match(/^[\d\.,]+$/)))) {
                  const numValue = parseFloat(valueCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
                  if (!isNaN(numValue) && numValue > 0) {
                    saldoInicial = numValue;
                    break;
                  }
                }
              }
            }
            break;
          }
        }
      }
      if (saldoInicial > 0) break;
    }
  }
  
  // Procesar según el tipo de banco
  if (tipoBanco === 'chile') {
    // Formato específico del Banco de Chile
    for (let i = 1; i < data.length; i++) {
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
        
        // Buscar monto
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\d\.,]+$/)))) {
            const numValue = parseFloat(cell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
            if (!isNaN(numValue) && numValue > 0) {
              monto = numValue;
              break;
            }
          }
        }
        
        if (fecha && monto > 0) {
          movimientos.push({
            fecha: fecha,
            descripcion: descripcion,
            monto: monto,
            tipo: 'gasto',
            banco: 'Banco de Chile',
            tipoCuenta: '',
            categoria: categorizarGasto(descripcion)
          });
        }
      }
    }
  } else if (tipoBanco === 'santander') {
    // Formato específico del Banco Santander
    for (let i = 1; i < data.length; i++) {
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
        
        // Buscar monto
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\d\.,]+$/)))) {
            const numValue = parseFloat(cell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
            if (!isNaN(numValue) && numValue > 0) {
              monto = numValue;
              break;
            }
          }
        }
        
        if (fecha && monto > 0) {
          movimientos.push({
            fecha: fecha,
            descripcion: descripcion,
            monto: monto,
            tipo: 'gasto',
            banco: 'Banco Santander',
            tipoCuenta: '',
            categoria: categorizarGasto(descripcion)
          });
        }
      }
    }
  }
  
  return { movimientos, saldoInicial };
}

// Función para generar el reporte consolidado con el formato específico de Arricam
function generarReporteConsolidado(movimientos, valoresFijos = null) {
  // Valores fijos por defecto si no se proporcionan
  const valoresPorDefecto = {
    bancoChileArriendo: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    bancoChileVenta: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    bancoSantander: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    abonosXPagos: 0,
    rescteFdosMut: 0
  };
  
  const valores = valoresFijos || valoresPorDefecto;
  
  // Agrupar por categorías
  const categorias = {};
  
  movimientos.forEach(mov => {
    if (!categorias[mov.categoria]) {
      categorias[mov.categoria] = [];
    }
    categorias[mov.categoria].push(mov);
  });
  
  // Crear workbook para el reporte
  const wb = XLSX.utils.book_new();
  
  // Calcular totales por cuenta
  const totalesPorCuenta = {
    'Banco de Chile - Arriendo': { gastos: 0, abonos: valores.bancoChileArriendo.abonos, saldoInicial: valores.bancoChileArriendo.saldoInicial },
    'Banco de Chile - Venta': { gastos: 0, abonos: valores.bancoChileVenta.abonos, saldoInicial: valores.bancoChileVenta.saldoInicial },
    'Banco Santander': { gastos: 0, abonos: valores.bancoSantander.abonos, saldoInicial: valores.bancoSantander.saldoInicial }
  };
  
  movimientos.forEach(mov => {
    if (mov.banco === 'Banco de Chile') {
      if (mov.tipoCuenta === 'arriendo') {
        totalesPorCuenta['Banco de Chile - Arriendo'].gastos += mov.monto;
      } else {
        totalesPorCuenta['Banco de Chile - Venta'].gastos += mov.monto;
      }
    } else if (mov.banco === 'Banco Santander') {
      totalesPorCuenta['Banco Santander'].gastos += mov.monto;
    }
  });
  
  // Calcular totales por categoría
  const totalesPorCategoria = {};
  Object.keys(categorias).forEach(categoria => {
    totalesPorCategoria[categoria] = categorias[categoria].reduce((sum, mov) => sum + mov.monto, 0);
  });
  
  // Crear hoja de consolidación (exactamente como el template)
  const hojaConsolidacion = [
    ['RESUMEN GASTOS MARZO 2025'],
    [''],
    ['GASTOS FIJOS'],
    ['FLETES', '', formatearNumero(totalesPorCategoria.FLETES || 0)],
    ['SUELDOS/IMPOSIC', '', formatearNumero(totalesPorCategoria.SUELDOS_IMPOSIC || 0)],
    ['MATERIALES', '', formatearNumero(totalesPorCategoria.MATERIALES || 0)],
    ['VEHICULOS', '', formatearNumero(totalesPorCategoria.VEHICULOS || 0)],
    ['PUBLICIDAD', '', formatearNumero(totalesPorCategoria.PUBLICIDAD || 0)],
    ['OTROS GASTOS', '', formatearNumero(totalesPorCategoria.OTROS_GASTOS || 0)],
    ['ART. ESCRITORIO', '', formatearNumero(totalesPorCategoria.ART_ESCRITORIO || 0)],
    ['COMBUSTIBLE', '', formatearNumero(totalesPorCategoria.COMBUSTIBLE || 0)],
    ['CONTADOR/ABOGADO/REDES', '', formatearNumero(totalesPorCategoria.CONTADOR_ABOGADO_REDES || 0)],
    ['IVA', '', formatearNumero(totalesPorCategoria.IVA || 0)],
    ['RENTA', '', formatearNumero(totalesPorCategoria.RENTA || 0)],
    ['IMPTOS BANCARIOS', '', formatearNumero(totalesPorCategoria.IMPTOS_BANCARIOS || 0)],
    ['REPUESTOS/REPARAC', '', formatearNumero(totalesPorCategoria.REPUESTOS_REPARAC || 0)],
    ['CAJA CHICA', '', formatearNumero(totalesPorCategoria.CAJA_CHICA || 0)],
    ['TOTAL GASTOS FIJOS', '', formatearNumero(Object.values(totalesPorCategoria).reduce((sum, total) => sum + total, 0))],
    [''],
    ['COMPRA CONT-INVERS / ARRDOS CONTAINERS - INTERNOS', '', formatearNumero(totalesPorCategoria.COMPRA_CONTAINERS || 0)],
    ['INVERSIONES/FDOS MUTUOS', '', formatearNumero(totalesPorCategoria.INVERSIONES || 0)],
    ['DEVOLUC GARANTIAS', '', formatearNumero(totalesPorCategoria.DEVOLUCION_GARANTIAS || 0)],
    ['TOTAL INVERSIONES', '', formatearNumero((totalesPorCategoria.COMPRA_CONTAINERS || 0) + (totalesPorCategoria.INVERSIONES || 0) + (totalesPorCategoria.DEVOLUCION_GARANTIAS || 0))],
    [''],
    ['TRANSFERENCIAS', '', formatearNumero(totalesPorCategoria.TRANSFERENCIAS || 0)],
    ['REDEPOSITOS /CHQ PROTEST', '', formatearNumero(0)], // Se calcula por diferencia
    ['TOT. GRAL MOVIMIENTOS', '', formatearNumero(Object.values(totalesPorCategoria).reduce((sum, total) => sum + total, 0))],
    [''],
    ['SALDO INICIAL', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + totalesPorCuenta['Banco Santander'].saldoInicial)],
    ['ABONOS X PAGOS', '', formatearNumero(valores.abonosXPagos)],
    ['RESCTE FDOS MUT/OTROS', '', formatearNumero(valores.rescteFdosMut)],
    ['TOTAL INGRESOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + totalesPorCuenta['Banco Santander'].saldoInicial + valores.abonosXPagos)]
  ];
  
  // Crear hoja de detalle (segunda imagen)
  const hojaDetalle = [
    ['DETALLE GASTOS ARRICAM SPA'],
    ['BCO CHILE CTA NRO.168-06824-09*168-08475-09'],
    ['BANCO SANTANDER NRO. 6866228-1'],
    ['DESDE', '01-03-2025'],
    [''],
    ['FLETES'],
    ['FECHA', 'DETALLE', 'MONTO', 'TIPO']
  ];
  
  // Agregar movimientos de FLETES
  if (categorias.FLETES) {
    categorias.FLETES.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL FLETES', formatearNumero(totalesPorCategoria.FLETES), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['CONTADOR / ABOGADO / REDES']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de CONTADOR_ABOGADO_REDES
  if (categorias.CONTADOR_ABOGADO_REDES) {
    categorias.CONTADOR_ABOGADO_REDES.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL CONTADOR/ABOGADO/REDES', formatearNumero(totalesPorCategoria.CONTADOR_ABOGADO_REDES), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['VEHICULOS']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de VEHICULOS
  if (categorias.VEHICULOS) {
    categorias.VEHICULOS.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL VEHICULOS', formatearNumero(totalesPorCategoria.VEHICULOS), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['SUELDOS/IMPOSICIONES']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de SUELDOS_IMPOSIC
  if (categorias.SUELDOS_IMPOSIC) {
    categorias.SUELDOS_IMPOSIC.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL SUELDOS/IMPOSICIONES', formatearNumero(totalesPorCategoria.SUELDOS_IMPOSIC), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['MATERIALES / HERRAMIENTAS']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de MATERIALES
  if (categorias.MATERIALES) {
    categorias.MATERIALES.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL MATERIALES', formatearNumero(totalesPorCategoria.MATERIALES), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['PUBLICIDAD']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de PUBLICIDAD
  if (categorias.PUBLICIDAD) {
    categorias.PUBLICIDAD.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL PUBLICIDAD', formatearNumero(totalesPorCategoria.PUBLICIDAD), '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['TRANSFERENCIAS OTRAS CUENTAS CTES']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de TRANSFERENCIAS
  if (categorias.TRANSFERENCIAS) {
    categorias.TRANSFERENCIAS.forEach(mov => {
      hojaDetalle.push([
        mov.fecha,
        mov.descripcion,
        mov.monto,
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    hojaDetalle.push(['', 'TOTAL TRANSFERENCIAS', totalesPorCategoria.TRANSFERENCIAS, '']);
  }
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['REDEPOSITOS CHQ PROTEST / OTROS TRANSF']);
  hojaDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de otros tipos
  const otrosMovimientos = movimientos.filter(mov => 
    !['FLETES', 'CONTADOR_ABOGADO_REDES', 'VEHICULOS', 'SUELDOS_IMPOSIC', 'MATERIALES', 'PUBLICIDAD', 'TRANSFERENCIAS'].includes(mov.categoria)
  );
  
  otrosMovimientos.forEach(mov => {
    hojaDetalle.push([
      mov.fecha,
      mov.descripcion,
      mov.monto,
      mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
    ]);
  });
  
  // Agregar resumen de cuentas al final
  hojaDetalle.push(['']);
  hojaDetalle.push(['CTA. CTE. ARRDOS NRO. 168-06824-09']);
  hojaDetalle.push(['SALDO INICIAL CHILE', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial)]);
  hojaDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valores.bancoChileArriendo.abonos)]);
  hojaDetalle.push(['OTRO ABONO', '', '']);
  hojaDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + valores.bancoChileArriendo.abonos)]);
  hojaDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].gastos)]);
  hojaDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  hojaDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + valores.bancoChileArriendo.abonos - totalesPorCuenta['Banco de Chile - Arriendo'].gastos)]);
  hojaDetalle.push(['LINEA CREDITO', '', formatearNumero(valores.bancoChileArriendo.lineaCredito)]);
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['CTA. CTE. VENTAS NRO. 168-08475-09']);
  hojaDetalle.push(['SALDO INICIAL CHILE', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial)]);
  hojaDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valores.bancoChileVenta.abonos)]);
  hojaDetalle.push(['OTRO ABONO', '', '']);
  hojaDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + valores.bancoChileVenta.abonos)]);
  hojaDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].gastos)]);
  hojaDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  hojaDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + valores.bancoChileVenta.abonos - totalesPorCuenta['Banco de Chile - Venta'].gastos)]);
  
  hojaDetalle.push(['']);
  hojaDetalle.push(['CTA. CTE. BANCO SANTANDER NRO. 6866228-1']);
  hojaDetalle.push(['SALDO INICIAL SANTANDER', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial)]);
  hojaDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valores.bancoSantander.abonos)]);
  hojaDetalle.push(['OTRO ABONO', '', '']);
  hojaDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial + valores.bancoSantander.abonos)]);
  hojaDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco Santander'].gastos)]);
  hojaDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  hojaDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial + valores.bancoSantander.abonos - totalesPorCuenta['Banco Santander'].gastos)]);
  hojaDetalle.push(['LINEA CREDITO', '', formatearNumero(valores.bancoSantander.lineaCredito)]);
  
  // Crear las hojas del workbook
  const wsConsolidacion = XLSX.utils.aoa_to_sheet(hojaConsolidacion);
  const wsDetalle = XLSX.utils.aoa_to_sheet(hojaDetalle);
  
  // Aplicar formato exacto como el template
  const rangeConsolidacion = XLSX.utils.decode_range(wsConsolidacion['!ref']);
  const rangeDetalle = XLSX.utils.decode_range(wsDetalle['!ref']);
  
  // Aplicar formato con colores grises y bordes visibles
  for (let row = rangeConsolidacion.s.r; row <= rangeConsolidacion.e.r; row++) {
    for (let col = rangeConsolidacion.s.c; col <= rangeConsolidacion.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
              // Aplicar estilos a todas las celdas, incluso las vacías
        if (!wsConsolidacion[cellRef]) {
          wsConsolidacion[cellRef] = { v: '', t: 's' };
        }
        
        const cellValue = wsConsolidacion[cellRef].v;
        
        // Determinar el estilo según el contenido
        let fillColor = null;
        let fontColor = null;
        let isBold = false;
        
        if (cellValue && typeof cellValue === 'string') {
          if (cellValue.includes('TOTAL') || cellValue.includes('GASTOS FIJOS')) {
            fillColor = 'D3D3D3'; // Gris claro
            isBold = true;
          } else if (cellValue.includes('RESUMEN') || cellValue.includes('MARZO')) {
            fillColor = 'A9A9A9'; // Gris medio
            fontColor = 'FFFFFF';
            isBold = true;
          } else if (['FLETES', 'SUELDOS/IMPOSIC', 'MATERIALES', 'VEHICULOS', 'PUBLICIDAD', 
                      'OTROS GASTOS', 'ART. ESCRITORIO', 'COMBUSTIBLE', 'CONTADOR/ABOGADO/REDES',
                      'IVA', 'RENTA', 'IMPTOS BANCARIOS', 'REPUESTOS/REPARAC', 'CAJA CHICA',
                      'COMPRA CONT-INVERS', 'INVERSIONES/FDOS MUTUOS', 'DEVOLUC GARANTIAS',
                      'TRANSFERENCIAS', 'REDEPOSITOS /CHQ PROTEST', 'SALDO INICIAL', 
                      'ABONOS X PAGOS', 'RESCTE FDOS MUT/OTROS', 'TOTAL INGRESOS'].includes(cellValue)) {
            fillColor = 'F5F5F5'; // Gris muy claro
            isBold = true;
          }
        }
        
        wsConsolidacion[cellRef].s = {
          font: {
            bold: isBold,
            color: fontColor ? { rgb: fontColor } : { rgb: "000000" }
          },
          fill: fillColor ? { fgColor: { rgb: fillColor } } : { fgColor: { rgb: "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          },
          alignment: {
            horizontal: "left",
            vertical: "center"
          }
        };
      }
    }
  
  // Aplicar formato con colores grises y bordes visibles para detalle
  for (let row = rangeDetalle.s.r; row <= rangeDetalle.e.r; row++) {
    for (let col = rangeDetalle.s.c; col <= rangeDetalle.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
              // Aplicar estilos a todas las celdas, incluso las vacías
        if (!wsDetalle[cellRef]) {
          wsDetalle[cellRef] = { v: '', t: 's' };
        }
        
        const cellValue = wsDetalle[cellRef].v;
        
        // Determinar el estilo según el contenido
        let fillColor = null;
        let fontColor = null;
        let isBold = false;
        
        if (cellValue && typeof cellValue === 'string') {
          if (cellValue.includes('TOTAL')) {
            fillColor = 'D3D3D3'; // Gris claro
            isBold = true;
          } else if (cellValue.includes('DETALLE GASTOS') || cellValue.includes('BCO CHILE') || 
                    cellValue.includes('BANCO SANTANDER') || cellValue.includes('DESDE')) {
            fillColor = 'A9A9A9'; // Gris medio
            fontColor = 'FFFFFF';
            isBold = true;
          } else if (['FLETES', 'CONTADOR / ABOGADO / REDES', 'VEHICULOS', 'SUELDOS/IMPOSICIONES',
                      'MATERIALES / HERRAMIENTAS', 'PUBLICIDAD', 'TRANSFERENCIAS OTRAS CUENTAS CTES',
                      'REDEPOSITOS CHQ PROTEST / OTROS TRANSF'].includes(cellValue)) {
            fillColor = 'F5F5F5'; // Gris muy claro
            isBold = true;
          } else if (cellValue.includes('CTA. CTE.') || cellValue.includes('SALDO') || 
                    cellValue.includes('ABONOS') || cellValue.includes('GASTOS') || 
                    cellValue.includes('LINEA')) {
            fillColor = 'E8E8E8'; // Gris claro
            isBold = true;
          } else if (['FECHA', 'DETALLE', 'MONTO', 'TIPO'].includes(cellValue)) {
            fillColor = 'DCDCDC'; // Gris claro para encabezados
            isBold = true;
          }
        }
        
        wsDetalle[cellRef].s = {
          font: {
            bold: isBold,
            color: fontColor ? { rgb: fontColor } : { rgb: "000000" }
          },
          fill: fillColor ? { fgColor: { rgb: fillColor } } : { fgColor: { rgb: "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } }
          },
          alignment: {
            horizontal: "left",
            vertical: "center"
          }
        };
      }
    }
  
  // Agregar merges dinámicos para totales
  const merges = [];
  for (let row = 0; row <= rangeDetalle.e.r; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 });
    if (wsDetalle[cellRef] && wsDetalle[cellRef].v && wsDetalle[cellRef].v.includes('TOTAL')) {
      merges.push({ s: { c: 0, r: row }, e: { c: 2, r: row } });
    }
  }
  wsDetalle['!merges'] = merges;
  
  // Ajustar ancho de columnas como en el template
  wsConsolidacion['!cols'] = [
    { width: 40 },
    { width: 15 },
    { width: 20 }
  ];
  
  wsDetalle['!cols'] = [
    { width: 15 },
    { width: 50 },
    { width: 15 },
    { width: 10 }
  ];
  
  // Agregar las hojas al workbook
  XLSX.utils.book_append_sheet(wb, wsConsolidacion, 'Consolidación');
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');
  
  // Generar el archivo Excel
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  
  return excelBuffer;
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
    let saldosInicialesChile = { venta: 0, arriendo: 0 };
    
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        const movimientosArchivo = resultado.movimientos;
        const saldoInicial = resultado.saldoInicial;
        
        // Asignar tipo de cuenta según el índice y guardar saldo inicial
        const tipoCuenta = i === 0 ? 'venta' : 'arriendo';
        movimientosArchivo.forEach(mov => {
          mov.tipoCuenta = tipoCuenta;
        });
        
        // Guardar saldo inicial según el tipo de cuenta
        if (tipoCuenta === 'venta') {
          saldosInicialesChile.venta = saldoInicial;
        } else {
          saldosInicialesChile.arriendo = saldoInicial;
        }
        
        movimientosChile = [...movimientosChile, ...movimientosArchivo];
      }
    }
    
    // Procesar archivo del Banco Santander (.xlsx)
    const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
    const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
    const resultadoSantander = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
    const movimientosSantander = resultadoSantander.movimientos;
    const saldoInicialSantander = resultadoSantander.saldoInicial;
    
    // Consolidar todos los movimientos
    let todosLosMovimientos = [...movimientosChile, ...movimientosSantander];
    
    // Actualizar valores fijos con los saldos iniciales extraídos
    if (!valoresFijos) {
      valoresFijos = {
        bancoChileArriendo: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoChileVenta: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        bancoSantander: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
        abonosXPagos: 0,
        rescteFdosMut: 0
      };
    }
    
    // Actualizar saldos iniciales extraídos de los archivos
    valoresFijos.bancoChileArriendo.saldoInicial = saldosInicialesChile.arriendo;
    valoresFijos.bancoChileVenta.saldoInicial = saldosInicialesChile.venta;
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
    
    // Generar reporte consolidado
    const buffer = generarReporteConsolidado(todosLosMovimientos, valoresFijos);
    
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