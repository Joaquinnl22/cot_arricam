import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function formatearNumero(numero) {
  if (typeof numero !== 'number') return '0';
  return numero.toLocaleString('es-CL');
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

// Función para analizar la estructura del archivo Santander y detectar columnas de abonos
function analizarEstructuraSantander(data) {
  console.log('🔍 Analizando estructura del archivo Santander...');
  
  const analisis = {
    columnasConValores: [],
    totalFilas: data.length,
    filasConFechas: 0,
    filasConValores: 0
  };
  
  // Analizar las primeras 10 filas para entender la estructura
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row) {
      console.log(`Fila ${i + 1}:`, row);
      
      let tieneFecha = false;
      let tieneValores = false;
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        
        // Contar filas con fechas
        if (esFechaValida(cell)) {
          tieneFecha = true;
        }
        
        // Contar filas con valores numéricos
        if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\-\d\.,]+$/)))) {
          const numValue = parseFloat(cell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
          if (!isNaN(numValue) && numValue !== 0) {
            tieneValores = true;
            
            // Registrar columnas con valores
            if (!analisis.columnasConValores.includes(j)) {
              analisis.columnasConValores.push(j);
            }
          }
        }
      }
      
      if (tieneFecha) analisis.filasConFechas++;
      if (tieneValores) analisis.filasConValores++;
    }
  }
  
  console.log('📊 Análisis de estructura Santander:', analisis);
  return analisis;
}

