import React, { useState, useEffect, useRef } from 'react';

export default function HelpModal({
  buttonText = "ⓘ Ayuda",
  className = "help-link",
  customStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Reproducir el sonido suave al abrir
  const playPopSound = () => {
    try {
      // 1. Intentar reproducir desde el archivo de assets
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 0.4;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback con sintetizador nativo Web Audio API si el navegador restringe el archivo
          playSynthPop();
        });
      }
    } catch (e) {
      playSynthPop();
    }
  };

  // Sonido sintetizado de respaldo (burbuja / chime suave)
  const playSynthPop = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.09);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (err) {}
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isOpen;
    if (nextState) {
      playPopSound();
    }
    setIsOpen(nextState);
  };

  // Cerrar al hacer clic fuera de la nubecita
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      {/* Botón / Anchor disparador */}
      <button
        type="button"
        onClick={handleToggle}
        className={className}
        aria-expanded={isOpen}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: isOpen ? '#BA181B' : 'inherit',
          fontWeight: 600,
          transition: 'color 0.15s, transform 0.1s',
          ...customStyle
        }}
      >
        {buttonText}
      </button>

      {/* Nubecita flotante anclada al botón con animación de desplazamiento */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Información de Ayuda"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: '-10px',
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            zIndex: 99999,
            color: '#18181B',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            animation: 'nubecitaSlideDown 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            transformOrigin: 'top right'
          }}
        >
          {/* Triangulito de la nube apuntando al anchor */}
          <div
            style={{
              position: 'absolute',
              top: '-7px',
              right: '24px',
              width: '14px',
              height: '14px',
              backgroundColor: '#ffffff',
              transform: 'rotate(45deg)',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
              zIndex: 1
            }}
          />

          {/* Encabezado de la Nubecita */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
              <div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#09090B', display: 'block', lineHeight: 1.2 }}>
                  ¿Necesitas Ayuda?
                </strong>
                <span style={{ fontSize: '11px', color: '#71717A' }}>Soporte de Residencia ULEAM</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar ayuda"
              style={{
                background: '#F4F4F5',
                border: 'none',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#71717A',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#27272A', padding: '10px 0', borderTop: '1px solid #F4F4F5', borderBottom: '1px solid #F4F4F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><strong>Tel:</strong> (+593) 098 564 2153</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                <strong>Email:</strong>{' '}
                <a href="mailto:residencia@uleam.edu.ec" style={{ color: '#000000', textDecoration: 'none', fontWeight: 600 }}>
                  residencia@uleam.edu.ec
                </a>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><strong>Horario:</strong> Lun a Vie · 08:00 - 17:00</span>
            </div>
          </div>

          {/* Pastilla de tip */}
          <div style={{ marginTop: '10px', backgroundColor: '#FFFFFF', border: '1px solid #000000', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#000000', lineHeight: '1.4' }}>
            <strong>Tip:</strong> Puedes guardar tu borrador y continuar llenando tus documentos en cualquier momento.
          </div>

          {/* Estilos de animación embebidos */}
          <style>{`
            @keyframes nubecitaSlideDown {
              0% {
                opacity: 0;
                transform: translateY(-12px) scale(0.92);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
