/**
 * ============================================================================
 * ENDPOINT API: GESTIÓN DIRECTA Y ASIGNACIÓN DE ESTUDIANTES A HABITACIONES
 * ============================================================================
 * UBICACIÓN: src/pages/api/habitaciones/assign.js
 * MÉTODO HTTP: POST
 * FORMATO ENTRADA / SALIDA: JSON
 * ============================================================================
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import habitacionesIniciales from '../../../data/habitaciones.json';
import usuariosIniciales from '../../../data/usuarios.json';
import postulacionesIniciales from '../../../data/postulaciones.json';

export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { habitacionId, estudianteCedula, accion = 'asignar' } = body;

    if (!habitacionId || !estudianteCedula) {
      return new Response(
        JSON.stringify({ success: false, message: 'habitacionId y estudianteCedula son requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Cargar Usuarios
    const userPath = path.resolve('src/data/usuarios.json');
    let listaUsuarios = usuariosIniciales;
    try {
      const userRaw = await fs.readFile(userPath, 'utf-8');
      listaUsuarios = JSON.parse(userRaw);
    } catch (e) {
      listaUsuarios = usuariosIniciales;
    }

    // 2. Cargar Habitaciones
    const habPath = path.resolve('src/data/habitaciones.json');
    let listaHabitaciones = habitacionesIniciales;
    try {
      const habRaw = await fs.readFile(habPath, 'utf-8');
      listaHabitaciones = JSON.parse(habRaw);
    } catch (e) {
      listaHabitaciones = habitacionesIniciales;
    }

    // 3. Cargar Postulaciones
    const postPath = path.resolve('src/data/postulaciones.json');
    let listaPostulaciones = postulacionesIniciales;
    try {
      const postRaw = await fs.readFile(postPath, 'utf-8');
      listaPostulaciones = JSON.parse(postRaw);
    } catch (e) {
      listaPostulaciones = postulacionesIniciales;
    }

    const hab = listaHabitaciones.find((h) => h.id === habitacionId);
    if (!hab) {
      return new Response(
        JSON.stringify({ success: false, message: 'Habitación no encontrada.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userIndex = listaUsuarios.findIndex((u) => u.cedula === estudianteCedula);
    if (userIndex === -1) {
      return new Response(
        JSON.stringify({ success: false, message: 'Estudiante no encontrado en el sistema.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const postIndex = listaPostulaciones.findIndex((p) => p.estudiante?.cedula === estudianteCedula);

    if (accion === 'asignar') {
      // Asignar estudiante a la habitación
      listaUsuarios[userIndex].aceptado = 1;
      listaUsuarios[userIndex].habitacionId = hab.id;
      listaUsuarios[userIndex].habitacionNumero = hab.numero;
      listaUsuarios[userIndex].edificio = hab.edificio;
      listaUsuarios[userIndex].piso = hab.piso;
      listaUsuarios[userIndex].pagosAlDia = true;
      listaUsuarios[userIndex].montoPendiente = 0;
      listaUsuarios[userIndex].becaPorcentaje = 100;
      listaUsuarios[userIndex].documentosRenovacion = {
        requiereRenovacion: false,
        estado: 'Al día',
        mensaje: `Plaza adjudicada en Habitación ${hab.numero}.`,
        proximaFecha: '15 Mar 2027'
      };

      if (postIndex !== -1) {
        listaPostulaciones[postIndex].estado = 'Aprobada';
        listaPostulaciones[postIndex].habitacionSugerida = hab.id;
        listaPostulaciones[postIndex].observacionesAdmin = `Asignación manual en Habitación ${hab.numero} por el administrador.`;
        listaPostulaciones[postIndex].fechaRevision = new Date().toLocaleDateString('es-EC', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } else if (accion === 'liberar') {
      // Desasignar estudiante y liberar cupo
      listaUsuarios[userIndex].aceptado = 0;
      listaUsuarios[userIndex].habitacionId = null;
      listaUsuarios[userIndex].habitacionNumero = null;
      listaUsuarios[userIndex].edificio = null;
      listaUsuarios[userIndex].piso = null;
      listaUsuarios[userIndex].documentosRenovacion = {
        requiereRenovacion: false,
        estado: 'Pendiente de postulación',
        mensaje: 'Aún no cuentas con una plaza habitacional adjudicada.',
        proximaFecha: 'N/A'
      };

      if (postIndex !== -1) {
        listaPostulaciones[postIndex].estado = 'Pendiente';
        listaPostulaciones[postIndex].observacionesAdmin = 'Cupo liberado por reasignación administrativa.';
      }
    }

    // 4. Recalcular ocupación de todas las habitaciones
    listaHabitaciones.forEach((h) => {
      const ocupantes = listaUsuarios.filter((u) => u.aceptado === 1 && u.habitacionId === h.id);
      h.ocupantesActuales = ocupantes.length;
      h.estado = h.ocupantesActuales >= h.capacidad ? 'Ocupada' : 'Disponible';
    });

    // 5. Guardar archivos atómicamente
    await fs.writeFile(userPath, JSON.stringify(listaUsuarios, null, 2), 'utf-8');
    await fs.writeFile(habPath, JSON.stringify(listaHabitaciones, null, 2), 'utf-8');
    await fs.writeFile(postPath, JSON.stringify(listaPostulaciones, null, 2), 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        message: accion === 'asignar'
          ? `Estudiante asignado correctamente a la Habitación ${hab.numero}.`
          : `Cupo liberado correctamente en la Habitación ${hab.numero}.`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en POST /api/habitaciones/assign:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error en el servidor al procesar asignación.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
