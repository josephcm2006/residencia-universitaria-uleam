// ========================================================================================
// PÁGINA ASOCIADA: src/pages/dashboard.astro (Ruta: /dashboard)
// TIPO: Script cliente de interactividad del Panel Administrativo
// UBICACIÓN: src/scripts/dashboard.js
// ========================================================================================
//
// 1. FUNCIONAMIENTO GENERAL DEL SCRIPT:
// ----------------------------------------------------------------------------------------
// Este script cliente controla la interactividad completa de la Consola de Administración:
// - Alternar entre las 4 pestañas del Sidebar (Postulaciones, Habitaciones, Residentes, Reportes).
// - Filtrado reactivo de postulaciones por estado (Todas, Pendientes, Aprobadas, Rechazadas).
// - Búsqueda en tiempo real por texto (nombre, cédula o carrera universitaria).
// - Apertura y renderizado dinámico del Drawer Modal de inspección de expediente completo.
// - Dictamen administrativo (Aprobar o Rechazar solicitud) con actualización asíncrona hacia
//   el endpoint '/api/postulaciones/status'.
// - Visor modal de documentos de soporte digital (PDF o imágenes).
// - Exportación del padrón de postulaciones en formato descargable .json.
//
// 2. VARIABLES Y NODOS DEL DOM:
// ----------------------------------------------------------------------------------------
// * navButtons {NodeList}: Botones del sidebar con atributo 'data-target-view'.
// * views {NodeList}: Contenedores principales de cada vista (.admin-content-view).
// * breadcrumbTitle {HTMLElement}: Texto de miga de pan en la barra superior.
// * filterBtns {NodeList}: Botones de filtro por estado (.filter-btn).
// * inputSearch {HTMLInputElement}: Campo de búsqueda de texto de postulaciones.
// * modal {HTMLElement}: Contenedor del Drawer modal (#inspector-modal).
// * viewerModal {HTMLElement}: Modal del visor de documentos (#doc-viewer-modal).
// * postulacionActiva {Object|null}: Objeto de la postulación actualmente abierta en inspección.
// ========================================================================================

