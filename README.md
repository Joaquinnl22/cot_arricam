# ARRICAM - Sistema de Gestión Empresarial

Sistema web para la gestión de cotizaciones, contratos, órdenes de compra y consolidación financiera de ARRICAM SPA.

## 🚀 Funcionalidades

### 📋 Cotizaciones
- Crear y gestionar cotizaciones para venta y arriendo
- Generar PDFs automáticamente
- Contador automático de cotizaciones
- Gestión de productos y precios

### 📄 Contratos
- Generación de contratos de venta y arriendo
- Templates personalizados
- Exportación a PDF

### 🛒 Órdenes de Compra
- Crear órdenes de compra
- Contador automático
- Gestión de proveedores

### 💰 Consolidación Financiera
- Procesamiento de archivos bancarios (CSV/Excel)
- Soporte para Banco de Chile y Santander
- Cálculo automático de saldos iniciales y abonos
- Generación de reportes consolidados en Excel
- Soporte para múltiples empresas (Arricam y Ferretería)

## 🛠️ Tecnologías

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** MongoDB
- **PDF:** Puppeteer, Chrome AWS Lambda
- **Excel:** XLSX, ExcelJS
- **Deploy:** Vercel

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/cot_arricam.git
cd cot_arricam
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```
Editar `.env.local` con tus credenciales de MongoDB:
```
MONGODB_URI=tu_uri_de_mongodb
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── consolidacion/      # Consolidación financiera
│   │   ├── contador/           # Contadores automáticos
│   │   ├── login/              # Autenticación
│   │   └── productos/          # Gestión de productos
│   ├── consolidacion/          # Página de consolidación
│   ├── contratos/              # Página de contratos
│   ├── cotizacion/             # Páginas de cotización
│   └── orden-compra/           # Página de órdenes de compra
├── components/                 # Componentes reutilizables
├── lib/                        # Configuración de MongoDB
└── models/                     # Modelos de datos
```

## 🔧 Uso

### Consolidación Financiera
1. Ir a `/consolidacion`
2. Subir archivos bancarios (CSV/Excel)
3. Revisar y ajustar saldos iniciales
4. Generar reporte consolidado

### Cotizaciones
1. Ir a `/cotizacion`
2. Crear nueva cotización
3. Agregar productos
4. Generar PDF

### Contratos
1. Ir a `/contratos`
2. Seleccionar tipo de contrato
3. Completar datos
4. Generar PDF

## 🚀 Deploy

El proyecto está configurado para deploy automático en Vercel:

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

## 📝 Notas

- Los archivos bancarios deben estar en formato CSV o Excel
- Los templates de PDF están en `public/templates/`
- Los contadores se almacenan en MongoDB

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado para ARRICAM SPA.
