import fs from 'node:fs/promises';
import path from 'node:path';
import incidenciasIniciales from '../../../data/incidencias.json';
import { validarReporteIncidencia } from '../../../errores-incidencias/validadorIncidencias.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();

    // 1. Validar campos del reporte
    const validacion = validarReporteIncidencia(body);
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

    // 2. Leer archivo actual de incidencias
    const filePath = path.resolve('src/data/incidencias.json');
    let lista = incidenciasIniciales;

    try {
      const dataRaw = await fs.readFile(filePath, 'utf-8');
      lista = JSON.parse(dataRaw);
    } catch (e) {
      lista = incidenciasIniciales;
    }

    // 3. Generar nuevo ID correlativo
    const nuevoNumero = lista.length + 1;
    const nuevoId = `INC-2026-${String(nuevoNumero).padStart(3, '0')}`;

    // 4. Formatear fecha y hora
    const ahora = new Date();
    const fechaTexto = ahora.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + ahora.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // 5. Construir objeto de la nueva incidencia
    const nuevaIncidencia = {
      id: nuevoId,
      estudianteCedula: body.estudianteCedula || '0953920949',
      estudianteNombre: body.estudianteNombre || 'Joseph Coello Mendoza',
      estudianteCorreo: body.estudianteCorreo || 'e0953920949@live.uleam.edu.ec',
      habitacionId: body.habitacionId || 'HAB-A101',
      habitacion: body.habitacion || 'A-101 (Edificio A)',
      categoria: body.categoria,
      urgencia: body.urgencia,
      asunto: body.asunto,
      descripcion: body.descripcion,
      evidencias: body.evidencias || [],
      fechaReporte: fechaTexto,
      estado: 'Pendiente',
      respuestaAdmin: 'Reporte registrado. En cola de asignación de técnico por Bienestar Estudiantil.'
    };

    // 6. Insertar al inicio de la lista
    lista.unshift(nuevaIncidencia);

    // 7. Persistir en disco
    try {
      await fs.writeFile(filePath, JSON.stringify(lista, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error escribiendo en incidencias.json:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Incidencia reportada correctamente.',
        incidencia: nuevaIncidencia
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
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
