/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Validador de postulaciones duplicadas por cédula y correo
 * ============================================================================
 * UBICACIÓN: src/scripts/postulacion/validadorDuplicados.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este módulo evalúa si el estudiante que intenta postular a la residencia
 * universitaria ya cuenta con una solicitud registrada previamente en el periodo
 * académico actual. Para ello, realiza una búsqueda comparativa bidireccional
 * utilizando su número de cédula y su correo electrónico institucional.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Recibe los datos del estudiante postulante y la lista de postulaciones guardadas.
 * 2. Limpia los datos de entrada (elimina espacios y convierte correos a minúsculas).
 * 3. Si no hay datos suficientes de identificación, finaliza indicando que no hay duplicado.
 * 4. Itera sobre la lista de postulaciones existentes comparando cédula y correo.
 * 5. Si encuentra coincidencia, retorna un objeto con esDuplicado = true y el mensaje de alerta.
 * 6. Si no existe coincidencia, retorna esDuplicado = false permitiendo continuar el registro.
 */

/**
 * Revisa si los datos del postulante ya figuran en la lista de solicitudes existentes.
 * 
 * @param {Object} estudiante - Objeto con los datos del postulante: { cedula, correo }.
 * @param {Array} listaPostulaciones - Arreglo de objetos con las postulaciones existentes en el sistema.
 * @returns {Object} Objeto con el diagnóstico:
 *   - esDuplicado: boolean (true si ya existe una postulación previa, false si es nueva).
 *   - mensaje: string (descripción explicativa para el estudiante).
 *   - postulacionExistente: Object|null (datos del registro previo si fue encontrado).
 */
export function verificarPostulacionDuplicada(estudiante = {}, listaPostulaciones = []) {
  // --------------------------------------------------------------------------
  // PASO 1: NORMALIZACIÓN Y LIMPIEZA DE LOS DATOS DE ENTRADA
  // --------------------------------------------------------------------------
  
  // VARIABLE 'cedulaPostulante':
  // Guarda el número de cédula del postulante en formato string y sin espacios en blanco
  // al inicio o al final, asegurando que '0953920949 ' se compare igual a '0953920949'.
  const cedulaPostulante = String(estudiante.cedula || '').trim();

  // VARIABLE 'correoPostulante':
  // Guarda el correo electrónico institucional del estudiante convertido a minúsculas
  // y sin espacios externos, evitando falsos negativos por diferencias de mayúsculas.
  const correoPostulante = String(estudiante.correo || '').trim().toLowerCase();

  // --------------------------------------------------------------------------
  // PASO 2: CONTROL DE SEGURIDAD POR DATOS VACÍOS
  // --------------------------------------------------------------------------
  // Si no se proporcionó ni cédula ni correo (por ejemplo, formulario completamente vacío),
  // no es posible realizar la comparación de duplicados, por lo que se retorna false.
  if (!cedulaPostulante && !correoPostulante) {
    return {
      esDuplicado: false,
      mensaje: '',
      postulacionExistente: null
    };
  }

  // --------------------------------------------------------------------------
  // PASO 3: BÚSQUEDA DE COINCIDENCIAS EN LA BASE DE DATOS LOCAL
  // --------------------------------------------------------------------------
  
  // VARIABLE 'encontrada':
  // Guarda el primer objeto de postulación de la lista que coincida con la cédula
  // o con el correo del postulante. Si no encuentra ninguna coincidencia, vale undefined.
  const encontrada = listaPostulaciones.find((item) => {
    // VARIABLE 'itemCedula':
    // Extrae y limpia la cédula almacenada en el registro evaluado actualmente.
    const itemCedula = String(item.estudiante?.cedula || '').trim();

    // VARIABLE 'itemCorreo':
    // Extrae y limpia el correo almacenado en el registro evaluado actualmente.
    const itemCorreo = String(item.estudiante?.correo || '').trim().toLowerCase();

    // VARIABLE 'coincideCedula':
    // Booleano que indica true si ambas cédulas existen y son exactamente idénticas.
    const coincideCedula = Boolean(cedulaPostulante && itemCedula === cedulaPostulante);

    // VARIABLE 'coincideCorreo':
    // Booleano que indica true si ambos correos existen y son exactamente idénticos.
    const coincideCorreo = Boolean(correoPostulante && itemCorreo === correoPostulante);

    // Retorna true si coincide por cédula O por correo institucional (criterio inclusivo de seguridad).
    return coincideCedula || coincideCorreo;
  });

  // --------------------------------------------------------------------------
  // PASO 4: EVALUACIÓN DEL RESULTADO Y GENERACIÓN DE RESPUESTA
  // --------------------------------------------------------------------------
  
  // Si la variable 'encontrada' contiene un objeto, significa que el alumno ya postuló.
  if (encontrada) {
    return {
      // Bloquea el proceso marcando duplicado como verdadero
      esDuplicado: true,
      // Mensaje formal para mostrar en el modal de advertencia al estudiante
      mensaje: `Ya registraste una postulación para este periodo académico (Código: ${encontrada.id}, Estado: ${encontrada.estado}). Solo se permite una solicitud por estudiante.`,
      // Retorna la postulación previa encontrada para permitir ver su comprobante
      postulacionExistente: encontrada
    };
  }

  // --------------------------------------------------------------------------
  // PASO 5: NO HAY DUPLICADOS (POSTULACIÓN VÁLIDA PARA CONTINUAR)
  // --------------------------------------------------------------------------
  // Si el bucle terminó sin coincidencias, el estudiante tiene derecho a registrar su postulación.
  return {
    esDuplicado: false,
    mensaje: '',
    postulacionExistente: null
  };
}
