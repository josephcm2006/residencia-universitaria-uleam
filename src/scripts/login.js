/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/index.astro (Ruta: /)
 * TIPO: Script de cliente y validación para el modal de inicio de sesión (Login)
 * ============================================================================
 * UBICACIÓN: src/scripts/login.js
 * 
 * PROPÓSITO:
 * Controla la interacción del modal de Microsoft 365 y valida los datos
 * ingresados en el formulario antes de enviarlos al servidor.
 * 
 * FLUJO GENERAL:
 * 1. Abrir/Cerrar la ventana modal al hacer clic en los botones o presionar Escape.
 * 2. Autocompletar credenciales de prueba (Estudiante / Administrador).
 * 3. Mostrar/Ocultar el texto de la contraseña mediante el botón con ícono de ojo.
 * 4. VALIDACIÓN DE FORMULARIO:
 *    - Comprueba que el correo no esté en blanco.
 *    - Comprueba que el correo tenga formato válido (@).
 *    - Comprueba que la contraseña no esté en blanco.
 * 5. Envío de datos al endpoint /api/auth/login mediante fetch asíncrono.
 * 6. Redirección automática según el rol (Estudiante -> /portal-init, Admin -> /dashboard).
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // REFERENCIAS A ELEMENTOS DEL DOM
  // --------------------------------------------------------------------------
  // modal: Contenedor overlay de la ventana de login
  const modal = document.getElementById('ms-login-modal');
  // form: Formulario HTML que contiene los campos de correo y contraseña
  const form = document.getElementById('ms-login-form');
  // inputEmail: Campo de texto para el correo institucional
  const inputEmail = document.getElementById('ms-input-email');
  // inputPassword: Campo de texto para la contraseña
  const inputPassword = document.getElementById('ms-input-password');
  // btnTogglePwd: Botón para mostrar u ocultar los caracteres de la contraseña
  const btnTogglePwd = document.getElementById('btn-toggle-password');
  // eyeIcon: Elemento que muestra el emoji 👁️ o 🙈
  const eyeIcon = document.getElementById('pwd-icon-eye');
  // alertBox: Caja visual de mensajes de alerta o error
  const alertBox = document.getElementById('ms-alert');
  // alertText: Etiqueta de texto donde se escribe el mensaje de alerta
  const alertText = document.getElementById('ms-alert-text');
  // btnSubmit: Botón principal de "Iniciar sesión"
  const btnSubmit = document.getElementById('btn-submit-ms');
  // btnFillNewStudent: Botón de acceso rápido para estudiante nuevo sin postular
  const btnFillNewStudent = document.getElementById('btn-fill-new-student-creds');
  // btnFillStudent: Botón de acceso rápido con credenciales de estudiante
  const btnFillStudent = document.getElementById('btn-fill-student-creds');
  // btnFillAdmin: Botón de acceso rápido con credenciales de administrador
  const btnFillAdmin = document.getElementById('btn-fill-admin-creds');
  // btnClose: Botón con la 'X' para cerrar la ventana modal
  const btnClose = document.getElementById('btn-close-ms-modal');
  // btnCancel: Botón secundario de cancelar
  const btnCancel = document.getElementById('btn-cancel-ms');

  // --------------------------------------------------------------------------
  // FUNCIONES DE CONTROL DE LA ALERTA VISUAL
  // --------------------------------------------------------------------------

  /**
   * Muestra un mensaje en pantalla al usuario (error o éxito).
   * @param {string} mensaje - Texto descriptivo del resultado.
   * @param {boolean} esExito - true para alerta verde, false para advertencia amarilla.
   */
  function mostrarAlerta(mensaje, esExito = false) {
    if (!alertBox || !alertText) return;

    alertText.textContent = mensaje;
    alertBox.style.display = 'flex';

    const icon = alertBox.querySelector('.ms-alert-icon');
    if (esExito) {
      alertBox.classList.add('success');
      if (icon) icon.textContent = '✅';
    } else {
      alertBox.classList.remove('success');
      if (icon) icon.textContent = '⚠️';
    }
  }

  /**
   * Oculta la caja de alertas y limpia su estado.
   */
  function ocultarAlerta() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
    alertBox.classList.remove('success');
  }

  // --------------------------------------------------------------------------
  // FUNCIONES DE CONTROL DE LA VENTANA MODAL
  // --------------------------------------------------------------------------

  /**
   * Abre la ventana modal de inicio de sesión.
   */
  function abrirModal() {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    ocultarAlerta();

    // Coloca el foco en el campo de texto correspondiente
    setTimeout(() => {
      if (inputEmail && !inputEmail.value) {
        inputEmail.focus();
      } else if (inputPassword) {
        inputPassword.focus();
      }
    }, 50);
  }

  /**
   * Cierra la ventana modal de inicio de sesión.
   */
  function cerrarModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    ocultarAlerta();
  }

  // Exponer las funciones globalmente en window para llamadas desde botones HTML
  window.openMicrosoftModal = abrirModal;
  window.closeMicrosoftModal = cerrarModal;

  // --------------------------------------------------------------------------
  // EVENTOS DE NAVEGACIÓN Y CIERRE
  // --------------------------------------------------------------------------

  // Abrir modal con cualquier botón que tenga el selector [data-open-ms-modal] o id
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#btn-open-microsoft-login, .btn-microsoft, [data-open-ms-modal]');
    if (trigger) {
      e.preventDefault();
      abrirModal();
    }
  });

  // Cerrar al hacer clic en 'X' o 'Cancelar'
  if (btnClose) btnClose.addEventListener('click', cerrarModal);
  if (btnCancel) btnCancel.addEventListener('click', cerrarModal);

  // Cerrar si se hace clic fuera del contenido (en el fondo oscuro)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  }

  // Cerrar con la tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      cerrarModal();
    }
  });

  // --------------------------------------------------------------------------
  // ACCESO RÁPIDO CON CREDENCIALES DE PRUEBA (DEMO)
  // --------------------------------------------------------------------------

  // Rellenar datos de estudiante nuevo sin postulación previa
  if (btnFillNewStudent) {
    btnFillNewStudent.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputEmail) inputEmail.value = 'e1318765432@live.uleam.edu.ec';
      if (inputPassword) {
        inputPassword.value = 'contraUSER123';
        inputPassword.focus();
      }
      ocultarAlerta();
    });
  }

  // Rellenar datos de estudiante
  if (btnFillStudent) {
    btnFillStudent.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputEmail) inputEmail.value = 'e0953920949@live.uleam.edu.ec';
      if (inputPassword) {
        inputPassword.value = 'contraUSER123';
        inputPassword.focus();
      }
      ocultarAlerta();
    });
  }

  // Rellenar datos de administrador
  if (btnFillAdmin) {
    btnFillAdmin.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputEmail) inputEmail.value = 'admin.residencia@uleam.edu.ec';
      if (inputPassword) {
        inputPassword.value = 'contraADMIN123';
        inputPassword.focus();
      }
      ocultarAlerta();
    });
  }

  // --------------------------------------------------------------------------
  // MOSTRAR U OCULTAR CONTRASEÑA
  // --------------------------------------------------------------------------
  if (btnTogglePwd && inputPassword) {
    btnTogglePwd.addEventListener('click', (e) => {
      e.preventDefault();
      const esPassword = inputPassword.type === 'password';
      inputPassword.type = esPassword ? 'text' : 'password';
      if (eyeIcon) eyeIcon.textContent = esPassword ? '-' : '👁️';
    });
  }

  // --------------------------------------------------------------------------
  // FUNCIÓN DE VALIDACIÓN DEL FORMULARIO
  // --------------------------------------------------------------------------
  /**
   * Valida de manera sencilla y clara que los campos cumplan los requisitos básicos:
   * 1. Que el correo no esté vacío.
   * 2. Que tenga formato de correo con '@'.
   * 3. Que la contraseña no esté vacía.
   * 
   * @param {string} email - Correo ingresado por el usuario.
   * @param {string} password - Contraseña ingresada.
   * @returns {string|null} - Retorna el texto del error si falla, o null si es válido.
   */
  function validarCredenciales(email, password) {
    // Validación 1: Correo vacío
    if (!email || email.trim() === '') {
      return 'Por favor ingresa tu correo institucional ULEAM.';
    }

    // Validación 2: Formato de correo básico
    if (!email.includes('@')) {
      return 'Ingresa un correo institucional válido (ej: e0953920949@live.uleam.edu.ec).';
    }

    // Validación 3: Contraseña vacía
    if (!password || password.trim() === '') {
      return 'Por favor ingresa tu contraseña institucional.';
    }

    // Si pasa todas las validaciones, retorna null (sin errores)
    return null;
  }

  // --------------------------------------------------------------------------
  // PROCESAMIENTO DEL ENVÍO DEL FORMULARIO (SUBMIT)
  // --------------------------------------------------------------------------
  if (form) {
    form.addEventListener('submit', async (e) => {
      // Prevenir la recarga tradicional de la página
      e.preventDefault();
      ocultarAlerta();

      // Obtener los valores limpios de los campos
      const email = (inputEmail ? inputEmail.value : '').trim();
      const password = inputPassword ? inputPassword.value : '';

      // EJECUTAR VALIDACIÓN
      const errorValidacion = validarCredenciales(email, password);
      if (errorValidacion) {
        mostrarAlerta(errorValidacion, false);
        if (!email && inputEmail) inputEmail.focus();
        else if (!password && inputPassword) inputPassword.focus();
        return; // Detener el flujo si la validación no pasó
      }

      // Cambiar estado visual del botón a "Procesando..."
      if (btnSubmit) {
        btnSubmit.disabled = true;
        const btnText = btnSubmit.querySelector('.btn-text');
        const btnSpinner = btnSubmit.querySelector('.btn-spinner');
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-flex';
      }

      try {
        // Enviar credenciales al endpoint de login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Éxito: Guardar sesión en localStorage y redirigir
          mostrarAlerta('¡Autenticación exitosa! Redirigiendo...', true);

          if (data.user) {
            try {
              localStorage.setItem('uleam_session', JSON.stringify(data.user));
            } catch (storageErr) {
              console.warn('No se pudo guardar en localStorage:', storageErr);
            }
          }

          // Redirección inmediata según la ruta devuelta por el servidor
          setTimeout(() => {
            window.location.href = data.redirectTo || '/portal-init';
          }, 400);
        } else {
          // Credenciales incorrectas u otro error del servidor
          mostrarAlerta(data.message || 'Correo o contraseña incorrectos.', false);
          restaurarBotonSubmit();
        }
      } catch (err) {
        // Error de conexión o red
        mostrarAlerta('Error de conexión con el servidor. Intente nuevamente.', false);
        restaurarBotonSubmit();
      }
    });
  }

  /**
   * Restaura el botón de envío a su estado activo original.
   */
  function restaurarBotonSubmit() {
    if (!btnSubmit) return;
    btnSubmit.disabled = false;
    const btnText = btnSubmit.querySelector('.btn-text');
    const btnSpinner = btnSubmit.querySelector('.btn-spinner');
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }

  // --------------------------------------------------------------------------
  // AUTO-APERTURA SI LA URL CONTIENE PARÁMETROS
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login') === 'microsoft' || urlParams.get('requireAuth') === '1') {
    abrirModal();
    if (urlParams.get('requireAuth') === '1') {
      mostrarAlerta('Por favor inicia sesión con tu cuenta institucional para ingresar al portal.', false);
    }
  }
});
