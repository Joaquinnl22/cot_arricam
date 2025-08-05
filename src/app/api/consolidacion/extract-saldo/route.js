import { NextResponse } from 'next/server';
import XLSX from 'xlsx';

function formatearNumero(numero) {
  if (typeof numero !== 'number') return '0';
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function extraerSaldoInicial(workbook, tipoBanco) {
  let saldoInicial = 0;
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Buscar saldo inicial en las primeras filas
  for (let i = 0; i < Math.min(data.length, 15); i++) {
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
  
  return saldoInicial;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const bancoChileCount = parseInt(formData.get('bancoChileCount') || '0');
    const bancoSantanderFile = formData.get('bancoSantander');
    
    const saldosIniciales = {
      bancoChileArriendo: 0,
      bancoChileVenta: 0,
      bancoSantander: 0
    };
    
    // Procesar archivos del Banco de Chile
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const saldoInicial = extraerSaldoInicial(bancoChileWorkbook, 'chile');
        
        // Asignar según el tipo de cuenta (primer archivo = venta, segundo = arriendo)
        if (i === 0) {
          saldosIniciales.bancoChileVenta = saldoInicial;
        } else {
          saldosIniciales.bancoChileArriendo = saldoInicial;
        }
      }
    }
    
    // Procesar archivo del Banco Santander
    if (bancoSantanderFile) {
      const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
      const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
      const saldoInicial = extraerSaldoInicial(bancoSantanderWorkbook, 'santander');
      saldosIniciales.bancoSantander = saldoInicial;
    }
    
    return NextResponse.json({
      success: true,
      saldosIniciales: saldosIniciales
    });
    
  } catch (error) {
    console.error('Error al extraer saldos iniciales:', error);
    return NextResponse.json(
      { success: false, error: 'Error al extraer saldos iniciales' },
      { status: 500 }
    );
  }
} 