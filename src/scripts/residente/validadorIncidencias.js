/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/residente-dashboard.astro (Ruta: /residente-dashboard)
 * TIPO: Validación de formulario para tickets y reportes de incidencia
 * ============================================================================
 * UBICACIÓN: src/scripts/residente/validadorIncidencias.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este archivo se encarga de auditar y garantizar la veracidad de los datos
 * suministrados por un residente cuando levanta un ticket de mantenimiento o
 * reporta una avería en su dormitorio (plomería, electricidad, cerraduras, etc.).
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Define listas maestras de categorías admitidas y niveles de urgencia.
 * 2. 'validarArchivoEvidencia': Revisa individualmente que cada foto o evidencia
 *    cumpla con las extensiones (.jpg, .jpeg, .png, .webp, .pdf) y tamaño <= 10MB.
 * 3. 'validarReporteIncidencia':
 *    - Comprueba que la categoría seleccionada sea oficial.
 *    - Comprueba que el nivel de urgencia esté entre los 4 válidos.
 *    - Verifica que el asunto tenga entre 5 y 80 caracteres.
 *    - Comprueba que la descripción tenga al menos 15 caracteres descriptivos.
 *    - Valida cada archivo adjunto si el estudiante subió evidencias.
 * 4. Retorna { esValido, errores, primerError }.
 */

// VARIABLE CONSTANTE 'CATEGORIAS_VALIDAS':
// Guarda el catálogo oficial de áreas de atención y mantenimiento admitidas por la ULEAM.
export const CATEGORIAS_VALIDAS = [
  'Plomería y Agua',
  'Electricidad e Iluminación',
  'Mobiliario y Equipamiento',
  'Conectividad Wi-Fi',
  'Cerrajería y Accesos',
  'Climatización y Aire',
  'Convivencia y Ruido',
  'Limpieza y Áreas Comunes',
  'Otro'
];

// VARIABLE CONSTANTE 'URGENCIAS_VALIDAS':
// Guarda los 4 niveles de prioridad reconocidos por el departamento de mantenimiento técnico.
export const URGENCIAS_VALIDAS = ['Baja', 'Media', 'Alta', 'Urgente'];

// VARIABLE CONSTANTE 'EXTENSIONES_EVIDENCIA':
// Guarda las extensiones de archivos fotográficos y documentales autorizados.
export const EXTENSIONES_EVIDENCIA = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

// VARIABLE CONSTANTE 'MAX_TAMANO_EVIDENCIA_BYTES':
// Guarda el tope máximo en bytes admitido por cada evidencia fotográfica (10 MB).
export const MAX_TAMANO_EVIDENCIA_BYTES = 10 * 1024 * 1024;

/**
 * Valida un archivo individual de evidencia fotográfica o documento adjunto.
 * 
 * @param {File|Object} archivo - Objeto File nativo o referencia guardada en memoria.
 * @returns {string|null} Retorna mensaje de error si no cumple las reglas, o null si es válido.
 */
export function validarArchivoEvidencia(archivo) {
  // Si no se pasó archivo para revisar, no genera error
  if (!archivo) return null;

  // VARIABLE 'nombre': Extrae el nombre del archivo.
  const nombre = archivo.name || archivo.nombreArchivo || '';

  // VARIABLE 'extension': Extrae la extensión final convertida a minúsculas.
  const extension = nombre.split('.').pop().toLowerCase();

  // PASO 1: Comprobar extensión contra la lista autorizada
  if (!EXTENSIONES_EVIDENCIA.includes(extension)) {
    return `El archivo "${nombre}" tiene formato no admitido (.${extension}). Solo se permiten: ${EXTENSIONES_EVIDENCIA.join(', ')}.`;
  }

  // VARIABLE 'tamano': Peso en bytes del archivo.
  const tamano = archivo.size || 0;

  // PASO 2: Comprobar límite de peso (10 MB)
  if (tamano > MAX_TAMANO_EVIDENCIA_BYTES) {
    const mb = (tamano / (1024 * 1024)).toFixed(1);
    return `El archivo "${nombre}" pesa ${mb} MB y supera el límite permitido de 10 MB.`;
  }

  // Pasa la validación técnica
  return null;
}

