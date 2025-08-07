import ExcelJS from 'exceljs';

// Función para formatear números con puntos de miles
function formatearNumero(numero) {
  if (numero === null || numero === undefined || numero === '') return '';
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Función para generar el reporte consolidado con ExcelJS
export async function generarReporteConsolidadoExcelJS(movimientos, valoresFijos = null) {
  // Calcular el mes anterior al actual
  const fechaActual = new Date();
  const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
  const nombreMesAnterior = mesAnterior.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const nombreMesAnteriorCorto = mesAnterior.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
  const añoAnterior = mesAnterior.getFullYear();
  
  // Valores fijos por defecto si no se proporcionan
  const valoresPorDefecto = {
    bancoChileArriendo: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    bancoChileVenta: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    bancoSantander: { saldoInicial: 0, abonos: 0, lineaCredito: 0 },
    abonosXPagos: 0,
    rescteFdosMut: 0
  };
  
  const valores = valoresFijos || valoresPorDefecto;
  
  // Convertir todos los valores a números para evitar problemas de concatenación
  const valoresNumericos = {
    bancoChileArriendo: { 
      saldoInicial: Number(valores.bancoChileArriendo.saldoInicial) || 0, 
      abonos: Number(valores.bancoChileArriendo.abonos) || 0, 
      lineaCredito: Number(valores.bancoChileArriendo.lineaCredito) || 0 
    },
    bancoChileVenta: { 
      saldoInicial: Number(valores.bancoChileVenta.saldoInicial) || 0, 
      abonos: Number(valores.bancoChileVenta.abonos) || 0, 
      lineaCredito: Number(valores.bancoChileVenta.lineaCredito) || 0 
    },
    bancoSantander: { 
      saldoInicial: Number(valores.bancoSantander.saldoInicial) || 0, 
      abonos: Number(valores.bancoSantander.abonos) || 0, 
      lineaCredito: Number(valores.bancoSantander.lineaCredito) || 0 
    },
    abonosXPagos: Number(valores.abonosXPagos) || 0,
    rescteFdosMut: Number(valores.rescteFdosMut) || 0
  };
  
  // Debug: Log de valores para verificar
  console.log('🔍 Valores fijos recibidos:', valores);
  console.log('🔍 Valores numéricos convertidos:', valoresNumericos);
  
  // Log específico de saldos iniciales
  console.log('💰 Saldos iniciales:');
  console.log(`  - Banco Chile Arriendo: ${formatearNumero(valoresNumericos.bancoChileArriendo.saldoInicial)}`);
  console.log(`  - Banco Chile Venta: ${formatearNumero(valoresNumericos.bancoChileVenta.saldoInicial)}`);
  console.log(`  - Banco Santander: ${formatearNumero(valoresNumericos.bancoSantander.saldoInicial)}`);
  
  // Log específico de abonos
  console.log('💰 Abonos:');
  console.log(`  - Banco Chile Arriendo: ${formatearNumero(valoresNumericos.bancoChileArriendo.abonos)}`);
  console.log(`  - Banco Chile Venta: ${formatearNumero(valoresNumericos.bancoChileVenta.abonos)}`);
  console.log(`  - Banco Santander: ${formatearNumero(valoresNumericos.bancoSantander.abonos)}`);
  
  // Agrupar por categorías
  const categorias = {};
  
  movimientos.forEach(mov => {
    if (!categorias[mov.categoria]) {
      categorias[mov.categoria] = [];
    }
    categorias[mov.categoria].push(mov);
  });
  
  // Crear workbook con ExcelJS
  const workbook = new ExcelJS.Workbook();
  
  // Calcular totales por cuenta
  const totalesPorCuenta = {
    'Banco de Chile - Arriendo': { gastos: 0, abonos: valoresNumericos.bancoChileArriendo.abonos, saldoInicial: valoresNumericos.bancoChileArriendo.saldoInicial },
    'Banco de Chile - Venta': { gastos: 0, abonos: valoresNumericos.bancoChileVenta.abonos, saldoInicial: valoresNumericos.bancoChileVenta.saldoInicial },
    'Banco Santander': { gastos: 0, abonos: valoresNumericos.bancoSantander.abonos, saldoInicial: valoresNumericos.bancoSantander.saldoInicial }
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
  
  // Log de totales por cuenta
  console.log('📊 Totales por cuenta:');
  console.log('  - Banco Chile Arriendo:', totalesPorCuenta['Banco de Chile - Arriendo']);
  console.log('  - Banco Chile Venta:', totalesPorCuenta['Banco de Chile - Venta']);
  console.log('  - Banco Santander:', totalesPorCuenta['Banco Santander']);
  
  // Log de cálculos finales
  const saldoInicialTotal = totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + totalesPorCuenta['Banco Santander'].saldoInicial;
  const abonosTotal = valoresNumericos.bancoChileArriendo.abonos + valoresNumericos.bancoChileVenta.abonos + valoresNumericos.bancoSantander.abonos;
  const totalIngresos = saldoInicialTotal + abonosTotal;
  
  console.log('💰 Cálculos finales:');
  console.log(`  - Saldo inicial total: ${formatearNumero(saldoInicialTotal)}`);
  console.log(`  - Abonos total: ${formatearNumero(abonosTotal)}`);
  console.log(`  - Total ingresos: ${formatearNumero(totalIngresos)}`);
  
  // Calcular totales por categoría
  const totalesPorCategoria = {};
  Object.keys(categorias).forEach(categoria => {
    totalesPorCategoria[categoria] = categorias[categoria].reduce((sum, mov) => sum + mov.monto, 0);
  });
  
  // Crear hoja de consolidación
  const worksheetConsolidacion = workbook.addWorksheet('Consolidación');
  
  // Datos de consolidación
  const datosConsolidacion = [
    [`RESUMEN GASTOS ${nombreMesAnteriorCorto} ${añoAnterior}`],
    [''],
    ['GASTOS FIJOS'],
    ['FLETES', '', formatearNumero(totalesPorCategoria.FLETES || 0)],
    ['SUELDOS/IMPOSIC', '', formatearNumero(totalesPorCategoria.SUELDOS_IMPOSIC || 0)],
    ['MATERIALES', '', formatearNumero(totalesPorCategoria.MATERIALES || 0)],
    ['VEHICULOS', '', formatearNumero(totalesPorCategoria.VEHICULOS || 0)],
    ['VEHICULO AUTOPISTAS', '', formatearNumero(totalesPorCategoria.VEHICULO_AUTOPISTAS || 0)],
    ['VEHICULO SEGUROS', '', formatearNumero(totalesPorCategoria.VEHICULO_SEGUROS || 0)],
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
    ['TOTAL GASTOS FIJOS', '', formatearNumero(
      (totalesPorCategoria.FLETES || 0) +
      (totalesPorCategoria.SUELDOS_IMPOSIC || 0) +
      (totalesPorCategoria.MATERIALES || 0) +
      (totalesPorCategoria.VEHICULO_AUTOPISTAS || 0) +
      (totalesPorCategoria.VEHICULO_SEGUROS || 0) +
      (totalesPorCategoria.PUBLICIDAD || 0) +
      (totalesPorCategoria.OTROS_GASTOS || 0) +
      (totalesPorCategoria.ART_ESCRITORIO || 0) +
      (totalesPorCategoria.COMBUSTIBLE || 0) +
      (totalesPorCategoria.CONTADOR_ABOGADO_REDES || 0) +
      (totalesPorCategoria.IVA || 0) +
      (totalesPorCategoria.RENTA || 0) +
      (totalesPorCategoria.IMPTOS_BANCARIOS || 0) +
      (totalesPorCategoria.REPUESTOS_REPARAC || 0) +
      (totalesPorCategoria.CAJA_CHICA || 0)
    )],
    [''],
    ['COMPRA CONT-INVERS / ARRDOS CONTAINERS - INTERNOS', '', formatearNumero(totalesPorCategoria.COMPRA_CONTAINERS || 0)],
    ['INVERSIONES/FDOS MUTUOS', '', formatearNumero(totalesPorCategoria.INVERSIONES || 0)],
    ['DEVOLUC GARANTIAS', '', formatearNumero(totalesPorCategoria.DEVOLUCION_GARANTIAS || 0)],
    ['TOTAL INVERSIONES', '', formatearNumero((totalesPorCategoria.COMPRA_CONTAINERS || 0) + (totalesPorCategoria.INVERSIONES || 0) + (totalesPorCategoria.DEVOLUCION_GARANTIAS || 0))],
    [''],
    ['TRANSFERENCIAS', '', formatearNumero(totalesPorCategoria.TRANSFERENCIAS || 0)],
    ['REDEPOSITOS /CHQ PROTEST', '', formatearNumero(0)], // Se calcula por diferencia
    ['TOT. GRAL MOVIMIENTOS', '', formatearNumero(movimientos.filter(mov => mov.tipo === 'gasto').reduce((sum, mov) => sum + mov.monto, 0))],
    [''],
    ['SALDO INICIAL', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + totalesPorCuenta['Banco Santander'].saldoInicial)],
    ['ABONOS X PAGOS', '', formatearNumero(valoresNumericos.bancoChileArriendo.abonos + valoresNumericos.bancoChileVenta.abonos + valoresNumericos.bancoSantander.abonos)],
    ['RESCTE FDOS MUT/OTROS', '', formatearNumero(valoresNumericos.rescteFdosMut)],
    ['TOTAL INGRESOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + totalesPorCuenta['Banco Santander'].saldoInicial + valoresNumericos.bancoChileArriendo.abonos + valoresNumericos.bancoChileVenta.abonos + valoresNumericos.bancoSantander.abonos)]
  ];
  
  // Agregar datos a la hoja de consolidación
  datosConsolidacion.forEach((row, rowIndex) => {
    const excelRow = worksheetConsolidacion.addRow(row);
    
    // Aplicar estilos según el contenido
    row.forEach((cellValue, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      
      if (cellValue && typeof cellValue === 'string') {
        if (cellValue.includes('TOTAL') || cellValue.includes('GASTOS FIJOS')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
          cell.font = { bold: true };
        } else if (cellValue.includes('RESUMEN GLOBAL')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9A9A9' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else if (cellValue.includes('RESUMEN') || cellValue.includes('MARZO')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9A9A9' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else if (['FLETES', 'SUELDOS/IMPOSIC', 'MATERIALES', 'VEHICULOS', 'VEHICULO AUTOPISTAS', 'VEHICULO SEGUROS', 'PUBLICIDAD', 
                    'OTROS GASTOS', 'ART. ESCRITORIO', 'COMBUSTIBLE', 'CONTADOR/ABOGADO/REDES',
                    'IVA', 'RENTA', 'IMPTOS BANCARIOS', 'REPUESTOS/REPARAC', 'CAJA CHICA',
                    'COMPRA CONT-INVERS', 'INVERSIONES/FDOS MUTUOS', 'DEVOLUC GARANTIAS',
                    'TRANSFERENCIAS', 'REDEPOSITOS /CHQ PROTEST', 'SALDO INICIAL', 
                    'ABONOS X PAGOS', 'RESCTE FDOS MUT/OTROS', 'TOTAL INGRESOS',
                    'RESUMEN GLOBAL', 'TOTAL SALDOS INICIALES', 'TOTAL ABONOS'].includes(cellValue)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          cell.font = { bold: true };
        }
      }
      
      // Aplicar bordes a todas las celdas
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
  });
  
  // Crear hoja de detalle
  const worksheetDetalle = workbook.addWorksheet('Detalle');
  
  // Datos de detalle
  const datosDetalle = [
    ['DETALLE GASTOS ARRICAM SPA'],
    ['BCO CHILE CTA NRO.168-06824-09*168-08475-09'],
    ['BANCO SANTANDER NRO. 6866228-1'],
    ['DESDE', `01-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}-${añoAnterior}`],
    [''],
    ['FLETES'],
    ['FECHA', 'DETALLE', 'MONTO', 'TIPO']
  ];
  
  // Agregar movimientos de FLETES
  if (categorias.FLETES) {
    categorias.FLETES.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL FLETES', formatearNumero(totalesPorCategoria.FLETES), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['CONTADOR / ABOGADO / REDES']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de CONTADOR_ABOGADO_REDES
  if (categorias.CONTADOR_ABOGADO_REDES) {
    categorias.CONTADOR_ABOGADO_REDES.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL CONTADOR/ABOGADO/REDES', formatearNumero(totalesPorCategoria.CONTADOR_ABOGADO_REDES), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['VEHICULOS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de VEHICULOS
  if (categorias.VEHICULOS) {
    categorias.VEHICULOS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL VEHICULOS', formatearNumero(totalesPorCategoria.VEHICULOS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['VEHICULO AUTOPISTAS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de VEHICULO_AUTOPISTAS
  if (categorias.VEHICULO_AUTOPISTAS) {
    categorias.VEHICULO_AUTOPISTAS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL VEHICULO AUTOPISTAS', formatearNumero(totalesPorCategoria.VEHICULO_AUTOPISTAS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['VEHICULO SEGUROS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de VEHICULO_SEGUROS
  if (categorias.VEHICULO_SEGUROS) {
    categorias.VEHICULO_SEGUROS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL VEHICULO SEGUROS', formatearNumero(totalesPorCategoria.VEHICULO_SEGUROS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['SUELDOS/IMPOSICIONES']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de SUELDOS_IMPOSIC
  if (categorias.SUELDOS_IMPOSIC) {
    categorias.SUELDOS_IMPOSIC.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL SUELDOS/IMPOSICIONES', formatearNumero(totalesPorCategoria.SUELDOS_IMPOSIC), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['MATERIALES / HERRAMIENTAS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de MATERIALES
  if (categorias.MATERIALES) {
    categorias.MATERIALES.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL MATERIALES', formatearNumero(totalesPorCategoria.MATERIALES), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['PUBLICIDAD']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de PUBLICIDAD
  if (categorias.PUBLICIDAD) {
    categorias.PUBLICIDAD.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL PUBLICIDAD', formatearNumero(totalesPorCategoria.PUBLICIDAD), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['COMBUSTIBLE']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de COMBUSTIBLE
  if (categorias.COMBUSTIBLE) {
    categorias.COMBUSTIBLE.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL COMBUSTIBLE', formatearNumero(totalesPorCategoria.COMBUSTIBLE), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['ART. ESCRITORIO']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de ART_ESCRITORIO
  if (categorias.ART_ESCRITORIO) {
    categorias.ART_ESCRITORIO.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL ART. ESCRITORIO', formatearNumero(totalesPorCategoria.ART_ESCRITORIO), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['IVA']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de IVA
  if (categorias.IVA) {
    categorias.IVA.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL IVA', formatearNumero(totalesPorCategoria.IVA), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['RENTA']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de RENTA
  if (categorias.RENTA) {
    categorias.RENTA.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL RENTA', formatearNumero(totalesPorCategoria.RENTA), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['IMPTOS BANCARIOS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de IMPTOS_BANCARIOS
  if (categorias.IMPTOS_BANCARIOS) {
    categorias.IMPTOS_BANCARIOS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL IMPTOS BANCARIOS', formatearNumero(totalesPorCategoria.IMPTOS_BANCARIOS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['REPUESTOS/REPARAC']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de REPUESTOS_REPARAC
  if (categorias.REPUESTOS_REPARAC) {
    categorias.REPUESTOS_REPARAC.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL REPUESTOS/REPARAC', formatearNumero(totalesPorCategoria.REPUESTOS_REPARAC), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['CAJA CHICA']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de CAJA_CHICA
  if (categorias.CAJA_CHICA) {
    categorias.CAJA_CHICA.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL CAJA CHICA', formatearNumero(totalesPorCategoria.CAJA_CHICA), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['COMPRA CONTAINERS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de COMPRA_CONTAINERS
  if (categorias.COMPRA_CONTAINERS) {
    categorias.COMPRA_CONTAINERS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL COMPRA CONTAINERS', formatearNumero(totalesPorCategoria.COMPRA_CONTAINERS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['INVERSIONES']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de INVERSIONES
  if (categorias.INVERSIONES) {
    categorias.INVERSIONES.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL INVERSIONES', formatearNumero(totalesPorCategoria.INVERSIONES), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['DEVOLUCION GARANTIAS']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de DEVOLUCION_GARANTIAS
  if (categorias.DEVOLUCION_GARANTIAS) {
    categorias.DEVOLUCION_GARANTIAS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL DEVOLUCION GARANTIAS', formatearNumero(totalesPorCategoria.DEVOLUCION_GARANTIAS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['TRANSFERENCIAS OTRAS CUENTAS CTES']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de TRANSFERENCIAS
  if (categorias.TRANSFERENCIAS) {
    categorias.TRANSFERENCIAS.forEach(mov => {
      datosDetalle.push([
        mov.fecha,
        mov.descripcion,
        formatearNumero(mov.monto),
        mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
      ]);
    });
    datosDetalle.push(['', 'TOTAL TRANSFERENCIAS', formatearNumero(totalesPorCategoria.TRANSFERENCIAS), '']);
  }
  
  datosDetalle.push(['']);
  datosDetalle.push(['REDEPOSITOS CHQ PROTEST / OTROS TRANSF']);
  datosDetalle.push(['FECHA', 'DETALLE', 'MONTO', 'TIPO']);
  
  // Agregar movimientos de otros tipos
  const otrosMovimientos = movimientos.filter(mov => 
    !['FLETES', 'CONTADOR_ABOGADO_REDES', 'VEHICULOS', 'VEHICULO_AUTOPISTAS', 'VEHICULO_SEGUROS', 'SUELDOS_IMPOSIC', 'MATERIALES', 'PUBLICIDAD', 'COMBUSTIBLE', 'ART_ESCRITORIO', 'IVA', 'RENTA', 'IMPTOS_BANCARIOS', 'REPUESTOS_REPARAC', 'CAJA_CHICA', 'COMPRA_CONTAINERS', 'INVERSIONES', 'DEVOLUCION_GARANTIAS', 'TRANSFERENCIAS'].includes(mov.categoria)
  );
  
  otrosMovimientos.forEach(mov => {
    datosDetalle.push([
      mov.fecha,
      mov.descripcion,
      formatearNumero(mov.monto),
      mov.tipoCuenta === 'arriendo' ? 'ar' : mov.tipoCuenta === 'venta' ? 'vt' : 's'
    ]);
  });
  
  // Agregar resumen de cuentas al final
  datosDetalle.push(['']);
  datosDetalle.push(['CTA. CTE. ARRDOS NRO. 168-06824-09']);
  datosDetalle.push(['SALDO INICIAL CHILE', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial)]);
  datosDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valoresNumericos.bancoChileArriendo.abonos)]);
  datosDetalle.push(['OTRO ABONO', '', '']);
  datosDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + valoresNumericos.bancoChileArriendo.abonos)]);
  datosDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].gastos)]);
  datosDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  datosDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco de Chile - Arriendo'].saldoInicial + valoresNumericos.bancoChileArriendo.abonos - totalesPorCuenta['Banco de Chile - Arriendo'].gastos)]);
  datosDetalle.push(['LINEA CREDITO', '', formatearNumero(valoresNumericos.bancoChileArriendo.lineaCredito)]);
  
  datosDetalle.push(['']);
  datosDetalle.push(['CTA. CTE. VENTAS NRO. 168-08475-09']);
  datosDetalle.push(['SALDO INICIAL CHILE', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial)]);
  datosDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valoresNumericos.bancoChileVenta.abonos)]);
  datosDetalle.push(['OTRO ABONO', '', '']);
  datosDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + valoresNumericos.bancoChileVenta.abonos)]);
  datosDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].gastos)]);
  datosDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  datosDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco de Chile - Venta'].saldoInicial + valoresNumericos.bancoChileVenta.abonos - totalesPorCuenta['Banco de Chile - Venta'].gastos)]);
  
  datosDetalle.push(['']);
  datosDetalle.push(['CTA. CTE. BANCO SANTANDER NRO. 6866228-1']);
  datosDetalle.push(['SALDO INICIAL SANTANDER', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial)]);
  datosDetalle.push(['ABONOS CTA CTE', '', formatearNumero(valoresNumericos.bancoSantander.abonos)]);
  datosDetalle.push(['OTRO ABONO', '', '']);
  datosDetalle.push(['TOT HABER', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial + valoresNumericos.bancoSantander.abonos)]);
  datosDetalle.push(['GASTOS', '', formatearNumero(totalesPorCuenta['Banco Santander'].gastos)]);
  datosDetalle.push(['CHQ. GIRADOS X COB', '', '']);
  datosDetalle.push(['SALDO LIQUIDO', '', formatearNumero(totalesPorCuenta['Banco Santander'].saldoInicial + valoresNumericos.bancoSantander.abonos - totalesPorCuenta['Banco Santander'].gastos)]);
  datosDetalle.push(['LINEA CREDITO', '', formatearNumero(valoresNumericos.bancoSantander.lineaCredito)]);
  
  // Agregar datos a la hoja de detalle
  datosDetalle.forEach((row, rowIndex) => {
    const excelRow = worksheetDetalle.addRow(row);
    
    // Aplicar estilos según el contenido
    row.forEach((cellValue, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      
      if (cellValue && typeof cellValue === 'string') {
        if (cellValue.includes('TOTAL')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
          cell.font = { bold: true };
        } else if (cellValue.includes('DETALLE GASTOS') || cellValue.includes('BCO CHILE') || 
                  cellValue.includes('BANCO SANTANDER') || cellValue.includes('DESDE')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9A9A9' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else if (['FLETES', 'CONTADOR / ABOGADO / REDES', 'VEHICULOS', 'VEHICULO AUTOPISTAS', 'VEHICULO SEGUROS', 'SUELDOS/IMPOSICIONES',
                    'MATERIALES / HERRAMIENTAS', 'PUBLICIDAD', 'TRANSFERENCIAS OTRAS CUENTAS CTES',
                    'REDEPOSITOS CHQ PROTEST / OTROS TRANSF', 'COMBUSTIBLE', 'ART. ESCRITORIO',
                    'IVA', 'RENTA', 'IMPTOS BANCARIOS', 'REPUESTOS/REPARAC', 'CAJA CHICA',
                    'COMPRA CONTAINERS', 'INVERSIONES', 'DEVOLUCION GARANTIAS'].includes(cellValue)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          cell.font = { bold: true };
        } else if (cellValue.includes('CTA. CTE.') || cellValue.includes('SALDO') || 
                  cellValue.includes('ABONOS') || cellValue.includes('GASTOS') || 
                  cellValue.includes('LINEA')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
          cell.font = { bold: true };
        } else if (['FECHA', 'DETALLE', 'MONTO', 'TIPO'].includes(cellValue)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCDCDC' } };
          cell.font = { bold: true };
        }
      }
      
      // Aplicar bordes a todas las celdas
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
  });
  
  // Ajustar ancho de columnas
  worksheetConsolidacion.getColumn(1).width = 40;
  worksheetConsolidacion.getColumn(2).width = 15;
  worksheetConsolidacion.getColumn(3).width = 20;
  
  worksheetDetalle.getColumn(1).width = 15;
  worksheetDetalle.getColumn(2).width = 50;
  worksheetDetalle.getColumn(3).width = 15;
  worksheetDetalle.getColumn(4).width = 10;
  
  // Generar el archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();
  
  return buffer;
} 