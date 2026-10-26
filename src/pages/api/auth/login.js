/**
 * ============================================================================
 * ENDPOINT DE AUTENTICACIÓN (LOGIN) - API INSTITUCIONAL ULEAM
 * ============================================================================
 * UBICACIÓN: src/pages/api/auth/login.js
 * MÉTODO: POST
 * FORMATO: JSON
 * 
 * PROPÓSITO:
 * Valida las credenciales (correo institucional y contraseña) de estudiantes
 * y administradores, creando la cookie de sesión institucional ('uleam_session')
 * y redirigiendo al portal correspondiente.
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Recibe 'email' y 'password' desde el formulario cliente.
 * 2. Valida que los campos no estén vacíos.
 * 3. Busca primero en la lista de estudiantes ('usuarios.json').
 * 4. Si no coincide, busca en la lista de administradores ('administradores.json').
 * 5. Si no existe usuario válido, responde con HTTP 401 (No autorizado).
 * 6. Si es correcto, emite la cookie de sesión 'uleam_session' (activa por 7 días).
 * 7. Determina la ruta según el rol:
 *    - Administrador -> '/dashboard'
 *    - Estudiante    -> '/portal-init'
 * 8. Responde con HTTP 200 OK y la ruta de destino.
 */

import usuarios from '../../../data/usuarios.json';
import administradores from '../../../data/administradores.json';

// Indicador para que Astro ejecute este endpoint en el servidor de forma dinámica
export const prerender = false;

export async function POST({ request, cookies }) {
  try {
    // ------------------------------------------------------------------------
    // PASO 1: EXTRAER DATOS ENVIADOS EN LA PETICIÓN
    // ------------------------------------------------------------------------
    // Obtenemos el objeto JSON enviado desde el cliente
    const datosEntrada = await request.json();

    // email: Correo institucional ingresado
    // password: Clave o contraseña ingresada
    const { email, password } = datosEntrada;

    // ------------------------------------------------------------------------
    // PASO 2: VALIDACIÓN BÁSICA DE CAMPOS OBLIGATORIOS
    // ------------------------------------------------------------------------
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Por favor ingrese su correo institucional y su contraseña.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // PASO 3: LIMPIAR Y NORMALIZAR VALORES
    // ------------------------------------------------------------------------
    // Convertimos el correo a minúsculas y sin espacios para evitar errores de tipeo
    const correoNormalizado = email.toString().toLowerCase().trim();
    const claveNormalizada = password.toString().trim();

    // ------------------------------------------------------------------------
    // PASO 4: BUSCAR EN ESTUDIANTES Y ADMINISTRADORES
    // ------------------------------------------------------------------------
    // Buscar primero en la lista de estudiantes
    let usuarioEncontrado = usuarios.find(
      (u) => u.email.toLowerCase().trim() === correoNormalizado && u.password === claveNormalizada
    );

    // Variable booleana para saber si el usuario tiene privilegios de administrador
    let esAdmin = false;

    // Si no fue un estudiante, buscar en la lista de administradores
    if (!usuarioEncontrado) {
      usuarioEncontrado = administradores.find(
        (a) => a.email.toLowerCase().trim() === correoNormalizado && a.password === claveNormalizada
      );
      if (usuarioEncontrado) {
        esAdmin = true;
      }
    }

    // ------------------------------------------------------------------------
    // PASO 5: SI NO COINCIDE NINGUNO, RECHAZAR CON CÓDIGO HTTP 401
    // ------------------------------------------------------------------------
    if (!usuarioEncontrado) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El correo electrónico o la contraseña son incorrectos.'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // PASO 6: CONSTRUIR LA INFORMACIÓN DE SESIÓN (SIN INCLUIR LA CONTRASEÑA)
    // ------------------------------------------------------------------------
    const sessionData = {
      id: usuarioEncontrado.id,
      email: usuarioEncontrado.email,
      nombre: usuarioEncontrado.nombre,
      nombreCompleto: usuarioEncontrado.nombreCompleto,
      rol: usuarioEncontrado.rol,
      cedula: usuarioEncontrado.cedula,
      carrera: usuarioEncontrado.carrera || null,
      cargo: usuarioEncontrado.cargo || null,
      departamento: usuarioEncontrado.departamento || null
    };

    // ------------------------------------------------------------------------
    // PASO 7: GUARDAR LA COOKIE DE SESIÓN EN EL NAVEGADOR
    // ------------------------------------------------------------------------
    // Duración de 7 días (60 * 60 * 24 * 7 segundos)
    cookies.set('uleam_session', JSON.stringify(sessionData), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax'
    });

    // ------------------------------------------------------------------------
    // PASO 8: DETERMINAR LA RUTA DE DESTINO SEGÚN EL ROL
    // ------------------------------------------------------------------------
    // Administradores van a '/dashboard', Estudiantes a '/portal-init'
    const rutaDestino = esAdmin ? '/dashboard' : '/portal-init';

    // ------------------------------------------------------------------------
    // PASO 9: RESPUESTA EXITOSA (HTTP 200)
    // ------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        user: sessionData,
        redirectTo: rutaDestino
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Manejo de errores imprevistos
    console.error('Error en POST /api/auth/login:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ocurrió un error al procesar el inicio de sesión.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