/**
 * Valida todos los campos de un reporte de incidencia antes de guardarlo en base de datos.
 * 
 * @param {Object} datos - Objeto recolectado del formulario de incidencias:
 *   { categoria, urgencia, asunto, descripcion, archivos }
 * @returns {Object} Diagnóstico con { esValido: boolean, errores: string[], primerError: string|null }
 */
export function validarReporteIncidencia(datos = {}) {
  // VARIABLE 'errores':
  // Acumula la lista de fallos encontrados en los campos del reporte.
  const errores = [];

  // --------------------------------------------------------------------------
  // PASO 1: VALIDAR CATEGORÍA SELECCIONADA
  // --------------------------------------------------------------------------
  // VARIABLE 'categoria': Categoría seleccionada por el estudiante sin espacios sobrantes.
  const categoria = String(datos.categoria || '').trim();

  if (!categoria) {
    errores.push('Debes seleccionar una categoría para clasificar el tipo de incidencia.');
  } else if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    errores.push('La categoría seleccionada no es válida.');
  }

  // --------------------------------------------------------------------------
  // PASO 2: VALIDAR NIVEL DE URGENCIA
  // --------------------------------------------------------------------------
  // VARIABLE 'urgencia': Nivel de urgencia elegido (Baja, Media, Alta o Urgente).
  const urgencia = String(datos.urgencia || '').trim();

  if (!urgencia) {
    errores.push('Debes indicar el nivel de urgencia de la incidencia.');
  } else if (!URGENCIAS_VALIDAS.includes(urgencia)) {
    errores.push('El nivel de urgencia seleccionado no es válido.');
  }

  // --------------------------------------------------------------------------
  // PASO 3: VALIDAR ASUNTO O TÍTULO BREVE
  // --------------------------------------------------------------------------
  // VARIABLE 'asunto': Título descriptivo breve del ticket.
  const asunto = String(datos.asunto || '').trim();

  if (!asunto) {
    errores.push('El asunto o título breve del reporte es obligatorio.');
  } else if (asunto.length < 5) {
    errores.push('El asunto debe contener al menos 5 caracteres.');
  } else if (asunto.length > 80) {
    errores.push('El asunto no puede exceder los 80 caracteres.');
  }

  // --------------------------------------------------------------------------
  // PASO 4: VALIDAR DESCRIPCIÓN DETALLADA DEL PROBLEMA
  // --------------------------------------------------------------------------
  // VARIABLE 'descripcion': Explicación pormenorizada del incidente.
  const descripcion = String(datos.descripcion || '').trim();

  if (!descripcion) {
    errores.push('La descripción detallada de la incidencia es obligatoria.');
  } else if (descripcion.length < 15) {
    errores.push('Por favor describe con más detalle la situación (mínimo 15 caracteres).');
  }

  // --------------------------------------------------------------------------
  // PASO 5: VALIDAR ARCHIVOS DE EVIDENCIA ADJUNTOS (SI EXISTEN)
  // --------------------------------------------------------------------------
  if (datos.archivos && Array.isArray(datos.archivos)) {
    datos.archivos.forEach((file) => {
      // VARIABLE 'err': Error retornado por la validación del archivo.
      const err = validarArchivoEvidencia(file);
      if (err) errores.push(err);
    });
  }

  // --------------------------------------------------------------------------
  // PASO 6: RETORNO DEL ESTADO FINAL CONSOLIDADO
  // --------------------------------------------------------------------------
  return {
    esValido: errores.length === 0,
    errores: errores,
    primerError: errores[0] || null
  };
}

export default {
  CATEGORIAS_VALIDAS,
  URGENCIAS_VALIDAS,
  EXTENSIONES_EVIDENCIA,
  validarArchivoEvidencia,
  validarReporteIncidencia
};
