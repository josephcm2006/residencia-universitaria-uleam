/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Validador de campos de texto, números y consentimientos
 * ============================================================================
 * UBICACIÓN: src/scripts/postulacion/validadorCampos.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este módulo se encarga de revisar los valores textuales, numéricos y selecciones
 * del formulario de solicitud de residencia. Verifica:
 * 1. Formato de cédula ecuatoriana (10 dígitos numéricos).
 * 2. Dominio del correo electrónico (@live.uleam.edu.ec o @uleam.edu.ec).
 * 3. Longitud mínima del nombre y la carrera del postulante.
 * 4. Que los integrantes del hogar sean un número entero mayor o igual a 1.
 * 5. Que el ingreso económico familiar sea un valor numérico positivo mayor a $0.
 * 6. Que las 3 declaraciones y consentimientos legales obligatorios estén marcados.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. 'validarFormatoCedula': Aplica expresión regular /^[0-9]{10}$/.
 * 2. 'validarCorreoInstitucional': Comprueba terminación del correo institucional.
 * 3. 'validarCamposFormulario': Extrae cada sub-objeto (estudiante, hogar, economia, consentimientos),
 *    evalúa cada regla condicional y añade los mensajes de error a un arreglo común.
 * 4. Retorna { esValido: boolean, errores: string[] }.
 */

/**
 * Valida que una cédula ecuatoriana tenga exactamente 10 dígitos numéricos válidos.
 * 
 * @param {string} cedula - Cadena de texto con el número de cédula ingresado.
 * @returns {boolean} Retorna true si contiene 10 dígitos del 0 al 9, false en caso contrario.
 */
export function validarFormatoCedula(cedula = '') {
  // VARIABLE 'limpia':
  // Guarda el número de cédula convertido a string y sin espacios en blanco en los extremos.
  const limpia = String(cedula).trim();

  // Expresión regular: ^ = inicio de cadena, [0-9]{10} = exactamente diez dígitos, $ = fin.
  return /^[0-9]{10}$/.test(limpia);
}

/**
 * Valida que el correo electrónico pertenezca al dominio institucional oficial de la ULEAM.
 * 
 * @param {string} correo - Dirección de correo electrónico ingresada.
 * @returns {boolean} Retorna true si finaliza en @live.uleam.edu.ec o @uleam.edu.ec.
 */
export function validarCorreoInstitucional(correo = '') {
  // VARIABLE 'limpio':
  // Guarda el correo electrónico en minúsculas y sin espacios externos para comparación estricta.
  const limpio = String(correo).trim().toLowerCase();

  // Comprueba que termine con el dominio de alumnos (@live.uleam.edu.ec) o docentes/personal (@uleam.edu.ec).
  return limpio.endsWith('@live.uleam.edu.ec') || limpio.endsWith('@uleam.edu.ec');
}

/**
 * Ejecuta todas las validaciones de los campos de texto, números y casillas de consentimiento.
 * 
 * @param {Object} datos - Objeto recolectado del formulario con la información del postulante.
 * @returns {Object} Objeto con:
 *   - esValido: boolean (true si no hay errores, false si falta algún campo obligatorio).
 *   - errores: string[] (lista de mensajes descriptivos para informar al postulante).
 */
