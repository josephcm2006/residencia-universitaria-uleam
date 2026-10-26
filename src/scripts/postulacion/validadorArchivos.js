/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Validador de formatos y tamaños de archivos adjuntos
 * ============================================================================
 * UBICACIÓN: src/scripts/postulacion/validadorArchivos.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este archivo se encarga de inspeccionar cada documento cargado por el estudiante
 * (cédula, certificado de matrícula, comprobante de ingresos, planillas, etc.)
 * para garantizar que cumpla con los formatos aceptados institucionalmente (.pdf, .jpg, .png)
 * y que no supere el tamaño máximo de 10 Megabytes por archivo.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Se define la lista blanca de extensiones permitidas y el tope en bytes.
 * 2. 'validarArchivoIndividual': Recibe un archivo, extrae su extensión, verifica si está
 *    en la lista permitida y comprueba que su peso no sobrepase los 10 MB.
 * 3. 'validarTodosLosArchivos': Itera sobre el mapa de archivos cargados en el formulario,
 *    aplica la validación individual a cada uno y acumula los mensajes de error.
 * 4. Retorna un objeto con { esValido, errores } que consume el administrador general de errores.
 */

// VARIABLE CONSTANTE 'FORMATOS_PERMITIDOS':
// Guarda el arreglo con las extensiones de archivo oficialmente admitidas por el sistema
// de Bienestar Estudiantil de la ULEAM (PDF y formatos de imagen estándar).
export const FORMATOS_PERMITIDOS = ['pdf', 'jpg', 'jpeg', 'png'];

// VARIABLE CONSTANTE 'TAMANO_MAXIMO_BYTES':
// Guarda el límite superior de peso permitido por archivo individual expresado en bytes.
// Cálculo: 10 * 1024 Kilobytes * 1024 Bytes = 10,485,760 bytes (10 Megabytes exactos).
export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/**
 * Valida la extensión y el tamaño de un único archivo adjunto.
 * 
 * @param {File|Object} archivo - Archivo nativo del navegador (File) u objeto con metadatos de archivo.
 * @param {string} nombreCampo - Nombre legible del requisito para armar mensajes claros (ej: "Cédula de Identidad").
 * @returns {string|null} Retorna una cadena con el mensaje de error si falla, o null si el archivo es válido.
 */
export function validarArchivoIndividual(archivo, nombreCampo) {
  // --------------------------------------------------------------------------
  // PASO 1: VERIFICAR SI EXISTE UN ARCHIVO SELECCIONADO
  // --------------------------------------------------------------------------
  // Si el usuario no seleccionó ningún archivo para este campo, no se genera error de formato.
  if (!archivo) return null;

  // --------------------------------------------------------------------------
  // PASO 2: EXTRAER NOMBRE Y EXTENSIÓN DEL ARCHIVO
  // --------------------------------------------------------------------------
  
  // VARIABLE 'nombre':
  // Guarda el nombre del archivo recibido, soportando tanto la propiedad estándar 'name'
  // de la Web File API como la propiedad 'nombreArchivo' de borradores serializados.
  const nombre = archivo.name || archivo.nombreArchivo || '';

  // VARIABLE 'extension':
  // Guarda la extensión del archivo extrayendo el texto después del último punto
  // y convirtiéndolo a minúsculas (ej: 'Foto.PNG' -> 'png').
  const extension = nombre.split('.').pop().toLowerCase();

  // --------------------------------------------------------------------------
  // PASO 3: VALIDAR CONTRA LISTA BLANCA DE FORMATOS
  // --------------------------------------------------------------------------
  // Si la extensión no existe en el arreglo FORMATOS_PERMITIDOS, se rechaza de inmediato.
  if (!FORMATOS_PERMITIDOS.includes(extension)) {
    return `El archivo de ${nombreCampo} tiene formato ".${extension}" no permitido. Solo se aceptan: ${FORMATOS_PERMITIDOS.join(', ')}.`;
  }

  // --------------------------------------------------------------------------
  // PASO 4: OBTENER Y CONVERTIR TAMAÑO DEL ARCHIVO A BYTES
  // --------------------------------------------------------------------------
  
  // VARIABLE 'tamanoBytes':
  // Guarda el tamaño numérico del archivo en bytes.
  let tamanoBytes = archivo.size;

  // Si el tamaño no viene como número nativo sino como texto guardado (ej: '2.5 MB'):
  if (!tamanoBytes && archivo.tamano) {
    const num = parseFloat(archivo.tamano);
    if (!isNaN(num)) {
      // Convierte el valor aproximado a bytes
      tamanoBytes = num * 1024 * 1024;
    }
  }

  // --------------------------------------------------------------------------
  // PASO 5: VALIDAR LÍMITE DE TAMAÑO (MÁXIMO 10 MB)
  // --------------------------------------------------------------------------
  // Si el archivo supera el límite de 10 MB (10,485,760 bytes), se genera error explicativo.
  if (tamanoBytes && tamanoBytes > TAMANO_MAXIMO_BYTES) {
    // VARIABLE 'tamanoMB':
    // Guarda el peso formateado a un decimal para que el usuario entienda cuánto se excedió.
    const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(1);
    return `El archivo de ${nombreCampo} pesa ${tamanoMB} MB, superando el límite máximo de 10 MB.`;
  }

  // Si superó todas las pruebas técnicas de extensión y tamaño, el archivo es 100% válido.
  return null;
}

