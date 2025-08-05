# Consolidación de Cuentas - Arricam

## Descripción
Esta funcionalidad permite procesar archivos Excel del Banco de Chile y Banco Santander para generar un reporte consolidado de gastos con categorización automática.

## Características

### Categorización Automática
El sistema detecta automáticamente las siguientes categorías de gastos:

- **FLETES**: flete, pago fact, hormazabal, vargas, galio
- **SUELDOS/IMPOSIC**: sueldo, imposic, remuneración, pago personal
- **MATERIALES**: material, insumo, repuesto
- **VEHICULOS**: vehículo, auto, patente, soap, seguro, musso, kia, dodge, ranguer
- **PUBLICIDAD**: publicidad, google, marketing, tarjeta crédito
- **ART. ESCRITORIO**: escritorio, oficina, equifax, entel, claro, prisa
- **COMBUSTIBLE**: combustible, copec, bencina, carga
- **CONTADOR/ABOGADO/REDES**: contador, abogado, honorarios, redes
- **IVA**: iva, impuesto
- **RENTA**: renta, impuesto
- **IMPTOS BANCARIOS**: comisión, banco, cobranza
- **REPUESTOS/REPARAC**: repuesto, reparación, mecánico
- **CAJA CHICA**: caja chica, gastos menores
- **TRANSFERENCIAS**: transferencia, transf, arrdos
- **INVERSIONES**: inversión, fondo mutuo, fdos mutuos
- **DEVOLUCION GARANTIAS**: devolución, garantía
- **COMPRA CONTAINERS**: container, compra container
- **OTROS GASTOS**: otros, varios, diversos

### Categorización Manual
Si el sistema no puede detectar automáticamente la categoría de un gasto, se mostrará un modal para que el usuario seleccione manualmente la categoría apropiada.

## Formato de Archivos de Entrada

### Banco de Chile
Debes subir **exactamente 2 archivos** Excel (.xls) del Banco de Chile. Cada archivo debe contener las siguientes columnas:
- **Fecha**: Formato DD-MM-YYYY o DD/MM/YYYY
- **Descripción**: Texto descriptivo del movimiento
- **Monto**: Valor numérico del gasto
- **Tipo**: (Opcional) Gasto/Ingreso

### Banco Santander
Un archivo Excel (.xlsx) del Banco Santander que debe contener las siguientes columnas:
- **Fecha**: Formato DD-MM-YYYY o DD/MM/YYYY
- **Descripción**: Texto descriptivo del movimiento
- **Monto**: Valor numérico del gasto
- **Tipo**: (Opcional) Gasto/Ingreso

## Formato de Salida

El reporte generado incluye:

### Hoja Principal: "Consolidación"
- Encabezado con información de las cuentas bancarias
- Secciones organizadas por categorías de gastos
- Totales por categoría
- Totales generales

### Hoja de Resumen: "Resumen"
- Resumen por categorías con montos totales
- Cantidad de movimientos por categoría
- Total general

### Hoja de Detalle: "Todos los Movimientos"
- Lista completa de todos los movimientos
- Información detallada: fecha, descripción, monto, categoría, banco

## Instrucciones de Uso

1. **Acceder a la funcionalidad**: Desde la página principal, hacer clic en "Consolidación de Cuentas"

2. **Subir archivos**:
   - Subir 2 archivos Excel del Banco de Chile (.xls)
   - Subir archivo Excel del Banco Santander (.xlsx)
   - (Opcional) Subir plantilla de formato de salida

3. **Procesar consolidación**:
   - Hacer clic en "Consolidar Cuentas"
   - Si hay movimientos sin categorizar, se mostrará el modal de categorización
   - Seleccionar la categoría apropiada para cada movimiento
   - Confirmar la categorización

4. **Descargar resultado**:
   - Una vez procesado, se puede descargar el archivo Excel consolidado
   - El archivo incluye múltiples hojas con diferentes vistas de los datos

## Tecnologías Utilizadas

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes
- **Procesamiento Excel**: XLSX.js
- **Categorización**: Sistema de palabras clave y categorización manual

## Estructura de Archivos

```
src/
├── app/
│   ├── consolidacion/
│   │   └── page.js                    # Página principal de consolidación
│   └── api/
│       └── consolidacion/
│           └── route.js               # API endpoint para procesamiento
└── components/
    └── CategorizacionModal.js         # Modal para categorización manual
```

## Consideraciones Técnicas

- Los archivos Excel se procesan en el servidor
- La categorización automática se basa en palabras clave
- El sistema es flexible con diferentes formatos de archivos Excel
- Se manejan errores de forma robusta
- La interfaz es responsive y accesible

## Mejoras Futuras

- [ ] Soporte para más bancos
- [ ] Categorización por IA/ML
- [ ] Historial de consolidaciones
- [ ] Exportación a PDF
- [ ] Gráficos y análisis estadísticos
- [ ] Integración con sistemas contables 