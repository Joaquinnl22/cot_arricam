import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function formatearNumero(numero) {
  if (typeof numero !== 'number') return '0';
  return numero.toLocaleString('es-CL');
}

function procesarArchivoBanco(workbook, tipoBanco) {
  let totalIngresos = 0;
  let movimientosProcesados = [];
  let numeroCuenta = '';
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Procesando archivo ${tipoBanco}, filas encontradas: ${data.length}`);
  
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
  
  // Analizar las primeras filas para detectar el formato
  let formatoDetectado = null;
  if (data.length > 0) {
    console.log('=== ANÁLISIS DE FORMATO SANTANDER ===');
    console.log('Total de filas en el archivo:', data.length);
    console.log('Primera fila completa:', data[0]);
    console.log('Segunda fila completa:', data[1]);
    console.log('Tercera fila completa:', data[2]);
    
    // Para Santander, buscar específicamente columnas de crédito/abono
    if (tipoBanco === 'santander') {
      console.log('🔍 Buscando columnas de abonos en las primeras 5 filas...');
      
      for (let fila = 0; fila < Math.min(5, data.length); fila++) {
        const row = data[fila];
        if (row) {
          console.log(`Analizando fila ${fila + 1}:`, row);
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell && typeof cell === 'string') {
              const cellLower = cell.toLowerCase();
              console.log(`Fila ${fila + 1}, Columna ${j + 1}: "${cell}"`);
              
              // Detectar columnas específicas de Santander
              if (cellLower.includes('crédito') || cellLower.includes('credito') || 
                  cellLower.includes('haber') || cellLower.includes('abono') ||
                  cellLower.includes('ingreso') || cellLower.includes('entrada') ||
                  cellLower.includes('débito') || cellLower.includes('debito') ||
                  cellLower.includes('cargo') || cellLower.includes('saldo')) {
                formatoDetectado = { tipo: 'santander', columnaAbono: j, titulo: cell };
                console.log(`✅ Columna de abono Santander detectada: ${j + 1} - "${cell}"`);
                break;
              }
            }
          }
          if (formatoDetectado) break;
        }
      }
    }
    
    if (!formatoDetectado && tipoBanco === 'santander') {
      console.log('⚠️ No se detectó columna específica de abonos Santander, analizando estructura...');
      // Analizar estructura de datos para inferir formato Santander
      if (data.length > 1) {
        const segundaFila = data[1];
        console.log('Analizando segunda fila Santander para inferir estructura:', segundaFila);
        
        // Buscar columnas con valores numéricos positivos
        for (let j = 0; j < segundaFila.length; j++) {
          const cell = segundaFila[j];
          if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\d\.,]+$/)))) {
            const numValue = parseFloat(cell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
            if (!isNaN(numValue) && numValue > 0) {
              console.log(`Columna ${j + 1} tiene valor numérico positivo: ${numValue}`);
            }
          }
        }
      }
    }
  }
  
  // Procesar Banco de Chile
  if (tipoBanco === 'chile') {
    console.log('🏦 Procesando Banco de Chile - Columna D para abonos, Columna C para cargos');
    
    // Procesar todas las filas del archivo
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length >= 4) { // Necesitamos al menos 4 columnas (A, B, C, D)
        // Buscar fecha y descripción
        let fecha = null;
        let descripcion = '';
        
        // Buscar fecha en las primeras columnas
        for (let j = 0; j < Math.min(row.length, 3); j++) {
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
        
        // Procesar Columna D (índice 3) - ABONOS
        const columnaAbono = row[3]; // Columna D
        if (columnaAbono && (typeof columnaAbono === 'number' || (typeof columnaAbono === 'string' && columnaAbono.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(columnaAbono.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue > 0) {
            totalIngresos += numValue;
            movimientosProcesados.push({
              fecha,
              descripcion,
              monto: numValue,
              posicion: 3, // Columna D
              totalColumnas: row.length,
              numeroCuenta,
              tipo: 'abono'
            });
            console.log(`✅ Abono Banco Chile (Columna D): ${formatearNumero(numValue)} - ${descripcion}`);
          }
        }
        
        // Procesar Columna C (índice 2) - CARGOS (solo para debug)
        const columnaCargo = row[2]; // Columna C
        if (columnaCargo && (typeof columnaCargo === 'number' || (typeof columnaCargo === 'string' && columnaCargo.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(columnaCargo.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue > 0) {
            console.log(`❌ Cargo Banco Chile (Columna C): ${formatearNumero(numValue)} - ${descripcion}`);
          }
        }
      }
    }
  }
  
  // Procesar según el formato detectado
  if (formatoDetectado && formatoDetectado.tipo === 'santander') {
    console.log(`Procesando Santander con formato detectado: ${formatoDetectado.titulo} en columna ${formatoDetectado.columnaAbono + 1}`);
    
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
      if (row && row.length > formatoDetectado.columnaAbono) {
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
        
        // Para Santander: valores POSITIVOS son ABONOS, valores NEGATIVOS son PAGOS
        // SOLO procesar la columna 1 (columna A)
        const columnaAbono = row[0]; // Columna A (índice 0)
        if (columnaAbono && (typeof columnaAbono === 'number' || (typeof columnaAbono === 'string' && columnaAbono.match(/^[\-\d\.,]+$/)))) {
          const numValue = parseFloat(columnaAbono.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue > 0) {
            // Valor POSITIVO = ABONO (ingreso)
            totalIngresos += numValue;
            movimientosProcesados.push({
              fecha,
              descripcion,
              monto: numValue,
              posicion: 0, // Columna A
              totalColumnas: row.length,
              numeroCuenta,
              tipo: 'abono'
            });
            console.log(`✅ Abono Santander detectado (valor positivo, columna A): ${formatearNumero(numValue)} - ${descripcion}`);
          } else if (!isNaN(numValue) && numValue < 0) {
            // Valor NEGATIVO = PAGO (egreso) - solo para debug
            console.log(`❌ Pago Santander detectado (valor negativo, columna A): ${formatearNumero(Math.abs(numValue))} - ${descripcion}`);
          }
        }
      }
    }
  } else if (tipoBanco === 'santander') {
    // Fallback específico para Santander
    console.log('⚠️ No se pudo detectar formato específico Santander, usando lógica fallback agresiva');
    
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
    
    // Para Santander, buscar TODOS los valores positivos en el archivo (abonos)
    for (let i = inicioMovimientos; i < finMovimientos && i < data.length; i++) {
      const row = data[i];
      if (row) {
        let fecha = null;
        let descripcion = '';
        
        // Buscar fecha y descripción
        for (let j = 0; j < Math.min(row.length, 5); j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            fecha = cell;
            break;
          }
        }
        
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string' && cell.length > 3 && !cell.match(/^\d+$/) && !cell.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            descripcion = cell;
            break;
          }
        }
        
        // Para Santander: valores POSITIVOS son ABONOS, valores NEGATIVOS son PAGOS
        // SOLO procesar la columna 1 (columna A)
        const cell = row[0]; // Columna A (índice 0)
        if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\-\d\.,]+$/)))) {
          const numValue = parseFloat(cell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue > 0) {
            // Valor POSITIVO = ABONO (ingreso)
            totalIngresos += numValue;
            movimientosProcesados.push({
              fecha,
              descripcion,
              monto: numValue,
              posicion: 0, // Columna A
              totalColumnas: row.length,
              numeroCuenta,
              tipo: 'abono'
            });
            console.log(`✅ Abono Santander (valor positivo, columna A): ${formatearNumero(numValue)} - ${descripcion}`);
          } else if (!isNaN(numValue) && numValue < 0) {
            // Valor NEGATIVO = PAGO (egreso) - solo para debug
            console.log(`❌ Pago Santander (valor negativo, columna A): ${formatearNumero(Math.abs(numValue))} - ${descripcion}`);
          }
        }
      }
    }
  }
  
  console.log(`=== RESUMEN ARCHIVO ${tipoBanco.toUpperCase()} ===`);
  console.log(`Cuenta encontrada: ${numeroCuenta}`);
  console.log(`Movimientos de ingreso procesados: ${movimientosProcesados.length}`);
  console.log(`Total ingresos: ${formatearNumero(totalIngresos)}`);
  console.log(`Total egresos excluidos: ${data.length - movimientosProcesados.length - 1}`);
  
  if (movimientosProcesados.length > 0) {
    console.log('Primeros 3 movimientos de ingreso:');
    movimientosProcesados.slice(0, 3).forEach((mov, index) => {
      console.log(`  ${index + 1}. ${mov.fecha} - ${formatearNumero(mov.monto)} - ${mov.descripcion}`);
    });
  }
  
  console.log(`=== FIN RESUMEN ${tipoBanco.toUpperCase()} ===`);
  
  return { totalIngresos, numeroCuenta };
}

export async function POST(request) {
  try {
    console.log('=== INICIANDO CÁLCULO DE ABONOS ===');
    
    const formData = await request.formData();
    const bancoChileCount = parseInt(formData.get('bancoChileCount') || '0');
    const bancoSantanderFile = formData.get('bancoSantander');
    
    console.log(`Archivos recibidos: Banco Chile: ${bancoChileCount}, Banco Santander: ${bancoSantanderFile ? 'Sí' : 'No'}`);
    
    const abonosCalculados = {
      bancoChileArriendo: 0,
      bancoChileVenta: 0,
      bancoSantander: 0
    };
    
    // Procesar archivos del Banco de Chile por separado
    const archivosChile = [];
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        console.log(`Procesando archivo Banco Chile ${i + 1}/${bancoChileCount}: ${bancoChileFile.name}`);
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        archivosChile.push(resultado);
      }
    }
    
    // Asignar los ingresos del Banco de Chile según el número de cuenta
    console.log('=== ASIGNANDO RESULTADOS BANCO CHILE ===');
    for (let i = 0; i < archivosChile.length; i++) {
      const archivo = archivosChile[i];
      const { totalIngresos, numeroCuenta } = archivo;
      
      console.log(`Archivo ${i + 1}: Cuenta ${numeroCuenta}, Ingresos ${formatearNumero(totalIngresos)}`);
      
      // Identificar la cuenta según el número encontrado
      if (numeroCuenta.includes('16806824') || numeroCuenta.includes('168-06824')) {
        // Cuenta de Arriendo: 168-06824-09
        abonosCalculados.bancoChileArriendo = totalIngresos;
        console.log(`✅ Asignando ${formatearNumero(totalIngresos)} a bancoChileArriendo (cuenta: ${numeroCuenta})`);
      } else if (numeroCuenta.includes('16808475') || numeroCuenta.includes('168-08475')) {
        // Cuenta de Venta: 168-08475-09
        abonosCalculados.bancoChileVenta = totalIngresos;
        console.log(`✅ Asignando ${formatearNumero(totalIngresos)} a bancoChileVenta (cuenta: ${numeroCuenta})`);
      } else {
        // Si no se puede identificar, usar el orden de subida como fallback
        if (abonosCalculados.bancoChileVenta === 0) {
          abonosCalculados.bancoChileVenta = totalIngresos;
          console.log(`⚠️ Asignando ${formatearNumero(totalIngresos)} a bancoChileVenta (fallback - cuenta no identificada)`);
        } else {
          abonosCalculados.bancoChileArriendo = totalIngresos;
          console.log(`⚠️ Asignando ${formatearNumero(totalIngresos)} a bancoChileArriendo (fallback - cuenta no identificada)`);
        }
      }
    }
    
    // Procesar archivo del Banco Santander por separado
    if (bancoSantanderFile) {
      console.log(`Procesando archivo Banco Santander: ${bancoSantanderFile.name}`);
      const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
      const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
      const resultado = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
      abonosCalculados.bancoSantander = resultado.totalIngresos; // Santander (6866228-1)
      console.log(`✅ Asignando ${formatearNumero(resultado.totalIngresos)} a bancoSantander (cuenta: ${resultado.numeroCuenta})`);
    } else {
      console.log('❌ No se recibió archivo del Banco Santander');
    }
    
    console.log('=== RESULTADOS FINALES ===');
    console.log('Abonos calculados finales:', {
      bancoChileArriendo: formatearNumero(abonosCalculados.bancoChileArriendo),
      bancoChileVenta: formatearNumero(abonosCalculados.bancoChileVenta),
      bancoSantander: formatearNumero(abonosCalculados.bancoSantander)
    });
    console.log('=== FIN CÁLCULO DE ABONOS ===');
    
    return NextResponse.json({
      success: true,
      abonosCalculados: abonosCalculados
    });
    
  } catch (error) {
    console.error('❌ Error al calcular abonos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al calcular abonos' },
      { status: 500 }
    );
  }
} 