function procesarArchivoBanco(workbook, tipoBanco) {
  let totalIngresos = 0;
  let movimientosProcesados = [];
  let numeroCuenta = '';
  let saldoInicial = 0;
  
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
  
  // Buscar saldo inicial para Santander
  if (tipoBanco === 'santander') {
    console.log('🔍 Buscando saldo inicial en Santander...');
    console.log('Analizando las primeras 20 filas para encontrar "saldo inicial"...');
    
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      if (row) {
        console.log(`Fila ${i + 1}:`, row);
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string') {
            const cellLower = cell.toLowerCase();
            console.log(`  Columna ${j + 1}: "${cell}" (lowercase: "${cellLower}")`);
            
            // Buscar variaciones de "saldo inicial"
            if (cellLower.includes('saldo inicial') || 
                cellLower.includes('saldoinicial') || 
                cellLower.includes('saldo inicial:') ||
                cellLower.includes('saldo inicial -') ||
                cellLower.includes('saldo inicial.')) {
              console.log(`📍 "Saldo inicial" encontrado en fila ${i + 1}, columna ${j + 1}: "${cell}"`);
              
              // Buscar el valor en la primera columna de la siguiente fila
              if (i + 1 < data.length) {
                const siguienteFila = data[i + 1];
                console.log(`Siguiente fila (${i + 2}):`, siguienteFila);
                
                if (siguienteFila && siguienteFila.length > 0) {
                  const valorSaldo = siguienteFila[0]; // Primera columna
                  console.log(`Valor en primera columna: "${valorSaldo}" (tipo: ${typeof valorSaldo})`);
                  
                  if (valorSaldo && (typeof valorSaldo === 'number' || (typeof valorSaldo === 'string' && valorSaldo.match(/^[\-\d\.,]+$/)))) {
                    const numValue = parseFloat(valorSaldo.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
                    console.log(`Valor numérico parseado: ${numValue}`);
                    
                    if (!isNaN(numValue)) {
                      saldoInicial = numValue;
                      console.log(`✅ Saldo inicial extraído: ${formatearNumero(saldoInicial)}`);
                    } else {
                      console.log(`❌ No se pudo parsear el valor: ${valorSaldo}`);
                    }
                  } else {
                    console.log(`❌ Valor no válido en primera columna: ${valorSaldo}`);
                  }
                } else {
                  console.log(`❌ No hay siguiente fila o está vacía`);
                }
              } else {
                console.log(`❌ No hay siguiente fila disponible`);
              }
              break;
            }
          }
        }
        if (saldoInicial > 0) break;
      }
    }
    
    if (saldoInicial === 0) {
      console.log('⚠️ No se encontró saldo inicial en Santander');
    }
  }
  
  // Buscar saldo inicial para Banco de Chile (Columna E + Columna C - Columna D, Fila 3)
  if (tipoBanco === 'chile') {
    console.log('🔍 Buscando saldo inicial en Banco de Chile (Columna E + Columna C - Columna D, Fila 3)...');
    if (data.length >= 3) {
      const fila3 = data[2]; // Fila 3 (índice 2)
      if (fila3 && fila3.length >= 5) { // Necesitamos al menos 5 columnas (A, B, C, D, E)
        const saldoMayorCell = fila3[4]; // Columna E (índice 4) - Saldo mayor
        const cargosCell = fila3[2]; // Columna C (índice 2) - Cargos
        const abonosCell = fila3[3]; // Columna D (índice 3) - Abonos
        
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
    
    // Procesar todas las filas del archivo (empezar desde fila 3 - índice 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (row && row.length >= 4) { // Necesitamos al menos 4 columnas (A, B, C, D)
        // Buscar fecha y descripción
        let fecha = null;
        let descripcion = '';
        
        // Buscar fecha en las primeras columnas
        for (let j = 0; j < Math.min(row.length, 3); j++) {
          const cell = row[j];
          if (esFechaValida(cell)) {
            fecha = cell;
            break;
          }
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
        
        // Procesar Columna D (índice 3) - ABONOS
        const columnaAbono = row[3]; // Columna D
        console.log(`🔍 Fila ${i + 1}: Fecha="${fecha}", Desc="${descripcion}", ColD="${columnaAbono}"`);
        
        if (columnaAbono && (typeof columnaAbono === 'number' || (typeof columnaAbono === 'string' && columnaAbono.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(columnaAbono.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          console.log(`🔍 Valor parseado Col D: ${numValue} (original: "${columnaAbono}")`);
          
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
          } else {
            console.log(`⚠️ Fila ${i + 1} valor no válido en Col D: ${numValue} (original: "${columnaAbono}")`);
          }
        } else {
          console.log(`⚠️ Fila ${i + 1} columna D no válida: "${columnaAbono}"`);
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
    // Fallback específico para Santander - MEJORADO
    console.log('⚠️ No se pudo detectar formato específico Santander, usando lógica fallback mejorada');
    console.log('🔍 Analizando todo el archivo Santander para encontrar abonos...');
    
    // Analizar la estructura del archivo
    const analisis = analizarEstructuraSantander(data);
    
    // Extraer ABONOS X PAGOS de fila 11, columna C
    console.log('🔍 Extrayendo ABONOS X PAGOS de fila 11, columna C');
    if (data.length >= 11) {
      const fila11 = data[10]; // Fila 11 (índice 10)
      if (fila11 && fila11.length >= 3) {
        const abonosXPagosCell = fila11[2]; // Columna C (índice 2)
        console.log(`🔍 Buscando ABONOS X PAGOS en fila 11, columna C: "${abonosXPagosCell}"`);
        
        if (abonosXPagosCell && (typeof abonosXPagosCell === 'number' || (typeof abonosXPagosCell === 'string' && abonosXPagosCell.match(/^[\d\.,]+$/)))) {
          const numValue = parseFloat(abonosXPagosCell.toString().replace(/[^\d\.,]/g, '').replace(',', '.'));
          console.log(`🔍 Valor parseado ABONOS X PAGOS: ${numValue} (original: "${abonosXPagosCell}")`);
          
          if (!isNaN(numValue) && numValue > 0) {
            totalIngresos = numValue;
            console.log(`✅ ABONOS X PAGOS extraído: ${formatearNumero(totalIngresos)}`);
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
    
    // Si no se encontró el valor en fila 11, usar la lógica anterior como fallback
    if (totalIngresos === 0) {
      console.log('⚠️ No se encontró ABONOS X PAGOS en fila 11, usando lógica fallback...');
      
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
              if (cellLower.includes('detalle movimiento') || cellLower.includes('movimientos') || cellLower.includes('transacciones')) {
                inicioMovimientos = i + 1; // Comenzar desde la siguiente fila
                console.log(`📍 Inicio de movimientos encontrado en fila ${i + 1}: "${cell}"`);
              } else if (cellLower.includes('resumen comisiones') || cellLower.includes('total') || cellLower.includes('saldo final')) {
                finMovimientos = i;
                console.log(`📍 Fin de movimientos encontrado en fila ${i + 1}: "${cell}"`);
                break;
              }
            }
          }
          if (finMovimientos !== -1) break;
        }
      }
      
      // Si no se encontraron marcadores específicos, usar todo el archivo
      if (inicioMovimientos === -1) {
        inicioMovimientos = 0;
        console.log('⚠️ No se encontraron marcadores de inicio, procesando todo el archivo');
      }
      if (finMovimientos === -1) {
        finMovimientos = data.length;
        console.log('⚠️ No se encontraron marcadores de fin, procesando hasta el final del archivo');
      }
      
      console.log(`📊 Procesando movimientos desde fila ${inicioMovimientos} hasta fila ${finMovimientos}`);
      console.log(`📊 Total de filas a procesar: ${finMovimientos - inicioMovimientos}`);
      
      // Para Santander, buscar TODOS los valores positivos en el archivo (abonos)
      for (let i = inicioMovimientos; i < finMovimientos && i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 0) {
          let fecha = null;
          let descripcion = '';
          
          // Buscar fecha y descripción
          for (let j = 0; j < Math.min(row.length, 5); j++) {
            const cell = row[j];
            if (esFechaValida(cell)) {
              fecha = cell;
              break;
            }
          }
          
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell && typeof cell === 'string' && cell.length > 3 && !cell.match(/^\d+$/) && !esFechaValida(cell)) {
              descripcion = cell;
              break;
            }
          }
          
          // Para Santander: valores POSITIVOS son ABONOS, valores NEGATIVOS son PAGOS
          // SOLO procesar la columna 1 (columna A)
          const cell = row[0]; // Columna A (índice 0)
          console.log(`🔍 Fila ${i + 1}: Fecha="${fecha}", Desc="${descripcion}", Valor="${cell}"`);
          
          if (cell && (typeof cell === 'number' || (typeof cell === 'string' && cell.match(/^[\-\d\.,]+$/)))) {
            const numValue = parseFloat(cell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
            console.log(`🔍 Valor parseado: ${numValue} (original: "${cell}")`);
            
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
            } else {
              console.log(`⚠️ Valor no válido: ${numValue} (original: "${cell}")`);
            }
          } else {
            console.log(`⚠️ Celda no válida: "${cell}" (tipo: ${typeof cell})`);
          }
        }
      }
      
      // Si no se encontraron abonos, mostrar advertencia
      if (totalIngresos === 0) {
        console.log('⚠️ No se encontraron abonos en el archivo Santander');
        console.log('🔍 Revisar la estructura del archivo y los valores');
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
    console.log(`💰 Total abonos calculados para ${tipoBanco}: ${formatearNumero(totalIngresos)}`);
    console.log(`📊 Movimientos procesados: ${movimientosProcesados.length}`);
    console.log(`📊 Primeros 3 movimientos:`, movimientosProcesados.slice(0, 3));
    
    return { totalIngresos, numeroCuenta, saldoInicial };
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
    const saldosInicialesChile = [];
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        console.log(`Procesando archivo Banco Chile ${i + 1}/${bancoChileCount}: ${bancoChileFile.name}`);
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        archivosChile.push(resultado);
        saldosInicialesChile.push(resultado.saldoInicial || 0);
        console.log(`💰 Saldo inicial extraído del archivo ${i + 1}: ${formatearNumero(resultado.saldoInicial || 0)}`);
      }
    }
    
    // Asignar los ingresos del Banco de Chile según el número de cuenta
    console.log('=== ASIGNANDO RESULTADOS BANCO CHILE ===');
    let saldoInicialArriendo = 0;
    let saldoInicialVenta = 0;
    
    for (let i = 0; i < archivosChile.length; i++) {
      const archivo = archivosChile[i];
      const { totalIngresos, numeroCuenta } = archivo;
      const saldoInicialArchivo = saldosInicialesChile[i] || 0;
      
      console.log(`Archivo ${i + 1}: Cuenta ${numeroCuenta}, Ingresos ${formatearNumero(totalIngresos)}, Saldo Inicial ${formatearNumero(saldoInicialArchivo)}`);
      
      // Identificar la cuenta según el número encontrado
      if (numeroCuenta.includes('16806824') || numeroCuenta.includes('168-06824')) {
        // Cuenta de Arriendo: 168-06824-09
        abonosCalculados.bancoChileArriendo = totalIngresos;
        saldoInicialArriendo = saldoInicialArchivo;
        console.log(`✅ Asignando ${formatearNumero(totalIngresos)} a bancoChileArriendo (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Arriendo: ${formatearNumero(saldoInicialArriendo)}`);
      } else if (numeroCuenta.includes('16808475') || numeroCuenta.includes('168-08475')) {
        // Cuenta de Venta: 168-08475-09
        abonosCalculados.bancoChileVenta = totalIngresos;
        saldoInicialVenta = saldoInicialArchivo;
        console.log(`✅ Asignando ${formatearNumero(totalIngresos)} a bancoChileVenta (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Venta: ${formatearNumero(saldoInicialVenta)}`);
      } else {
        // Si no se puede identificar, usar el orden de subida como fallback
        if (abonosCalculados.bancoChileVenta === 0) {
          abonosCalculados.bancoChileVenta = totalIngresos;
          saldoInicialVenta = saldoInicialArchivo;
          console.log(`⚠️ Asignando ${formatearNumero(totalIngresos)} a bancoChileVenta (fallback - cuenta no identificada)`);
          console.log(`💰 Saldo inicial Venta (fallback): ${formatearNumero(saldoInicialVenta)}`);
        } else {
          abonosCalculados.bancoChileArriendo = totalIngresos;
          saldoInicialArriendo = saldoInicialArchivo;
          console.log(`⚠️ Asignando ${formatearNumero(totalIngresos)} a bancoChileArriendo (fallback - cuenta no identificada)`);
          console.log(`💰 Saldo inicial Arriendo (fallback): ${formatearNumero(saldoInicialArriendo)}`);
        }
      }
    }
    
    // Procesar archivo del Banco Santander por separado
    let saldoInicialSantander = 0;
    if (bancoSantanderFile) {
      console.log(`Procesando archivo Banco Santander: ${bancoSantanderFile.name}`);
      const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
      const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
      const resultado = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
      abonosCalculados.bancoSantander = resultado.totalIngresos; // Santander (6866228-1)
      saldoInicialSantander = resultado.saldoInicial || 0;
      console.log(`✅ Asignando ${formatearNumero(resultado.totalIngresos)} a bancoSantander (cuenta: ${resultado.numeroCuenta})`);
      console.log(`💰 Saldo inicial extraído: ${formatearNumero(saldoInicialSantander)}`);
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
      abonosCalculados: abonosCalculados,
      saldoInicialSantander: saldoInicialSantander,
      saldoInicialSantanderFormateado: formatearNumero(saldoInicialSantander),
      saldoInicialChileArriendo: saldoInicialArriendo,
      saldoInicialChileArriendoFormateado: formatearNumero(saldoInicialArriendo),
      saldoInicialChileVenta: saldoInicialVenta,
      saldoInicialChileVentaFormateado: formatearNumero(saldoInicialVenta)
    });
    
  } catch (error) {
    console.error('❌ Error al calcular abonos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al calcular abonos' },
      { status: 500 }
    );
  }
} 