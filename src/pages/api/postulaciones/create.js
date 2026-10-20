import fs from 'node:fs/promises';
import path from 'node:path';
import postulacionesIniciales from '../../../data/postulaciones.json';
import usuariosIniciales from '../../../data/usuarios.json';

export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();

    // 1. Validar que vengan los datos obligatorios del postulante
    const cedulaPostulante = String(body.estudiante?.cedula || '').trim();
    const correoPostulante = String(body.estudiante?.correo || '').trim().toLowerCase();
    const nombrePostulante = String(body.estudiante?.nombre || '').trim();

    if (!cedulaPostulante || !correoPostulante || !nombrePostulante) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Los datos de identificación del estudiante (cédula, nombre y correo institucional) son obligatorios.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Leer archivo actual de postulaciones para validar duplicados
    const filePath = path.resolve('src/data/postulaciones.json');
    let lista = postulacionesIniciales;

    try {
      const dataRaw = await fs.readFile(filePath, 'utf-8');
      lista = JSON.parse(dataRaw);
    } catch (e) {
      lista = postulacionesIniciales;
    }

    // 3. Regla institucional: Validar que el estudiante no postule dos veces
    const postExistente = lista.find((p) => {
      const pCedula = p.estudiante?.cedula ? String(p.estudiante.cedula).trim() : '';
      const pCorreo = p.estudiante?.correo ? String(p.estudiante.correo).trim().toLowerCase() : '';
      return (cedulaPostulante && pCedula === cedulaPostulante) || (correoPostulante && pCorreo === correoPostulante);
    });

    if (postExistente) {
      return new Response(
        JSON.stringify({
          success: false,
          duplicado: true,
          message: `El estudiante con cédula ${cedulaPostulante} ya cuenta con una postulación activa (${postExistente.id}). Solo se permite una solicitud por estudiante.`,
          postulacionExistente: postExistente
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Obtener información institucional del estudiante desde usuarios.json
    let listaUsuarios = usuariosIniciales;
    try {
      const userPath = path.resolve('src/data/usuarios.json');
      const rawUsers = await fs.readFile(userPath, 'utf-8');
      listaUsuarios = JSON.parse(rawUsers);
    } catch (e) {
      listaUsuarios = usuariosIniciales;
    }

    const perfilEstudiante = listaUsuarios.find(
      (u) => (u.cedula && String(u.cedula).trim() === cedulaPostulante) ||
             (u.email && String(u.email).trim().toLowerCase() === correoPostulante)
    );

    // 5. Construir lista de documentos cargados en el formulario
    const documentos = [];
    if (body.archivosAdjuntos && typeof body.archivosAdjuntos === 'object') {
      let docIndex = 1;
      for (const [key, doc] of Object.entries(body.archivosAdjuntos)) {
        if (doc && doc.nombreArchivo) {
          documentos.push({
            id: `doc-auto-${docIndex++}`,
            tipo: doc.tipo || key,
            archivo: doc.nombreArchivo,
            tamano: doc.tamano || 'N/A',
            estado: 'Cargado'
          });
        }
      }
    }

    // 6. Generar correlativo formal de postulación
    const nuevoNumero = lista.length + 1;
    const nuevoId = `POST-2026-${String(nuevoNumero).padStart(3, '0')}`;

    // 7. Formatear fecha oficial de emisión
    const fechaEmision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // 8. Construir el nuevo expediente con datos 100% dinámicos del usuario
    const nuevaPostulacion = {
      id: nuevoId,
      estudiante: {
        nombre: nombrePostulante,
        correo: correoPostulante,
        cedula: cedulaPostulante,
        carrera: body.estudiante?.carrera?.trim() || perfilEstudiante?.carrera || 'Carrera Universitaria',
        facultad: perfilEstudiante?.facultad || 'Facultad Académica ULEAM',
        semestre: perfilEstudiante?.periodo ? `${perfilEstudiante.periodo}` : 'Periodo 2026-2',
        ciudadOrigen: body.estudiante?.ciudadOrigen || 'Foráneo'
      },
      fechaPostulacion: fechaEmision,
      estado: 'Pendiente',
      prioridad: 'Alta',
      situacionSocioeconomica: {
        ingresoMensual: body.situacionEconomica?.ingresoMensualHogar ? `$ ${body.situacionEconomica.ingresoMensualHogar}` : '$ 0.00',
        egresosMensuales: body.situacionEconomica?.egresosMensuales ? `$ ${body.situacionEconomica.egresosMensuales}` : '$ 0.00',
        integrantes: body.hogar?.integrantes ? `${body.hogar.integrantes} personas` : '1 persona',
        dependientes: body.hogar?.dependientes ? `${body.hogar.dependientes} dependientes` : '0 dependientes',
        quintil: body.situacionEconomica?.quintil || 'Quintil 1'
      },
      referencias: Array.isArray(body.referencias) ? body.referencias : [],
      accesibilidad: {
        requiere: Boolean(body.accesibilidad?.necesidad),
        detalle: body.accesibilidad?.necesidad || 'Sin requerimientos específicos de movilidad',
        grupoVulnerable: body.accesibilidad?.grupoVulnerable || 'Ninguno'
      },
      habitacionSugerida: body.habitacionPreferencia?.codigo || perfilEstudiante?.habitacionId || 'HAB-A101',
      documentos: documentos,
      observacionesAdmin: 'Postulación registrada en línea por el estudiante. Pendiente de dictamen institucional.'
    };

    // 9. Guardar al inicio de la lista
    lista.unshift(nuevaPostulacion);

    try {
      await fs.writeFile(filePath, JSON.stringify(lista, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error guardando en postulaciones.json:', err);
    }

    return new Response(
      JSON.stringify({ success: true, postulacion: nuevaPostulacion }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en POST /api/postulaciones/create:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Ocurrió un error en el servidor al registrar la postulación.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
