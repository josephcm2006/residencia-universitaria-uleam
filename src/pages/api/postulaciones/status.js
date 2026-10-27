/**
 * ============================================================================
 * ENDPOINT API: ACTUALIZACIÓN DE ESTADO DE POSTULACIÓN, RESIDENTE Y HABITACIÓN
 * ============================================================================
 * UBICACIÓN: src/pages/api/postulaciones/status.js
 * MÉTODO HTTP: POST
 * FORMATO ENTRADA / SALIDA: JSON
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este endpoint es el motor central de dictamen administrativo de Bienestar Estudiantil:
 * 1. Recibe el ID de la postulación ('POST-2026-XXX'), el nuevo estado ('Aprobada', 'Rechazada', 'Pendiente')
 *    y las observaciones técnicas del administrador.
 * 2. Actualiza el expediente en 'src/data/postulaciones.json'.
 * 3. SINCRONIZACIÓN AUTOMÁTICA CON USUARIOS ('src/data/usuarios.json'):
 *    - Si se APRUEBA:
 *      * Se marca al estudiante con 'aceptado: 1'.
 *      * Se le asigna la habitación sugerida (o la primera vacante disponible).
 *      * Se vinculan los metadatos: habitacionId, habitacionNumero, edificio, piso, beca 100%, pagos al día.
 *    - Si se RECHAZA o queda en PENDIENTE:
 *      * Se establece 'aceptado: 0'.
 *      * Se desasigna cualquier habitación ('habitacionId: null', etc.).
 * 4. SINCRONIZACIÓN AUTOMÁTICA DE HABITACIONES ('src/data/habitaciones.json'):
 *    * Recalcula 'ocupantesActuales' contando exactamente cuántos estudiantes con 'aceptado === 1'
 *      están habitando cada dormitorio físico.
 *    * Si ocupantesActuales >= capacidad -> estado pasa a 'Ocupada'.
 *    * Si ocupantesActuales < capacidad -> estado pasa a 'Disponible'.
 * 
 * FLUJO DE EJECUCIÓN:
 * - Solicitud POST recibida -> request.json().
 * - Validación de presencia de 'id' y 'estado'.
 * - Lectura y actualización de 'postulaciones.json'.
 * - Lectura y actualización de 'usuarios.json' (adjudicación / revocación de plaza).
 * - Lectura y recálculo de ocupación en 'habitaciones.json'.
 * - Retorno de HTTP 200 OK con payload consolidado.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import postulacionesIniciales from '../../../data/postulaciones.json';
import usuariosIniciales from '../../../data/usuarios.json';
import habitacionesIniciales from '../../../data/habitaciones.json';

// Deshabilita prerenderizado estático en Astro para permitir ejecución dinámica en el servidor
export const prerender = false;

export async function POST({ request }) {
  try {
    // ------------------------------------------------------------------------
    // PASO 1: LECTURA DEL PAYLOAD JSON ENTRANTE
    // ------------------------------------------------------------------------
    
    // VARIABLE 'body': Contiene el cuerpo de la petición enviada por la consola administrativa.
    const body = await request.json();

    // VARIABLES DE ENTRADA:
    // id: Código de la postulación a dictaminar (ej: 'POST-2026-001').
    // estado: Nuevo dictamen institucional ('Aprobada', 'Rechazada', 'Pendiente').
    // observaciones: Justificación o notas técnicas del evaluador.
    // habitacionId: ID de la habitación elegida manualmente por el administrador.
    const { id, estado, observaciones, habitacionId } = body;

    // Validación de obligatoriedad: id y estado son indispensables
    if (!id || !estado) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID y estado son requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // PASO 2: LECTURA Y ACTUALIZACIÓN DEL EXPEDIENTE EN 'postulaciones.json'
    // ------------------------------------------------------------------------
    
    const postFilePath = path.resolve('src/data/postulaciones.json');
    let listaPostulaciones = postulacionesIniciales;

    try {
      const dataRaw = await fs.readFile(postFilePath, 'utf-8');
      listaPostulaciones = JSON.parse(dataRaw);
    } catch (e) {
      listaPostulaciones = postulacionesIniciales;
    }

    const postIndex = listaPostulaciones.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return new Response(
        JSON.stringify({ success: false, message: 'Postulación no encontrada.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = listaPostulaciones[postIndex];
    post.estado = estado;

    if (observaciones !== undefined) {
      post.observacionesAdmin = observaciones;
    }

    // Registra fecha formal de resolución administrativa
    post.fechaRevision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // ------------------------------------------------------------------------
    // PASO 3: LECTURA DE HABITACIONES Y USUARIOS PARA SINCRONIZACIÓN
    // ------------------------------------------------------------------------
    
    const habFilePath = path.resolve('src/data/habitaciones.json');
    let listaHabitaciones = habitacionesIniciales;
    try {
      const habRaw = await fs.readFile(habFilePath, 'utf-8');
      listaHabitaciones = JSON.parse(habRaw);
    } catch (e) {
      listaHabitaciones = habitacionesIniciales;
    }

    const userFilePath = path.resolve('src/data/usuarios.json');
    let listaUsuarios = usuariosIniciales;
    try {
      const userRaw = await fs.readFile(userFilePath, 'utf-8');
      listaUsuarios = JSON.parse(userRaw);
    } catch (e) {
      listaUsuarios = usuariosIniciales;
    }

    // Identificar al estudiante dueño de la postulación
    const cedulaEst = post.estudiante?.cedula;
    const correoEst = post.estudiante?.correo?.toLowerCase().trim();

    const userIndex = listaUsuarios.findIndex(
      (u) => (cedulaEst && u.cedula === cedulaEst) || (correoEst && u.email?.toLowerCase().trim() === correoEst)
    );

    // ------------------------------------------------------------------------
    // PASO 4: ADJUDICACIÓN O REVOCACIÓN DE HABITACIÓN EN 'usuarios.json'
    // ------------------------------------------------------------------------
    
    if (estado === 'Aprobada') {
      // Prioridad 1: Habitación seleccionada manualmente por el administrador
      let habAsignada = null;
      if (habitacionId) {
        habAsignada = listaHabitaciones.find((h) => h.id === habitacionId);
      }

      // Prioridad 2: Buscar habitación sugerida con vacantes
      if (!habAsignada) {
        habAsignada = listaHabitaciones.find(
          (h) => h.id === post.habitacionSugerida && (h.ocupantesActuales || 0) < h.capacidad
        );
      }

      // Prioridad 3: Primera habitación disponible con vacantes
      if (!habAsignada) {
        habAsignada = listaHabitaciones.find((h) => (h.ocupantesActuales || 0) < h.capacidad) || listaHabitaciones[0];
      }

      // Sincronizar postulación con la habitación definitiva
      if (habAsignada) {
        post.habitacionSugerida = habAsignada.id;
      }

      // Si el estudiante existe en el catálogo de usuarios, activar plaza
      if (userIndex !== -1 && habAsignada) {
        listaUsuarios[userIndex].aceptado = 1;
        listaUsuarios[userIndex].habitacionId = habAsignada.id;
        listaUsuarios[userIndex].habitacionNumero = habAsignada.numero;
        listaUsuarios[userIndex].edificio = habAsignada.edificio;
        listaUsuarios[userIndex].piso = habAsignada.piso;
        listaUsuarios[userIndex].pagosAlDia = true;
        listaUsuarios[userIndex].montoPendiente = 0.0;
        listaUsuarios[userIndex].becaPorcentaje = 100;
        listaUsuarios[userIndex].documentosRenovacion = {
          requiereRenovacion: false,
          estado: 'Al día',
          mensaje: 'Postulación aprobada por Bienestar Estudiantil. Plaza activa.',
          proximaFecha: '15 Mar 2027'
        };
      }
    } else {
      // Si fue Rechazada o se regresa a Pendiente, revocar asignación de habitación
      if (userIndex !== -1) {
        listaUsuarios[userIndex].aceptado = 0;
        listaUsuarios[userIndex].habitacionId = null;
        listaUsuarios[userIndex].habitacionNumero = null;
        listaUsuarios[userIndex].edificio = null;
        listaUsuarios[userIndex].piso = null;
        listaUsuarios[userIndex].documentosRenovacion = {
          requiereRenovacion: false,
          estado: estado === 'Rechazada' ? 'No admitido' : 'En revisión',
          mensaje: estado === 'Rechazada' ? 'Postulación no admitida en el periodo actual.' : 'Expediente en proceso de evaluación.',
          proximaFecha: 'N/A'
        };
      }
    }

    // ------------------------------------------------------------------------
    // PASO 5: RECÁLCULO EXACTO DE OCUPACIÓN EN 'habitaciones.json'
    // ------------------------------------------------------------------------
    
    // Contamos exactamente cuántos estudiantes aceptados (aceptado === 1) tiene cada habitación
    const ocupantesPorHab = {};
    listaUsuarios.filter((u) => u.aceptado === 1 && u.habitacionId).forEach((u) => {
      ocupantesPorHab[u.habitacionId] = (ocupantesPorHab[u.habitacionId] || 0) + 1;
    });

    listaHabitaciones.forEach((hab) => {
      const ocupantes = ocupantesPorHab[hab.id] || 0;
      hab.ocupantesActuales = ocupantes;
      hab.estado = ocupantes >= hab.capacidad ? 'Ocupada' : 'Disponible';
    });

    // ------------------------------------------------------------------------
    // PASO 6: GUARDADO PERSISTENTE EN DISCO
    // ------------------------------------------------------------------------
    
    await fs.writeFile(postFilePath, JSON.stringify(listaPostulaciones, null, 2), 'utf-8');
    await fs.writeFile(userFilePath, JSON.stringify(listaUsuarios, null, 2), 'utf-8');
    await fs.writeFile(habFilePath, JSON.stringify(listaHabitaciones, null, 2), 'utf-8');

    // ------------------------------------------------------------------------
    // PASO 7: RESPUESTA EXITOSA CONSOLIDADA (HTTP 200 OK)
    // ------------------------------------------------------------------------
    
    return new Response(
      JSON.stringify({
        success: true,
        postulacion: post,
        usuario: userIndex !== -1 ? listaUsuarios[userIndex] : null,
        habitaciones: listaHabitaciones
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error procesando actualización de estado:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error procesando la actualización.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
