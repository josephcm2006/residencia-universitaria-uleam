import fs from 'node:fs/promises';
import path from 'node:path';
import postulacionesIniciales from '../../../data/postulaciones.json';

export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { id, estado, observaciones } = body;

    if (!id || !estado) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID y estado son requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const filePath = path.resolve('src/data/postulaciones.json');
    let lista = postulacionesIniciales;

    try {
      const dataRaw = await fs.readFile(filePath, 'utf-8');
      lista = JSON.parse(dataRaw);
    } catch (e) {
      // Fallback a postulacionesIniciales
    }

    const index = lista.findIndex((p) => p.id === id);
    if (index === -1) {
      return new Response(
        JSON.stringify({ success: false, message: 'Postulación no encontrada.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    lista[index].estado = estado;
    if (observaciones) {
      lista[index].observacionesAdmin = observaciones;
    }
    lista[index].fechaRevision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    try {
      await fs.writeFile(filePath, JSON.stringify(lista, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error guardando en archivo:', err);
    }

    // Sincronizar ocupación de habitaciones con las postulaciones aprobadas
    try {
      const habFilePath = path.resolve('src/data/habitaciones.json');
      const habRaw = await fs.readFile(habFilePath, 'utf-8');
      const habList = JSON.parse(habRaw);

      const aprobadasPorHab = {};
      lista.filter((p) => p.estado === 'Aprobada').forEach((p) => {
        const habId = p.habitacionSugerida || 'HAB-A101';
        aprobadasPorHab[habId] = (aprobadasPorHab[habId] || 0) + 1;
      });

      habList.forEach((hab) => {
        const ocupantes = aprobadasPorHab[hab.id] || 0;
        hab.ocupantesActuales = ocupantes;
        if (ocupantes >= hab.capacidad) {
          hab.estado = 'Ocupada';
        } else {
          hab.estado = 'Disponible';
        }
      });

      await fs.writeFile(habFilePath, JSON.stringify(habList, null, 2), 'utf-8');
    } catch (habErr) {
      console.error('Error actualizando habitaciones:', habErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        postulacion: lista[index]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Error procesando la actualización.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
