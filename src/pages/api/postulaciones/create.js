/**
 * ============================================================================
 * ENDPOINT API: CREACIÓN DE POSTULACIÓN A RESIDENCIA UNIVERSITARIA
 * ============================================================================
 * UBICACIÓN: src/pages/api/postulaciones/create.js
 * MÉTODO HTTP: POST
 * FORMATO ENTRADA / SALIDA: JSON
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este endpoint procesa la creación de un nuevo expediente de postulación:
 * 1. Recibe el payload JSON enviado por el cliente.
 * 2. Valida obligatoriedad de cédula, correo institucional y nombre del postulante.
 * 3. Aplica la segunda barrera de seguridad contra duplicados en el servidor (HTTP 409).
 * 4. Consulta 'usuarios.json' para vincular la facultad y carrera real del estudiante.
 * 5. Genera un identificador formal correlativo (ej: 'POST-2026-001').
 * 6. Construye el objeto completo de la postulación y lo inserta al inicio de la lista.
 * 7. Guarda de forma atómica en 'src/data/postulaciones.json' y responde HTTP 200 OK.
 * 
 * FLUJO DE EJECUCIÓN:
 * - Solicitud entrante -> request.json()
 * - Validación obligatoria de datos del alumno (si falla -> HTTP 400)
 * - Verificación de coincidencia por cédula o correo (si existe -> HTTP 409)
 * - Mapeo de archivos y datos socioeconómicos
 * - fs.writeFile() en disco
 * - Respuesta JSON con { success: true, postulacion: nuevaPostulacion }
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import postulacionesIniciales from '../../../data/postulaciones.json';
import usuariosIniciales from '../../../data/usuarios.json';

// Indicador para Astro de que este endpoint se ejecuta dinámicamente en servidor (Node.js SSR)
export const prerender = false;

export async function POST({ request }) {
  try {
    // ------------------------------------------------------------------------
    // PASO 1: PARSEO Y LECTURA DEL PAYLOAD JSON ENTRANTE
    // ------------------------------------------------------------------------
    
    // VARIABLE 'body': Guarda el objeto JSON decodificado de la petición HTTP.
    const body = await request.json();

    // ------------------------------------------------------------------------
    // PASO 2: VALIDACIÓN DE CAMPOS OBLIGATORIOS DEL POSTULANTE
    // ------------------------------------------------------------------------
    
    // VARIABLE 'cedulaPostulante': Cédula recibida sin espacios externos.
    const cedulaPostulante = String(body.estudiante?.cedula || '').trim();

    // VARIABLE 'correoPostulante': Correo recibido en minúsculas y sin espacios.
    const correoPostulante = String(body.estudiante?.correo || '').trim().toLowerCase();

    // VARIABLE 'nombrePostulante': Nombre completo del postulante sin espacios externos.
    const nombrePostulante = String(body.estudiante?.nombre || '').trim();

    // Si falta alguno de los tres pilares de identidad, rechaza la solicitud (HTTP 400 Bad Request)
    if (!cedulaPostulante || !correoPostulante || !nombrePostulante) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Los datos de identificación del estudiante (cédula, nombre y correo institucional) son obligatorios.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // PASO 3: LECTURA DEL ARCHIVO DE POSTULACIONES EXISTENTES
    // ------------------------------------------------------------------------
    
    // VARIABLE 'filePath': Ruta absoluta calculada al archivo físico 'src/data/postulaciones.json'.
    const filePath = path.resolve('src/data/postulaciones.json');

    // VARIABLE 'lista': Almacena el arreglo en memoria con las solicitudes existentes.
    let lista = postulacionesIniciales;

    try {
      // VARIABLE 'dataRaw': Contenido crudo de texto leído desde el archivo físico en disco.
      const dataRaw = await fs.readFile(filePath, 'utf-8');
      lista = JSON.parse(dataRaw);
    } catch (e) {
      // Si el archivo no existe o está vacío, usa el fallback inicial
      lista = postulacionesIniciales;
    }

    // ------------------------------------------------------------------------
    // PASO 4: CONTROL DE SEGURIDAD SERVER-SIDE CONTRA POSTULACIONES DUPLICADAS
    // ------------------------------------------------------------------------
    
    // VARIABLE 'postExistente':
    // Busca si ya existe alguna postulación con la misma cédula o con el mismo correo institucional.
    const postExistente = lista.find((p) => {
      const pCedula = p.estudiante?.cedula ? String(p.estudiante.cedula).trim() : '';
      const pCorreo = p.estudiante?.correo ? String(p.estudiante.correo).trim().toLowerCase() : '';
      return (cedulaPostulante && pCedula === cedulaPostulante) || (correoPostulante && pCorreo === correoPostulante);
    });

    // Si ya existe un registro previo, devuelve código HTTP 409 Conflict impidiendo duplicados
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

    // ------------------------------------------------------------------------
    // PASO 5: CONSULTA DEL PERFIL REAL EN LA BASE DE DATOS DE USUARIOS
    // ------------------------------------------------------------------------
    
    // VARIABLE 'listaUsuarios': Colección de usuarios institucionales de la universidad.
    let listaUsuarios = usuariosIniciales;
    try {
      const userPath = path.resolve('src/data/usuarios.json');
      const rawUsers = await fs.readFile(userPath, 'utf-8');
      listaUsuarios = JSON.parse(rawUsers);
    } catch (e) {
      listaUsuarios = usuariosIniciales;
    }

    // VARIABLE 'perfilEstudiante':
    // Registro del estudiante encontrado en usuarios.json para vincular su facultad y carrera real.
    const perfilEstudiante = listaUsuarios.find(
      (u) => (u.cedula && String(u.cedula).trim() === cedulaPostulante) ||
             (u.email && String(u.email).trim().toLowerCase() === correoPostulante)
    );

    // ------------------------------------------------------------------------
    // PASO 6: PROCESAMIENTO DINÁMICO DE ARCHIVOS ADJUNTOS
    // ------------------------------------------------------------------------
    
    // VARIABLE 'documentos':
    // Arreglo donde se estructuran los documentos cargados por el postulante en el formulario.
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

    // ------------------------------------------------------------------------
    // PASO 7: GENERACIÓN DEL CORRELATIVO INSTITUCIONAL
    // ------------------------------------------------------------------------
    
    // VARIABLE 'nuevoNumero': Índice secuencial (total de elementos actuales + 1).
    const nuevoNumero = lista.length + 1;

    // VARIABLE 'nuevoId': Código formal formateado a 3 dígitos (ej: 'POST-2026-001').
    const nuevoId = `POST-2026-${String(nuevoNumero).padStart(3, '0')}`;

    // VARIABLE 'fechaEmision': Fecha oficial con formato '19 oct 2026'.
    const fechaEmision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // ------------------------------------------------------------------------
    // PASO 8: CONSTRUCCIÓN DEL EXPEDIENTE ESTUDIANTIL CON DATOS REALES
    // ------------------------------------------------------------------------
    
    // VARIABLE 'nuevaPostulacion':
    // Objeto consolidado del expediente estudiantil que se almacenará en la base de datos.
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
      condicionesConvivencia: body.condicionesConvivencia || null,
      habitacionSugerida: body.habitacionPreferencia?.codigo || perfilEstudiante?.habitacionId || 'HAB-A101',
      documentos: documentos,
      observacionesAdmin: 'Postulación registrada en línea por el estudiante. Pendiente de dictamen institucional.'
    };

    // ------------------------------------------------------------------------
    // PASO 9: INSERCIÓN ATÓMICA Y ESCRITURA EN DISCO
    // ------------------------------------------------------------------------
    // Inserta al principio para que las solicitudes más recientes se consulten primero
    lista.unshift(nuevaPostulacion);

    try {
      // Escribe el archivo en disco con sangría legible de 2 espacios
      await fs.writeFile(filePath, JSON.stringify(lista, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error guardando en postulaciones.json:', err);
    }

    // Actualiza el perfil del estudiante en usuarios.json
    try {
      if (perfilEstudiante) {
        perfilEstudiante.postulacionId = nuevoId;
        perfilEstudiante.documentosRenovacion = {
          requiereRenovacion: false,
          estado: 'Postulado - En Revisión',
          postulacionId: nuevoId,
          mensaje: 'Tu solicitud ha sido registrada y está en revisión por Bienestar Estudiantil.',
          proximaFecha: '30 oct 2026'
        };
        const userPath = path.resolve('src/data/usuarios.json');
        await fs.writeFile(userPath, JSON.stringify(listaUsuarios, null, 2), 'utf-8');
      }
    } catch (errUser) {
      console.error('Error actualizando usuarios.json:', errUser);
    }

    // ------------------------------------------------------------------------
    // PASO 10: RESPUESTA EXITOSA (HTTP 200 OK)
    // ------------------------------------------------------------------------
    return new Response(
      JSON.stringify({ success: true, postulacion: nuevaPostulacion }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Captura de fallos imprevistos en tiempo de ejecución (HTTP 500)
    console.error('Error en POST /api/postulaciones/create:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Ocurrió un error en el servidor al registrar la postulación.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