document.addEventListener('DOMContentLoaded', () => {
  // // Almacenamos la lista de postulaciones leyendo la tabla renderizada o variable global
  const tablaPostulaciones = document.getElementById('tabla-postulaciones');
  let postulacionActiva = null;

  // Catálogo de habitaciones sincronizadas para el Asistente de Compatibilidad
  let catalogoHabitaciones = [];
  try {
    const habDataEl = document.getElementById('admin-habitaciones-data');
    if (habDataEl) {
      catalogoHabitaciones = JSON.parse(habDataEl.getAttribute('data-habitaciones') || '[]');
    }
  } catch (e) {
    console.error('Error cargando catálogo de habitaciones:', e);
  }

  // Catálogo de postulantes disponibles para asignación directa
  let catalogoPostulantes = [];
  try {
    const postDataEl = document.getElementById('admin-postulantes-data');
    if (postDataEl) {
      catalogoPostulantes = JSON.parse(postDataEl.getAttribute('data-postulantes') || '[]');
    }
  } catch (e) {
    console.error('Error cargando postulantes disponibles:', e);
  }

  // ----------------------------------------------------------------------------------------
  // PASO 1: NAVEGACIÓN Y CAMBIO DE PESTAÑAS EN EL SIDEBAR
  // ----------------------------------------------------------------------------------------
  const navButtons = document.querySelectorAll('.nav-item-btn[data-target-view]');
  const views = document.querySelectorAll('.admin-content-view');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // // Quita la clase 'active' de todos los botones y se la asigna al botón pulsado
      navButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // // Oculta todas las vistas principales
      const targetId = btn.getAttribute('data-target-view');
      views.forEach((v) => (v.style.display = 'none'));

      // // Muestra únicamente la vista seleccionada
      const targetView = document.getElementById(targetId);
      if (targetView) targetView.style.display = 'block';

      // // Actualiza el título del breadcrumb en la cabecera superior
      if (breadcrumbTitle) {
        if (targetId === 'view-postulaciones') breadcrumbTitle.textContent = 'Gestión de Postulaciones 2026-2';
        if (targetId === 'view-habitaciones') breadcrumbTitle.textContent = 'Inventario de Habitaciones y Cupos';
        if (targetId === 'view-estudiantes') breadcrumbTitle.textContent = 'Residentes Asignados';
        if (targetId === 'view-reportes') breadcrumbTitle.textContent = 'Reportes de Ocupación';
      }
    });
  });

  // ----------------------------------------------------------------------------------------
  // PASO 2: FILTRADO POR ESTADO DE SOLICITUD
  // ----------------------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const rows = document.querySelectorAll('#tbody-postulaciones tr');

      rows.forEach((row) => {
        if (row.id === 'row-empty-state') return;
        const status = row.getAttribute('data-status');
        if (filter === 'todos' || status === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // ----------------------------------------------------------------------------------------
  // PASO 3: BÚSQUEDA REACTIVA EN VIVO POR NOMBRE, CÉDULA O CARRERA
  // ----------------------------------------------------------------------------------------
  const inputSearch = document.getElementById('input-search-postulacion');
  if (inputSearch) {
    inputSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#tbody-postulaciones tr');

      rows.forEach((row) => {
        if (row.id === 'row-empty-state') return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 4: INSPECCIÓN DEL EXPEDIENTE DIGITAL COMPLETO
  // ----------------------------------------------------------------------------------------
  const modal = document.getElementById('inspector-modal');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');

  // Función para abrir el expediente extrayendo los datos de la fila o memoria
  function abrirExpediente(postId) {
    const row = document.querySelector(`tr[data-post-id="${postId}"]`);
    if (!row) return;

    postulacionActiva = { id: postId };

    const nombre = row.querySelector('.student-meta strong')?.textContent || 'Estudiante';
    const correo = row.querySelector('.student-meta span')?.textContent || '';
    const cedula = row.children[1]?.textContent?.trim() || '';
    const carrera = row.children[2]?.textContent?.trim() || '';
    const status = row.getAttribute('data-status') || 'Pendiente';

    // Extraer datos estructurados de la postulación
    let postData = {};
    try {
      postData = JSON.parse(row.getAttribute('data-postulacion') || '{}');
    } catch (e) {
      postData = {};
    }

    // Inyectar datos en los campos del modal drawer
    const elName = document.getElementById('modal-student-name');
    const elCedula = document.getElementById('modal-student-cedula');
    const elEmail = document.getElementById('modal-student-email');
    const elCarrera = document.getElementById('modal-student-carrera');
    const elFacultad = document.getElementById('modal-student-facultad');
    const elStatus = document.getElementById('modal-current-status');

    if (elName) elName.textContent = nombre;
    if (elCedula) elCedula.textContent = cedula;
    if (elEmail) elEmail.textContent = correo;
    if (elCarrera) elCarrera.textContent = carrera;
    if (elFacultad) elFacultad.textContent = postData.estudiante?.facultad || 'Facultad ULEAM · Foráneo';
    if (elStatus) {
      elStatus.textContent = status;
      if (status === 'Aprobada') elStatus.style.color = '#059669';
      else if (status === 'Rechazada') elStatus.style.color = '#DC2626';
      else elStatus.style.color = '#D97706';
    }

    // Datos socioeconómicos por defecto legibles
    const elIngresos = document.getElementById('modal-student-ingresos');
    const elEgresos = document.getElementById('modal-student-egresos');
    const elHogar = document.getElementById('modal-student-hogar');
    const elQuintil = document.getElementById('modal-student-quintil');
    const elAcc = document.getElementById('modal-student-accesibilidad');
    const elRef = document.getElementById('modal-student-referencias');

    if (elIngresos) elIngresos.textContent = postData.situacionSocioeconomica?.ingresoMensual || '$ 450.00';
    if (elEgresos) elEgresos.textContent = postData.situacionSocioeconomica?.egresosMensuales || '$ 380.00';
    if (elHogar) elHogar.textContent = postData.situacionSocioeconomica?.integrantes || '4 integrantes, 2 dependientes';
    if (elQuintil) elQuintil.textContent = (postData.situacionSocioeconomica?.quintil || 'Quintil 1') + ' (Prioridad Alta)';
    if (elAcc) elAcc.textContent = postData.accesibilidad?.detalle || 'Estudiante no declaró requerimientos especiales de movilidad.';
    if (elRef) elRef.textContent = 'Referencia registrada en el expediente estudiantil.';

    // Inyectar Perfil de Convivencia y Condiciones Declaradas (Sin emojis)
    const chipsContainer = document.getElementById('modal-convivencia-chips');
    if (chipsContainer) {
      const conv = postData.condicionesConvivencia;
      if (!conv || !conv.configurado) {
        chipsContainer.innerHTML = '<span style="font-size: 12px; color: #94A3B8; font-style: italic;">El estudiante no declaró condiciones de convivencia adicionales (Estándar ULEAM).</span>';
      } else {
        const chips = [];
        const makeChip = (text) => `<span style="background: #F3F4F6; border: 1px solid #D1D5DB; color: #111827; padding: 4px 9px; border-radius: 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">${text}</span>`;

        // 1. Mascotas
        if (conv.mascotas === 'sin_mascotas') {
          chips.push(makeChip('Habitación libre de mascotas'));
        } else if (conv.mascotas === 'posee_asistencia') {
          chips.push(makeChip('Usuario con animal de asistencia'));
        } else if (conv.mascotas === 'tolera_asistencia') {
          chips.push(makeChip('Tolerante con animales de asistencia'));
        }

        // 2. Climatización
        if (conv.climatizacion === 'frio') {
          chips.push(makeChip('A/C Frío continuo (18°C-20°C)'));
        } else if (conv.climatizacion === 'ventilador') {
          chips.push(makeChip('Solo ventilador / Sensible'));
        } else if (conv.climatizacion === 'templado') {
          chips.push(makeChip('A/C Templado (22°C-24°C)'));
        }

        // 3. Audio / Estudio
        if (conv.audio === 'audifonos') {
          chips.push(makeChip('Audífonos obligatorios'));
        } else if (conv.audio === 'moderado') {
          chips.push(makeChip('Volumen moderado flexible'));
        }

        // 4. Humo / Tabaco
        if (conv.humo === 'no_tolera') {
          chips.push(makeChip('100% Libre de humo y vapor'));
        } else if (conv.humo === 'vapeador') {
          chips.push(makeChip('Vapeador ocasional'));
        } else if (conv.humo === 'tolera_fuera') {
          chips.push(makeChip('Tolerante en exteriores'));
        }

        // 5. Salud y Medicación
        if (conv.salud && conv.salud.refrigeracionMedica) {
          chips.push(makeChip('Refrigeración médica'));
        }
        if (conv.salud && conv.salud.alergiaAlimentos) {
          chips.push(makeChip('Alergia alimentaria severa'));
        }
        if (conv.salud && conv.salud.sensibilidadOlores) {
          chips.push(makeChip('Sensible a olores/químicos'));
        }

        chipsContainer.innerHTML = chips.join('');
      }
    }

    // Poblado del Selector de Habitaciones con Evaluación de Choques
    const selectHab = document.getElementById('modal-select-habitacion');
    if (selectHab) {
      selectHab.innerHTML = '';
      catalogoHabitaciones.forEach((hab) => {
        const opt = document.createElement('option');
        opt.value = hab.id;
        const vacantes = hab.capacidad - (hab.ocupantesActuales || 0);
        opt.textContent = `Habitación ${hab.numero} (${hab.tipo}) · Género: ${hab.genero} · ${vacantes} vacante(s) libre(s)`;
        if (hab.id === postData.habitacionSugerida) {
          opt.selected = true;
        }
        selectHab.appendChild(opt);
      });

      // Función de Evaluación de Compatibilidad en Vivo
      function evaluarCompatibilidadHabitacion(habId) {
        const box = document.getElementById('box-evaluacion-compatibilidad');
        if (!box) return;
        const hab = catalogoHabitaciones.find((h) => h.id === habId);
        if (!hab) {
          box.innerHTML = '<span style="color: #64748B;">Selecciona una habitación para evaluar.</span>';
          return;
        }

        const nombreNorm = (nombre || '').toLowerCase();
        const esFemenino = nombreNorm.includes('maría') || nombreNorm.includes('maria') || nombreNorm.includes('elena') || nombreNorm.includes('ana') || nombreNorm.includes('laura') || nombreNorm.includes('sofia') || nombreNorm.includes('carla') || nombreNorm.includes('paula');
        const generoEstudiante = esFemenino ? 'Femenino' : 'Masculino';

        const alertas = [];
        const coincidencias = [];
        let score = 95;

        // 1. FILTRO DURO: GÉNERO
        if (hab.genero && hab.genero !== generoEstudiante) {
          alertas.push(`<strong>Alerta Crítica de Género:</strong> Habitación ${hab.numero} designada para género <strong>${hab.genero}</strong> y postulante es de género <strong>${generoEstudiante}</strong>. <em>(Separación obligatoria por normativa de residencias ULEAM)</em>.`);
          score = 0;
        }

        // 2. DISPONIBILIDAD DE CAMAS
        const vacantes = hab.capacidad - (hab.ocupantesActuales || 0);
        if (vacantes <= 0) {
          alertas.push(`<strong>Capacidad Completa:</strong> El dormitorio no cuenta con camas desocupadas (${hab.ocupantesActuales}/${hab.capacidad} ocupadas).`);
          score = Math.min(score, 35);
        } else {
          coincidencias.push(`✓ Disponibilidad física: ${vacantes} cama(s) disponible(s).`);
        }

        // 3. ACCESIBILIDAD FÍSICA
        if (postData.accesibilidad?.requiere && !hab.accesibilidad) {
          alertas.push(`<strong>Accesibilidad reducida:</strong> El estudiante declaró necesidad de movilidad y este dormitorio no está adaptado con rampas.`);
          score = Math.min(score, 50);
        } else if (postData.accesibilidad?.requiere && hab.accesibilidad) {
          coincidencias.push(`✓ Dormitorio en planta baja totalmente adaptado para accesibilidad.`);
        }

        // 4. CONVIVENCIA CON MASCOTAS
        const conv = postData.condicionesConvivencia;
        if (conv && conv.mascotas === 'sin_mascotas') {
          coincidencias.push(`✓ Habitación libre de mascotas / ambiente seguro ante alergias y asma.`);
        } else if (conv && conv.mascotas === 'posee_asistencia') {
          coincidencias.push(`✓ Requiere habitación compatible con animal de asistencia certificado.`);
        }

        // 5. CLIMATIZACIÓN
        if (conv) {
          if (conv.climatizacion === 'frio' && !hab.amenidades?.some((a) => a.toLowerCase().includes('aire'))) {
            alertas.push(`<strong>Climatización:</strong> El estudiante prefiere A/C frío y la habitación no tiene unidad de aire acondicionado.`);
            score = Math.max(30, score - 20);
          } else if (conv.climatizacion) {
            coincidencias.push(`✓ Climatización y ventilación compatibles.`);
          }
        }

        // Renderizado del veredicto
        let badgeHtml = '';
        if (score === 0 || alertas.some((a) => a.includes('Género'))) {
          badgeHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="background:#F3F4F6; border:1px solid #DC2626; color:#DC2626; font-weight:700; padding:4px 10px; border-radius:0; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;">INCOMPATIBLE (0%)</span>
            <span style="font-size:11px; color:#DC2626; font-weight:600; text-transform:uppercase;">Conflicto de Normativa</span>
          </div>`;
        } else if (score >= 80) {
          badgeHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="background:#F3F4F6; border:1px solid #059669; color:#059669; font-weight:700; padding:4px 10px; border-radius:0; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;">COMPATIBLE (${score}%)</span>
            <span style="font-size:11px; color:#059669; font-weight:600; text-transform:uppercase;">Recomendada para Dictamen</span>
          </div>`;
        } else {
          badgeHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="background:#F3F4F6; border:1px solid #D97706; color:#D97706; font-weight:700; padding:4px 10px; border-radius:0; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;">COMPATIBILIDAD MODERADA (${score}%)</span>
            <span style="font-size:11px; color:#D97706; font-weight:600; text-transform:uppercase;">Requiere mediación</span>
          </div>`;
        }

        let bodyAlertas = alertas.length > 0 ? `<div style="color: #991B1B; margin-bottom: 6px; font-size: 12px; line-height: 1.4;">${alertas.join('<br>')}</div>` : '';
        let bodyCoincidencias = coincidencias.length > 0 ? `<div style="color: #166534; font-size: 12px; line-height: 1.4;">${coincidencias.join('<br>')}</div>` : '';

        box.innerHTML = badgeHtml + bodyAlertas + bodyCoincidencias;
      }

      selectHab.onchange = () => evaluarCompatibilidadHabitacion(selectHab.value);
      evaluarCompatibilidadHabitacion(selectHab.value);
    }

    // Inyectar lista de documentos digitales
    const docsContainer = document.getElementById('modal-docs-list');
    if (docsContainer) {
      docsContainer.innerHTML = `
        <div class="doc-card">
          <div class="doc-info">
            <div class="doc-file-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
            </div>
            <div>
              <strong>Cédula de Identidad</strong>
              <span>cedula_identidad.pdf (1.2 MB)</span>
            </div>
          </div>
          <button type="button" class="btn-view-doc" data-doc-name="cedula_identidad.pdf" data-doc-title="Cédula de Identidad" data-doc-size="1.2 MB">
            <span>Ver documento</span>
          </button>
        </div>
        <div class="doc-card">
          <div class="doc-info">
            <div class="doc-file-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
            </div>
            <div>
              <strong>Certificado de Matrícula</strong>
              <span>matricula_2026.pdf (1.8 MB)</span>
            </div>
          </div>
          <button type="button" class="btn-view-doc" data-doc-name="matricula_2026.pdf" data-doc-title="Certificado de Matrícula" data-doc-size="1.8 MB">
            <span>Ver documento</span>
          </button>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  }

  function cerrarExpediente() {
    if (modal) modal.classList.remove('active');
    postulacionActiva = null;
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', cerrarExpediente);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarExpediente();
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 5: DELEGACIÓN DE EVENTOS CLICK EN LA TABLA
  // ----------------------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    // Clic en 'Revisar expediente'
    const inspectBtn = e.target.closest('[data-action="inspect"]');
    if (inspectBtn) {
      const postId = inspectBtn.getAttribute('data-post-id');
      abrirExpediente(postId);
      return;
    }

    // Clic en 'Aprobar de inmediato'
    const quickApproveBtn = e.target.closest('[data-action="quick-approve"]');
    if (quickApproveBtn) {
      const postId = quickApproveBtn.getAttribute('data-post-id');
      actualizarEstadoPostulacion(postId, 'Aprobada', 'Aprobado de forma directa por el coordinador.');
      return;
    }

    // Clic en 'Rechazar'
    const quickRejectBtn = e.target.closest('[data-action="quick-reject"]');
    if (quickRejectBtn) {
      const postId = quickRejectBtn.getAttribute('data-post-id');
      actualizarEstadoPostulacion(postId, 'Rechazada', 'No cumple con los soportes requeridos.');
      return;
    }

    // Abrir documento en visor
    const viewDocBtn = e.target.closest('.btn-view-doc');
    if (viewDocBtn) {
      const docName = viewDocBtn.getAttribute('data-doc-name');
      const docTitle = viewDocBtn.getAttribute('data-doc-title');
      const docSize = viewDocBtn.getAttribute('data-doc-size');
      abrirVisorDocumento(docTitle, docName, docSize);
      return;
    }
  });

  // ----------------------------------------------------------------------------------------
  // PASO 6: BOTONES DE ACCIÓN DENTRO DEL DRAWER MODAL
  // ----------------------------------------------------------------------------------------
  const btnModalApprove = document.getElementById('btn-modal-approve');
  const btnModalReject = document.getElementById('btn-modal-reject');

  if (btnModalApprove) {
    btnModalApprove.addEventListener('click', () => {
      if (!postulacionActiva) return;
      const notas = document.getElementById('modal-admin-notes')?.value || '';
      const selectedHabId = document.getElementById('modal-select-habitacion')?.value || null;
      actualizarEstadoPostulacion(postulacionActiva.id, 'Aprobada', notas, selectedHabId);
      cerrarExpediente();
    });
  }

  if (btnModalReject) {
    btnModalReject.addEventListener('click', () => {
      if (!postulacionActiva) return;
      const notas = document.getElementById('modal-admin-notes')?.value || '';
      actualizarEstadoPostulacion(postulacionActiva.id, 'Rechazada', notas, null);
      cerrarExpediente();
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 7: ACTUALIZACIÓN ASÍNCRONA HACIA EL SERVIDOR
  // ----------------------------------------------------------------------------------------
  async function actualizarEstadoPostulacion(postId, nuevoEstado, observaciones, habitacionId = null) {
    try {
      const response = await fetch('/api/postulaciones/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, estado: nuevoEstado, observaciones, habitacionId })
      });
      const data = await response.json();
      if (data.success) {
        // // Recarga suave en 400ms para refrescar de forma reactiva las 4 pestañas
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  }

  // ----------------------------------------------------------------------------------------
  // PASO 8: VISOR DE DOCUMENTO SIMULADO
  // ----------------------------------------------------------------------------------------
  const viewerModal = document.getElementById('doc-viewer-modal');
  const btnCloseViewer = document.getElementById('btn-close-viewer');
  const btnCloseViewerOk = document.getElementById('btn-close-viewer-ok');

  function abrirVisorDocumento(titulo, archivo, tamano) {
    const elTitle = document.getElementById('viewer-doc-title');
    const elName = document.getElementById('viewer-file-name');
    const elSize = document.getElementById('viewer-file-size');

    if (elTitle) elTitle.textContent = titulo;
    if (elName) elName.textContent = archivo;
    if (elSize) elSize.textContent = `${tamano} · Formato Cifrado ULEAM`;
    if (viewerModal) viewerModal.style.display = 'flex';
  }

  function cerrarVisor() {
    if (viewerModal) viewerModal.style.display = 'none';
  }

  if (btnCloseViewer) btnCloseViewer.addEventListener('click', cerrarVisor);
  if (btnCloseViewerOk) btnCloseViewerOk.addEventListener('click', cerrarVisor);
  if (viewerModal) {
    viewerModal.addEventListener('click', (e) => {
      if (e.target === viewerModal) cerrarVisor();
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 9: EXPORTAR LISTADO DE POSTULACIONES EN JSON
  // ----------------------------------------------------------------------------------------
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const rows = Array.from(document.querySelectorAll('#tbody-postulaciones tr'));
      const data = rows
        .filter((r) => r.id !== 'row-empty-state')
        .map((r) => ({
          id: r.getAttribute('data-post-id'),
          estudiante: r.querySelector('.student-meta strong')?.textContent,
          correo: r.querySelector('.student-meta span')?.textContent,
          cedula: r.children[1]?.textContent?.trim(),
          carrera: r.children[2]?.textContent?.trim(),
          fecha: r.children[3]?.textContent?.trim(),
          estado: r.getAttribute('data-status')
        }));

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'postulaciones_uleam.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 10: GESTIÓN DIRECTA DE HABITACIÓN Y ASIGNACIÓN DE POSTULANTES
  // ----------------------------------------------------------------------------------------
  const roomModal = document.getElementById('room-manage-modal');
  const btnCloseRoomModal = document.getElementById('btn-close-room-modal');
  const btnCloseRoomModalBottom = document.getElementById('btn-rm-modal-close');
  let habitacionSeleccionada = null;

  function abrirModalHabitacion(roomId) {
    const hab = catalogoHabitaciones.find((h) => h.id === roomId);
    if (!hab || !roomModal) return;

    habitacionSeleccionada = hab;

    // Inyectar datos de cabecera
    const titleNum = document.getElementById('rm-title-numero');
    const titleMeta = document.getElementById('rm-title-meta');
    const badgeGenero = document.getElementById('rm-badge-genero');
    const badgeCap = document.getElementById('rm-badge-capacidad');
    const badgeAcc = document.getElementById('rm-badge-acc');
    const badgePill = document.getElementById('rm-badge-status-pill');

    if (titleNum) titleNum.textContent = `Habitación ${hab.numero}`;
    if (titleMeta) titleMeta.textContent = `${hab.edificio} · ${hab.piso} · Modalidad: ${hab.tipo}`;
    if (badgeGenero) badgeGenero.textContent = hab.genero || 'Mixto';
    if (badgeCap) badgeCap.textContent = `${hab.ocupantesActuales || 0}/${hab.capacidad || 2}`;
    if (badgeAcc) badgeAcc.textContent = hab.accesibilidad ? 'Sí (Adaptada)' : 'Estándar';

    if (badgePill) {
      const libre = (hab.capacidad || 2) - (hab.ocupantesActuales || 0);
      if (libre <= 0) {
        badgePill.textContent = 'Ocupada al 100%';
        badgePill.style.background = '#F3F4F6';
        badgePill.style.color = '#111827';
        badgePill.style.border = '1px solid #D1D5DB';
      } else {
        badgePill.textContent = `${libre} vacante(s) libre(s)`;
        badgePill.style.background = '#F3F4F6';
        badgePill.style.color = '#111827';
        badgePill.style.border = '1px solid #D1D5DB';
      }
    }

    // Renderizar Ocupantes Actuales
    const occupantsList = document.getElementById('rm-occupants-list');
    const emptyOccupants = document.getElementById('rm-empty-occupants');

    if (occupantsList) {
      occupantsList.innerHTML = '';
      if (hab.residentes && hab.residentes.length > 0) {
        if (emptyOccupants) emptyOccupants.style.display = 'none';
        hab.residentes.forEach((res) => {
          const card = document.createElement('div');
          card.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:0; padding:10px 14px;';
          card.innerHTML = `
            <div>
              <strong style="font-size:13px; color:#111827; display:block;">${res.nombreCompleto || res.nombre}</strong>
              <span style="font-size:11.5px; color:#4B5563; font-family:'JetBrains Mono', ui-monospace, monospace;">C.I: ${res.cedula} · ${res.carrera || 'Estudiante ULEAM'}</span>
            </div>
            <button type="button" class="btn-liberar-cupo" data-student-cedula="${res.cedula}" style="background:#FFFFFF; border:1px solid #D1D5DB; color:#DC2626; padding:5px 10px; border-radius:0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; cursor:pointer;">
              Liberar Cupo
            </button>
          `;
          occupantsList.appendChild(card);
        });
      } else {
        if (emptyOccupants) emptyOccupants.style.display = 'block';
      }
    }

    // Control de Asignación
    const warningFull = document.getElementById('rm-room-full-warning');
    const assignControls = document.getElementById('rm-assign-controls');
    const selectStudent = document.getElementById('rm-select-student');
    const feedbackBox = document.getElementById('rm-compat-feedback');

    const vacantes = (hab.capacidad || 2) - (hab.ocupantesActuales || 0);

    if (vacantes <= 0) {
      if (warningFull) warningFull.style.display = 'block';
      if (assignControls) assignControls.style.display = 'none';
    } else {
      if (warningFull) warningFull.style.display = 'none';
      if (assignControls) assignControls.style.display = 'block';

      if (selectStudent) {
        selectStudent.innerHTML = '';
        if (catalogoPostulantes.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'No hay estudiantes o postulantes pendientes disponibles';
          selectStudent.appendChild(opt);
          if (feedbackBox) feedbackBox.innerHTML = '<span style="color:#64748B;">No hay postulantes pendientes en cola de admisión.</span>';
        } else {
          catalogoPostulantes.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.cedula;
            opt.textContent = `${p.nombreCompleto || p.nombre} (${p.carrera || 'Carrera'}) - C.I: ${p.cedula}`;
            selectStudent.appendChild(opt);
          });

          // Función de Evaluación en Vivo dentro del modal de habitación
          function evaluarCompatibilidadHabitacionDirecta(cedula) {
            if (!feedbackBox) return;
            const estudiante = catalogoPostulantes.find((s) => s.cedula === cedula);
            if (!estudiante) {
              feedbackBox.innerHTML = '<span style="color:#64748B;">Selecciona un postulante para evaluar.</span>';
              return;
            }

            const nombreNorm = (estudiante.nombreCompleto || estudiante.nombre || '').toLowerCase();
            const esFemenino = nombreNorm.includes('maría') || nombreNorm.includes('maria') || nombreNorm.includes('elena') || nombreNorm.includes('ana') || nombreNorm.includes('laura') || nombreNorm.includes('sofia') || nombreNorm.includes('carla') || nombreNorm.includes('paula');
            const generoEstudiante = esFemenino ? 'Femenino' : 'Masculino';

            let score = 95;
            let alertas = [];
            let coincidencias = [];

            // Género
            if (hab.genero && hab.genero !== generoEstudiante) {
              alertas.push(`<strong>Alerta Crítica de Género:</strong> La habitación ${hab.numero} está asignada a género <strong>${hab.genero}</strong> y el/la estudiante es de género <strong>${generoEstudiante}</strong>.`);
              score = 0;
            } else {
              coincidencias.push(`✓ Género normativo compatible (${hab.genero}).`);
            }

            // Capacidad
            coincidencias.push(`✓ Vacante libre confirmada (${vacantes} cupo(s) disponible(s)).`);

            // Renderizado del veredicto
            let badgeHtml = '';
            if (score === 0 || alertas.some((a) => a.includes('Género'))) {
              badgeHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="background:#F3F4F6; border:1px solid #DC2626; color:#DC2626; font-weight:700; padding:3px 8px; border-radius:0; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;">INCOMPATIBLE (0%)</span>
                <span style="font-size:11px; color:#DC2626; font-weight:600; text-transform:uppercase;">Conflicto Normativo</span>
              </div>`;
            } else {
              badgeHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="background:#F3F4F6; border:1px solid #059669; color:#059669; font-weight:700; padding:3px 8px; border-radius:0; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;">COMPATIBLE (${score}%)</span>
                <span style="font-size:11px; color:#059669; font-weight:600; text-transform:uppercase;">Apto para ingreso</span>
              </div>`;
            }

            let bodyAlertas = alertas.length > 0 ? `<div style="color:#991B1B; margin-bottom:4px; font-size:11.5px;">${alertas.join('<br>')}</div>` : '';
            let bodyCoincidencias = coincidencias.length > 0 ? `<div style="color:#166534; font-size:11.5px;">${coincidencias.join('<br>')}</div>` : '';

            feedbackBox.innerHTML = badgeHtml + bodyAlertas + bodyCoincidencias;
          }

          selectStudent.onchange = () => evaluarCompatibilidadHabitacionDirecta(selectStudent.value);
          evaluarCompatibilidadHabitacionDirecta(selectStudent.value);
        }
      }
    }

    roomModal.style.display = 'flex';
  }

  function cerrarModalHabitacion() {
    if (roomModal) roomModal.style.display = 'none';
    habitacionSeleccionada = null;
  }

  if (btnCloseRoomModal) btnCloseRoomModal.addEventListener('click', cerrarModalHabitacion);
  if (btnCloseRoomModalBottom) btnCloseRoomModalBottom.addEventListener('click', cerrarModalHabitacion);
  if (roomModal) {
    roomModal.addEventListener('click', (e) => {
      if (e.target === roomModal) cerrarModalHabitacion();
    });
  }

  // Delegación de clic para 'Gestionar y Asignar Postulante'
  document.addEventListener('click', async (e) => {
    const btnManage = e.target.closest('.btn-manage-room');
    if (btnManage) {
      const roomId = btnManage.getAttribute('data-room-id');
      abrirModalHabitacion(roomId);
      return;
    }

    // Botón Liberar Cupo
    const btnLiberar = e.target.closest('.btn-liberar-cupo');
    if (btnLiberar) {
      const cedula = btnLiberar.getAttribute('data-student-cedula');
      if (!habitacionSeleccionada || !cedula) return;
      if (confirm('¿Deseas liberar el cupo de este estudiante y regresar su estado a pendiente?')) {
        try {
          const resp = await fetch('/api/habitaciones/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              habitacionId: habitacionSeleccionada.id,
              estudianteCedula: cedula,
              accion: 'liberar'
            })
          });
          const res = await resp.json();
          if (res.success) {
            window.location.reload();
          } else {
            alert(res.message || 'Error al liberar cupo.');
          }
        } catch (err) {
          console.error(err);
        }
      }
      return;
    }
  });

  // Confirmar Asignación desde el Modal de Habitación
  const btnConfirmAssign = document.getElementById('btn-rm-assign-confirm');
  if (btnConfirmAssign) {
    btnConfirmAssign.addEventListener('click', async () => {
      if (!habitacionSeleccionada) return;
      const selectStudent = document.getElementById('rm-select-student');
      const cedula = selectStudent ? selectStudent.value : '';
      if (!cedula) {
        alert('Selecciona un postulante disponible.');
        return;
      }

      btnConfirmAssign.disabled = true;
      btnConfirmAssign.textContent = 'Asignando a la habitación...';

      try {
        const resp = await fetch('/api/habitaciones/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            habitacionId: habitacionSeleccionada.id,
            estudianteCedula: cedula,
            accion: 'asignar'
          })
        });
        const res = await resp.json();
        if (res.success) {
          window.location.reload();
        } else {
          alert(res.message || 'No fue posible asignar al estudiante.');
          btnConfirmAssign.disabled = false;
          btnConfirmAssign.textContent = 'Confirmar y Asignar a la Habitación';
        }
      } catch (err) {
        console.error(err);
        btnConfirmAssign.disabled = false;
        btnConfirmAssign.textContent = 'Confirmar y Asignar a la Habitación';
      }
    });
  }
});
