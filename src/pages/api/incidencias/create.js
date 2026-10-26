/**
 * ============================================================================
 * ENDPOINT API: REGISTRO DE INCIDENCIAS Y MANTENIMIENTO
 * ============================================================================
 * UBICACIÓN: src/pages/api/incidencias/create.js
 * MÉTODO HTTP: POST
 * FORMATO ENTRADA / SALIDA: JSON
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este endpoint permite a un estudiante residente reportar una avería o solicitud
 * de mantenimiento en su habitación (plomería, electricidad, cerraduras, etc.):
 * 1. Recibe el objeto JSON con { categoria, urgencia, asunto, descripcion, evidencias }.
 * 2. Valida los campos mediante el módulo modular 'validadorIncidencias.js'.
 * 3. Si algún campo es incorrecto o vacío, responde con HTTP 400 Bad Request.
 * 4. Lee el archivo físico 'src/data/incidencias.json'.
 * 5. Genera un identificador formal correlativo (ej: 'INC-2026-003').
 * 6. Registra la fecha y hora oficial del reporte con el estado inicial "Pendiente".
 * 7. Escribe la nueva incidencia en disco y responde con HTTP 200 OK.
 * 
 * FLUJO DE EJECUCIÓN:
 * - Petición POST recibida -> request.json()
 * - Ejecuta validarReporteIncidencia(body) (si falla -> HTTP 400)
 * - fs.readFile('src/data/incidencias.json')
 * - Genera correlativo 'INC-2026-XXX' y timestamp
 * - Construye objeto y ejecuta lista.unshift(nuevaIncidencia)
 * - fs.writeFile()
 * - Retorna respuesta HTTP 200 OK con { success: true, incidencia }
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import incidenciasIniciales from '../../../data/incidencias.json';
import { validarReporteIncidencia } from '../../../scripts/residente/validadorIncidencias.js';

// Deshabilita prerenderizado estático en Astro para permitir ejecución dinámica en el servidor
export const prerender = false;

export async function POST({ request }) {
  try {
    // ------------------------------------------------------------------------
    // PASO 1: LECTURA Y DECODIFICACIÓN DEL PAYLOAD JSON
    // ------------------------------------------------------------------------
    
    // VARIABLE 'body':
    // Objeto JavaScript con los datos enviados por el modal del residente.
    const body = await request.json();

    // ------------------------------------------------------------------------
    // PASO 2: VALIDACIÓN MODULAR DE CAMPOS DEL REPORTE
    // ------------------------------------------------------------------------
    
    // VARIABLE 'validacion':
    // Guarda el diagnóstico del validador: { esValido: boolean, errores: string[], primerError: string|null }
    const validacion = validarReporteIncidencia(body);

    // Si no cumple con las reglas institucionales, rechaza la solicitud de inmediato (HTTP 400)
    if (!validacion.esValido) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validacion.primerError || 'Datos del reporte incompletos.',
          errores: validacion.errores
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // PASO 3: LECTURA DE LAS INCIDENCIAS PREVIAMENTE ALMACENADAS
    // ------------------------------------------------------------------------
    
    // VARIABLE 'filePath': Ruta absoluta al archivo físico de almacenamiento en disco.
    const filePath = path.resolve('src/data/incidencias.json');

    // VARIABLE 'lista': Arreglo de incidencias cargadas en memoria.
    let lista = incidenciasIniciales;

    try {
      // VARIABLE 'dataRaw': Texto crudo leído desde el archivo JSON.
      const dataRaw = await fs.readFile(filePath, 'utf-8');
      lista = JSON.parse(dataRaw);
    } catch (e) {
      lista = incidenciasIniciales;
    }

    // ------------------------------------------------------------------------
    // PASO 4: GENERACIÓN DEL IDENTIFICADOR CORRELATIVO
    // ------------------------------------------------------------------------
    
    // VARIABLE 'nuevoNumero': Cantidad de elementos actuales + 1 para el correlativo.
    const nuevoNumero = lista.length + 1;

    // VARIABLE 'nuevoId': Código del ticket con formato institucional (ej: 'INC-2026-003').
    const nuevoId = `INC-2026-${String(nuevoNumero).padStart(3, '0')}`;

    // ------------------------------------------------------------------------
    // PASO 5: FORMATEO DE FECHA Y HORA OFICIAL DEL REPORTE
    // ------------------------------------------------------------------------
    
    // VARIABLE 'ahora': Instancia de Date con la fecha y hora exacta del servidor.
    const ahora = new Date();

    // VARIABLE 'fechaTexto': Cadena legible con fecha y hora (ej: '20 oct 2026 · 14:30').
    const fechaTexto = ahora.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + ahora.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // ------------------------------------------------------------------------
    // PASO 6: CONSTRUCCIÓN DEL OBJETO DEL TICKET DE MANTENIMIENTO
    // ------------------------------------------------------------------------
    
    // VARIABLE 'nuevaIncidencia':
    // Objeto estructurado que representa el ticket completo que revisará el personal de bienestar.
    const nuevaIncidencia = {
      id: nuevoId,
      estudianteCedula: String(body.estudianteCedula || '').trim(),
      estudianteNombre: String(body.estudianteNombre || '').trim(),
      estudianteCorreo: String(body.estudianteCorreo || '').trim().toLowerCase(),
      habitacionId: body.habitacionId || 'HAB-A101',
      habitacion: body.habitacion || 'A-101 (Edificio A)',
      categoria: body.categoria,
      urgencia: body.urgencia,
      asunto: body.asunto,
      descripcion: body.descripcion,
      evidencias: Array.isArray(body.evidencias) ? body.evidencias : [],
      fechaReporte: fechaTexto,
      estado: 'Pendiente',
      respuestaAdmin: 'Reporte registrado. En cola de asignación de técnico por Bienestar Estudiantil.'
    };

    // ------------------------------------------------------------------------
    // PASO 7: INSERCIÓN AL INICIO Y ESCRITURA EN DISCO
    // ------------------------------------------------------------------------
    // unshift coloca la nueva incidencia en la primera posición para verse arriba en la lista
    lista.unshift(nuevaIncidencia);

    try {
      await fs.writeFile(filePath, JSON.stringify(lista, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error escribiendo en incidencias.json:', err);
    }

    // ------------------------------------------------------------------------
    // PASO 8: RESPUESTA SATISFACTORIA (HTTP 200 OK)
    // ------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Incidencia reportada correctamente.',
        incidencia: nuevaIncidencia
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Manejo de errores no previstos durante el procesamiento
    console.error('Error en POST /api/incidencias/create:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ocurrió un error en el servidor al registrar el reporte.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
