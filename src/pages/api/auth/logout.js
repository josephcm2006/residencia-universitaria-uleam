export const prerender = false;

export async function POST({ cookies }) {
  cookies.delete('uleam_session', { path: '/' });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET({ cookies, redirect }) {
  cookies.delete('uleam_session', { path: '/' });
  return redirect('/');
}
