/**
 * ============================================================================
 * ADMINISTRADOR CENTRAL DE ERRORES Y VALIDACIONES DE POSTULACIÓN
 * ============================================================================
 * Este módulo unifica las validaciones de campos, archivos y duplicados
 * para ofrecer un diagnóstico integral antes de enviar los datos al servidor.
 */

import { validarCamposFormulario } from './validadorCampos.js';
import { validarTodosLosArchivos } from './validadorArchivos.js';
import { verificarPostulacionDuplicada } from './validadorDuplicados.js';

/**
 * Realiza la validación integral de la postulación.
 * 
 * @param {Object} datosFormulario - Objeto con los datos recolectados de los inputs.
 * @param {Object} archivosSubidos - Objeto con los archivos cargados por el usuario.
 * @param {Array} listaPostulacionesExistentes - Registros actuales del sistema para validar duplicados.
 * @returns {Object} Resultado con:
 *   - esValido: boolean (true si pasa todas las pruebas)
 *   - esDuplicado: boolean (true si el estudiante ya postuló)
 *   - errores: string[] (lista de mensajes de error encontrados)
 *   - primerError: string (el primer mensaje de error para mostrar rápido)
 */
export function validarPostulacionCompleta(
  datosFormulario = {},
  archivosSubidos = {},
  listaPostulacionesExistentes = []
) {
  const listaErrores = [];

  // -------------------------------------------------------------------------
  // 1. VERIFICAR DUPLICADOS PRIMERO (Regla crítica de negocio)
  // -------------------------------------------------------------------------
  const resultadoDuplicado = verificarPostulacionDuplicada(
    datosFormulario.estudiante,
    listaPostulacionesExistentes
  );

  if (resultadoDuplicado.esDuplicado) {
    // Si ya existe, es un error bloqueante inmediato
    return {
      esValido: false,
      esDuplicado: true,
      errores: [resultadoDuplicado.mensaje],
      primerError: resultadoDuplicado.mensaje,
      postulacionPrevia: resultadoDuplicado.postulacionExistente
    };
  }

  // -------------------------------------------------------------------------
  // 2. VALIDAR CAMPOS DE TEXTO, NÚMEROS Y CONSENTIMIENTOS
  // -------------------------------------------------------------------------
  const resultadoCampos = validarCamposFormulario(datosFormulario);
  if (!resultadoCampos.esValido) {
    listaErrores.push(...resultadoCampos.errores);
  }

  // -------------------------------------------------------------------------
  // 3. VALIDAR ARCHIVOS Y FORMATOS (PDF, JPG, PNG, Tamaño Máx 10MB)
  // -------------------------------------------------------------------------
  const resultadoArchivos = validarTodosLosArchivos(archivosSubidos);
  if (!resultadoArchivos.esValido) {
    listaErrores.push(...resultadoArchivos.errores);
  }

  // -------------------------------------------------------------------------
  // 4. RETORNO DEL ESTADO CONSOLIDADO
  // -------------------------------------------------------------------------
  return {
    esValido: listaErrores.length === 0,
    esDuplicado: false,
    errores: listaErrores,
    primerError: listaErrores[0] || null,
    totalErrores: listaErrores.length
  };
}

export default {
  validarPostulacionCompleta
};
