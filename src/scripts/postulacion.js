/**
 * ============================================================================
 * CONTROLADOR CLIENTE DE FORMULARIO DE POSTULACIÓN
 * ============================================================================
 * Gestiona la interactividad del formulario de residencia:
 * - Selección y validación de archivos en tiempo real
 * - Cálculo del progreso general (0% a 100%)
 * - Guardado de borrador y visor JSON
 * - Envío asíncrono y comunicación con modales React vía eventos
 */

import { validarPostulacionCompleta } from '../errores-postulacion/administradorErrores.js';
import { validarArchivoIndividual } from '../errores-postulacion/validadorArchivos.js';

(function () {
  // Almacén en memoria de los archivos seleccionados
  var archivosCargados = {};

  function mostrarToast(mensaje) {
    var toast = document.getElementById('save-toast');
    var text = document.getElementById('toast-message');
    if (!toast || !text) return;
    text.textContent = mensaje;
    toast.style.display = 'flex';
    setTimeout(function () {
      toast.style.display = 'none';
    }, 3500);
  }

  // 1. Manejo de subida de archivos con validación en tiempo real
  var fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(function (input) {
    input.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      var card = input.closest('.file-row');
      if (!card) return;

      var statusBadge = card.querySelector('.file-status');
      var descSpan = card.querySelector('.file-desc');
      var docType = input.getAttribute('data-doc-type') || input.name;

      if (file) {
        // Validar formato (.pdf, .jpg, .png) y tamaño (<= 10MB)
        var errorArchivo = validarArchivoIndividual(file, docType);
        if (errorArchivo) {
          window.dispatchEvent(
            new CustomEvent('abrir-modal-error-postulacion', {
              detail: {
                titulo: 'Archivo No Válido',
                mensaje: errorArchivo,
                errores: []
              }
            })
          );

          // Resetear campo
          input.value = '';
          delete archivosCargados[input.name];
          if (statusBadge) {
            statusBadge.textContent = 'Sin archivo';
            statusBadge.classList.remove('uploaded');
          }
          if (descSpan) {
            descSpan.textContent = 'Formatos permitidos: PDF, JPG, PNG (Máx 10 MB)';
            descSpan.style.color = '#71717A';
            descSpan.style.fontWeight = 'normal';
          }
          actualizarProgreso();
          return;
        }

        var sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        var fileName = file.name;

        // Registrar en memoria
        archivosCargados[input.name] = {
          tipo: docType,
          nombreArchivo: fileName,
          tamano: sizeMB + ' MB',
          tipoMime: file.type || 'application/octet-stream',
          fechaCarga: new Date().toISOString()
        };

        // Actualizar UI
        if (statusBadge) {
          statusBadge.textContent = '✓ Archivo cargado';
          statusBadge.classList.add('uploaded');
        }
        if (descSpan) {
          descSpan.textContent = '📄 ' + fileName + ' (' + sizeMB + ' MB) — Listo';
          descSpan.style.color = '#1F7A4C';
          descSpan.style.fontWeight = '600';
        }

        mostrarToast('Archivo cargado: ' + fileName);
      } else {
        delete archivosCargados[input.name];
        if (statusBadge) {
          statusBadge.textContent = 'Sin archivo';
          statusBadge.classList.remove('uploaded');
        }
      }

      actualizarProgreso();
    });
  });

  // 2. Cálculo dinámico de progreso (0% a 100%)
  function actualizarProgreso() {
    var totalPuntos = 10;
    var puntos = 2; // Inicia con 2 por datos personales de la cuenta

    var tieneCedula = archivosCargados['file_cedula'];
    var tieneMatricula = archivosCargados['file_matricula'];
    var stageIdentidadTitle = document.getElementById('stage-identidad-title');
    var stageIdentidadDesc = document.getElementById('stage-identidad-desc');

    if (tieneCedula && tieneMatricula) {
      puntos += 2;
      if (stageIdentidadTitle) {
        stageIdentidadTitle.className = 'text-verde';
        stageIdentidadTitle.textContent = '2. Identidad y matrícula';
      }
      if (stageIdentidadDesc) {
        stageIdentidadDesc.className = 'text-verde';
        stageIdentidadDesc.textContent = 'Cédula y matrícula seleccionadas';
      }
    } else if (tieneCedula || tieneMatricula) {
      puntos += 1;
      if (stageIdentidadDesc) {
        stageIdentidadDesc.textContent = '1 documento cargado, falta 1';
      }
    }

    var campoIntegrantes = document.getElementById('campo-integrantes');
    var tieneHogarDoc = archivosCargados['file_hogar'];
    var stageHogarTitle = document.getElementById('stage-hogar-title');
    var stageHogarDesc = document.getElementById('stage-hogar-desc');

    if (campoIntegrantes && campoIntegrantes.value.trim()) {
      puntos += 1;
    }
    if (tieneHogarDoc) {
      puntos += 1;
    }
    if (campoIntegrantes && campoIntegrantes.value.trim() && tieneHogarDoc) {
      if (stageHogarTitle) stageHogarTitle.className = 'text-verde';
      if (stageHogarDesc) {
        stageHogarDesc.className = 'text-verde';
        stageHogarDesc.textContent = 'Información y soporte de hogar completo';
      }
    }

    var campoIngresos = document.getElementById('campo-ingresos');
    var tieneIngresosDoc = archivosCargados['file_ingresos'];
    var stageSocioTitle = document.getElementById('stage-socioeconomica-title');
    var stageSocioDesc = document.getElementById('stage-socioeconomica-desc');

    if (campoIngresos && campoIngresos.value.trim()) {
      puntos += 1;
    }
    if (tieneIngresosDoc) {
      puntos += 1;
    }
    if (campoIngresos && campoIngresos.value.trim() && tieneIngresosDoc) {
      if (stageSocioTitle) stageSocioTitle.className = 'text-verde';
      if (stageSocioDesc) {
        stageSocioDesc.className = 'text-verde';
        stageSocioDesc.textContent = 'Datos económicos y comprobantes registrados';
      }
    }

    var checkAut = document.getElementById('check-autenticidad');
    var checkDat = document.getElementById('check-tratamiento');
    var checkReg = document.getElementById('check-reglamento');
    var stageConsentTitle = document.getElementById('stage-consentimiento-title');
    var stageConsentDesc = document.getElementById('stage-consentimiento-desc');

    if (checkAut && checkAut.checked && checkDat && checkDat.checked && checkReg && checkReg.checked) {
      puntos += 2;
      if (stageConsentTitle) stageConsentTitle.className = 'text-verde';
      if (stageConsentDesc) {
        stageConsentDesc.className = 'text-verde';
        stageConsentDesc.textContent = 'Términos y reglamento aceptados';
      }
    } else if (checkAut && (checkAut.checked || checkDat.checked)) {
      puntos += 1;
    }

    var porcentaje = Math.min(100, Math.round((puntos / totalPuntos) * 100));
    var fill = document.getElementById('progress-fill');
    var text = document.getElementById('progress-text');
    if (fill) fill.style.width = porcentaje + '%';
    if (text) text.textContent = porcentaje + '%';
  }

  var inputsText = document.querySelectorAll(
    'input[type="text"], input[type="tel"], textarea, select, input[type="checkbox"]'
  );
  inputsText.forEach(function (inp) {
    inp.addEventListener('input', actualizarProgreso);
    inp.addEventListener('change', actualizarProgreso);
  });

  // 3. Recolectar datos del formulario en un objeto JSON limpio
  function recolectarDatosPostulacion() {
    var form = document.getElementById('form-postulacion');
    var formData = new FormData(form);
    return {
      estudiante: {
        nombre: document.getElementById('campo-nombre') ? document.getElementById('campo-nombre').value : '',
        carrera: document.getElementById('campo-carrera') ? document.getElementById('campo-carrera').value : '',
        correo: document.getElementById('campo-correo') ? document.getElementById('campo-correo').value : '',
        cedula: document.getElementById('campo-cedula') ? document.getElementById('campo-cedula').value : '0953920949'
      },
      hogar: {
        integrantes: formData.get('integrantes_hogar') || '',
        dependientes: formData.get('dependientes_hogar') || ''
      },
      referencias: [
        {
          tipo: 'Emergencia / Familiar',
          nombre: formData.get('ref1_nombre') || '',
          parentesco: formData.get('ref1_parentesco') || '',
          telefono: formData.get('ref1_telefono') || ''
        },
        {
          tipo: 'Personal / Académica',
          nombre: formData.get('ref2_nombre') || '',
          vinculo: formData.get('ref2_parentesco') || '',
          telefono: formData.get('ref2_telefono') || ''
        }
      ],
      situacionEconomica: {
        ingresoMensualHogar: formData.get('ingreso_mensual') || '',
        egresosMensuales: formData.get('egresos_mensuales') || ''
      },
      accesibilidad: {
        necesidad: formData.get('accesibilidad') || '',
        grupoVulnerable: formData.get('grupo_vulnerable') || ''
      },
      habitacionPreferencia: {
        tipo: 'Habitación Estándar Compartida',
        ubicacion: 'Edificio A · Campus Matriz',
        periodo: '2026-2'
      },
      consentimientos: {
        autenticidad: document.getElementById('check-autenticidad') ? document.getElementById('check-autenticidad').checked : false,
        tratamientoDatos: document.getElementById('check-tratamiento') ? document.getElementById('check-tratamiento').checked : false,
        reglamento: document.getElementById('check-reglamento') ? document.getElementById('check-reglamento').checked : false
      },
      archivosAdjuntos: archivosCargados,
      ultimaActualizacion: new Date().toLocaleString()
    };
  }

  // Guardar borrador en localStorage
  var btnDraft = document.getElementById('btn-save-draft');
  if (btnDraft) {
    btnDraft.addEventListener('click', function () {
      var data = recolectarDatosPostulacion();
      try {
        localStorage.setItem('postulacion_borrador_uleam', JSON.stringify(data));
        mostrarToast('Borrador guardado localmente con éxito.');
      } catch (err) {
        mostrarToast('Datos listos en memoria.');
      }
    });
  }

  // Visor JSON
  var btnViewJson = document.getElementById('btn-view-json');
  var jsonModal = document.getElementById('json-modal');
  var jsonPreview = document.getElementById('json-preview');
  var btnCloseModal = document.getElementById('btn-close-json-modal');
  var btnModalOk = document.getElementById('btn-modal-ok');

  if (btnViewJson && jsonModal && jsonPreview) {
    btnViewJson.addEventListener('click', function () {
      var data = recolectarDatosPostulacion();
      jsonPreview.textContent = JSON.stringify(data, null, 2);
      jsonModal.style.display = 'flex';
    });
  }

  function cerrarModalJson() {
    if (jsonModal) jsonModal.style.display = 'none';
  }
  if (btnCloseModal) btnCloseModal.addEventListener('click', cerrarModalJson);
  if (btnModalOk) btnModalOk.addEventListener('click', cerrarModalJson);
  if (jsonModal) {
    jsonModal.addEventListener('click', function (e) {
      if (e.target === jsonModal) cerrarModalJson();
    });
  }

  // 4. Envío de formulario con validación modular y control de duplicados
  var form = document.getElementById('form-postulacion');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = recolectarDatosPostulacion();

      // Obtener lista previa del DOM para chequear duplicados
      var listaExistente = [];
      try {
        listaExistente = JSON.parse(
          form.getAttribute('data-postulaciones-existentes') || '[]'
        );
      } catch (err) {}

      // Validar campos, archivos y duplicados
      var validacion = validarPostulacionCompleta(
        data,
        archivosCargados,
        listaExistente
      );

      // Si hay errores de campos, formatos o duplicados:
      if (!validacion.esValido) {
        window.dispatchEvent(
          new CustomEvent('abrir-modal-error-postulacion', {
            detail: {
              titulo: validacion.esDuplicado
                ? 'Postulación Ya Registrada'
                : 'Requisitos Incompletos',
              mensaje: validacion.esDuplicado
                ? validacion.primerError
                : 'Para procesar tu postulación a la residencia, por favor completa o corrige los siguientes puntos:',
              errores: validacion.esDuplicado ? [] : validacion.errores,
              esDuplicado: validacion.esDuplicado
            }
          })
        );
        return;
      }

      // Disparar modal de carga "Cargando postulación..."
      window.dispatchEvent(new CustomEvent('iniciar-envio-postulacion'));

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Enviando postulación...';
      }

      try {
        var response = await fetch('/api/postulaciones/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await response.json();

        // Control de duplicado en servidor (HTTP 409)
        if (!result.success && result.duplicado) {
          window.dispatchEvent(new CustomEvent('cerrar-modal-exito-postulacion'));
          window.dispatchEvent(
            new CustomEvent('abrir-modal-error-postulacion', {
              detail: {
                titulo: 'Postulación Ya Registrada',
                mensaje: result.message,
                errores: [],
                esDuplicado: true
              }
            })
          );
          return;
        }

        // Si fue exitoso: visto verde animado y sonido
        if (result.success) {
          window.dispatchEvent(
            new CustomEvent('postulacion-exitosa', {
              detail: { codigo: result.postulacion.id }
            })
          );

          try {
            localStorage.setItem('postulacion_final_uleam', JSON.stringify(result.postulacion));
          } catch (err) {}

          // Redirección garantizada de respaldo a la página oficial de postulado
          setTimeout(function () {
            if (window.location.pathname.includes('/postulation')) {
              window.location.href = '/postulado?id=' + encodeURIComponent(result.postulacion.id);
            }
          }, 4300);
        } else {
          window.dispatchEvent(new CustomEvent('cerrar-modal-exito-postulacion'));
          window.dispatchEvent(
            new CustomEvent('abrir-modal-error-postulacion', {
              detail: {
                titulo: 'Error en la Postulación',
                mensaje: result.message || 'Ocurrió un problema registrando tu postulación.',
                errores: []
              }
            })
          );
        }
      } catch (err) {
        window.dispatchEvent(new CustomEvent('cerrar-modal-exito-postulacion'));
        window.dispatchEvent(
          new CustomEvent('abrir-modal-error-postulacion', {
            detail: {
              titulo: 'Error de Red',
              mensaje: 'No fue posible conectar con el servidor institucional. Por favor intenta nuevamente.',
              errores: []
            }
          })
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
})();
