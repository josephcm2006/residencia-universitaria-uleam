import React, { useState, useEffect, useRef } from 'react';

/**
 * ============================================================================
 * ANIMACIÓN DE POSTULACIÓN TIPO TRANSFERENCIA BANCARIA (VISTO VERDE FLUIDO)
 * ============================================================================
 * Ubicación: src/components/animations/AnimacionPostulacion.jsx
 * 
 * Flujo:
 * 1. 'cargando': Breve spinner institucional de procesamiento (1.2s).
 * 2. 'exito': Círculo verde trazado y visto verde fluido con sonido de
 *    verificación exitosa tipo app bancaria (3 segundos completos).
 * 3. Redirección automática inmediata a /postulado.astro.
 */
export default function AnimacionPostulacion() {
  const [fase, setFase] = useState('inactivo'); // 'inactivo' | 'cargando' | 'exito'
  const [codigoPostulacion, setCodigoPostulacion] = useState('POST-2026-001');
  const codigoRef = useRef('POST-2026-001');
  const timerExitoRef = useRef(null);
  const timerRedirigirRef = useRef(null);

  // Sonido de verificación exitosa (Estilo campanada de transferencia bancaria)
  const reproducirSonidoExito = () => {
    // 1. Audio pop.wav
    try {
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}

    // 2. Chime armónico y cristalino tipo app bancaria (D5 -> A5 -> E6)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const ahora = ctx.currentTime;

      // Nota 1: D5 preparatoria suave
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ahora);
      gain1.gain.setValueAtTime(0.18, ahora);
      gain1.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ahora);
      osc1.stop(ahora + 0.35);

      // Nota 2: A5 brillante de confirmación
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, ahora + 0.1);
      gain2.gain.setValueAtTime(0, ahora + 0.1);
      gain2.gain.linearRampToValueAtTime(0.38, ahora + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ahora + 0.1);
      osc2.stop(ahora + 0.85);

      // Nota 3: Armónico E6 cristalino y resonante
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.51, ahora + 0.16);
      gain3.gain.setValueAtTime(0, ahora + 0.16);
      gain3.gain.linearRampToValueAtTime(0.28, ahora + 0.19);
      gain3.gain.exponentialRampToValueAtTime(0.001, ahora + 1.25);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ahora + 0.16);
      osc3.stop(ahora + 1.25);
    } catch (err) {}
  };

  const redirigirAPostulado = (codigo) => {
    const cod = codigo || codigoRef.current || codigoPostulacion || 'POST-2026-001';
    window.location.href = `/postulado?id=${encodeURIComponent(cod)}`;
  };

  useEffect(() => {
    // Escuchar inicio de envío
    const onIniciar = () => {
      setFase('cargando');
    };

    // Escuchar confirmación exitosa
    const onExito = (e) => {
      const detalle = e.detail || {};
      const cod = detalle.codigo || (detalle.postulacion && detalle.postulacion.id) || 'POST-2026-001';
      codigoRef.current = cod;
      setCodigoPostulacion(cod);

      // PASO 1: Carga breve (1.2s)
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      timerExitoRef.current = setTimeout(() => {
        // PASO 2: Transición al visto verde fluido estilo app bancaria
        setFase('exito');
        setTimeout(() => {
          reproducirSonidoExito();
        }, 400); // Suena justo cuando el visto comienza a trazarse

        // PASO 3: Mantener la animación durante exactamente 3 segundos completos
        if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
        timerRedirigirRef.current = setTimeout(() => {
          redirigirAPostulado(cod);
        }, 3000);
      }, 1200);
    };

    const onCerrar = () => {
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
      setFase('inactivo');
    };

    window.addEventListener('iniciar-envio-postulacion', onIniciar);
    window.addEventListener('postulacion-exitosa', onExito);
    window.addEventListener('cerrar-modal-exito-postulacion', onCerrar);

    return () => {
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
      window.removeEventListener('iniciar-envio-postulacion', onIniciar);
      window.removeEventListener('postulacion-exitosa', onExito);
      window.removeEventListener('cerrar-modal-exito-postulacion', onCerrar);
    };
  }, []);

  if (fase === 'inactivo') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
        animation: 'overlayFadeIn 0.3s ease'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          padding: '42px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          textAlign: 'center',
          color: '#0F172A',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          animation: 'cardSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {fase === 'cargando' ? (
          /* ========================================================
             FASE 1: CARGANDO POSTULACIÓN (PROCESAMIENTO INSTITUCIONAL)
             ======================================================== */
          <div>
            <div style={{ position: 'relative', width: '68px', height: '68px', margin: '0 auto 24px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '4px solid #F1F5F9',
                  borderRadius: '50%'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '4px solid transparent',
                  borderTopColor: '#BA181B',
                  borderRightColor: '#10B981',
                  borderRadius: '50%',
                  animation: 'spinLoader 1s linear infinite'
                }}
              />
            </div>

            <h3 style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Cargando postulación...
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: '0 auto 18px', maxWidth: '340px' }}>
              Cifrando expediente estudiantil y registrando documentos en Bienestar Estudiantil.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#94A3B8',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <span>Conexión institucional segura</span>
            </div>
          </div>
        ) : (
          /* ========================================================
             FASE 2: VISTO VERDE FLUIDO TIPO TRANSFERENCIA (3 SEGUNDOS)
             ======================================================== */
          <div style={{ animation: 'contentFadeIn 0.35s ease' }}>
            
            {/* Animación del Círculo y Visto Verde Fluido (Estilo Transferencia Bancaria) */}
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Resplandor y halo verde suave que late suavemente */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.16)',
                  animation: 'pulseGlow 2.5s infinite ease-in-out'
                }}
              />

              {/* Círculo trazado fluidamente alrededor de 360 grados */}
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                style={{
                  transform: 'rotate(-90deg)',
                  display: 'block'
                }}
              >
                {/* Fondo suave */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="#F0FDF4"
                  stroke="#E2E8F0"
                  strokeWidth="4"
                />

                {/* Trazo circular fluido animado */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray="276.46"
                  strokeDashoffset="276.46"
                  style={{
                    animation: 'strokeCircleFluid 1.2s cubic-bezier(0.65, 0, 0.45, 1) forwards'
                  }}
                />
              </svg>

              {/* Visto verde dibujado de forma fluida de izquierda a derecha */}
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'block'
                }}
              >
                <path
                  d="M30 52 L44 65 L72 36"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="75"
                  strokeDashoffset="75"
                  style={{
                    animation: 'strokeCheckFluid 0.9s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards'
                  }}
                />
              </svg>
            </div>

            <h3 style={{ fontSize: '23px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              ¡Postulación Exitosa!
            </h3>

            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#F1F5F9',
                color: '#1E293B',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                padding: '5px 14px',
                borderRadius: '999px',
                border: '1px solid #CBD5E1',
                marginBottom: '16px'
              }}
            >
              {codigoPostulacion}
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 auto 24px' }}>
              ¡Tu solicitud ha sido registrada correctamente! Cargando comprobante oficial...
            </p>

            {/* Botón interactivo para avanzar sin esperar */}
            <button
              type="button"
              onClick={() => redirigirAPostulado(codigoPostulacion)}
              style={{
                width: '100%',
                backgroundColor: '#15803D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
            >
              <span>Ver mi comprobante oficial →</span>
            </button>
          </div>
        )}
      </div>

      {/* Animaciones CSS Keyframes */}
      <style>{`
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes contentFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes strokeCircleFluid {
          from {
            stroke-dashoffset: 276.46;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes strokeCheckFluid {
          from {
            stroke-dashoffset: 75;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseGlow {
          0% {
            transform: scale(0.95);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
