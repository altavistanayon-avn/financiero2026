# 🏘️ Altavista de Nayón — Dashboard Financiero

Dashboard interactivo que lee datos desde un Google Sheet público y permite a los residentes consultar el estado financiero de la urbanización mes a mes.

---

## 📋 PASO 1: Crear el Google Sheet

### 1.1 Crear una hoja nueva en Google Sheets

Ve a [sheets.google.com](https://sheets.google.com) y crea una nueva hoja de cálculo. Nómbrala:
**"Altavista de Nayón — Datos Dashboard"**

### 1.2 Crear las 5 pestañas (tabs)

Crea exactamente estas 5 pestañas con estos nombres (respetar mayúsculas):

| Pestaña | Contenido |
|---------|-----------|
| `RESUMEN` | KPIs principales del mes (1 fila por mes) |
| `GASTOS` | Detalle de gastos por categoría |
| `CXC` | Cuentas por cobrar (deudores) |
| `CXP` | Cuentas por pagar (proveedores) |
| `INGRESOS` | Detalle de ingresos por propietario |

### 1.3 Estructura de cada pestaña

#### 🔵 Pestaña: RESUMEN
Una fila por cada mes. La fila 1 son los encabezados.

| mes | saldo_inicial | total_ingresos | otros_ingresos | total_gastos | saldo_disponible | cxc_total | poliza | anticipos | cxp_total | saldo_final | total_unidades | unidades_morosas |
|-----|--------------|----------------|----------------|-------------|-----------------|-----------|--------|-----------|-----------|-------------|----------------|------------------|
| Abril 2026 | 54943.80 | 9457.72 | 543.06 | 4343.36 | 60601.22 | 14003.66 | 20000 | 11946 | 4597.27 | 64084.10 | 155 | 35 |
| Mayo 2026 | 60601.22 | ... | ... | ... | ... | ... | ... | ... | ... | ... | 155 | ... |

#### 🔵 Pestaña: GASTOS
Múltiples filas por mes. Una fila por cada categoría de gasto.

| mes | categoria | monto |
|-----|-----------|-------|
| Abril 2026 | Seguridad Privada | 3196.71 |
| Abril 2026 | Administración | 402.50 |
| Abril 2026 | Limpieza y Jardinería | 365 |
| Abril 2026 | Sistema Mi Casita | 117.90 |
| Abril 2026 | Cuatripartito | 89.96 |
| Abril 2026 | Jardinería (combustible) | 79.48 |
| Abril 2026 | Internet | 75.05 |
| Abril 2026 | Comisiones Bancarias | 11.76 |
| Abril 2026 | Almuerzos | 5 |
| Mayo 2026 | Seguridad Privada | ... |
| Mayo 2026 | ... | ... |

#### 🔵 Pestaña: CXC (Cuentas por Cobrar)
Los deudores del mes. Múltiples filas por mes.

| mes | casa | propietario | total | desde |
|-----|------|-------------|-------|-------|
| Abril 2026 | 6D | Raúl Rivas | 5124.22 | 2019 |
| Abril 2026 | 7F/C2 | Juan Diego Guzmán | 2040 | 2023 |
| Abril 2026 | 8F | Azucena Guerrero | 1993.69 | 2020 |
| Abril 2026 | 7C | Pazmiño/Abad Vergara | 1037.42 | 2019 |
| Abril 2026 | 4D/C1 | Mario Reinoso | 600 | 2025 |
| ... | ... | ... | ... | ... |

#### 🔵 Pestaña: CXP (Cuentas por Pagar)
Proveedores con factura pendiente. Múltiples filas por mes.

| mes | proveedor | detalle | monto |
|-----|-----------|---------|-------|
| Abril 2026 | INGECSE CÍA. LTDA. | Seguridad Privada Abril 2026 | 3196.71 |
| Abril 2026 | Edificios Q | Servicios Administrativos Abril 2026 | 402.50 |
| Abril 2026 | Gilbert Tapia | Limpieza y Mantenimiento Abril 2026 | 365 |
| Abril 2026 | Fabián Aragundi | Instalación sistema fotovoltaico garita | 233.53 |
| Abril 2026 | ServiExpress | Elaboración cartolas ingreso residentes | 170 |
| ... | ... | ... | ... |

#### 🔵 Pestaña: INGRESOS
Pagos recibidos por propietario. Múltiples filas por mes.

| mes | casa | propietario | monto |
|-----|------|-------------|-------|
| Abril 2026 | 10B/C1 | Jorge Luis Alvarado | 60 |
| Abril 2026 | 10B/C3 | Eduardo Javier Espinoza | 60 |
| Abril 2026 | 1A/C3 | Christian Paredes | 60 |
| ... | ... | ... | ... |

### 1.4 Hacer el Sheet público

1. En Google Sheets, clic en **Compartir** (botón verde arriba a la derecha)
2. En "Acceso general", cambiar a **"Cualquier persona con el enlace"**
3. Asegurarse de que diga **"Lector"** (no editor)
4. Copiar el enlace

### 1.5 Obtener el SHEET_ID

Del enlace copiado, extrae el ID. Ejemplo:
```
https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
                                       └──────── ESTE ES TU ID ────────┘
```

---

## 🚀 PASO 2: Configurar el proyecto

### 2.1 Requisitos previos
- [Node.js](https://nodejs.org/) versión 18 o superior instalado
- Una cuenta en [Vercel](https://vercel.com) (gratis con GitHub)
- [Git](https://git-scm.com/) instalado

### 2.2 Descomprimir y configurar

```bash
# 1. Descomprimir el archivo
unzip altavista-dashboard.zip
cd altavista-dashboard

# 2. Abrir el archivo de configuración y pegar tu SHEET_ID
#    Edita src/config.js y reemplaza "PEGA_AQUI_TU_SHEET_ID" con tu ID real
```

### 2.3 Probar en local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:5173 en tu navegador. Deberías ver el dashboard con los datos de tu Google Sheet.

---

## 🌐 PASO 3: Desplegar en Vercel (GRATIS)

### Opción A: Desde GitHub (RECOMENDADO)

```bash
# 1. Crear repositorio en GitHub
git init
git add .
git commit -m "Dashboard financiero Altavista"

# 2. Crear repo en github.com y conectar
git remote add origin https://github.com/TU-USUARIO/altavista-dashboard.git
git push -u origin main
```

3. Ve a [vercel.com](https://vercel.com) → **"Add New Project"**
4. Importa tu repositorio de GitHub
5. Vercel detecta Vite automáticamente → clic en **Deploy**
6. En 60 segundos tienes tu URL: `https://altavista-dashboard.vercel.app`

### Opción B: Deploy directo con Vercel CLI

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Desplegar
vercel

# Seguir las instrucciones en pantalla
# Vercel te dará una URL pública
```

---

## 📅 PASO 4: Actualización mensual

Cada mes, el administrador solo necesita:

1. **Abrir el Google Sheet**
2. **Agregar filas nuevas** en cada pestaña con el mes nuevo:
   - En `RESUMEN`: agregar 1 fila con los KPIs del mes
   - En `GASTOS`: agregar las filas de gastos del mes
   - En `CXC`: agregar los deudores actualizados
   - En `CXP`: agregar las facturas pendientes del mes
   - En `INGRESOS`: agregar los pagos recibidos del mes
3. **¡Listo!** El dashboard se actualiza automáticamente

> **IMPORTANTE**: En la columna `mes`, usar un formato consistente.  
> Ejemplo: "Abril 2026", "Mayo 2026", "Junio 2026"...
> El dashboard los ordena por el orden en que aparecen en la hoja.

---

## 🔐 Consideraciones de Privacidad

- El Google Sheet es **público en modo lectura**. Cualquier persona con el enlace puede ver los datos.
- Si necesitas restringir el acceso, considera la Ruta 3 (backend con autenticación).
- **No incluyas** datos sensibles como cédulas, teléfonos o correos electrónicos.
- Los datos que se muestran son los mismos que se presentan en asamblea.

---

## 🛠️ Personalización

### Cambiar nombre de la urbanización
Edita `src/config.js`:
```js
export const NOMBRE_URBANIZACION = "Mi Urbanización";
```

### Cambiar colores del tema
Edita el objeto `C` al inicio de `src/App.jsx`.

### Agregar un dominio personalizado
En Vercel → Settings → Domains → agrega tu dominio (ej: `finanzas.altavistadenayon.com`).

---

## 📁 Estructura del proyecto

```
altavista-dashboard/
├── index.html              ← Página HTML principal
├── package.json            ← Dependencias (React, Recharts, PapaParse)
├── vite.config.js          ← Configuración de Vite
├── vercel.json             ← Configuración de despliegue
├── src/
│   ├── main.jsx            ← Punto de entrada React
│   ├── config.js           ← ⚙️ CONFIGURACIÓN (SHEET_ID va aquí)
│   ├── App.jsx             ← Dashboard principal (tabs, charts, KPIs)
│   └── services/
│       └── sheets.js       ← Conexión con Google Sheets
└── README.md               ← Esta guía
```