/**
 * Valida el conjunto completo de archivos subidos en el formulario de postulación.
 * 
 * @param {Object} archivosSubidos - Diccionario con los archivos donde la clave es el input name.
 * @returns {Object} Objeto consolidado con:
 *   - esValido: boolean (true si todos los archivos adjuntos son correctos, false si al menos uno falla).
 *   - errores: string[] (arreglo con todos los mensajes de error acumulados).
 */
export function validarTodosLosArchivos(archivosSubidos = {}) {
  // VARIABLE 'errores':
  // Arreglo donde se van acumulando las descripciones de error encontradas en cada archivo.
  const errores = [];

  // VARIABLE 'mapaNombres':
  // Diccionario que traduce el atributo 'name' del input HTML a un nombre institucional
  // formal y legible para el estudiante en los mensajes de la interfaz de usuario.
  const mapaNombres = {
    file_cedula: 'Cédula de Identidad',
    file_matricula: 'Certificado de Matrícula',
    file_hogar: 'Declaración de Núcleo Familiar',
    file_ingresos: 'Comprobante de Ingresos',
    file_egresos: 'Planilla de Servicios',
    file_accesibilidad: 'Certificado de Accesibilidad'
  };

  // --------------------------------------------------------------------------
  // PASO 1: ITERAR Y VALIDAR CADA ARCHIVO ADJUNTO
  // --------------------------------------------------------------------------
  for (const [claveCampo, archivo] of Object.entries(archivosSubidos)) {
    if (archivo) {
      // VARIABLE 'nombreLegible':
      // Obtiene el nombre institucional traducido o usa la clave como fallback.
      const nombreLegible = mapaNombres[claveCampo] || claveCampo;

      // VARIABLE 'errorArchivo':
      // Ejecuta la validación técnica sobre el archivo específico.
      const errorArchivo = validarArchivoIndividual(archivo, nombreLegible);

      // Si falló, agrega el mensaje al listado general de errores
      if (errorArchivo) {
        errores.push(errorArchivo);
      }
    }
  }

  // --------------------------------------------------------------------------
  // PASO 2: RETORNO DEL ESTADO FINAL CONSOLIDADO
  // --------------------------------------------------------------------------
  return {
    esValido: errores.length === 0,
    errores: errores
  };
}

export default {
  FORMATOS_PERMITIDOS,
  TAMANO_MAXIMO_BYTES,
  validarArchivoIndividual,
  validarTodosLosArchivos
};
