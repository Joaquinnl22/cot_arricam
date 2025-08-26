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
  let totalAbonos = 0;
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
          // Buscar patrones de cuenta mejorados
          let match = null;
          
          // Patrón 1: cta:001681111502
          match = cell.match(/cta:(\d+)/i);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado (patrón cta:): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 2: cuenta:001681111502
          match = cell.match(/cuenta:(\d+)/i);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado (patrón cuenta:): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 3: 168-06824-09 (formato con guiones)
          match = cell.match(/(\d{3}-\d{5}-\d{2})/);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado (patrón con guiones): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 4: 0-000-9208349-7 (formato Santander)
          match = cell.match(/(\d-\d{3}-\d{7}-\d)/);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado (patrón Santander): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 5: 001681111502 (formato sin guiones)
          match = cell.match(/(\d{12})/);
          if (match) {
            numeroCuenta = match[1];
            console.log(`Número de cuenta encontrado (patrón sin guiones): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 6: Buscar cualquier número que contenga 16811115 o 16813961 (cuentas de ferreteria)
          if (cell.includes('16811115') || cell.includes('16813961')) {
            numeroCuenta = cell.replace(/[^\d]/g, ''); // Extraer solo números
            console.log(`Número de cuenta encontrado (patrón ferreteria): ${numeroCuenta}`);
            break;
          }
          
          // Patrón 7: Buscar cualquier número que contenga 16806824 o 16808475 (cuentas de arricam)
          if (cell.includes('16806824') || cell.includes('16808475')) {
            numeroCuenta = cell.replace(/[^\d]/g, ''); // Extraer solo números
            console.log(`Número de cuenta encontrado (patrón arricam): ${numeroCuenta}`);
            break;
          }
        }
      }
      if (numeroCuenta) break;
    }
  }
  
  // Función mejorada para buscar saldo inicial
  const buscarSaldoInicial = (data, tipoBanco) => {
    console.log(`🔍 Buscando saldo inicial para ${tipoBanco}...`);
    console.log(`Analizando las primeras 30 filas del archivo...`);
    
    // Mostrar las primeras 10 filas para debug
    console.log('📊 Primeras 10 filas del archivo:');
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row) {
        console.log(`Fila ${i + 1}:`, row);
      }
    }
    
    let saldoEncontrado = 0;
    
    // Buscar en las primeras 30 filas
    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i];
      if (row) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (cell && typeof cell === 'string') {
            const cellLower = cell.toLowerCase();
            
            // Buscar variaciones de "saldo inicial"
            if (cellLower.includes('saldo inicial') || 
                cellLower.includes('saldoinicial') || 
                cellLower.includes('saldo inicial:') ||
                cellLower.includes('saldo inicial -') ||
                cellLower.includes('saldo inicial.') ||
                cellLower.includes('saldo') ||
                cellLower.includes('balance') ||
                cellLower.includes('total') ||
                cellLower.includes('saldo mayor') ||
                cellLower.includes('saldo anterior') ||
                cellLower.includes('saldo del día') ||
                cellLower.includes('saldo del dia') ||
                cellLower.includes('saldo disponible') ||
                cellLower.includes('saldo cuenta') ||
                cellLower.includes('saldo en cuenta')) {
              
              console.log(`📍 Palabra clave encontrada en fila ${i + 1}, columna ${j + 1}: "${cell}"`);
              
              // Buscar el valor numérico en la misma fila o en las siguientes
              for (let k = j + 1; k < row.length; k++) {
                const valorCell = row[k];
                if (valorCell && (typeof valorCell === 'number' || (typeof valorCell === 'string' && valorCell.match(/^[\-\d\.,]+$/)))) {
                  const numValue = parseFloat(valorCell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
                  if (!isNaN(numValue) && numValue > 0) {
                    saldoEncontrado = numValue;
                    console.log(`✅ Saldo inicial encontrado en misma fila, columna ${k + 1}: ${formatearNumero(saldoEncontrado)}`);
                    return saldoEncontrado;
                  }
                }
              }
              
              // Si no se encontró en la misma fila, buscar en la siguiente
              if (i + 1 < data.length) {
                const siguienteFila = data[i + 1];
                if (siguienteFila) {
                  for (let k = 0; k < siguienteFila.length; k++) {
                    const valorCell = siguienteFila[k];
                    if (valorCell && (typeof valorCell === 'number' || (typeof valorCell === 'string' && valorCell.match(/^[\-\d\.,]+$/)))) {
                      const numValue = parseFloat(valorCell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
                      if (!isNaN(numValue) && numValue > 0) {
                        saldoEncontrado = numValue;
                        console.log(`✅ Saldo inicial encontrado en siguiente fila, columna ${k + 1}: ${formatearNumero(saldoEncontrado)}`);
                        return saldoEncontrado;
                      }
                    }
                  }
                }
              }
              
              // Si no se encontró en la siguiente fila, buscar en la anterior
              if (i > 0) {
                const filaAnterior = data[i - 1];
                if (filaAnterior) {
                  for (let k = 0; k < filaAnterior.length; k++) {
                    const valorCell = filaAnterior[k];
                    if (valorCell && (typeof valorCell === 'number' || (typeof valorCell === 'string' && valorCell.match(/^[\-\d\.,]+$/)))) {
                      const numValue = parseFloat(valorCell.toString().replace(/[^\d\.,\-]/g, '').replace(',', '.'));
                      if (!isNaN(numValue) && numValue > 0) {
                        saldoEncontrado = numValue;
                        console.log(`✅ Saldo inicial encontrado en fila anterior, columna ${k + 1}: ${formatearNumero(saldoEncontrado)}`);
                        return saldoEncontrado;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    if (saldoEncontrado === 0) {
      console.log(`⚠️ No se encontró saldo inicial para ${tipoBanco}`);
    }
    
    return saldoEncontrado;
  };
  
  // Buscar saldo inicial usando la función mejorada
  if (tipoBanco === 'santander') {
    saldoInicial = buscarSaldoInicial(data, 'Santander');
  }
  
  // Buscar saldo inicial para Banco de Chile usando la función mejorada
  if (tipoBanco === 'chile') {
    console.log('🔍 Buscando saldo inicial en Banco de Chile...');
    
    // Primero intentar con la lógica específica del Banco de Chile
    if (data.length >= 3) {
      const fila3 = data[2]; // Fila 3 (índice 2)
      if (fila3 && fila3.length >= 5) { // Necesitamos al menos 5 columnas (A, B, C, D, E)
        const saldoMayorCell = fila3[4]; // Columna E (índice 4) - Saldo mayor
        const cargosCell = fila3[2]; // Columna C (índice 2) - Cargos
        const abonosCell = fila3[3]; // Columna D (índice 3) - Abonos
        
        console.log(`🔍 Valores extraídos de la fila 3:`);
        console.log(`  - Columna E (Saldo Mayor): "${saldoMayorCell}" (tipo: ${typeof saldoMayorCell})`);
        console.log(`  - Columna C (Cargos): "${cargosCell}" (tipo: ${typeof cargosCell})`);
        console.log(`  - Columna D (Abonos): "${abonosCell}" (tipo: ${typeof abonosCell})`);
        
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
        
        // Si el resultado es 0, verificar si realmente no hay datos
        if (saldoInicial === 0 && saldoMayor === 0 && cargos === 0 && abonos === 0) {
          console.log('⚠️ Todos los valores son 0, usando búsqueda general...');
          saldoInicial = buscarSaldoInicial(data, 'Banco de Chile');
        }
      } else {
        console.log('⚠️ Fila 3 no tiene suficientes columnas, usando búsqueda general...');
        saldoInicial = buscarSaldoInicial(data, 'Banco de Chile');
      }
    } else {
      console.log('⚠️ Archivo no tiene suficientes filas, usando búsqueda general...');
      saldoInicial = buscarSaldoInicial(data, 'Banco de Chile');
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
            totalAbonos += numValue;
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
            totalAbonos += numValue;
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
    
    // Si no se encontró el valor en fila 11, usar la lógica anterior como fallback
    if (totalAbonos === 0) {
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
              totalAbonos += numValue;
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
      if (totalAbonos === 0) {
        console.log('⚠️ No se encontraron abonos en el archivo Santander');
        console.log('🔍 Revisar la estructura del archivo y los valores');
      }
    }
  }
  
  console.log(`=== RESUMEN ARCHIVO ${tipoBanco.toUpperCase()} ===`);
  console.log(`Cuenta encontrada: ${numeroCuenta}`);
  console.log(`Movimientos de ingreso procesados: ${movimientosProcesados.length}`);
  console.log(`Total abonos: ${formatearNumero(totalAbonos)}`);
  console.log(`Total egresos excluidos: ${data.length - movimientosProcesados.length - 1}`);
  
  if (movimientosProcesados.length > 0) {
    console.log('Primeros 3 movimientos de ingreso:');
    movimientosProcesados.slice(0, 3).forEach((mov, index) => {
      console.log(`  ${index + 1}. ${mov.fecha} - ${formatearNumero(mov.monto)} - ${mov.descripcion}`);
    });
  }
  
      console.log(`=== FIN RESUMEN ${tipoBanco.toUpperCase()} ===`);
    console.log(`💰 Total abonos calculados para ${tipoBanco}: ${formatearNumero(totalAbonos)}`);
    console.log(`📊 Movimientos procesados: ${movimientosProcesados.length}`);
    console.log(`📊 Primeros 3 movimientos:`, movimientosProcesados.slice(0, 3));
    console.log(`🔍 Número de cuenta detectado: "${numeroCuenta}"`);
    console.log(`💰 Saldo inicial detectado: ${formatearNumero(saldoInicial)}`);
    
    return { totalAbonos, numeroCuenta, saldoInicial };
}

export async function POST(request) {
  try {
    console.log('=== INICIANDO CÁLCULO DE ABONOS ===');
    
    const formData = await request.formData();
    const bancoChileCount = parseInt(formData.get('bancoChileCount') || '0');
    const bancoSantanderFile = formData.get('bancoSantander');
    const empresaSeleccionada = formData.get('empresaSeleccionada') || 'arricam';
    
    console.log(`🏢 Empresa seleccionada: ${empresaSeleccionada}`);
    
    console.log(`Archivos recibidos: Banco Chile: ${bancoChileCount}, Banco Santander: ${bancoSantanderFile ? 'Sí' : 'No'}`);
    
    const abonosCalculados = {
      bancoChileArriendo: 0,
      bancoChileVenta: 0,
      bancoSantander: 0,
      ferreteriaBancoChileArriendo: 0,
      ferreteriaBancoChileVenta: 0,
      ferreteriaBancoSantander: 0
    };
    
    // Procesar archivos del Banco de Chile por separado
    const archivosChile = [];
    const saldosInicialesChile = [];
    console.log(`🔍 Procesando ${bancoChileCount} archivo(s) del Banco de Chile`);
    
    for (let i = 0; i < bancoChileCount; i++) {
      const bancoChileFile = formData.get(`bancoChile_${i}`);
      if (bancoChileFile) {
        console.log(`📁 Procesando archivo Banco Chile ${i + 1}/${bancoChileCount}: ${bancoChileFile.name}`);
        const bancoChileBuffer = await bancoChileFile.arrayBuffer();
        const bancoChileWorkbook = XLSX.read(bancoChileBuffer, { type: 'buffer' });
        const resultado = procesarArchivoBanco(bancoChileWorkbook, 'chile');
        
        console.log(`📊 Resultado del archivo ${i + 1}:`, {
          totalAbonos: resultado.totalAbonos,
          numeroCuenta: resultado.numeroCuenta,
          saldoInicial: resultado.saldoInicial,
          movimientos: resultado.movimientos?.length || 0
        });
        
        archivosChile.push(resultado);
        saldosInicialesChile.push(resultado.saldoInicial || 0);
        console.log(`💰 Saldo inicial extraído del archivo ${i + 1}: ${formatearNumero(resultado.saldoInicial || 0)}`);
      }
    }
    
    // Asignar los ingresos del Banco de Chile según el número de cuenta
    console.log('=== ASIGNANDO RESULTADOS BANCO CHILE ===');
    console.log(`📋 Archivos procesados: ${archivosChile.length}`);
    archivosChile.forEach((archivo, index) => {
      console.log(`  Archivo ${index + 1}: Cuenta "${archivo.numeroCuenta}", Abonos ${formatearNumero(archivo.totalAbonos)}, Saldo ${formatearNumero(archivo.saldoInicial)}`);
    });
    
    let saldoInicialArriendo = 0;
    let saldoInicialVenta = 0;
    let saldoInicialFerreteriaArriendo = 0;
    let saldoInicialFerreteriaVenta = 0;
    
    console.log('🔍 Inicializando variables de saldo:');
    console.log(`  saldoInicialArriendo: ${formatearNumero(saldoInicialArriendo)}`);
    console.log(`  saldoInicialVenta: ${formatearNumero(saldoInicialVenta)}`);
    console.log(`  saldoInicialFerreteriaArriendo: ${formatearNumero(saldoInicialFerreteriaArriendo)}`);
    console.log(`  saldoInicialFerreteriaVenta: ${formatearNumero(saldoInicialFerreteriaVenta)}`);
    
    for (let i = 0; i < archivosChile.length; i++) {
      const archivo = archivosChile[i];
      const { totalAbonos, numeroCuenta } = archivo;
      const saldoInicialArchivo = saldosInicialesChile[i] || 0;
      
      console.log(`🔍 Analizando archivo ${i + 1}: Cuenta ${numeroCuenta}, Abonos ${formatearNumero(totalAbonos)}, Saldo Inicial ${formatearNumero(saldoInicialArchivo)}`);
      console.log(`🔍 Número de cuenta detectado: "${numeroCuenta}"`);
      
      // Identificar la cuenta según el número encontrado
      console.log(`🔍 Verificando patrones de cuenta para: "${numeroCuenta}"`);
      console.log(`🔍 Incluye '16806824'? ${numeroCuenta.includes('16806824')}`);
      console.log(`🔍 Incluye '168-06824'? ${numeroCuenta.includes('168-06824')}`);
      console.log(`🔍 Incluye '16808475'? ${numeroCuenta.includes('16808475')}`);
      console.log(`🔍 Incluye '168-08475'? ${numeroCuenta.includes('168-08475')}`);
      console.log(`🔍 Incluye '16811115'? ${numeroCuenta.includes('16811115')}`);
      console.log(`🔍 Incluye '168-11115'? ${numeroCuenta.includes('168-11115')}`);
      console.log(`🔍 Incluye '16813961'? ${numeroCuenta.includes('16813961')}`);
      console.log(`🔍 Incluye '168-13961'? ${numeroCuenta.includes('168-13961')}`);
      
      if (numeroCuenta.includes('16806824') || numeroCuenta.includes('168-06824')) {
        // Cuenta de Arriendo ARRICAM: 168-06824-09
                  abonosCalculados.bancoChileArriendo = totalAbonos;
        saldoInicialArriendo = saldoInicialArchivo;
                  console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a bancoChileArriendo ARRICAM (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Arriendo ARRICAM: ${formatearNumero(saldoInicialArriendo)}`);
      } else if (numeroCuenta.includes('16808475') || numeroCuenta.includes('168-08475')) {
        // Cuenta de Venta ARRICAM: 168-08475-09
                  abonosCalculados.bancoChileVenta = totalAbonos;
        saldoInicialVenta = saldoInicialArchivo;
                  console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a bancoChileVenta ARRICAM (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Venta ARRICAM: ${formatearNumero(saldoInicialVenta)}`);
      } else if (numeroCuenta.includes('16811115') || numeroCuenta.includes('168-11115')) {
        // Cuenta de Arriendo FERRETERIA: 168-11115-02
                  abonosCalculados.ferreteriaBancoChileArriendo = totalAbonos;
        saldoInicialFerreteriaArriendo = saldoInicialArchivo;
                  console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a ferreteriaBancoChileArriendo (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Ferreteria Arriendo: ${formatearNumero(saldoInicialFerreteriaArriendo)}`);
        
        console.log('🔍 Estado de variables después de asignar ferreteria arriendo:');
        console.log(`  saldoInicialFerreteriaArriendo: ${formatearNumero(saldoInicialFerreteriaArriendo)}`);
        console.log(`  saldoInicialFerreteriaVenta: ${formatearNumero(saldoInicialFerreteriaVenta)}`);
      } else if (numeroCuenta.includes('16813961') || numeroCuenta.includes('168-13961')) {
        // Cuenta de Venta FERRETERIA: 168-13961-08
                  abonosCalculados.ferreteriaBancoChileVenta = totalAbonos;
        saldoInicialFerreteriaVenta = saldoInicialArchivo;
                  console.log(`✅ Asignando ${formatearNumero(totalAbonos)} a ferreteriaBancoChileVenta (cuenta: ${numeroCuenta})`);
        console.log(`💰 Saldo inicial Ferreteria Venta: ${formatearNumero(saldoInicialFerreteriaVenta)}`);
        
        console.log('🔍 Estado de variables después de asignar ferreteria venta:');
        console.log(`  saldoInicialFerreteriaVenta: ${formatearNumero(saldoInicialFerreteriaVenta)}`);
        console.log(`  saldoInicialFerreteriaArriendo: ${formatearNumero(saldoInicialFerreteriaArriendo)}`);
      } else {
        // Si no se puede identificar, usar el orden de subida como fallback
        console.log(`❌ No se pudo identificar el tipo de cuenta para: "${numeroCuenta}"`);
        if (abonosCalculados.bancoChileVenta === 0) {
          abonosCalculados.bancoChileVenta = totalAbonos;
          saldoInicialVenta = saldoInicialArchivo;
          console.log(`⚠️ Asignando ${formatearNumero(totalAbonos)} a bancoChileVenta (fallback - cuenta no identificada)`);
          console.log(`💰 Saldo inicial Venta (fallback): ${formatearNumero(saldoInicialVenta)}`);
        } else {
          abonosCalculados.bancoChileArriendo = totalAbonos;
          saldoInicialArriendo = saldoInicialArchivo;
          console.log(`⚠️ Asignando ${formatearNumero(totalAbonos)} a bancoChileArriendo (fallback - cuenta no identificada)`);
          console.log(`💰 Saldo inicial Arriendo (fallback): ${formatearNumero(saldoInicialArriendo)}`);
        }
      }
    }
    
    // Procesar archivo del Banco Santander por separado
    let saldoInicialSantander = 0;
    let saldoInicialFerreteriaSantander = 0;
    if (bancoSantanderFile) {
      console.log(`Procesando archivo Banco Santander: ${bancoSantanderFile.name}`);
      const bancoSantanderBuffer = await bancoSantanderFile.arrayBuffer();
      const bancoSantanderWorkbook = XLSX.read(bancoSantanderBuffer, { type: 'buffer' });
      const resultado = procesarArchivoBanco(bancoSantanderWorkbook, 'santander');
      // Identificar la cuenta Santander según el número encontrado
      if (resultado.numeroCuenta.includes('6866228') || resultado.numeroCuenta.includes('6866228-1')) {
        // Cuenta Santander ARRICAM: 6866228-1
        abonosCalculados.bancoSantander = resultado.totalAbonos;
        saldoInicialSantander = resultado.saldoInicial || 0;
        console.log(`✅ Asignando ${formatearNumero(resultado.totalAbonos)} a bancoSantander ARRICAM (cuenta: ${resultado.numeroCuenta})`);
        console.log(`💰 Saldo inicial extraído ARRICAM: ${formatearNumero(saldoInicialSantander)}`);
      } else if (resultado.numeroCuenta.includes('9208349') || resultado.numeroCuenta.includes('9208349-7')) {
        // Cuenta Santander FERRETERIA: 9208349-7
        abonosCalculados.ferreteriaBancoSantander = resultado.totalAbonos;
        saldoInicialFerreteriaSantander = resultado.saldoInicial || 0;
        console.log(`✅ Asignando ${formatearNumero(resultado.totalAbonos)} a ferreteriaBancoSantander (cuenta: ${resultado.numeroCuenta})`);
        console.log(`💰 Saldo inicial extraído Ferreteria: ${formatearNumero(saldoInicialFerreteriaSantander)}`);
      } else {
        // Si no se puede identificar, usar como Santander ARRICAM por defecto
        abonosCalculados.bancoSantander = resultado.totalAbonos;
        saldoInicialSantander = resultado.saldoInicial || 0;
        console.log(`⚠️ Asignando ${formatearNumero(resultado.totalAbonos)} a bancoSantander (fallback - cuenta no identificada: ${resultado.numeroCuenta})`);
        console.log(`💰 Saldo inicial extraído (fallback): ${formatearNumero(saldoInicialSantander)}`);
      }
    } else {
      console.log('❌ No se recibió archivo del Banco Santander');
    }
    
    console.log('=== RESULTADOS FINALES ===');
    console.log('Abonos calculados finales:', {
      bancoChileArriendo: formatearNumero(abonosCalculados.bancoChileArriendo),
      bancoChileVenta: formatearNumero(abonosCalculados.bancoChileVenta),
      bancoSantander: formatearNumero(abonosCalculados.bancoSantander),
      ferreteriaBancoChileArriendo: formatearNumero(abonosCalculados.ferreteriaBancoChileArriendo),
      ferreteriaBancoChileVenta: formatearNumero(abonosCalculados.ferreteriaBancoChileVenta),
      ferreteriaBancoSantander: formatearNumero(abonosCalculados.ferreteriaBancoSantander)
    });
    
    console.log('💰 Saldos iniciales finales:', {
      arriendoArricam: formatearNumero(saldoInicialArriendo),
      ventaArricam: formatearNumero(saldoInicialVenta),
      santanderArricam: formatearNumero(saldoInicialSantander),
      arriendoFerreteria: formatearNumero(saldoInicialFerreteriaArriendo),
      ventaFerreteria: formatearNumero(saldoInicialFerreteriaVenta),
      santanderFerreteria: formatearNumero(saldoInicialFerreteriaSantander)
    });
    
    console.log('=== FIN CÁLCULO DE ABONOS ===');
    
    // Construir respuesta según la empresa seleccionada
    let respuesta = {
      success: true,
      abonosCalculados: abonosCalculados,
      saldoInicialSantander: saldoInicialSantander,
      saldoInicialSantanderFormateado: formatearNumero(saldoInicialSantander),
      saldoInicialChileArriendo: saldoInicialArriendo,
      saldoInicialChileArriendoFormateado: formatearNumero(saldoInicialArriendo),
      saldoInicialChileVenta: saldoInicialVenta,
      saldoInicialChileVentaFormateado: formatearNumero(saldoInicialVenta)
    };
    
    if (empresaSeleccionada === 'ferreteria') {
      // Para ferreteria, enviar datos con claves de ferreteria
      respuesta = {
        ...respuesta,
        saldoInicialFerreteriaArriendo: saldoInicialFerreteriaArriendo,
        saldoInicialFerreteriaArriendoFormateado: formatearNumero(saldoInicialFerreteriaArriendo),
        saldoInicialFerreteriaVenta: saldoInicialFerreteriaVenta,
        saldoInicialFerreteriaVentaFormateado: formatearNumero(saldoInicialFerreteriaVenta),
        saldoInicialFerreteriaSantander: saldoInicialFerreteriaSantander,
        saldoInicialFerreteriaSantanderFormateado: formatearNumero(saldoInicialFerreteriaSantander)
      };
      console.log('🏢 Enviando respuesta para FERRETERIA con claves:', Object.keys(respuesta));
      console.log('💰 Saldos iniciales ferreteria enviados:', {
        arriendo: respuesta.saldoInicialFerreteriaArriendo,
        venta: respuesta.saldoInicialFerreteriaVenta,
        santander: respuesta.saldoInicialFerreteriaSantander
      });
    } else {
      // Para arricam, enviar datos con claves de nueva empresa (mantener compatibilidad)
      respuesta = {
        ...respuesta,
        saldoInicialNuevaEmpresaArriendo: saldoInicialFerreteriaArriendo,
        saldoInicialNuevaEmpresaArriendoFormateado: formatearNumero(saldoInicialFerreteriaArriendo),
        saldoInicialNuevaEmpresaVenta: saldoInicialFerreteriaVenta,
        saldoInicialNuevaEmpresaVentaFormateado: formatearNumero(saldoInicialFerreteriaVenta),
        saldoInicialNuevaEmpresaSantander: saldoInicialFerreteriaSantander,
        saldoInicialNuevaEmpresaSantanderFormateado: formatearNumero(saldoInicialFerreteriaSantander)
      };
      console.log('🏢 Enviando respuesta para ARRICAM con claves:', Object.keys(respuesta));
    }
    
    console.log('📤 Respuesta final completa:', respuesta);
    return NextResponse.json(respuesta);
    
  } catch (error) {
    console.error('❌ Error al calcular abonos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al calcular abonos' },
      { status: 500 }
    );
  }
} 