# Los Cóndor de Oro - Sistema de Premiación

Sistema full-stack completo para la gestión de un evento de premiación del clan Legión Cóndor.

## 🏗️ Arquitectura

El proyecto está dividido en 3 servicios independientes:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Base de Datos**: PostgreSQL

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker
- Docker Compose

### Instalación y Ejecución

1. **Clonar o descargar el proyecto**

2. **Crear archivo `.env`** (opcional, tiene valores por defecto)
   ```env
   # Database
   POSTGRES_USER=condor
   POSTGRES_PASSWORD=condor123
   POSTGRES_DB=condor_db

   # Admin
   ADMIN_USER=admin
   ADMIN_PASSWORD=admin
   ```

3. **Construir y ejecutar con Docker**
   ```bash
   docker-compose up --build
   ```

4. **Acceder a la aplicación**
   - Frontend público: http://localhost:3000
   - Backend API: http://localhost:3001
   - Panel admin: http://localhost:3000/admin/login
   - Credenciales admin (por defecto): `admin` / `admin`

## 📋 Características

### Páginas Públicas
- **Landing**: Página principal que muestra el estado actual del evento
- **Validar Código**: Validación de códigos únicos de miembros
- **Nominar**: Formulario para nominar candidatos por categoría
- **Votar**: Formulario para votar por candidatos
- **Ganadores**: Página con los ganadores anunciados

### Panel de Administración
- **Dashboard**: Estadísticas generales del evento
- **Categorías**: Gestión de categorías de premiación
- **Estado del Evento**: Control del estado global (SETUP, NOMINATIONS, VOTING, CLOSED)
- **Nominaciones**: Visualización de todas las nominaciones recibidas
- **Candidatos**: Gestión de candidatos por categoría
- **Resultados**: Visualización de resultados de votación
- **Ganadores**: Establecer y publicar ganadores por categoría
- **Importar Códigos**: Importación de códigos desde CSV o manualmente

## 🗄️ Base de Datos

El proyecto usa PostgreSQL con Prisma ORM. Las migraciones se ejecutan automáticamente al iniciar el contenedor.

### Tablas Principales
- `categories`: Categorías de premiación
- `nominations`: Nominaciones recibidas
- `candidates`: Candidatos por categoría
- `votes`: Votos registrados
- `member_codes`: Códigos únicos de miembros
- `event_state`: Estado actual del evento

## 🔐 Seguridad

- Autenticación básica HTTP para el panel admin
- Validación de códigos únicos antes de nominar/votar
- Códigos se marcan como usados después de cada acción
- Sin relación entre códigos y acciones (anonimato)

## 🎨 Tecnologías

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, ShadCN/UI, Framer Motion, React Router
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Infraestructura**: Docker, Docker Compose

## 📝 Flujo del Evento

1. **SETUP**: Configuración inicial, creación de categorías e importación de códigos
2. **NOMINATIONS**: Los miembros pueden nominar candidatos usando sus códigos
3. **VOTING**: Los miembros pueden votar por candidatos usando sus códigos
4. **CLOSED**: El evento finaliza, se pueden ver los ganadores

## 🔧 Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐛 Solución de Problemas

### El contenedor no inicia
- Verifica que los puertos 3000, 3001 y 5432 estén disponibles
- Revisa los logs: `docker-compose logs`

### Error de conexión a la base de datos
- Asegúrate de que el contenedor de la base de datos esté saludable
- Verifica las variables de entorno en `.env`

### Las migraciones fallan
- Elimina el volumen de PostgreSQL: `docker-compose down -v`
- Vuelve a construir: `docker-compose up --build`

## 📄 Licencia

Este proyecto es privado para el clan Legión Cóndor.
