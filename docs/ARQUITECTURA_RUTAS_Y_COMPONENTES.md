# Arquitectura de Rutas, Páginas, Componentes y Validaciones
## Sistema de Gestión de Residencia Universitaria — ULEAM

Este documento detalla la estructura técnica de todas las páginas accesibles de la aplicación web, indicando para cada una sus archivos fuentes, componentes Astro/React integrados, hojas de estilo CSS (incluyendo diseño responsivo), scripts de cliente, módulos de validación, endpoints API y fuentes de datos JSON.

---

## Índice de Páginas y Módulos

1. [`/` — Inicio y Autenticación Institucional](#1--inicio-y-autenticación-institucional)
2. [`/portal-init` — Portal Inicial del Estudiante](#2-portal-init--portal-inicial-del-estudiante)
3. [`/postulation` — Formulario de Solicitud de Residencia](#3-postulation--formulario-de-solicitud-de-residencia)
4. [`/postulado` — Comprobante Oficial de Postulación Registrada](#4-postulado--comprobante-oficial-de-postulación-registrada)
5. [`/dashboard` — Consola de Administración y Gestión Habitacional](#5-dashboard--consola-de-administración-y-gestión-habitacional)
6. [`/residente-dashboard` — Dashboard del Residente Aceptado](#6-residente-dashboard--dashboard-del-residente-aceptado)
7. [`/mis-solicitudes` — Historial de Incidencias y Mantenimiento](#7-mis-solicitudes--historial-de-incidencias-y-mantenimiento)
8. [`/prueba1` — Página de Pruebas Técnicas Astro](#8-prueba1--página-de-pruebas-técnicas-astro)
9. [Catálogo Centralizado de Endpoints API (SSR)](#9-catálogo-centralizado-de-endpoints-api-ssr)
10. [Esquema de Bases de Datos JSON](#10-esquema-de-bases-de-datos-json)

---

## 1. `/` — Inicio y Autenticación Institucional

* **Ruta de acceso:** `http://localhost:4321/`
* **Archivo principal:** [`src/pages/index.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/index.astro)
* **Propósito:** Portal de bienvenida de la residencia universitaria con llamada a la acción y disparador del modal de inicio de sesión con Microsoft 365.

### Componentes Utilizados
* [`MicrosoftLoginModal.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/auth/MicrosoftLoginModal.astro): Modal de autenticación institucional con campos de correo y contraseña, botones de prueba rápida (*Estudiante* y *Administrador*), y conmutador visual de clave.
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) (`client:load`): Modal interactivo React de soporte y canales de contacto.
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro): Pie de página institucional oficial ULEAM.

### Hojas de Estilo (CSS)
* `src/styles/index.css`: Estilos base del layout dividido (*split layout*), panel hero izquierdo y panel de login derecho.
* `src/styles/css-responsive/index.responsive.css`: Adaptaciones para tabletas y dispositivos móviles.
* Bloque `<style>` interno en `MicrosoftLoginModal.astro`: Estilos de overlay, modal card y animaciones de carga.

### Scripts de Cliente y Validaciones
* [`src/scripts/login.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/login.js):
  * **Validación de correo:** Comprueba campo no vacío y presencia de `@` con terminación institucional.
  * **Validación de contraseña:** Verifica campo no vacío.
  * **Autocompletado de prueba:** Relleno automático para perfiles Estudiante (`e0953920949@live.uleam.edu.ec`) y Administrador (`admin.residencia@uleam.edu.ec`).
  * **Petición asíncrona:** Realiza `fetch` hacia `/api/auth/login`, almacena la sesión en `localStorage` (`uleam_session`) y ejecuta la redirección inteligente (`/portal-init` o `/dashboard`).

### Endpoints y Datos
* **Consumo API:** `POST /api/auth/login`
* **Fuentes de datos:** [`src/data/usuarios.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/usuarios.json), [`src/data/administradores.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/administradores.json).

---

## 2. `/portal-init` — Portal Inicial del Estudiante

* **Ruta de acceso:** `http://localhost:4321/portal-init`
* **Archivo principal:** [`src/pages/portal-init.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/portal-init.astro)
* **Propósito:** Centro de información del alumno autenticado. Gestiona de manera reactiva y bajo demanda 3 estados del estudiante:
  1. **Sin postulación:** Muestra banner rojo para iniciar el trámite de residencia y la lista de documentos a preparar.
  2. **Postulado (En revisión):** Muestra banner azul marino con código de expediente, resumen de su solicitud y enlace a su comprobante oficial.
  3. **Aceptado (Plaza adjudicada):** Muestra banner verde esmeralda con enlace directo al Dashboard de Residente.

### Componentes Utilizados
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) (`client:load`): Soporte y preguntas frecuentes.
* [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx) (`client:load`): Modal de confirmación de salida y cierre de sesión.
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro): Pie de página institucional.

### Hojas de Estilo (CSS)
* `src/styles/portal-init.css`: Estilos de cabecera topbar, grid de 3 pasos, tarjeta dividida y lista de requerimientos.
* `src/styles/css-responsive/portal-init.responsive.css`: Reorganización en columna única para pantallas móviles.

### Lógica y Controladores
* **Frontmatter SSR en `portal-init.astro`:**
  * Lee y deserializa la cookie `uleam_session`.
  * Sincroniza dinámicamente con [`src/data/usuarios.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/usuarios.json).
  * Lee en tiempo real [`src/data/postulaciones.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/postulaciones.json) mediante `fs.readFile` para evaluar `esPostulado`.
  * Calcula iniciales de avatar y saludo de género (*Bienvenido* / *Bienvenida*).

### Endpoints y Datos
* **Cookie institucional:** `uleam_session`
* **Fuentes de datos:** `usuarios.json`, `postulaciones.json`.

---

## 3. `/postulation` — Formulario de Solicitud de Residencia

* **Ruta de acceso:** `http://localhost:4321/postulation`
* **Archivo principal:** [`src/pages/postulation.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/postulation.astro)
* **Propósito:** Expediente digital de postulación estructurado en 8 secciones temáticas con validaciones en cliente y servidor, guardado de borrador local, visor JSON y condiciones de convivencia.

### Componentes de Secciones del Formulario
* [`DatosPersonalesSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/DatosPersonalesSection.astro): Campos precargados de nombre, carrera, correo institucional y cédula.
* [`IdentidadMatriculaSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/IdentidadMatriculaSection.astro): Carga de cédula de identidad y certificado de matrícula vigente.
* [`ComposicionHogarSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/ComposicionHogarSection.astro): Integrantes y dependientes del hogar con soporte documental.
* [`ReferenciasSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/ReferenciasSection.astro): Referencia de emergencia/familiar y referencia personal/académica con teléfonos y parentesco.
* [`SituacionEconomicaSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/SituacionEconomicaSection.astro): Ingreso mensual, egresos, planilla de servicios básicos y comprobante de ingresos.
* [`AccesibilidadSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/AccesibilidadSection.astro): Requerimientos de movilidad reducida y grupo de atención prioritaria.
* [`HabitacionPreferenciaSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/HabitacionPreferenciaSection.astro): Preferencia de habitación y disparador del modal de convivencia con visualizador de chips.
* [`ModalCondicionesConvivencia.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/ModalCondicionesConvivencia.astro): Modal con tarjetas con imágenes de fondo desvanecidas (mascotas de asistencia, climatización A/C, estudio con audífonos, libre de humo y requerimientos médicos).
* [`ConsentimientoSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/ConsentimientoSection.astro): Checkboxes de autenticidad jurada, tratamiento de datos LOPDP y aceptación de reglamento.
* [`EtapasPostulacionSection.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/EtapasPostulacionSection.astro): Resumen visual del proceso de validación y botón principal de envío.
* [`JsonPreviewModal.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/JsonPreviewModal.astro): Modal para inspeccionar la estructura JSON cruda que se enviará al backend.

### Componentes de Retroalimentación y Modales
* [`AnimacionPostulacion.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/AnimacionPostulacion.jsx) (`client:load`): Modal interactivo con spinner concéntrico (600ms), visto verde animado vectorial con sonido armónico (1000ms) y botón de acceso inmediato.
* [`PostulationErrorModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/postulacion/PostulationErrorModal.jsx) (`client:load`): Modal emergente con lista detallada de errores en caso de validación fallida.
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) y [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx).
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro).

### Hojas de Estilo (CSS)
* `src/styles/postulation.css`: Estilos generales del formulario, barra de progreso, tarjetas pill, estados de carga y visor modal.
* `src/styles/css-responsive/postulation.responsive.css`: Adaptaciones responsive para cuadrículas y formularios móviles.

### Scripts y Módulos de Validación
* [`src/scripts/postulacion/postulacion.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/postulacion/postulacion.js):
  * Monitoreo dinámico del peso y formato de archivos.
  * Cálculo ponderado de la barra de progreso (0% a 100%).
  * Guardado y restauración de borradores en `localStorage` (`postulacion_borrador_uleam`).
  * Gestión interactiva del modal de convivencia y serialización en campo oculto `#input-condiciones-convivencia`.
  * Intercepción del evento `submit` y comunicación con modales React mediante `CustomEvent`.
* [`src/scripts/postulacion/administradorErrores.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/postulacion/administradorErrores.js):
  * Orquestador que coordina secuencialmente la verificación de duplicados, validación de campos y validación de archivos.
* [`src/scripts/postulacion/validadorCampos.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/postulacion/validadorCampos.js):
  * **Cédula ecuatoriana:** Expresión regular `/^[0-9]{10}$/`.
  * **Correo institucional:** Terminación estricta `@live.uleam.edu.ec` o `@uleam.edu.ec`.
  * **Integrantes del hogar:** Entero $\ge 1$.
  * **Ingreso familiar mensual:** Valor numérico $> \$0$.
  * **Consentimientos:** Los 3 checkboxes legales obligatorios.
  * **Convivencia:** Obligatoriedad de haber configurado el bloque de condiciones.
* [`src/scripts/postulacion/validadorArchivos.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/postulacion/validadorArchivos.js):
  * Lista blanca de extensiones: `['pdf', 'jpg', 'jpeg', 'png']`.
  * Límite de tamaño: Máximo 10 MB por archivo ($10 \times 1024 \times 1024$ bytes).
* [`src/scripts/postulacion/validadorDuplicados.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/postulacion/validadorDuplicados.js):
  * Búsqueda comparativa por cédula y correo contra la lista de postulaciones activas.

### Endpoints y Datos
* **Consumo API:** `POST /api/postulaciones/create`
* **Redirección de seguridad:** Si ya existe postulación previa, redirige con HTTP 302 a `/postulado?id=${id}`.
* **Fuentes de datos:** `postulaciones.json`, `usuarios.json`.

---

## 4. `/postulado` — Comprobante Oficial de Postulación Registrada

* **Ruta de acceso:** `http://localhost:4321/postulado` o `http://localhost:4321/postulado?id=POST-2026-001`
* **Archivo principal:** [`src/pages/postulado.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/postulado.astro)
* **Propósito:** Comprobante formal emitido al estudiante tras culminar satisfactoriamente el envío del formulario.

### Componentes Utilizados
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) (`client:load`).
* [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx) (`client:load`).
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro).

### Hojas de Estilo (CSS)
* `src/styles/postulation.css`: Tipografías, contenedores, badges de estado y botones.
* `src/styles/css-responsive/postulado.responsive.css`: Adaptación para formato de impresión y pantallas pequeñas.

### Lógica y Controladores
* **Frontmatter SSR en `postulado.astro`:**
  * Lee el parámetro `?id=` de la URL o identifica al alumno por cédula/correo.
  * Extrae los metadatos de la postulación: fecha de ingreso, estado (*En Revisión*), resumen de ingresos y miembros del hogar, y catálogo de archivos digitales bajo custodia.
  * Regla de redirección: Si el estudiante ya tiene calidad de aceptado (`aceptado === 1`), se le redirige inmediatamente a `/residente-dashboard`.
  * Acción de cliente: Botón para imprimir el documento mediante `window.print()`.

### Fuentes de Datos
* `usuarios.json`, `postulaciones.json`.

---

## 5. `/dashboard` — Consola de Administración y Gestión Habitacional

* **Ruta de acceso:** `http://localhost:4321/dashboard`
* **Archivo principal:** [`src/pages/dashboard.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/dashboard.astro)
* **Propósito:** Consola central de Bienestar Estudiantil para coordinadores y administradores. Permite evaluar postulaciones, dictaminar expedientes, gestionar el inventario de dormitorios, asignar postulantes a habitaciones con verificación de compatibilidad en vivo, y monitorear reportes.

### Componentes Modulares de la Consola
* [`DashboardSidebar.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/DashboardSidebar.astro): Menú de navegación lateral con conmutador de vistas (Postulaciones, Habitaciones, Residentes, Reportes) y perfil del administrador.
* [`VistaPostulaciones.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/VistaPostulaciones.astro): Tarjetas de métricas (KPIs), buscador en vivo, filtros por estado (*Todos*, *Pendiente*, *Aprobado*, *Rechazado*) y tabla de expedientes.
* [`VistaHabitaciones.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/VistaHabitaciones.astro): Catálogo de habitaciones organizadas en tarjetas con indicador de capacidad, género, amenidades y botón *"Gestionar y Asignar Postulante"*.
* [`VistaResidentes.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/VistaResidentes.astro): Padrón oficial de residentes admitidos con número de habitación asignada y estado de beca.
* [`VistaReportes.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/VistaReportes.astro): Estadísticas consolidadas de ocupación por edificio y balance de plazas disponibles.

### Modales Administrativos
* [`ExpedienteModal.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/ExpedienteModal.astro): Modal para inspeccionar a fondo la solicitud del estudiante, ver sus documentos adjuntos, condiciones de convivencia y emitir dictamen institucional (*Aprobar* / *Rechazar*).
* [`RoomManageModal.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/RoomManageModal.astro): Modal de administración habitacional. Muestra los ocupantes actuales con opción de liberar cupo, selector de candidatos postulantes y asistente en vivo de compatibilidad (género, mascotas, aire acondicionado y cupos disponibles).
* [`DocViewerModal.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/admin/DocViewerModal.astro): Visor digital para previsualizar PDFs e imágenes adjuntas.
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx), [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx), [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro).

### Hojas de Estilo (CSS)
* `src/styles/dashboard.css`: Estilos de la consola de administración, tablas de datos, badges de estado, modales de gestión y sidebar.
* `src/styles/css-responsive/dashboard.responsive.css`: Adaptaciones para pantallas de laptops y monitores compactos.

### Scripts y Lógica
* [`src/scripts/dashboard.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/dashboard.js):
  * Conmutación entre pestañas (`#vista-postulaciones`, `#vista-habitaciones`, `#vista-residentes`, `#vista-reportes`).
  * Filtrado y búsqueda en tiempo real de postulantes y dormitorios.
  * Inspección de expediente con carga dinámica en `#expediente-modal`.
  * Emisión de dictamen conectando con `/api/postulaciones/status`.
  * Asistente de compatibilidad en vivo y asignación de cupos conectando con `/api/habitaciones/assign`.

### Endpoints y Datos
* **Consumo API:**
  * `POST /api/postulaciones/status` (cambio de estado a *Aprobado* o *Rechazado*).
  * `POST /api/habitaciones/assign` (asignación o liberación atómica de cupos).
* **Fuentes de datos:** `administradores.json`, `postulaciones.json`, `habitaciones.json`, `usuarios.json`.

---

## 6. `/residente-dashboard` — Dashboard del Residente Aceptado

* **Ruta de acceso:** `http://localhost:4321/residente-dashboard`
* **Archivo principal:** [`src/pages/residente-dashboard.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/residente-dashboard.astro)
* **Propósito:** Portal de servicios para el estudiante que ya tiene habitación asignada (`aceptado === 1`). Muestra su dormitorio asignado, amenidades, compañeros de cuarto con contacto institucional, estado de beca, y canal de tickets de incidencias 24/7.

### Componentes Utilizados
* [`ReportarIncidenciaModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/residente/ReportarIncidenciaModal.jsx) (`client:load`): Modal interactivo React para crear tickets de mantenimiento o averías con selector de categoría, urgencia, descripción y fotos adjuntas.
* [`SolicitudesPreviasModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/residente/SolicitudesPreviasModal.jsx) (`client:load`): Modal interactivo React para consultar los reportes recientes y su evolución.
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) (`client:load`).
* [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx) (`client:load`).
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro).

### Hojas de Estilo (CSS)
* `src/styles/residente-dashboard.css`: Estilos de las tarjetas habitacionales, métricas de beca, lista de compañeros y panel de convivencia.
* `src/styles/css-responsive/residente-dashboard.responsive.css`: Adaptaciones responsive para dispositivos móviles.

### Scripts y Validaciones
* [`src/scripts/residente/validadorIncidencias.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/scripts/residente/validadorIncidencias.js):
  * **Categorías válidas:** Plomería y Agua, Electricidad e Iluminación, Mobiliario, Wi-Fi, Cerrajería, Climatización, Convivencia, Limpieza, Otro.
  * **Urgencias válidas:** Baja, Media, Alta, Urgente.
  * **Asunto:** Entre 5 y 80 caracteres.
  * **Descripción:** Mínimo 15 caracteres explicativos.
  * **Evidencias fotográficas:** Extensiones `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` hasta 10 MB.

### Endpoints y Datos
* **Consumo API:** `POST /api/incidencias/create`
* **Redirección de seguridad:** Si un estudiante autenticado tiene `aceptado === 0`, el servidor lo redirige a `/postulado`.
* **Fuentes de datos:** `usuarios.json`, `habitaciones.json`, `incidencias.json`.

---

## 7. `/mis-solicitudes` — Historial de Incidencias y Mantenimiento

* **Ruta de acceso:** `http://localhost:4321/mis-solicitudes`
* **Archivo principal:** [`src/pages/mis-solicitudes.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/mis-solicitudes.astro)
* **Propósito:** Historial completo y pormenorizado de todas las solicitudes de asistencia técnica, reparaciones y mantenimiento levantadas por el residente, con métricas de resolución y estado en vivo.

### Componentes Utilizados
* [`ReportarIncidenciaModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/residente/ReportarIncidenciaModal.jsx) (`client:load`).
* [`HelpModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/HelpModal.jsx) (`client:load`).
* [`ExitConfirmModal.jsx`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/ExitConfirmModal.jsx) (`client:load`).
* [`Footer.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/components/shared/Footer.astro).

### Hojas de Estilo (CSS)
* `src/styles/residente-dashboard.css`.
* `src/styles/css-responsive/postulado.responsive.css`.

### Scripts y Endpoints
* **Validaciones:** `src/scripts/residente/validadorIncidencias.js`.
* **Consumo API:** `POST /api/incidencias/create`.
* **Fuentes de datos:** `usuarios.json`, `habitaciones.json`, `incidencias.json`.

---

## 8. `/prueba1` — Página de Pruebas Técnicas Astro

* **Ruta de acceso:** `http://localhost:4321/prueba1`
* **Archivo principal:** [`src/pages/prueba1.astro`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/prueba1.astro)
* **Propósito:** Vista estática de pruebas para verificación de sintaxis y renderizado base del motor Astro.

---

## 9. Catálogo Centralizado de Endpoints API (SSR)

Todos los endpoints residen en `src/pages/api/`, operan dinámicamente con `export const prerender = false;` bajo Node.js SSR y responden en formato JSON:

| Endpoint | Método | Archivo Controlador | Propósito | Fuentes Afectadas |
| :--- | :---: | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | [`login.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/auth/login.js) | Autentica estudiantes y administradores, y genera la cookie `uleam_session`. | `usuarios.json`, `administradores.json` |
| `/api/auth/logout` | `POST` | [`logout.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/auth/logout.js) | Elimina la cookie de sesión institucional y redirige a `/`. | Cookies HTTP |
| `/api/postulaciones/create` | `POST` | [`create.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/postulaciones/create.js) | Registra el expediente de postulación, condiciones de convivencia, y actualiza el usuario a *Postulado*. | `postulaciones.json`, `usuarios.json` |
| `/api/postulaciones/status` | `POST` | [`status.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/postulaciones/status.js) | Cambia el estado de una postulación (*Aprobado*, *Rechazado*, *En Revisión*). | `postulaciones.json` |
| `/api/habitaciones/assign` | `POST` | [`assign.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/habitaciones/assign.js) | Realiza asignación o liberación atómica de cupos habitacionales y sincroniza los tres modelos. | `usuarios.json`, `habitaciones.json`, `postulaciones.json` |
| `/api/incidencias/create` | `POST` | [`create.js`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/pages/api/incidencias/create.js) | Registra un nuevo ticket de avería o reporte de mantenimiento con correlativo institucional. | `incidencias.json` |

---

## 10. Esquema de Bases de Datos JSON

Todos los archivos de datos residen en la carpeta `src/data/`:

* [`usuarios.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/usuarios.json): Padrón de estudiantes. Campos clave: `id`, `email`, `password`, `cedula`, `nombreCompleto`, `carrera`, `aceptado` (0 = postulante, 1 = residente adjudicado), `habitacionId`, `documentosRenovacion`.
* [`postulaciones.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/postulaciones.json): Expedientes de postulación recibidos. Campos clave: `id`, `estudiante`, `fechaPostulacion`, `estado`, `situacionSocioeconomica`, `condicionesConvivencia`, `documentos`.
* [`habitaciones.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/habitaciones.json): Inventario físico de dormitorios. Campos clave: `id`, `numero`, `edificio`, `piso`, `tipo`, `capacidad`, `ocupantesActuales`, `estado`, `genero`, `accesibilidad`, `amenidades`.
* [`incidencias.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/incidencias.json): Historial de reportes de mantenimiento y averías. Campos clave: `id`, `estudianteCedula`, `habitacionId`, `categoria`, `urgencia`, `asunto`, `descripcion`, `estado`, `archivos`.
* [`administradores.json`](file:///C:/Users/FishieDev/Desktop/residencia-universitaria-uleam/src/data/administradores.json): Cuentas de personal de Bienestar Estudiantil con rol y departamento.
