import React, { useState } from 'react';

/**
 * ============================================================================
 * COMPONENTE COMPARTIDO: Modal de confirmación de salida y cierre de sesión
 * USADO EN: Cabeceras de todas las páginas protegidas (/portal-init, /postulation, /residente-dashboard, /dashboard)
 * ============================================================================
 * UBICACIÓN: src/components/shared/ExitConfirmModal.jsx
 * 
 * FUNCIONAMIENTO GENERAL:
 * Este componente despliega un diálogo emergente de confirmación institucional:
 * 1. Previene salidas accidentales en formularios o pantallas de postulación.
 * 2. Al confirmar, remueve las credenciales en localStorage ('uleam_session').
 * 3. Redirige a la ruta asignada (por defecto '/api/auth/logout' para eliminar cookies).
 * 4. Implementa fondo oscurecido con desenfoque (blur de 8px).
 * 
 * PROPS:
 * - 'buttonText': Texto del botón activador (ej: "↪ Salir" o "Cerrar sesión").
 * - 'title': Encabezado de la ventana modal.
 * - 'message': Texto explicativo para advertir al usuario.
 * - 'confirmText': Texto del botón de confirmación de salida.
 * - 'cancelText': Texto del botón para cancelar y quedarse en la página.
 * - 'redirectUrl': Destino de navegación al confirmar la salida.
 */
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
  // VARIABLE 'isOpen': Estado de visibilidad (true = modal abierto, false = cerrado).
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Ejecuta la limpieza de la sesión local y efectúa la redirección.
   */
  const handleConfirm = () => {
    try {
      // Limpia la clave de sesión en el almacenamiento del navegador
      localStorage.removeItem('uleam_session');
    } catch (e) {}

    // Redirige al endpoint de logout o a la URL especificada
    window.location.href = redirectUrl;
  };

  return (
    <>
      {/* Botón Disparador en la Cabecera */}
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

      {/* Ventana Emergente con Fondo Desenfoque (Backdrop Blur) */}
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
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              maxWidth: '420px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              color: '#18181B',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              textAlign: 'center'
            }}
          >
            {/* Icono de Salida Institucional */}
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
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
                  padding: '10px 16px',
                  borderRadius: '4px',
                  border: '1px solid #E4E4E7',
                  backgroundColor: '#FFFFFF',
                  color: '#18181B',
                  fontWeight: 600,
                  fontSize: '13px',
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
                  padding: '10px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#BA181B',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
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
