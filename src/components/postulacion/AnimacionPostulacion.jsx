import React, { useState, useEffect, useRef } from 'react';

/**
 * ============================================================================
 * PÁGINA ASOCIADA: src/pages/postulation.astro (Ruta: /postulation)
 * TIPO: Componente React para la animación de confirmación de postulación
 * ============================================================================
 * UBICACIÓN: src/components/postulacion/AnimacionPostulacion.jsx
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este componente React gestiona la retroalimentación audiovisual cuando el estudiante
 * envía su formulario de postulación:
 * 1. Muestra un estado de procesamiento con desenfoque de fondo y spinner concéntrico (1.2s).
 * 2. Transiciona a un visto verde animado vectorial fluido (estilo confirmación de pago móvil).
 * 3. Ejecuta simultáneamente un sonido de confirmación institucional mediante Web Audio API.
 * 4. Permanece en pantalla durante 3.0 segundos completos para que el alumno aprecie el éxito.
 * 5. Redirige automáticamente al comprobante oficial (/postulado?id=POST-...).
 * 
 * VARIABLES DE ESTADO Y REFERENCIAS:
 * - 'fase': Máquina de estados ('inactivo' | 'cargando' | 'exito').
 * - 'codigoPostulacion': Código correlativo retornado por el servidor (ej: 'POST-2026-001').
 * - 'codigoRef': Referencia mutable (useRef) para evitar re-renderizados accidentales en timers.
 * - 'timerExitoRef': Manejador del setTimeout para la transición de carga a éxito.
 * - 'timerRedirigirRef': Manejador del setTimeout de los 3.0 segundos para la redirección.
 */
export default function AnimacionPostulacion() {
  // VARIABLE 'fase':
  // Controla la etapa visual: 'inactivo' (oculto), 'cargando' (spinner), 'exito' (visto verde).
  const [fase, setFase] = useState('inactivo');

  // VARIABLE 'codigoPostulacion':
  // Guarda el código oficial retornado por el backend para mostrarlo en el badge central.
  const [codigoPostulacion, setCodigoPostulacion] = useState('POST-2026-001');

  // VARIABLE 'codigoRef':
  // Almacena el código en un ref mutable para que las clausuras de setTimeout siempre lean el valor real.
  const codigoRef = useRef('POST-2026-001');

  // VARIABLE 'timerExitoRef':
  // Referencia para pausar o limpiar el temporizador de carga (1.2s) si el modal se desmonta.
  const timerExitoRef = useRef(null);

  // VARIABLE 'timerRedirigirRef':
  // Referencia para pausar o limpiar el temporizador de permanencia (3.0s) de la confirmación.
  const timerRedirigirRef = useRef(null);

  // --------------------------------------------------------------------------
  // SÍNTESIS SONORA TIPO APP BANCARIA (WEB AUDIO API + ARCHIVO POP)
  // --------------------------------------------------------------------------
  
  /**
   * Genera un chime armónico cristalino de 3 notas tipo verificación bancaria
   * (Re 587.33Hz -> La 880Hz -> Mi 1318.51Hz) con curva de resonancia suave.
   */
  const reproducirSonidoExito = () => {
    // 1. Reproducción de audio grabado como respaldo
    try {
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}

    // 2. Síntesis armónica en tiempo real mediante Web Audio API
    try {
      // VARIABLE 'AudioCtx': Constructor nativo de audio del navegador.
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      // VARIABLE 'ctx': Contexto maestro de procesamiento de audio.
      const ctx = new AudioCtx();

      // Si el navegador suspendió el audio por políticas de interacción, se reactiva
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // VARIABLE 'ahora': Tiempo base del reloj interno de audio en segundos.
      const ahora = ctx.currentTime;

      // --- NOTA 1: D5 (587.33 Hz) - Tono senoidal preparatorio suave ---
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

      // --- NOTA 2: A5 (880.00 Hz) - Tono triangular brillante de confirmación ---
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

      // --- NOTA 3: E6 (1318.51 Hz) - Armónico cristalino con resonancia prolongada ---
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

  /**
   * Redirige el navegador a la página de comprobante oficial con el ID en URL.
   * @param {string} codigo - Código de la postulación (ej: 'POST-2026-001').
   */
  const redirigirAPostulado = (codigo) => {
    // VARIABLE 'cod': Código prioritario para asegurar que nunca viaje undefined en la URL.
    const cod = codigo || codigoRef.current || codigoPostulacion || 'POST-2026-001';
    window.location.href = `/postulado?id=${encodeURIComponent(cod)}`;
  };

  // --------------------------------------------------------------------------
  // ESCUCHA DE EVENTOS PERSONALIZADOS DEL SISTEMA
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Evento disparado por postulacion.js al hacer clic en enviar
    const onIniciar = () => {
      setFase('cargando');
    };

    // Evento disparado por postulacion.js cuando el servidor responde HTTP 200 OK
    const onExito = (e) => {
      // VARIABLE 'detalle': Datos adjuntos en el evento CustomEvent
      const detalle = e.detail || {};

      // VARIABLE 'cod': Extrae el código correlativo formal generado
      const cod = detalle.codigo || (detalle.postulacion && detalle.postulacion.id) || 'POST-2026-001';
      codigoRef.current = cod;
      setCodigoPostulacion(cod);

      // PASO 1: Mantener spinner de carga durante 600ms para feedback visual
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      timerExitoRef.current = setTimeout(() => {
        // PASO 2: Transición a la fase de visto verde fluido
        setFase('exito');

        // Suena el acorde cristalino justo cuando el trazo del visto empieza a dibujarse
        setTimeout(() => {
          reproducirSonidoExito();
        }, 200);

        // PASO 3: Mantener la animación de éxito durante 1.0 segundo y redirigir
        if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
        timerRedirigirRef.current = setTimeout(() => {
          redirigirAPostulado(cod);
        }, 1000);
      }, 600);
    };

    // Evento para cerrar y resetear el modal en caso de error
    const onCerrar = () => {
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
      setFase('inactivo');
    };

    // Registro de listeners globales en la ventana del navegador
    window.addEventListener('iniciar-envio-postulacion', onIniciar);
    window.addEventListener('postulacion-exitosa', onExito);
    window.addEventListener('cerrar-modal-exito-postulacion', onCerrar);

    // Limpieza de listeners al desmontar el componente
    return () => {
      if (timerExitoRef.current) clearTimeout(timerExitoRef.current);
      if (timerRedirigirRef.current) clearTimeout(timerRedirigirRef.current);
      window.removeEventListener('iniciar-envio-postulacion', onIniciar);
      window.removeEventListener('postulacion-exitosa', onExito);
      window.removeEventListener('cerrar-modal-exito-postulacion', onCerrar);
    };
  }, []);

  // Si está inactivo, no renderiza elementos en el DOM para ahorrar memoria
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
            
            {/* Contenedor del Círculo y Visto Verde Vectorial */}
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
              {/* Halo verde pulsante de fondo */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.16)',
                  animation: 'pulseGlow 2.5s infinite ease-in-out'
                }}
              />

              {/* Círculo trazado en 360 grados (perímetro 2*PI*44 = 276.46) */}
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                style={{
                  transform: 'rotate(-90deg)',
                  display: 'block'
                }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="#F0FDF4"
                  stroke="#E2E8F0"
                  strokeWidth="4"
                />

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

              {/* Visto verde dibujado de izquierda a derecha (strokeDasharray 75) */}
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

            {/* Badge con el código de postulación retornado */}
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

            {/* Botón de acceso inmediato si el estudiante no desea esperar los 3 segundos */}
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

      {/* Keyframes animaciones CSS */}
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
