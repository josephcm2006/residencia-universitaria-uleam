import React, { useState, useEffect } from 'react';

export default function SolicitudesPreviasModal({
  incidenciasIniciales = [],
  buttonText = "Ver mis solicitudes previas",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [listaIncidencias, setListaIncidencias] = useState(incidenciasIniciales);

  // Reproducir sonido suave al abrir
  const reproducirSonidoApertura = () => {
    try {
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 0.5;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => reproducirSintetizador());
      }
    } catch (e) {
      reproducirSintetizador();
    }
  };

  const reproducirSintetizador = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  };

  const handleOpen = () => {
    reproducirSonidoApertura();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Escuchar cuando se crea una nueva incidencia para agregarla a la lista en vivo
  useEffect(() => {
    const onNueva = (e) => {
      const inc = e.detail?.incidencia;
      if (inc) {
        setListaIncidencias((prev) => [inc, ...prev]);
      }
    };
    window.addEventListener('incidencia-creada', onNueva);
    return () => window.removeEventListener('incidencia-creada', onNueva);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (ev.key === 'Escape' && isOpen) handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const badgeEstado = (estado) => {
    switch (estado) {
      case 'Resuelta':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'En Proceso':
        return { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    }
  };

  const colorUrgencia = {
    Baja: '#15803D',
    Media: '#0284C7',
    Alta: '#D97706',
    Urgente: '#DC2626'
  };

  return (
    <>
      {/* Botón Disparador Secundario */}
      <button
        type="button"
        onClick={handleOpen}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          padding: '12px 22px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '14px',
          border: '1px solid #CBD5E1',
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#F8FAFC';
          e.currentTarget.style.borderColor = '#94A3B8';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#CBD5E1';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>{buttonText}</span>
        {listaIncidencias.length > 0 && (
          <span
            style={{
              backgroundColor: '#BA181B',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              marginLeft: '4px'
            }}
          >
            {listaIncidencias.length}
          </span>
        )}
      </button>

      {/* Modal con Fondo Desenfoque (Blur) y Cajita de Solicitudes */}
      {isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            animation: 'overlayFade 0.25s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              color: '#0F172A',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Cabecera */}
            <div
              style={{
                padding: '24px 28px 18px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#BA181B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Expediente de Mantenimiento · ULEAM
                </span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                  Mis Solicitudes e Incidencias Registradas
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '22px',
                  lineHeight: '1',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Cuerpo de la Cajita con Scroll */}
            <div
              style={{
                padding: '20px 28px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {listaIncidencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600 }}>No cuentas con incidencias registradas.</p>
                  <p style={{ fontSize: '13px' }}>Cuando reportes una situación con tu habitación, podrás ver su avance aquí.</p>
                </div>
              ) : (
                listaIncidencias.map((inc) => {
                  const estStyle = badgeEstado(inc.estado);
                  return (
                    <div
                      key={inc.id}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '16px 18px',
                        backgroundColor: '#F8FAFC',
                        transition: 'box-shadow 0.15s ease'
                      }}
                    >
                      {/* Fila superior: ID, Categoría y Estado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12.5px', color: '#0F172A', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '4px' }}>
                            {inc.id}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                            {inc.categoria}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: colorUrgencia[inc.urgencia] || '#475569',
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${colorUrgencia[inc.urgencia] || '#CBD5E1'}`,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            Urgencia {inc.urgencia}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: estStyle.bg,
                            color: estStyle.color,
                            border: `1px solid ${estStyle.border}`
                          }}
                        >
                          ● {inc.estado}
                        </span>
                      </div>

                      {/* Asunto y Fecha */}
                      <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
                        {inc.asunto}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.45', margin: '0 0 8px 0' }}>
                        {inc.descripcion}
                      </p>

                      {/* Respuesta de Mantenimiento */}
                      {inc.respuestaAdmin && (
                        <div
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderLeft: '3px solid #0284C7',
                            padding: '8px 12px',
                            borderRadius: '0 4px 4px 0',
                            fontSize: '12px',
                            color: '#334155',
                            marginTop: '8px'
                          }}
                        >
                          <strong style={{ color: '#0369A1', display: 'block', marginBottom: '2px' }}>
                            Dictamen institucional:
                          </strong>
                          {inc.respuestaAdmin}
                        </div>
                      )}

                      <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '8px', textAlign: 'right' }}>
                        Reportado: {inc.fechaReporte}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer con Enlace al Historial Completo */}
            <div
              style={{
                padding: '16px 28px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <a
                href="/mis-solicitudes"
                style={{
                  color: '#BA181B',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Ver historial completo detallado</span>
                <span>→</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cerrar cajita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
