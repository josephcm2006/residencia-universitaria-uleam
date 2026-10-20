/**
 * ============================================================================
 * VALIDADOR DE CAMPOS DEL FORMULARIO DE POSTULACIÓN
 * ============================================================================
 * Este archivo se encarga de verificar que la información escrita por el
 * estudiante en cada sección del formulario sea coherente, no esté vacía
 * y cumpla con las políticas de admisión a la residencia universitaria.
 */

/**
 * Valida que una cédula ecuatoriana tenga 10 dígitos numéricos válidos.
 * @param {string} cedula - Número de cédula ingresado.
 * @returns {boolean} True si es válida, False en caso contrario.
 */
export function validarFormatoCedula(cedula = '') {
  const limpia = String(cedula).trim();
  // Debe contener exactamente 10 dígitos numéricos
  return /^[0-9]{10}$/.test(limpia);
}

/**
 * Valida que el correo sea una dirección institucional válida de la ULEAM.
 * @param {string} correo - Correo electrónico ingresado.
 * @returns {boolean} True si contiene el dominio institucional.
 */
export function validarCorreoInstitucional(correo = '') {
  const limpio = String(correo).trim().toLowerCase();
  return limpio.endsWith('@live.uleam.edu.ec') || limpio.endsWith('@uleam.edu.ec');
}

/**
 * Ejecuta todas las validaciones de los campos de texto, números y consentimientos.
 * 
 * @param {Object} datos - Objeto con los datos recolectados del formulario.
 * @returns {Object} { esValido: boolean, errores: string[] }
 */
export function validarCamposFormulario(datos = {}) {
  const errores = [];

  const estudiante = datos.estudiante || {};
  const hogar = datos.hogar || {};
  const economia = datos.situacionEconomica || {};
  const consentimientos = datos.consentimientos || {};

  // -------------------------------------------------------------
  // 1. VALIDACIÓN DE DATOS DEL ESTUDIANTE
  // -------------------------------------------------------------
  if (!estudiante.nombre || estudiante.nombre.trim().length < 3) {
    errores.push('El nombre completo del estudiante es obligatorio y debe tener al menos 3 caracteres.');
  }

  if (!estudiante.cedula || !validarFormatoCedula(estudiante.cedula)) {
    errores.push('La cédula de identidad debe contener exactamente 10 dígitos numéricos válidos.');
  }

  if (!estudiante.correo || !validarCorreoInstitucional(estudiante.correo)) {
    errores.push('El correo debe pertenecer al dominio institucional (@live.uleam.edu.ec o @uleam.edu.ec).');
  }

  if (!estudiante.carrera || estudiante.carrera.trim().length < 4) {
    errores.push('La carrera y semestre en curso son obligatorios.');
  }

  // -------------------------------------------------------------
  // 2. VALIDACIÓN DE COMPOSICIÓN DEL HOGAR
  // -------------------------------------------------------------
  const integrantes = hogar.integrantes ? String(hogar.integrantes).trim() : '';
  if (!integrantes) {
    errores.push('Debes especificar la cantidad de integrantes que conforman tu hogar.');
  } else {
    // Si escribió solo un número o texto, verificar que tenga al menos un número mayor a 0
    const numIntegrantes = parseInt(integrantes.replace(/\D/g, ''), 10);
    if (isNaN(numIntegrantes) || numIntegrantes < 1) {
      errores.push('La cantidad de integrantes en el hogar debe ser al menos 1 persona.');
    }
  }

  // -------------------------------------------------------------
  // 3. VALIDACIÓN DE SITUACIÓN ECONÓMICA
  // -------------------------------------------------------------
  const ingresoHogar = economia.ingresoMensualHogar ? String(economia.ingresoMensualHogar).trim() : '';
  if (!ingresoHogar) {
    errores.push('Debes indicar el ingreso económico mensual aproximado de tu grupo familiar.');
  } else {
    const numIngreso = parseFloat(ingresoHogar.replace(/[^0-9.]/g, ''));
    if (isNaN(numIngreso) || numIngreso <= 0) {
      errores.push('El ingreso económico mensual debe ser un valor positivo mayor a $0.');
    }
  }

  // -------------------------------------------------------------
  // 4. VALIDACIÓN DE DECLARACIONES Y CONSENTIMIENTOS (CHECKBOXES)
  // -------------------------------------------------------------
  if (!consentimientos.autenticidad) {
    errores.push('Debes aceptar la declaración jurada de autenticidad de los documentos presentados.');
  }

  if (!consentimientos.tratamientoDatos) {
    errores.push('Debes autorizar el tratamiento confidencial de tus datos personales.');
  }

  if (!consentimientos.reglamento) {
    errores.push('Debes aceptar cumplir el reglamento interno de la residencia universitaria.');
  }

  // -------------------------------------------------------------
  // RETORNO DEL ESTADO FINAL
  // -------------------------------------------------------------
  return {
    esValido: errores.length === 0,
    errores: errores
  };
}
