/**
 * ============================================================================
 * ENDPOINT API: CIERRE DE SESIÓN INSTITUCIONAL (LOGOUT)
 * ============================================================================
 * UBICACIÓN: src/pages/api/auth/logout.js
 * MÉTODOS HTTP: POST y GET
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este archivo se encarga de invalidar la sesión activa del usuario:
 * 1. Elimina la cookie 'uleam_session' en el navegador del cliente.
 * 2. Si se llama vía POST (fetch o AJAX): retorna JSON { success: true }.
 * 3. Si se llama vía GET (enlace o navegación directa): redirige al inicio de sesión ('/').
 * 
 * FLUJO DE EJECUCIÓN:
 * - Recibe solicitud -> cookies.delete('uleam_session', { path: '/' })
 * - Si es POST: responde HTTP 200 con JSON
 * - Si es GET: ejecuta redirect('/') hacia la pantalla de login principal
 */

export const prerender = false;

/**
 * Cierre de sesión asíncrono para llamadas fetch / JavaScript.
 */
export async function POST({ cookies }) {
  // Elimina la cookie de sesión institucional en la raíz del dominio
  cookies.delete('uleam_session', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Cierre de sesión síncrono para redirecciones de hipervínculos HTML.
 */
export async function GET({ cookies, redirect }) {
  // Elimina la cookie de sesión institucional en la raíz del dominio
  cookies.delete('uleam_session', { path: '/' });

  // Redirige al estudiante al formulario de autenticación principal
  return redirect('/');
}
