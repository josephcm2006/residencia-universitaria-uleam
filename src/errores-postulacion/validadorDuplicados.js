/**
 * ============================================================================
 * VALIDADOR DE POSTULACIONES DUPLICADAS
 * ============================================================================
 * Regla institucional: Cada estudiante universitario solo tiene permitido
 * presentar UNA (1) solicitud de residencia por periodo académico.
 * Si ya existe un registro con su cédula o correo, el sistema debe impedirlo
 * y alertar al usuario con un mensaje claro.
 */

/**
 * Revisa si los datos del postulante ya figuran en la lista de solicitudes existentes.
 * 
 * @param {Object} estudiante - Objeto con { cedula, correo } del estudiante postulante.
 * @param {Array} listaPostulaciones - Arreglo de postulaciones ya almacenadas en el sistema.
 * @returns {Object} { esDuplicado: boolean, mensaje: string, postulacionExistente: Object|null }
 */
export function verificarPostulacionDuplicada(estudiante = {}, listaPostulaciones = []) {
  // Limpiar y normalizar los valores para una comparación exacta
  const cedulaPostulante = String(estudiante.cedula || '').trim();
  const correoPostulante = String(estudiante.correo || '').trim().toLowerCase();

  // Si no se proporcionó cédula ni correo, no podemos evaluar duplicados
  if (!cedulaPostulante && !correoPostulante) {
    return {
      esDuplicado: false,
      mensaje: '',
      postulacionExistente: null
    };
  }

  // Buscar coincidencia en la lista existente
  const encontrada = listaPostulaciones.find((item) => {
    const itemCedula = String(item.estudiante?.cedula || '').trim();
    const itemCorreo = String(item.estudiante?.correo || '').trim().toLowerCase();

    // Comparamos coincidencia por cédula o por correo institucional
    const coincideCedula = Boolean(cedulaPostulante && itemCedula === cedulaPostulante);
    const coincideCorreo = Boolean(correoPostulante && itemCorreo === correoPostulante);

    return coincideCedula || coincideCorreo;
  });

  // Si se encontró un registro previo:
  if (encontrada) {
    return {
      esDuplicado: true,
      mensaje: `Ya registraste una postulación para este periodo académico (Código: ${encontrada.id}, Estado: ${encontrada.estado}). Solo se permite una solicitud por estudiante.`,
      postulacionExistente: encontrada
    };
  }

  // No hay duplicados
  return {
    esDuplicado: false,
    mensaje: '',
    postulacionExistente: null
  };
}
