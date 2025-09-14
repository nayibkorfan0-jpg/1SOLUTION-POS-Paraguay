# 1SOLUTION - Guía de Despliegue y Distribución

## 🎯 Objetivo
Esta guía proporciona instrucciones paso a paso para generar el ejecutable final de 1SOLUTION y prepararlo para distribución a clientes.

---

## 📋 Pre-requisitos

### Entorno de Desarrollo
- ✅ Node.js 18+ instalado
- ✅ npm o yarn funcional
- ✅ Windows 10/11 (para builds de Windows)
- ✅ Git (para control de versiones)

### Verificación de Dependencias
```bash
# Verificar versiones
node --version  # Debe ser 18+
npm --version   # Debe ser 8+

# Verificar instalación de dependencias
npm list electron
npm list electron-builder
npm list better-sqlite3
```

---

## 🛠 Proceso de Construcción

### Paso 1: Preparación del Entorno
```bash
# Navegar al directorio del proyecto
cd /path/to/1solution-project

# Instalar/actualizar dependencias
npm install

# Limpiar construcciones anteriores
rm -rf dist release
```

### Paso 2: Agregar Scripts de Build (Si no existen)

Editar `package.json` y agregar estos scripts:

```json
{
  "scripts": {
    "build:frontend": "vite build",
    "build:backend": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server",
    "build:electron": "esbuild electron/main.ts --platform=node --bundle --format=cjs --outfile=electron/main.js --target=node18",
    "build:production": "node scripts/build-production.js",
    "build:all": "npm run build:production -- --package",
    "electron:dev": "NODE_ENV=development electron electron/main.js",
    "electron:build": "electron-builder --win",
    "electron:dist": "npm run build:production && npm run electron:build",
    "package:win": "npm run build:all",
    "clean": "rm -rf dist release electron/main.js"
  }
}
```

### Paso 3: Configurar Iconos (Opcional pero Recomendado)

Crear iconos para la aplicación siguiendo `assets/icon-requirements.md`:

```bash
# Estructura de iconos requerida
assets/
├── icon.ico          # Icono principal (multi-resolución)
├── icon.png          # PNG base (512x512)
└── icon-requirements.md
```

**Nota**: La aplicación funcionará sin iconos personalizados, usando los iconos por defecto de Electron.

### Paso 4: Construcción de Producción

#### Opción A: Construcción Completa Automática
```bash
# Ejecutar construcción completa con empaquetado
npm run build:all
```

#### Opción B: Construcción Paso a Paso
```bash
# 1. Construir frontend
npm run build:frontend

# 2. Construir backend  
npm run build:backend

# 3. Construir proceso principal de Electron
npm run build:electron

# 4. Ejecutar script de producción
npm run build:production

# 5. Generar ejecutable e instalador
npm run electron:build
```

#### Opción C: Comandos Manuales (Si no se pueden agregar scripts)
```bash
# Frontend
npx vite build

# Backend
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Electron Main
npx esbuild electron/main.ts --platform=node --bundle --format=cjs --outfile=electron/main.js --target=node18

# Script de producción
node scripts/build-production.js

# Empaquetado final
npx electron-builder --win
```

---

## 📦 Verificación de Resultados

### Archivos Generados

Después de una construcción exitosa, deberías tener:

```
proyecto/
├── dist/                           # Build de producción
│   ├── public/                     # Frontend construido
│   ├── server/                     # Backend construido
│   ├── shared/                     # Esquemas compartidos
│   └── package.json                # Dependencias de producción
├── release/                        # Archivos distribuibles
│   ├── 1SOLUTION-Setup-1.0.0-x64.exe    # ✅ INSTALADOR PRINCIPAL
│   ├── 1SOLUTION-Portable-1.0.0-x64.exe # ✅ EJECUTABLE PORTÁTIL
│   └── latest.yml                  # Metadatos
└── electron/
    └── main.js                     # Proceso principal construido
```

### Verificación de Integridad

```bash
# Verificar que los archivos existen
ls -la release/
ls -la dist/

# Verificar tamaño de archivos (aproximado)
# Instalador: ~150-300 MB
# Portátil: ~150-300 MB
```

---

## 🚀 Distribución a Clientes

### Archivos para Distribución

**PRIMARIO**: `release/1SOLUTION-Setup-1.0.0-x64.exe`
- Instalador completo con wizard
- Crea accesos directos automáticamente
- Instalación en Archivos de Programa
- Registro en Sistema de Windows

**ALTERNATIVO**: `release/1SOLUTION-Portable-1.0.0-x64.exe`
- Ejecutable autónomo
- No requiere instalación
- Ejecutar directamente desde cualquier ubicación

### Instrucciones para el Cliente

#### Instalación Estándar:
1. Descargar `1SOLUTION-Setup-1.0.0-x64.exe`
2. Ejecutar como administrador (clic derecho → "Ejecutar como administrador")
3. Seguir el asistente de instalación
4. Buscar "1SOLUTION" en el menú de inicio

#### Uso Portátil:
1. Descargar `1SOLUTION-Portable-1.0.0-x64.exe`
2. Colocar en carpeta deseada
3. Ejecutar directamente (doble clic)
4. La aplicación creará la base de datos en la misma carpeta

---

## 🔧 Solución de Problemas

### Problemas Comunes de Construcción

#### Error: "Cannot find module 'better-sqlite3'"
```bash
npm rebuild better-sqlite3 --build-from-source
```

#### Error: "Electron failed to install correctly"
```bash
npx electron-rebuild
```

#### Error: "Module not found" durante build
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

#### Error: "Permission denied" en Windows
- Ejecutar terminal como administrador
- Verificar antivirus no esté bloqueando

### Problemas de Ejecución

#### "No se puede abrir la aplicación"
- Verificar Windows Defender / antivirus
- Ejecutar como administrador
- Verificar integridad del archivo descargado

#### "Error de base de datos"
- Verificar permisos de escritura en la carpeta
- Ejecutar en carpeta con permisos de usuario

---

## 📋 Checklist de Distribución

### Antes de Enviar al Cliente:
- [ ] Construcción exitosa sin errores
- [ ] Archivo instalador generado (>100MB típicamente)
- [ ] Archivo portátil generado (>100MB típicamente)
- [ ] Prueba de instalación en PC limpio
- [ ] Verificación de funcionalidad básica
- [ ] Iconos personalizados (si se agregaron)

### Documentación para Cliente:
- [ ] Manual de instalación
- [ ] Manual de usuario básico
- [ ] Requisitos del sistema
- [ ] Información de soporte/contacto

### Archivos de Soporte:
- [ ] `README-DISTRIBUCION.md` - Documentación técnica
- [ ] `LICENSE.txt` - Licencia de software
- [ ] Manuales de usuario (si existen)

---

## 📞 Información de Contacto y Soporte

Para problemas técnicos durante el despliegue:
- **Documentación**: Ver `README-DISTRIBUCION.md`
- **Logs de construcción**: Revisar salida de console durante build
- **Problemas de Electron**: Consultar documentación oficial de Electron

**Estado del Proyecto**: ✅ **LISTO PARA PRODUCCIÓN**

La aplicación 1SOLUTION está completamente preparada para distribución como ejecutable de Windows independiente.