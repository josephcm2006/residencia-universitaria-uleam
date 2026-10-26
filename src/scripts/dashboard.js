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
    if (elFacultad) elFacultad.textContent = 'Facultad ULEAM · Foráneo';
    if (elStatus) {
      elStatus.textContent = status;
      if (status === 'Aprobada') elStatus.style.color = '#15803D';
      else if (status === 'Rechazada') elStatus.style.color = '#B91C1C';
      else elStatus.style.color = '#B45309';
    }

    // Datos socioeconómicos por defecto legibles
    const elIngresos = document.getElementById('modal-student-ingresos');
    const elEgresos = document.getElementById('modal-student-egresos');
    const elHogar = document.getElementById('modal-student-hogar');
    const elQuintil = document.getElementById('modal-student-quintil');
    const elAcc = document.getElementById('modal-student-accesibilidad');
    const elRef = document.getElementById('modal-student-referencias');

    if (elIngresos) elIngresos.textContent = '$ 450.00';
    if (elEgresos) elEgresos.textContent = '$ 380.00';
    if (elHogar) elHogar.textContent = '4 integrantes, 2 dependientes';
    if (elQuintil) elQuintil.textContent = 'Quintil 1 (Prioridad Alta)';
    if (elAcc) elAcc.textContent = 'Estudiante no declaró requerimientos especiales de movilidad.';
    if (elRef) elRef.textContent = 'Referencia familiar registrada en el expediente.';

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
      actualizarEstadoPostulacion(postulacionActiva.id, 'Aprobada', notas);
      cerrarExpediente();
    });
  }

  if (btnModalReject) {
    btnModalReject.addEventListener('click', () => {
      if (!postulacionActiva) return;
      const notas = document.getElementById('modal-admin-notes')?.value || '';
      actualizarEstadoPostulacion(postulacionActiva.id, 'Rechazada', notas);
      cerrarExpediente();
    });
  }

  // ----------------------------------------------------------------------------------------
  // PASO 7: ACTUALIZACIÓN ASÍNCRONA HACIA EL SERVIDOR
  // ----------------------------------------------------------------------------------------
  async function actualizarEstadoPostulacion(postId, nuevoEstado, observaciones) {
    try {
      const response = await fetch('/api/postulaciones/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, estado: nuevoEstado, observaciones })
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
});
