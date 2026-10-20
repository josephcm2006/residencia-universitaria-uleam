import React, { useState, useEffect } from 'react';

/**
 * ============================================================================
 * MODAL DE PROCESAMIENTO Y ÉXITO DE POSTULACIÓN (CON FONDO BLUR)
 * ============================================================================
 * Muestra primero la fase "Cargando postulación..." y luego transiciona a
 * "¡Postulación correcta!" con animación de visto verde y efecto sonoro.
 */
export default function PostulationSuccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [fase, setFase] = useState('cargando'); // 'cargando' | 'exito'
  const [codigoPostulacion, setCodigoPostulacion] = useState('POST-2026-001');

  // Reproducir sonido de confirmación institucional
  const reproducirSonidoExito = () => {
    try {
      // 1. Intentar reproducir archivo de audio pop.wav
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 0.7;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si el navegador bloquea el audio externo, usar Web Audio API
          reproducirChimeSintetizado();
        });
      }
    } catch (e) {
      reproducirChimeSintetizado();
    }
  };

  // Sonido sintetizado agradable y positivo (Do - Mi - Sol)
  const reproducirChimeSintetizado = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notas = [523.25, 659.25, 783.99]; // Acorde C mayor
      notas.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const inicio = ctx.currentTime + index * 0.08;
        const fin = inicio + 0.35;

        gain.gain.setValueAtTime(0, inicio);
        gain.gain.linearRampToValueAtTime(0.2, inicio + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, fin);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(inicio);
        osc.stop(fin);
      });
    } catch (err) {}
  };

  useEffect(() => {
    // Escuchar inicio de envío
    const manejarInicio = (e) => {
      setFase('cargando');
      setIsOpen(true);
    };

    // Escuchar confirmación exitosa del servidor
    const manejarExito = (e) => {
      const detalle = e.detail || {};
      setCodigoPostulacion(detalle.codigo || 'POST-2026-001');

      // Dar un pequeño delay para que la transición sea visible y fluida
      setTimeout(() => {
        setFase('exito');
        reproducirSonidoExito();
      }, 700);
    };

    // Escuchar cierre forzado (ej. si hubo error de duplicado en servidor)
    const manejarCierre = () => {
      setIsOpen(false);
    };

    window.addEventListener('iniciar-envio-postulacion', manejarInicio);
    window.addEventListener('postulacion-exitosa', manejarExito);
    window.addEventListener('cerrar-modal-exito-postulacion', manejarCierre);

    return () => {
      window.removeEventListener('iniciar-envio-postulacion', manejarInicio);
      window.removeEventListener('postulacion-exitosa', manejarExito);
      window.removeEventListener('cerrar-modal-exito-postulacion', manejarCierre);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          maxWidth: '440px',
          width: '100%',
          padding: '36px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
      >
        {fase === 'cargando' ? (
          /* ========================================================
             FASE 1: CARGANDO POSTULACIÓN
             ======================================================== */
          <div>
            {/* Spinner Institucional */}
            <div
              style={{
                width: '54px',
                height: '54px',
                border: '4px solid #E2E8F0',
                borderTop: '4px solid #BA181B',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spinLoader 0.8s linear infinite'
              }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Cargando postulación...
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
              Cifrando expediente estudiantil y registrando documentos en la base de datos de residencia ULEAM.
            </p>
          </div>
        ) : (
          /* ========================================================
             FASE 2: POSTULACIÓN CORRECTA CON VISTO VERDE ANIMADO
             ======================================================== */
          <div style={{ animation: 'fadeInContent 0.35s ease' }}>
            {/* Animación del Visto Verde */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                border: '2px solid #86EFAC',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                animation: 'scaleCheckmark 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              ¡Postulación correcta!
            </h3>

            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'monospace',
                padding: '4px 12px',
                borderRadius: '99px',
                marginBottom: '14px',
                border: '1px solid #E2E8F0'
              }}
            >
              {codigoPostulacion}
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', marginBottom: '24px' }}>
              Tu solicitud de residencia ha sido enviada con éxito. El comité evaluador revisará tus soportes socioeconómicos para el periodo académico 2026-2.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/portal-init';
              }}
              style={{
                width: '100%',
                backgroundColor: '#15803D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
            >
              Aceptar y Volver al Portal
            </button>
          </div>
        )}
      </div>

      {/* Estilos de animación en línea */}
      <style>{`
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes scaleCheckmark {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
