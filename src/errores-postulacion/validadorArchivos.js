/**
 * ============================================================================
 * VALIDADOR DE ARCHIVOS DE POSTULACIÓN
 * ============================================================================
 * Este archivo se encarga de revisar que todos los documentos adjuntos
 * cumplan con los requerimientos técnicos y de formato exigidos por la ULEAM.
 */

// Formatos permitidos oficialmente por el sistema institucional
export const FORMATOS_PERMITIDOS = ['pdf', 'jpg', 'jpeg', 'png'];

// Tamaño máximo permitido por archivo: 10 Megabytes (en bytes)
export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

/**
 * Valida la extensión y el tamaño de un único archivo.
 * @param {File|Object} archivo - Archivo nativo del navegador o referencia con nombre y tamaño.
 * @param {string} nombreCampo - Identificador descriptivo del archivo (ej. "Cédula").
 * @returns {string|null} Mensaje de error si falla la validación, o null si es válido.
 */
export function validarArchivoIndividual(archivo, nombreCampo) {
  // Si no se envió ningún archivo para revisar, no hay error de formato
  if (!archivo) return null;

  // 1. Obtener el nombre del archivo
  const nombre = archivo.name || archivo.nombreArchivo || '';
  
  // 2. Extraer la extensión del archivo y pasarla a minúsculas
  const extension = nombre.split('.').pop().toLowerCase();

  // 3. Verificar si la extensión se encuentra entre los formatos permitidos
  if (!FORMATOS_PERMITIDOS.includes(extension)) {
    return `El archivo de ${nombreCampo} tiene formato ".${extension}" no permitido. Solo se aceptan: ${FORMATOS_PERMITIDOS.join(', ')}.`;
  }

  // 4. Obtener el tamaño del archivo en bytes
  let tamanoBytes = archivo.size;
  if (!tamanoBytes && archivo.tamano) {
    // Si viene como string '1.5 MB', convertirlo aproximadamente a bytes
    const num = parseFloat(archivo.tamano);
    if (!isNaN(num)) {
      tamanoBytes = num * 1024 * 1024;
    }
  }

  // 5. Verificar que no supere el tamaño máximo de 10 MB
  if (tamanoBytes && tamanoBytes > TAMANO_MAXIMO_BYTES) {
    const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(1);
    return `El archivo de ${nombreCampo} pesa ${tamanoMB} MB, superando el límite máximo de 10 MB.`;
  }

  // Si pasó todas las pruebas, el archivo es válido
  return null;
}

/**
 * Valida el conjunto de archivos subidos por el postulante.
 * Revisa que cada archivo adjuntado tenga formato y tamaño correctos.
 * Si el estudiante no adjunta un documento, el sistema utilizará los
 * registros digitales institucionales asociados a su cuenta ULEAM.
 * 
 * @param {Object} archivosSubidos - Diccionario con los archivos cargados por el usuario.
 * @returns {Object} { esValido: boolean, errores: string[] }
 */
export function validarTodosLosArchivos(archivosSubidos = {}) {
  const errores = [];

  // Mapeo amigable para los mensajes de error
  const mapaNombres = {
    file_cedula: 'Cédula de Identidad',
    file_matricula: 'Certificado de Matrícula',
    file_hogar: 'Declaración de Núcleo Familiar',
    file_ingresos: 'Comprobante de Ingresos',
    file_egresos: 'Planilla de Servicios',
    file_accesibilidad: 'Certificado de Accesibilidad'
  };

  // Validar formato y tamaño de cada archivo que haya sido seleccionado
  for (const [claveCampo, archivo] of Object.entries(archivosSubidos)) {
    if (archivo) {
      const nombreLegible = mapaNombres[claveCampo] || claveCampo;
      const errorArchivo = validarArchivoIndividual(archivo, nombreLegible);
      if (errorArchivo) {
        errores.push(errorArchivo);
      }
    }
  }

  // Retornar resultado consolidado
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
