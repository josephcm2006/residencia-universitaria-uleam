/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Coordinador central de validaciones del formulario de postulación
 * ============================================================================
 * UBICACIÓN: src/scripts/postulacion/administradorErrores.js
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este módulo actúa como el orquestador principal de calidad de datos antes
 * de que el formulario intente enviar información a los servidores de la ULEAM.
 * Coordina en un orden lógico y secuencial las 3 capas de verificación:
 * 1. Control de duplicados (Regla de negocio: 1 sola postulación por alumno).
 * 2. Validación de campos de texto, números y consentimientos legales.
 * 3. Validación técnica de formatos y tamaños de archivos adjuntos.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. 'validarPostulacionCompleta' recibe: datosFormulario, archivosSubidos, listaPostulacionesExistentes.
 * 2. PASO 1 (Prioridad Crítica): Invoca 'verificarPostulacionDuplicada'. Si el estudiante ya postuló,
 *    aborta de inmediato y retorna 'esDuplicado: true'.
 * 3. PASO 2: Invoca 'validarCamposFormulario'. Si faltan campos o datos requeridos, añade los errores.
 * 4. PASO 3: Invoca 'validarTodosLosArchivos'. Si algún archivo excede 10MB o tiene extensión inválida,
 *    añade los errores.
 * 5. PASO 4: Consolida el resultado final y retorna un diagnóstico unificado.
 */

import { validarCamposFormulario } from './validadorCampos.js';
import { validarTodosLosArchivos } from './validadorArchivos.js';
import { verificarPostulacionDuplicada } from './validadorDuplicados.js';

/**
 * Realiza la validación integral y consolidada de la postulación.
 * 
 * @param {Object} datosFormulario - Objeto con los valores ingresados en el formulario HTML.
 * @param {Object} archivosSubidos - Mapa con los archivos adjuntos cargados en memoria por el usuario.
 * @param {Array} listaPostulacionesExistentes - Arreglo de solicitudes registradas para verificar duplicados.
 * @returns {Object} Diagnóstico consolidado con las siguientes propiedades:
 *   - esValido: boolean (true si pasa todas las pruebas con éxito, false si hay errores).
 *   - esDuplicado: boolean (true si el alumno ya cuenta con postulación previa).
 *   - errores: string[] (arreglo con todos los mensajes de error detectados).
 *   - primerError: string|null (el primer mensaje de error para mostrar de forma rápida).
 *   - totalErrores: number (conteo total de inconsistencias encontradas).
 *   - postulacionPrevia: Object|undefined (datos del registro previo si existió duplicado).
 */
export function validarPostulacionCompleta(
  datosFormulario = {},
  archivosSubidos = {},
  listaPostulacionesExistentes = []
) {
  // VARIABLE 'listaErrores':
  // Arreglo donde se van acumulando de manera centralizada todos los errores encontrados
  // tanto de campos incompletos como de archivos inválidos.
  const listaErrores = [];

  // --------------------------------------------------------------------------
  // PASO 1: VERIFICAR DUPLICADOS PRIMERO (REGLA CRÍTICA DE NEGOCIO)
  // --------------------------------------------------------------------------
  
  // VARIABLE 'resultadoDuplicado':
  // Guarda el objeto resultante de la función 'verificarPostulacionDuplicada':
  // { esDuplicado: boolean, mensaje: string, postulacionExistente: Object|null }
  const resultadoDuplicado = verificarPostulacionDuplicada(
    datosFormulario.estudiante,
    listaPostulacionesExistentes
  );

  // Si 'esDuplicado' es true, es un error fatal y bloqueante:
  // Se detiene la ejecución inmediatamente para no confundir al usuario con errores secundarios de campos.
  if (resultadoDuplicado.esDuplicado) {
    return {
      esValido: false,
      esDuplicado: true,
      errores: [resultadoDuplicado.mensaje],
      primerError: resultadoDuplicado.mensaje,
      postulacionPrevia: resultadoDuplicado.postulacionExistente
    };
  }

  // --------------------------------------------------------------------------
  // PASO 2: VALIDAR CAMPOS DE TEXTO, NÚMEROS Y CONSENTIMIENTOS
  // --------------------------------------------------------------------------
  
  // VARIABLE 'resultadoCampos':
  // Guarda el diagnóstico de campos obligatorios: { esValido: boolean, errores: string[] }
  const resultadoCampos = validarCamposFormulario(datosFormulario);

  // Si falló algún campo, se desempaquetan y agregan todos sus errores a la lista general
  if (!resultadoCampos.esValido) {
    listaErrores.push(...resultadoCampos.errores);
  }

  // --------------------------------------------------------------------------
  // PASO 3: VALIDAR ARCHIVOS Y FORMATOS (PDF, JPG, PNG, TAMAÑO MÁXIMO 10 MB)
  // --------------------------------------------------------------------------
  
  // VARIABLE 'resultadoArchivos':
  // Guarda el diagnóstico de archivos: { esValido: boolean, errores: string[] }
  const resultadoArchivos = validarTodosLosArchivos(archivosSubidos);

  // Si algún archivo adjunto incumple formato o tamaño, se agregan sus errores
  if (!resultadoArchivos.esValido) {
    listaErrores.push(...resultadoArchivos.errores);
  }

  // --------------------------------------------------------------------------
  // PASO 4: RETORNO DEL ESTADO FINAL CONSOLIDADO
  // --------------------------------------------------------------------------
  return {
    // esValido es true únicamente cuando la lista general de errores está vacía
    esValido: listaErrores.length === 0,
    esDuplicado: false,
    errores: listaErrores,
    // primerError permite a los modales alertar el problema principal sin abrumar
    primerError: listaErrores[0] || null,
    // totalErrores informa la cantidad de inconsistencias a subsanar
    totalErrores: listaErrores.length
  };
}

export default {
  validarPostulacionCompleta
};
