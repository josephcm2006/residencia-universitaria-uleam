/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Controlador de cliente y validaciones del formulario de postulación
 * ============================================================================
 * UBICACIÓN: src/scripts/postulacion/postulacion.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este script administra la interactividad completa del formulario de postulación:
 * 1. Monitorea la selección de archivos y ejecuta validaciones técnicas en tiempo real.
 * 2. Calcula de forma ponderada el porcentaje de progreso (0% a 100%) y actualiza la barra.
 * 3. Permite guardar borradores locales en localStorage ('postulacion_borrador_uleam').
 * 4. Permite inspeccionar los datos estructurados en formato JSON crudo mediante un visor.
 * 5. Intercepta el envío del formulario, ejecuta el diagnóstico completo de duplicados y campos,
 *    y coordina la comunicación con los modales React mediante eventos personalizados (CustomEvent).
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Se envuelve todo el código en un IIFE (Immediately Invoked Function Expression) para
 *    evitar contaminar el ámbito global de JavaScript.
 * 2. Se declaran las estructuras de almacenamiento temporal en memoria ('archivosCargados').
 * 3. Se asignan listeners a los inputs de tipo file (evento 'change') para validar formato/peso.
 * 4. Se asignan listeners a inputs de texto, números y checks para recalcular el progreso en vivo.
 * 5. Al pulsar 'Guardar borrador', serializa el estado a localStorage y emite un toast informativo.
 * 6. Al pulsar 'Enviar', intercepta el evento submit, ejecuta 'validarPostulacionCompleta()'.
 *    - Si es inválido: dispara 'abrir-modal-error-postulacion' con la lista de fallos o alerta de duplicado.
 *    - Si es válido: dispara 'iniciar-envio-postulacion' (spinner de carga) y hace fetch a '/api/postulaciones/create'.
 *    - Si el servidor responde 200: dispara 'postulacion-exitosa' para iniciar animación de visto y sonido.
 */

import { validarPostulacionCompleta } from './administradorErrores.js';
import { validarArchivoIndividual } from './validadorArchivos.js';

