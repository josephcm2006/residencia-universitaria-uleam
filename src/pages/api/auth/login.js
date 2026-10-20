import usuarios from '../../../data/usuarios.json';
import administradores from '../../../data/administradores.json';

export const prerender = false;

export async function POST({ request, cookies }) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = (email || '').toString().toLowerCase().trim();
    const cleanPassword = (password || '').toString();

    // 1. Buscar primero en estudiantes (usuarios.json)
    let user = usuarios.find(
      (u) => u.email.toLowerCase().trim() === cleanEmail && u.password === cleanPassword
    );
    let esAdmin = false;

    // 2. Si no coincide, buscar en administradores (administradores.json)
    if (!user) {
      user = administradores.find(
        (a) => a.email.toLowerCase().trim() === cleanEmail && a.password === cleanPassword
      );
      if (user) {
        esAdmin = true;
      }
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El correo electrónico o la contraseña son incorrectos. Verifique sus credenciales institucionales.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      nombreCompleto: user.nombreCompleto,
      rol: user.rol,
      cedula: user.cedula,
      cargo: user.cargo || null,
      departamento: user.departamento || null,
      carrera: user.carrera || null,
      facultad: user.facultad || null
    };

    cookies.set('uleam_session', JSON.stringify(sessionData), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'lax'
    });

    // Administradores se redirigen a /dashboard, estudiantes a /portal-init
    const targetUrl = esAdmin ? '/dashboard' : '/portal-init';

    return new Response(
      JSON.stringify({
        success: true,
        user: sessionData,
        redirectTo: targetUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ocurrió un error inesperado al procesar el inicio de sesión.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
