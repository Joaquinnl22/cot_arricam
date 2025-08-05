import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Crear workbook para el template
    const wb = XLSX.utils.book_new();
    
    // Datos de ejemplo para la hoja de consolidación
    const hojaConsolidacion = [
      ['RESUMEN GASTOS MARZO 2025'],
      [''],
      ['GASTOS FIJOS'],
      ['FLETES', '', 3254055],
      ['SUELDOS/IMPOSIC', '', 4166181],
      ['MATERIALES', '', 2269344],
      ['VEHICULOS', '', 2032157],
      ['PUBLICIDAD', '', 0],
      ['OTROS GASTOS', '', 0],
      ['ART. ESCRITORIO', '', 5470772],
      ['COMBUSTIBLE', '', 2104322],
      ['CONTADOR/ABOGADO/REDES', '', 8592583.106],
      ['IVA', '', 3808300],
      ['RENTA', '', 4873600],
      ['IMPTOS BANCARIOS', '', 11945335],
      ['REPUESTOS/REPARAC', '', 879317],
      ['CAJA CHICA', '', 5640782],
      ['TOTAL GASTOS FIJOS', '', 77675024.106],
      [''],
      ['COMPRA CONT-INVERS / ARRDOS CONTAINERS - INTERNOS', '', 4144597],
      ['INVERSIONES/FDOS MUTUOS', '', 0],
      ['DEVOLUC GARANTIAS', '', 140000],
      ['TOTAL INVERSIONES', '', 4284597],
      [''],
      ['TRANSFERENCIAS', '', 7773951],
      ['REDEPOSITOS /CHQ PROTEST', '', 4777058],
      ['TOT. GRAL MOVIMIENTOS', '', 90416080.106],
      [''],
      ['SALDO INICIAL', '', 61226701],
      ['ABONOS X PAGOS', '', 22087333],
      ['RESCTE FDOS MUT/OTROS', '', 0],
      ['TOTAL INGRESOS', '', 83314034]
    ];
    
    // Datos de ejemplo para la hoja de detalle
    const hojaDetalle = [
      ['DETALLE GASTOS ARRICAM SPA'],
      ['BCO CHILE CTA NRO.168-06824-09*168-08475-09'],
      ['BANCO SANTANDER NRO. 6866228-1'],
      ['DESDE', '01-03-2025'],
      [''],
      ['FLETES'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['19/03/2025', 'TRASPASO A:Transportes Hormazabal', 11900, 'vt'],
      ['19/03/2025', 'TRASPASO A:Transp Jose Vargas Garc', 345100, 'vt'],
      ['19/03/2025', 'TRASPASO A:Transportes Hormazabal', 404600, 'vt'],
      ['19/03/2025', 'TRASPASO A:Transp Jose Vargas Garc', 226100, 'vt'],
      ['27/03/2025', 'TRASPASO A:Transp Jose Vargas Garc', 618800, 'vt'],
      ['31/03/2025', 'TRASPASO A:LUIS HORMAZABAL SANCHEZ', 714000, 'vt'],
      ['31/03/2025', 'TRASPASO A:Transp Jose Vargas Garc', 333200, 'vt'],
      ['19/03/2025', 'TRASPASO A:COMERCIAL GALIO SPA', 183855, 'ar'],
      ['27/03/2025', 'TRASPASO A:Transp Jose Vargas Garc', 59500, 'ar'],
      ['31/03/2025', 'TRASPASO A:LUIS HORMAZABAL SANCHEZ', 357000, 'ar'],
      ['', 'TOTAL FLETES', 3254055, ''],
      [''],
      ['CONTADOR / ABOGADO / REDES'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['05/03/2025', 'HONORARIOS CONTADOR', 8592583.106, 'vt'],
      ['', 'TOTAL CONTADOR/ABOGADO/REDES', 8592583.106, ''],
      [''],
      ['VEHICULOS'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['21/03/2025', 'PAC AUTOP CENTRAL', 95226, 'vt'],
      ['03/03/2025', 'RUTA 78 DODGE', 3042, 'vt'],
      ['07/03/2025', 'COSTANERA NORTE', 206549, 'vt'],
      ['05/03/2025', 'AUTOP VESPUCIO SUR', 16591, 'vt'],
      ['', 'TOTAL VEHICULOS', 2032157, ''],
      [''],
      ['SUELDOS/IMPOSICIONES'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['05/03/2025', 'SUELDO VICTOR', 375000, 'vt'],
      ['15/03/2025', 'SUELDO CEA', 350000, 'vt'],
      ['25/03/2025', 'SUELDO CRISTOBAL', 500000, 'vt'],
      ['', 'TOTAL SUELDOS/IMPOSICIONES', 4166181, ''],
      [''],
      ['MATERIALES / HERRAMIENTAS'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['20/03/2025', 'MAT SODIMAC', 140000, 'vt'],
      ['19/03/2025', 'COMPRA FERRET MORALES', 26980, 'vt'],
      ['03/03/2025', 'MAT ARIDOS CARRASCO', 72389, 'vt'],
      ['', 'TOTAL MATERIALES', 2269344, ''],
      [''],
      ['PUBLICIDAD'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['05/03/2025', 'PAGO TARJ CREDT GOOGLE', 1242159, 'vt'],
      ['', 'TOTAL PUBLICIDAD', 1242159, ''],
      [''],
      ['TRANSFERENCIAS OTRAS CUENTAS CTES'],
      ['FECHA', 'DETALLE', 'MONTO', 'TIPO'],
      ['21/03/2025', 'TRANSF SPA ARRDOS CH', 1000000, 'vt'],
      ['21/03/2025', 'TRANSF SPA ARRDOS CH', 3000000, 'vt'],
      ['05/03/2025', 'TRANSF ARRI 06 DEVOL ARRDO', 1773951, 'vt'],
      ['', 'TOTAL TRANSFERENCIAS', 7773951, ''],
      [''],
      ['CTA. CTE. ARRDOS NRO. 168-06824-09'],
      ['SALDO INICIAL CHILE', '', 7773182],
      ['ABONOS CTA CTE', '', 11650629],
      ['OTRO ABONO', '', ''],
      ['TOT HABER', '', 19423811],
      ['GASTOS', '', 15462290],
      ['CHQ. GIRADOS X COB', '', ''],
      ['SALDO LIQUIDO', '', 3961521],
      ['LINEA CREDITO', '', 11020000],
      [''],
      ['CTA. CTE. VENTAS NRO. 168-08475-09'],
      ['SALDO INICIAL CHILE', '', 3163422],
      ['ABONOS CTA CTE', '', 6771504],
      ['OTRO ABONO', '', ''],
      ['TOT HABER', '', 9934926],
      ['GASTOS', '', 6634005],
      ['CHQ. GIRADOS X COB', '', ''],
      ['SALDO LIQUIDO', '', 3300921],
      [''],
      ['CTA. CTE. BANCO SANTANDER NRO. 6866228-1'],
      ['SALDO INICIAL SANTANDER', '', 50290097],
      ['ABONOS CTA CTE', '', 3665200],
      ['OTRO ABONO', '', ''],
      ['TOT HABER', '', 53955297],
      ['GASTOS', '', 6295423],
      ['CHQ. GIRADOS X COB', '', ''],
      ['SALDO LIQUIDO', '', 47659874],
      ['LINEA CREDITO', '', 1500000]
    ];
    
    // Crear las hojas del workbook
    const wsConsolidacion = XLSX.utils.aoa_to_sheet(hojaConsolidacion);
    const wsDetalle = XLSX.utils.aoa_to_sheet(hojaDetalle);
    
    // Aplicar formato con colores grises y bordes visibles
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
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_ejemplo_arricam.xlsx"'
      }
    });
    
  } catch (error) {
    console.error('Error al generar template:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el template' },
      { status: 500 }
    );
  }
} 