export function validarCamposFormulario(datos = {}) {
  // VARIABLE 'errores':
  // Arreglo donde se van apilando todos los mensajes de error detectados durante la revisión.
  const errores = [];

  // VARIABLES DE DESESTRUCTURACIÓN:
  // Se extraen los sub-bloques del formulario protegiendo contra valores nulos o indefinidos.
  const estudiante = datos.estudiante || {};
  const hogar = datos.hogar || {};
  const economia = datos.situacionEconomica || {};
  const consentimientos = datos.consentimientos || {};

  // --------------------------------------------------------------------------
  // PASO 1: VALIDACIÓN DE DATOS PERSONALES DEL ESTUDIANTE
  // --------------------------------------------------------------------------
  
  // VARIABLE 'nombre': Nombre completo del postulante.
  // Regla: Obligatorio y mínimo 3 caracteres para evitar iniciales o nombres truncados.
  if (!estudiante.nombre || estudiante.nombre.trim().length < 3) {
    errores.push('El nombre completo del estudiante es obligatorio y debe tener al menos 3 caracteres.');
  }

  // VARIABLE 'cedula': Cédula de identidad ecuatoriana.
  // Regla: Obligatoria y con exactamente 10 dígitos numéricos.
  if (!estudiante.cedula || !validarFormatoCedula(estudiante.cedula)) {
    errores.push('La cédula de identidad debe contener exactamente 10 dígitos numéricos válidos.');
  }

  // VARIABLE 'correo': Correo electrónico del postulante.
  // Regla: Obligatorio y perteneciente al dominio institucional de la ULEAM.
  if (!estudiante.correo || !validarCorreoInstitucional(estudiante.correo)) {
    errores.push('El correo debe pertenecer al dominio institucional (@live.uleam.edu.ec o @uleam.edu.ec).');
  }

  // VARIABLE 'carrera': Carrera universitaria y semestre en curso.
  // Regla: Obligatoria y con al menos 4 caracteres de descripción.
  if (!estudiante.carrera || estudiante.carrera.trim().length < 4) {
    errores.push('La carrera y semestre en curso son obligatorios.');
  }

  // --------------------------------------------------------------------------
  // PASO 2: VALIDACIÓN DE LA COMPOSICIÓN DEL HOGAR
  // --------------------------------------------------------------------------
  
  // VARIABLE 'integrantes': Cantidad de miembros del núcleo familiar escrita en el formulario.
  const integrantes = hogar.integrantes ? String(hogar.integrantes).trim() : '';

  if (!integrantes) {
    errores.push('Debes especificar la cantidad de integrantes que conforman tu hogar.');
  } else {
    // VARIABLE 'numIntegrantes':
    // Extrae únicamente los dígitos de la cadena (ej: '4 personas' -> 4) en formato entero base 10.
    const numIntegrantes = parseInt(integrantes.replace(/\D/g, ''), 10);

    // Regla: No puede ser NaN ni menor a 1 (al menos debe estar el propio estudiante).
    if (isNaN(numIntegrantes) || numIntegrantes < 1) {
      errores.push('La cantidad de integrantes en el hogar debe ser al menos 1 persona.');
    }
  }

  // --------------------------------------------------------------------------
  // PASO 3: VALIDACIÓN DE LA SITUACIÓN ECONÓMICA FAMILIAR
  // --------------------------------------------------------------------------
  
  // VARIABLE 'ingresoHogar': Ingreso monetario mensual aproximado ingresado por el usuario.
  const ingresoHogar = economia.ingresoMensualHogar ? String(economia.ingresoMensualHogar).trim() : '';

  if (!ingresoHogar) {
    errores.push('Debes indicar el ingreso económico mensual aproximado de tu grupo familiar.');
  } else {
    // VARIABLE 'numIngreso':
    // Limpia símbolos como '$', comas o espacios y lo convierte a número flotante.
    const numIngreso = parseFloat(ingresoHogar.replace(/[^0-9.]/g, ''));

    // Regla: Debe ser un número válido mayor a $0 USD para evaluar quintil de beca.
    if (isNaN(numIngreso) || numIngreso <= 0) {
      errores.push('El ingreso económico mensual debe ser un valor positivo mayor a $0.');
    }
  }

  // --------------------------------------------------------------------------
  // PASO 4: VALIDACIÓN DE DECLARACIONES Y CONSENTIMIENTOS LEGALES (CHECKBOXES)
  // --------------------------------------------------------------------------
  
  // Consentimiento 1: Declaración jurada de que los documentos y datos son verdaderos.
  if (!consentimientos.autenticidad) {
    errores.push('Debes aceptar la declaración jurada de autenticidad de los documentos presentados.');
  }

  // Consentimiento 2: Autorización de tratamiento y verificación de datos por Bienestar Estudiantil.
  if (!consentimientos.tratamientoDatos) {
    errores.push('Debes autorizar el tratamiento confidencial de tus datos personales.');
  }

  // Consentimiento 3: Compromiso de respetar el reglamento interno de la residencia universitaria.
  if (!consentimientos.reglamento) {
    errores.push('Debes aceptar cumplir el reglamento interno de la residencia universitaria.');
  }

  // --------------------------------------------------------------------------
  // PASO 5: RETORNO DEL ESTADO FINAL CONSOLIDADO
  // --------------------------------------------------------------------------
  return {
    // esValido es true únicamente cuando no se agregó ningún mensaje al arreglo de errores.
    esValido: errores.length === 0,
    errores: errores
  };
}
