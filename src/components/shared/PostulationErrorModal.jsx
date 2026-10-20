import React, { useState, useEffect } from 'react';

/**
 * ============================================================================
 * MODAL DE ERROR / DUPLICADO EN POSTULACIÓN (CON FONDO BLUR)
 * ============================================================================
 * Se despliega cuando el estudiante intenta postular dos veces o cuando
 * existen campos y documentos con errores de validación.
 */
export default function PostulationErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [titulo, setTitulo] = useState('Error en la postulación');
  const [mensaje, setMensaje] = useState('');
  const [listaErrores, setListaErrores] = useState([]);
  const [esDuplicado, setEsDuplicado] = useState(false);

  useEffect(() => {
    // Escuchar evento personalizado emitido por el validador
    const manejarApertura = (e) => {
      const detalle = e.detail || {};
      setTitulo(detalle.titulo || (detalle.esDuplicado ? 'Postulación Ya Registrada' : 'Revisión de Requisitos'));
      setMensaje(detalle.mensaje || '');
      setListaErrores(detalle.errores || []);
      setEsDuplicado(Boolean(detalle.esDuplicado));
      setIsOpen(true);
    };

    window.addEventListener('abrir-modal-error-postulacion', manejarApertura);
    return () => {
      window.removeEventListener('abrir-modal-error-postulacion', manejarApertura);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
          border: '1px solid #E2E8F0',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Icono de advertencia o error en círculo */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: esDuplicado ? '#FEF3C7' : '#FEE2E2',
            color: esDuplicado ? '#D97706' : '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          {esDuplicado ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>

        {/* Título del Error */}
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
          {titulo}
        </h3>

        {/* Mensaje descriptivo principal */}
        {mensaje && (
          <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
            {mensaje}
          </p>
        )}

        {/* Lista detallada de errores en caso de múltiples campos faltantes */}
        {listaErrores.length > 0 && (
          <div
            style={{
              textAlign: 'left',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}
          >
            <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '6px' }}>
              Por favor revisa los siguientes puntos:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
              {listaErrores.map((err, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón de acción */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            width: '100%',
            backgroundColor: esDuplicado ? '#D97706' : '#BA181B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {esDuplicado ? 'Entendido, volver' : 'Corregir formulario'}
        </button>
      </div>
    </div>
  );
}
