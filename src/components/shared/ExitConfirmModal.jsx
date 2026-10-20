import React, { useState } from 'react';

export default function ExitConfirmModal({
  buttonText = "↪ Cerrar sesión",
  title = "¿Estás seguro de que deseas salir?",
  message = "Se cerrará tu sesión activa. Puedes volver a ingresar en cualquier momento con tus credenciales de Microsoft 365.",
  confirmText = "Sí, cerrar sesión",
  cancelText = "Cancelar",
  redirectUrl = "/api/auth/logout",
  className = "logout-link",
  customStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    try {
      localStorage.removeItem('uleam_session');
    } catch (e) {}
    window.location.href = redirectUrl;
  };

  return (
    <>
      {/* Botón Disparador */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          ...customStyle
        }}
      >
        {buttonText}
      </button>

      {/* Ventana Emergente con Fondo Blur */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '420px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              color: '#18181B',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: 'center'
            }}
          >
            {/* Icono de advertencia */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px'
              }}
            >
              🚪
            </div>

            {/* Título y Mensaje */}
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>
              {title}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#71717A', lineHeight: '1.5' }}>
              {message}
            </p>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F4F4F5',
                  color: '#18181B',
                  border: '1px solid #E4E4E7',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  backgroundColor: '#BA181B',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
