# 🥚 Laspo - Plataforma de Gestión de Suscripciones y Pedidos de Huevos de Campo

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

Plataforma web integral diseñada para la administración, suscripción recurrente, seguimiento logístico y métricas operativas de **Laspo - Huevos de Campo & Tradición**.

---

## 📌 Tabla de Contenidos

- [Características Principales](#-características-principales)
  - [Portal del Cliente](#-portal-del-cliente)
  - [Panel de Administración (Dashboard)](#-panel-de-administración-dashboard)
  - [Seguridad y Control de Acceso](#-seguridad-y-control-de-acceso)
  - [Automatización con n8n](#-automatización-con-n8n)
- [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Puesta en Marcha en Desarrollo](#-puesta-en-marcha-en-desarrollo)
- [Configuración de Base de Datos (Supabase)](#-configuración-de-base-de-datos-supabase)
- [Despliegue y Docker](#-despliegue-y-docker)
- [Integración con n8n](#-integración-con-n8n)

---

## ✨ Características Principales

### 👤 Portal del Cliente (`/mi-cuenta`)
* **Gestión de Suscripciones y Pedidos**: Solicitud de pedidos por planchas de huevos con modalidades de frecuencia flexible: *semanal*, *quincenal*, *personalizado* y *espontáneo*.
* **Calendario de Entregas**: Calendario visual interactivo para visualizar los días programados de entrega de cada cliente.
* **Historial Detallado**: Seguimiento de estado en tiempo real (*pendiente*, *entregado*, *cancelado*).
* **Modo Claro / Modo Oscuro**: Soporte nativo de cambio de tema mediante `@custom-variant dark` (Tailwind v4) con persistencia en `localStorage`.

### 🛠️ Panel de Administración (`/dashboard`)
* **Calendario General de Entregas (`LasPoCalendar.tsx`)**: Componente React mensual nativo altamente optimizado para Next.js SSR, eliminando dependencias pesadas propensas a fallos de hidratación.
* **Checklist de Logística en Vivo**: Lista de control diaria para marcar entregas como completadas con actualización instantánea en la base de datos.
* **Módulo de Pedidos Espontáneos (`NuevoPedidoAdminModal.tsx`)**: Asignación rápida de pedidos a clientes existentes o creación automática de nuevos clientes desde el propio panel.
* **Analítica & KPIs de Negocio (`AdminMetrics.tsx`)**:
  - Métricas globales de planchas entregadas, pedidos pendientes y cancelados.
  - Gráficos interactivos de evolución temporal por períodos (semana, mes, histórico).
  - Directorio consolidado de clientes con historial de consumo.

### 🔐 Seguridad y Control de Acceso
* **Supabase SSR**: Manejo seguro de sesiones mediante `@supabase/ssr` con cookies HttpOnly en middleware y Server Components.
* **Row Level Security (RLS)**: Políticas estrictas a nivel de fila en PostgreSQL para aislar los datos privados de cada cliente garantizando que los administradores conserven privilegios de mutación total.
* **Jerarquía de Roles**: Distinción entre roles `cliente`, `subadmin` y `admin`.

### ⚡ Automatización con n8n
* Disparo de webhooks ante la inserción de nuevos pedidos para notificar al equipo vía WhatsApp, Telegram o Email según el flujo definido.

---

## 🏛️ Arquitectura y Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Fullstack** | [Next.js](https://nextjs.org/) 16+ (App Router, Server Actions, API Routes) |
| **Interfaz & Estilos** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Base de Datos & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+, GoTrue Auth, Realtime) |
| **Contenedores & Infra** | [Docker](https://www.docker.com/) (Multi-stage build), Traefik Proxy, Easypanel / Swarm |
| **Automatización** | [n8n](https://n8n.io/) (Flujo `n8n_workflow_nuevo_pedido.json`) |

---

## 📂 Estructura del Proyecto

```text
las-po-app/
├── n8n_workflow_nuevo_pedido.json  # Definición del flujo de automatización n8n
├── supabase_schema.sql             # Script SQL completo: tablas, funciones y RLS
├── Dockerfile                      # Imagen Docker optimizada multi-stage para Node 22
├── next.config.ts                  # Configuración Next.js (output standalone y rewrites)
├── package.json
├── tsconfig.json
├── public/                         # Assets estáticos
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── admin/crear-pedido-espontaneo/  # Endpoint seguro para pedidos admin
    │   │   └── auth/                          # Endpoints auxiliares de autenticación
    │   ├── dashboard/                         # Panel administrativo protegido
    │   ├── mi-cuenta/                         # Portal del cliente
    │   ├── login/                             # Inicio de sesión
    │   ├── registro/                          # Registro de nuevos clientes
    │   ├── globals.css                        # Configuración Tailwind CSS v4 & dark mode
    │   ├── layout.tsx
    │   └── page.tsx                           # Landing page
    ├── components/
    │   ├── AdminMetrics.tsx                   # Panel de métricas y gráficos
    │   ├── LasPoCalendar.tsx                  # Calendario mensual nativo SSR-safe
    │   ├── NuevoPedidoAdminModal.tsx          # Modal de creación de pedidos rápidos
    │   └── ThemeToggle.tsx                    # Toggle de modo oscuro/claro
    ├── lib/
    │   └── supabase/                          # Clientes Supabase browser y server
    └── middleware.ts                          # Protección de rutas por sesión y rol
```

---

## 🚀 Puesta en Marcha en Desarrollo

### 1. Clonar el repositorio
```bash
git clone https://github.com/slaratro/laspo.git
cd laspo
```

### 2. Configurar variables de entorno
Copia la plantilla de variables:
```bash
cp .env.example .env.local
```

Edita `.env.local` con las credenciales de tu proyecto de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-instancia-supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará accesible en [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Configuración de Base de Datos (Supabase)

1. Ingresa a la consola de Supabase (Cloud o Self-Hosted).
2. Dirígete a **SQL Editor**.
3. Ejecuta íntegramente el archivo [`supabase_schema.sql`](./supabase_schema.sql).
4. El script creará:
   - Tabla `public.perfiles` con soporte para roles (`cliente`, `admin`, `subadmin`).
   - Tabla `public.pedidos` con validaciones de frecuencia y fechas personalizadas.
   - Políticas RLS para lectura, inserción y modificación segura.
   - Triggers automáticos para vincular `auth.users` con `public.perfiles`.

> **Nota para instancias Self-Hosted**: Si el servidor SMTP no está configurado, asegúrate de activar `ENABLE_EMAIL_AUTOCONFIRM=true` en `/opt/supabase/.env` para permitir el registro inmediato de clientes.

---

## 🐳 Despliegue y Docker

El proyecto incluye un [`Dockerfile`](./Dockerfile) optimizado en tres etapas (*deps*, *builder*, *runner*) con salida `standalone` para reducir el tamaño final de la imagen.

### Construir la imagen localmente:
```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://tu-supabase.com" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key" \
  -t laspo-app:latest .
```

### Ejecutar el contenedor:
```bash
docker run -d -p 3000:3000 --name laspo-app laspo-app:latest
```

---

## ⚡ Integración con n8n

1. En tu instancia de n8n, importa el archivo [`n8n_workflow_nuevo_pedido.json`](./n8n_workflow_nuevo_pedido.json).
2. El flujo expone un webhook de entrada `POST /webhook/nuevo-pedido`.
3. En Supabase, configura un **Database Webhook** apuntando a dicha URL activado ante eventos `INSERT` en la tabla `public.pedidos`.

---

## 📝 Licencia

Este proyecto es de uso privado para la gestión de la granja avícola **Laspo**. Todos los derechos reservados.