(function () {
  // --------------------------------------------------------------------------
  // VARIABLES DE ESTADO LOCAL EN MEMORIA
  // --------------------------------------------------------------------------
  
  // VARIABLE 'archivosCargados':
  // Objeto diccionario en memoria que guarda las referencias de los archivos seleccionados
  // por el usuario. La clave es el nombre del input (ej: 'file_cedula') y el valor contiene
  // el nombre del archivo, su peso formateado, su tipo MIME y la fecha de selección.
  var archivosCargados = {};

  /**
   * Muestra una notificación flotante breve (Toast) en la esquina inferior derecha.
   * @param {string} mensaje - Texto explicativo que se mostrará al usuario.
   */
  function mostrarToast(mensaje) {
    // VARIABLE 'toast': Contenedor HTML del toast flotante.
    var toast = document.getElementById('save-toast');

    // VARIABLE 'text': Elemento span donde se inserta el texto del mensaje.
    var text = document.getElementById('toast-message');

    if (!toast || !text) return;

    text.textContent = mensaje;
    toast.style.display = 'flex';

    // Desaparece automáticamente después de 3.5 segundos
    setTimeout(function () {
      toast.style.display = 'none';
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // 1. MANEJO DE SUBIDA DE ARCHIVOS CON VALIDACIÓN EN TIEMPO REAL
  // --------------------------------------------------------------------------
  
  // VARIABLE 'fileInputs': Colección de todos los inputs de archivo del formulario.
  var fileInputs = document.querySelectorAll('input[type="file"]');

  fileInputs.forEach(function (input) {
    // Escucha el evento 'change' cada vez que el estudiante selecciona o cambia un archivo
    input.addEventListener('change', function (e) {
      // VARIABLE 'file': Primer archivo seleccionado por el usuario en el explorador de archivos.
      var file = e.target.files && e.target.files[0];

      // VARIABLE 'card': Fila contenedora del requisito documental en la interfaz.
      var card = input.closest('.file-row');
      if (!card) return;

      // VARIABLE 'statusBadge': Etiqueta visual de estado (ej: "Sin archivo" o "Archivo cargado").
      var statusBadge = card.querySelector('.file-status');

      // VARIABLE 'descSpan': Texto explicativo donde se muestran los megabytes y el nombre del archivo.
      var descSpan = card.querySelector('.file-desc');

      // VARIABLE 'docType': Nombre descriptivo institucional asignado al atributo data-doc-type.
      var docType = input.getAttribute('data-doc-type') || input.name;

      if (file) {
        // PASO 1: Validar extensión (.pdf, .jpg, .png) y límite de 10 MB antes de procesar
        var errorArchivo = validarArchivoIndividual(file, docType);

        if (errorArchivo) {
          // Si el archivo es inválido, emite evento al modal React para alertar al alumno
          window.dispatchEvent(
            new CustomEvent('abrir-modal-error-postulacion', {
              detail: {
                titulo: 'Archivo No Válido',
                mensaje: errorArchivo,
                errores: []
              }
            })
          );

          // Limpia el input y remueve del almacén en memoria para no enviar archivos corruptos
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

          // Recalcula el progreso general restando este documento
          actualizarProgreso();
          return;
        }

        // PASO 2: Si el archivo es válido, calcula tamaño en MB y registra metadatos
        var sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        var fileName = file.name;

        // Guarda en la variable 'archivosCargados' los datos limpios del archivo
        archivosCargados[input.name] = {
          tipo: docType,
          nombreArchivo: fileName,
          tamano: sizeMB + ' MB',
          tipoMime: file.type || 'application/octet-stream',
          fechaCarga: new Date().toISOString()
        };

        // PASO 3: Actualiza los elementos visuales de la fila a color verde
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
        // Si el usuario canceló la selección, se elimina del estado
        delete archivosCargados[input.name];
        if (statusBadge) {
          statusBadge.textContent = 'Sin archivo';
          statusBadge.classList.remove('uploaded');
        }
      }

      // Recalcula la barra de avance
      actualizarProgreso();
    });
  });

  // --------------------------------------------------------------------------
  // 2. CÁLCULO DINÁMICO DE PROGRESO PONDERADO (0% A 100%)
  // --------------------------------------------------------------------------
  
  /**
   * Evalúa la completitud de cada sección y ajusta la barra visual de progreso.
   */
  function actualizarProgreso() {
    // VARIABLE 'totalPuntos': Base máxima de puntuación (10 puntos = 100%).
    var totalPuntos = 10;

    // VARIABLE 'puntos': Inicia con 2 puntos por datos personales precargados desde la sesión.
    var puntos = 2;

    // Evaluación Sección 2: Cédula y Matrícula (2 puntos)
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

    // Evaluación Sección 3: Composición del Hogar (2 puntos)
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

    // Evaluación Sección 4: Situación Económica (2 puntos)
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

    // Evaluación Sección 5: Consentimientos y Términos Legales (2 puntos)
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

    // Evaluación Sección 6: Condiciones de Convivencia (1 punto)
    var inputConvCheck = document.getElementById('input-condiciones-convivencia');
    if (inputConvCheck && inputConvCheck.value) {
      puntos += 1;
    }

    // VARIABLE 'porcentaje':
    // Convierte los puntos a escala de 0 a 100 asegurando no sobrepasar el 100%.
    var porcentaje = Math.min(100, Math.round((puntos / 11) * 100));

    // VARIABLE 'fill': Barra de color que se ensancha horizontalmente.
    var fill = document.getElementById('progress-fill');

    // VARIABLE 'text': Indicador numérico textual del porcentaje.
    var text = document.getElementById('progress-text');

    if (fill) fill.style.width = porcentaje + '%';
    if (text) text.textContent = porcentaje + '%';
  }

  // Asignar listeners en vivo a todos los campos de texto, select y checkboxes
  var inputsText = document.querySelectorAll(
    'input[type="text"], input[type="tel"], textarea, select, input[type="checkbox"]'
  );
  inputsText.forEach(function (inp) {
    inp.addEventListener('input', actualizarProgreso);
    inp.addEventListener('change', actualizarProgreso);
  });

  // --------------------------------------------------------------------------
  // 3. RECOLECCIÓN ESTRUCTURADA DE DATOS DEL FORMULARIO
  // --------------------------------------------------------------------------
  
  /**
   * Recolecta todos los valores del DOM y construye un objeto JSON normalizado.
   * @returns {Object} Datos consolidados del expediente del estudiante.
   */
  function recolectarDatosPostulacion() {
    // VARIABLE 'form': Elemento HTML del formulario de postulación.
    var form = document.getElementById('form-postulacion');

    // VARIABLE 'formData': Objeto FormData para leer inputs por su atributo name.
    var formData = new FormData(form);

    return {
      estudiante: {
        nombre: document.getElementById('campo-nombre') ? document.getElementById('campo-nombre').value.trim() : '',
        carrera: document.getElementById('campo-carrera') ? document.getElementById('campo-carrera').value.trim() : '',
        correo: document.getElementById('campo-correo') ? document.getElementById('campo-correo').value.trim() : '',
        cedula: document.getElementById('campo-cedula') ? document.getElementById('campo-cedula').value.trim() : ''
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
      condicionesConvivencia: (function () {
        try {
          var val = document.getElementById('input-condiciones-convivencia')?.value;
          return val ? JSON.parse(val) : null;
        } catch (e) {
          return null;
        }
      })(),
      archivosAdjuntos: archivosCargados,
      ultimaActualizacion: new Date().toLocaleString()
    };
  }

  // --------------------------------------------------------------------------
  // GESTIÓN DEL MODAL DE CONDICIONES Y PREFERENCIAS DE CONVIVENCIA
  // --------------------------------------------------------------------------
  var btnAbrirConv = document.getElementById('btn-abrir-modal-convivencia');
  var btnCerrarConv = document.getElementById('btn-cerrar-modal-convivencia');
  var btnCancelarConv = document.getElementById('btn-cancelar-convivencia');
  var btnGuardarConv = document.getElementById('btn-guardar-convivencia');
  var modalConv = document.getElementById('modal-condiciones-convivencia');
  var inputConv = document.getElementById('input-condiciones-convivencia');
  var chipsContainer = document.getElementById('contenedor-chips-convivencia');
  var badgeConv = document.getElementById('badge-convivencia-status');
  var btnTextConv = document.getElementById('btn-text-convivencia');
  var errorMsgConv = document.getElementById('conv-error-msg');

  function renderizarChipsConvivencia(data) {
    if (!data || !data.configurado) return;
    if (badgeConv) {
      badgeConv.className = 'status-pill-complete';
      badgeConv.innerHTML = '<span class="dot"></span><span class="text">Condiciones configuradas (Listo)</span>';
    }
    if (btnTextConv) {
      btnTextConv.textContent = 'Modificar Condiciones de Convivencia';
    }
    if (!chipsContainer) return;

    var chips = [];

    // 1. Mascotas
    if (data.mascotas === 'sin_mascotas') {
      chips.push('<span class="conv-chip chip-alert">Habitación libre de mascotas</span>');
    } else if (data.mascotas === 'posee_asistencia') {
      chips.push('<span class="conv-chip chip-health">Usuario con animal de asistencia</span>');
    } else if (data.mascotas === 'tolera_asistencia') {
      chips.push('<span class="conv-chip">Tolerante con animales de asistencia</span>');
    }

    // 2. Climatización
    if (data.climatizacion === 'frio') chips.push('<span class="conv-chip">A/C Frío continuo (18°C-20°C)</span>');
    else if (data.climatizacion === 'ventilador') chips.push('<span class="conv-chip">Solo ventilador / Sensible</span>');
    else chips.push('<span class="conv-chip">A/C Templado (22°C-24°C)</span>');

    // 3. Audio / Estudio
    if (data.audio === 'audifonos') chips.push('<span class="conv-chip">Audífonos obligatorios</span>');
    else chips.push('<span class="conv-chip">Volumen moderado flexible</span>');

    // 4. Humo / Tabaco
    if (data.humo === 'no_tolera') chips.push('<span class="conv-chip">100% Libre de humo y vapor</span>');
    else if (data.humo === 'vapeador') chips.push('<span class="conv-chip">Vapeador ocasional</span>');
    else chips.push('<span class="conv-chip">Tolerante en exteriores</span>');

    // 5. Salud y Medicación
    if (data.salud && data.salud.refrigeracionMedica) chips.push('<span class="conv-chip chip-health">Refrigeración médica</span>');
    if (data.salud && data.salud.alergiaAlimentos) chips.push('<span class="conv-chip chip-alert">Alergia alimentaria severa</span>');
    if (data.salud && data.salud.sensibilidadOlores) chips.push('<span class="conv-chip">Sensible a olores/químicos</span>');

    chipsContainer.innerHTML = chips.join('');
    chipsContainer.style.display = 'flex';
  }

  function restaurarValoresEnModal(data) {
    if (!data) return;
    if (data.salud) {
      var checkRefri = document.getElementById('conv-refrigeracion-medica');
      var checkAlim = document.getElementById('conv-alergia-alimentos');
      var checkOlores = document.getElementById('conv-sensibilidad-olores');
      if (checkRefri) checkRefri.checked = Boolean(data.salud.refrigeracionMedica);
      if (checkAlim) checkAlim.checked = Boolean(data.salud.alergiaAlimentos);
      if (checkOlores) checkOlores.checked = Boolean(data.salud.sensibilidadOlores);
    }
    
    // Radios principales
    ['conv_mascotas', 'conv_climatizacion', 'conv_audio', 'conv_humo'].forEach(function (name) {
      var key = name.replace('conv_', '');
      var val = data[key];
      if (val) {
        var radio = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
        if (radio) radio.checked = true;
      }
    });
  }

  function abrirModalConvivencia() {
    if (modalConv) modalConv.style.display = 'flex';
  }

  function cerrarModalConvivencia() {
    if (modalConv) modalConv.style.display = 'none';
    if (errorMsgConv) errorMsgConv.style.display = 'none';
  }

  if (btnAbrirConv) btnAbrirConv.addEventListener('click', abrirModalConvivencia);
  if (btnCerrarConv) btnCerrarConv.addEventListener('click', cerrarModalConvivencia);
  if (btnCancelarConv) btnCancelarConv.addEventListener('click', cerrarModalConvivencia);

  if (modalConv) {
    modalConv.addEventListener('click', function (e) {
      if (e.target === modalConv) cerrarModalConvivencia();
    });
  }

  if (btnGuardarConv) {
    btnGuardarConv.addEventListener('click', function () {
      var mascotas = document.querySelector('input[name="conv_mascotas"]:checked');
      var clima = document.querySelector('input[name="conv_climatizacion"]:checked');
      var audio = document.querySelector('input[name="conv_audio"]:checked');
      var humo = document.querySelector('input[name="conv_humo"]:checked');

      if (!mascotas || !clima || !audio || !humo) {
        if (errorMsgConv) errorMsgConv.style.display = 'block';
        return;
      }

      if (errorMsgConv) errorMsgConv.style.display = 'none';

      var data = {
        configurado: true,
        mascotas: mascotas.value,
        climatizacion: clima.value,
        audio: audio.value,
        humo: humo.value,
        salud: {
          refrigeracionMedica: Boolean(document.getElementById('conv-refrigeracion-medica')?.checked),
          alergiaAlimentos: Boolean(document.getElementById('conv-alergia-alimentos')?.checked),
          sensibilidadOlores: Boolean(document.getElementById('conv-sensibilidad-olores')?.checked)
        },
        fecha: new Date().toISOString()
      };

      if (inputConv) {
        inputConv.value = JSON.stringify(data);
      }

      renderizarChipsConvivencia(data);
      cerrarModalConvivencia();
      actualizarProgreso();
      mostrarToast('Condiciones de convivencia configuradas.');
    });
  }

  // Restaurar de borrador si existe en localStorage
  try {
    var rawDraft = localStorage.getItem('postulacion_borrador_uleam');
    if (rawDraft) {
      var draft = JSON.parse(rawDraft);
      if (draft.condicionesConvivencia && draft.condicionesConvivencia.configurado) {
        if (inputConv) inputConv.value = JSON.stringify(draft.condicionesConvivencia);
        renderizarChipsConvivencia(draft.condicionesConvivencia);
        restaurarValoresEnModal(draft.condicionesConvivencia);
      }
    }
  } catch (err) {}

  // --------------------------------------------------------------------------
  // GUARDAR BORRADOR EN LOCALSTORAGE
  // --------------------------------------------------------------------------
  var btnDraft = document.getElementById('btn-save-draft');
  if (btnDraft) {
    btnDraft.addEventListener('click', function () {
      // VARIABLE 'data': Objeto con el estado actual del formulario.
      var data = recolectarDatosPostulacion();
      try {
        localStorage.setItem('postulacion_borrador_uleam', JSON.stringify(data));
        mostrarToast('Borrador guardado localmente con éxito.');
      } catch (err) {
        mostrarToast('Datos listos en memoria.');
      }
    });
  }

  // --------------------------------------------------------------------------
  // VISOR MODAL DE JSON CRUDO
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // 4. INTERCEPCIÓN DEL ENVÍO DEL FORMULARIO Y VALIDACIÓN INTEGRAL
  // --------------------------------------------------------------------------
  var form = document.getElementById('form-postulacion');
  if (form) {
    form.addEventListener('submit', async function (e) {
      // Previene el refresco nativo del navegador
      e.preventDefault();

      // VARIABLE 'data': Objeto con los datos recolectados de todos los campos
      var data = recolectarDatosPostulacion();

      // VARIABLE 'listaExistente':
      // Arreglo de solicitudes previas inyectadas desde el servidor en el atributo HTML
      var listaExistente = [];
      try {
        listaExistente = JSON.parse(
          form.getAttribute('data-postulaciones-existentes') || '[]'
        );
      } catch (err) {}

      // PASO 1: Ejecutar la validación modular (campos, formatos y duplicados)
      var validacion = validarPostulacionCompleta(
        data,
        archivosCargados,
        listaExistente
      );

      // Si falla la validación (campos vacíos, archivos pesados o cédula ya registrada):
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

      // PASO 2: Disparar modal de carga ("Cargando postulación... Cifrando expediente")
      window.dispatchEvent(new CustomEvent('iniciar-envio-postulacion'));

      // Deshabilitar botón para evitar envíos múltiples por doble clic
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Enviando postulación...';
      }

      // PASO 3: Petición HTTP asíncrona hacia el endpoint de Astro
      try {
        var response = await fetch('/api/postulaciones/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await response.json();

        // Si el servidor detectó que la cédula ya existe (HTTP 409 Conflict):
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

        // PASO 4: Si la creación fue exitosa (HTTP 200 OK):
        if (result.success) {
          // Dispara el evento que inicia el visto verde fluido y sonido tipo app bancaria
          window.dispatchEvent(
            new CustomEvent('postulacion-exitosa', {
              detail: { codigo: result.postulacion.id }
            })
          );

          try {
            localStorage.setItem('postulacion_final_uleam', JSON.stringify(result.postulacion));
          } catch (err) {}

          // Redirección de respaldo por si el navegador bloquea la navegación automática
          setTimeout(function () {
            if (!window.location.pathname.includes('/postulado')) {
              window.location.href = '/postulado?id=' + encodeURIComponent(result.postulacion.id);
            }
          }, 1800);
        } else {
          // Error controlado retornado por el servidor
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
        // Error de conexión de red o caída del servidor
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
        // Restablecer botón al terminar el proceso
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
})();
