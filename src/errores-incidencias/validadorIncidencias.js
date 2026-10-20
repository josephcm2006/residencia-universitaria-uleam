/**
 * ============================================================================
 * VALIDADOR DE REPORTES DE INCIDENCIA Y SOLICITUDES DE RESIDENCIA
 * ============================================================================
 * Ubicación: src/errores-incidencias/validadorIncidencias.js
 * 
 * Reglas de validación:
 * 1. Categoría: Debe pertenecer a la lista oficial de áreas de mantenimiento.
 * 2. Nivel de Urgencia: 'Baja' | 'Media' | 'Alta' | 'Urgente'.
 * 3. Asunto: Obligatorio, longitud entre 5 y 80 caracteres.
 * 4. Descripción: Obligatoria, longitud mínima de 15 caracteres para detallar el problema.
 * 5. Evidencias/Archivos: Formatos admitidos (jpg, jpeg, png, webp, pdf), máximo 10 MB.
 */

// Categorías institucionales de mantenimiento
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

// Niveles de urgencia admitidos
export const URGENCIAS_VALIDAS = ['Baja', 'Media', 'Alta', 'Urgente'];

// Extensiones y tamaño máximo de evidencias
export const EXTENSIONES_EVIDENCIA = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
export const MAX_TAMANO_EVIDENCIA_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Valida un archivo individual de evidencia fotográfica o documental.
 * @param {File|Object} archivo - Archivo seleccionado o metadata.
 * @returns {string|null} Mensaje de error si no es válido, o null si es correcto.
 */
export function validarArchivoEvidencia(archivo) {
  if (!archivo) return null;

  const nombre = archivo.name || archivo.nombreArchivo || '';
  const extension = nombre.split('.').pop().toLowerCase();

  if (!EXTENSIONES_EVIDENCIA.includes(extension)) {
    return `El archivo "${nombre}" tiene formato no admitido (.${extension}). Solo se permiten: ${EXTENSIONES_EVIDENCIA.join(', ')}.`;
  }

  const tamano = archivo.size || 0;
  if (tamano > MAX_TAMANO_EVIDENCIA_BYTES) {
    const mb = (tamano / (1024 * 1024)).toFixed(1);
    return `El archivo "${nombre}" pesa ${mb} MB y supera el límite permitido de 10 MB.`;
  }

  return null;
}

/**
 * Valida todos los campos de un reporte de incidencia antes de guardarlo.
 * @param {Object} datos - Objeto con { categoria, urgencia, asunto, descripcion, evidencias }
 * @returns {Object} { esValido: boolean, errores: string[], primerError: string|null }
 */
export function validarReporteIncidencia(datos = {}) {
  const errores = [];

  // 1. Validar Categoría
  const categoria = String(datos.categoria || '').trim();
  if (!categoria) {
    errores.push('Debes seleccionar una categoría para clasificar el tipo de incidencia.');
  } else if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    errores.push('La categoría seleccionada no es válida.');
  }

  // 2. Validar Nivel de Urgencia
  const urgencia = String(datos.urgencia || '').trim();
  if (!urgencia) {
    errores.push('Debes indicar el nivel de urgencia de la incidencia.');
  } else if (!URGENCIAS_VALIDAS.includes(urgencia)) {
    errores.push('El nivel de urgencia seleccionado no es válido.');
  }

  // 3. Validar Asunto
  const asunto = String(datos.asunto || '').trim();
  if (!asunto) {
    errores.push('El asunto o título breve del reporte es obligatorio.');
  } else if (asunto.length < 5) {
    errores.push('El asunto debe contener al menos 5 caracteres.');
  } else if (asunto.length > 80) {
    errores.push('El asunto no puede exceder los 80 caracteres.');
  }

  // 4. Validar Descripción Detallada
  const descripcion = String(datos.descripcion || '').trim();
  if (!descripcion) {
    errores.push('La descripción detallada de la incidencia es obligatoria.');
  } else if (descripcion.length < 15) {
    errores.push('Por favor describe con más detalle la situación (mínimo 15 caracteres).');
  }

  // 5. Validar Archivos de Evidencia (si se adjuntaron)
  if (datos.archivos && Array.isArray(datos.archivos)) {
    datos.archivos.forEach((file) => {
      const err = validarArchivoEvidencia(file);
      if (err) errores.push(err);
    });
  }

  return {
    esValido: errores.length === 0,
    errores,
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
