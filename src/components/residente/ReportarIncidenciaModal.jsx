import React, { useState, useRef, useEffect } from 'react';
import {
  CATEGORIAS_VALIDAS,
  URGENCIAS_VALIDAS,
  validarReporteIncidencia,
  validarArchivoEvidencia
} from '../../errores-incidencias/validadorIncidencias.js';

export default function ReportarIncidenciaModal({
  estudiante = {},
  habitacion = {},
  buttonText = "Reportar incidencia",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [errores, setErrores] = useState([]);

  // Campos del formulario
  const [categoria, setCategoria] = useState('');
  const [urgencia, setUrgencia] = useState('Media');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState([]);

  const fileInputRef = useRef(null);

  // Reproducir sonido suave institucional al abrir (pop + sintetizador)
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
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  };

  const handleOpen = () => {
    reproducirSonidoApertura();
    setIsOpen(true);
    setExito(false);
    setErrores([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setExito(false);
    setErrores([]);
  };

  // Manejo de archivos adjuntos con validación en tiempo real
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const nuevosArchivos = [];
    const nuevosErrores = [];

    files.forEach((file) => {
      const errorArchivo = validarArchivoEvidencia(file);
      if (errorArchivo) {
        nuevosErrores.push(errorArchivo);
      } else {
        nuevosArchivos.push({
          nombre: file.name,
          tamano: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        });
      }
    });

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
    } else {
      setErrores([]);
    }

    setArchivos((prev) => [...prev, ...nuevosArchivos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEliminarArchivo = (index) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  // Enviar el reporte
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);

    const datosParaValidar = {
      categoria,
      urgencia,
      asunto,
      descripcion,
      archivos
    };

    const validacion = validarReporteIncidencia(datosParaValidar);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch('/api/incidencias/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria,
          urgencia,
          asunto,
          descripcion,
          evidencias: archivos,
          estudianteCedula: estudiante.cedula || '0953920949',
          estudianteNombre: estudiante.nombreCompleto || 'Joseph Coello Mendoza',
          estudianteCorreo: estudiante.email || 'e0953920949@live.uleam.edu.ec',
          habitacionId: habitacion.id || 'HAB-A101',
          habitacion: `${habitacion.numero || 'A-101'} (${habitacion.edificio || 'Edificio A'})`
        })
      });

      const res = await response.json();

      if (res.success) {
        setCodigoGenerado(res.incidencia.id);
        setExito(true);

        // Disparar evento para que la cajita de solicitudes previas se refresque
        window.dispatchEvent(
          new CustomEvent('incidencia-creada', {
            detail: { incidencia: res.incidencia }
          })
        );

        // Limpiar campos
        setCategoria('');
        setUrgencia('Media');
        setAsunto('');
        setDescripcion('');
        setArchivos([]);
      } else {
        setErrores(res.errores || [res.message || 'Error al guardar la incidencia.']);
      }
    } catch (err) {
      setErrores(['Error de conexión al enviar el reporte. Inténtalo nuevamente.']);
    } finally {
      setEnviando(false);
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (ev.key === 'Escape' && isOpen) handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const colorUrgencia = {
    Baja: '#15803D',
    Media: '#0284C7',
    Alta: '#D97706',
    Urgente: '#DC2626'
  };

  return (
    <>
      {/* Botón Disparador Principal */}
      <button
        type="button"
        onClick={handleOpen}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#BA181B',
          color: '#FFFFFF',
          padding: '12px 22px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          boxShadow: '0 4px 14px rgba(186, 24, 27, 0.25)',
          transition: 'background-color 0.15s, transform 0.1s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#BA181B')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{buttonText}</span>
      </button>

      {/* Modal con Fondo Desenfoque (Blur) y Animación Fluida */}
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px 28px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              color: '#0F172A',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              border: '1px solid #E2E8F0',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#BA181B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Residencia Universitaria · Bienestar Estudiantil
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                  Reportar Incidencia o Mantenimiento
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Habitación asignada: <strong>{habitacion.numero || 'A-101'}</strong> ({habitacion.edificio || 'Edificio A'})
                </p>
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
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Mensaje de Éxito al Enviar */}
            {exito ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', animation: 'overlayFade 0.3s ease' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    border: '2px solid #86EFAC'
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                  ¡Incidencia Registrada con Éxito!
                </h4>
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontFamily: 'monospace',
                    marginBottom: '14px'
                  }}
                >
                  {codigoGenerado}
                </div>
                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', maxWidth: '420px', margin: '0 auto 24px' }}>
                  Tu solicitud ha sido enviada al equipo de mantenimiento de Bienestar Estudiantil. Puedes hacer seguimiento desde la sección de solicitudes previas.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setExito(false)}
                    style={{
                      flex: 1,
                      backgroundColor: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '11px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Reportar otra incidencia
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      backgroundColor: '#15803D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '11px',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Entendido y volver
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario de Reporte */
              <form onSubmit={handleSubmit}>
                {/* Errores */}
                {errores.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '18px',
                      fontSize: '12.5px',
                      color: '#991B1B'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Por favor corrige los siguientes puntos:</strong>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {errores.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 1. Categoría */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Categoría de la Incidencia *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">Selecciona un área de atención...</option>
                    {CATEGORIAS_VALIDAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Nivel de Urgencia */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nivel de Urgencia *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {URGENCIAS_VALIDAS.map((urg) => {
                      const seleccionada = urgencia === urg;
                      return (
                        <button
                          key={urg}
                          type="button"
                          onClick={() => setUrgencia(urg)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            border: seleccionada ? `2px solid ${colorUrgencia[urg]}` : '1px solid #E2E8F0',
                            backgroundColor: seleccionada ? '#F8FAFC' : '#FFFFFF',
                            color: seleccionada ? colorUrgencia[urg] : '#64748B',
                            fontWeight: seleccionada ? 800 : 600,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {urg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Asunto */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Asunto breve del reporte *
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Ej. Fuga leve en el grifo del lavamanos"
                    maxLength={80}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      fontFamily: 'inherit'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '3px', textAlign: 'right' }}>
                    {asunto.length}/80 caracteres
                  </span>
                </div>

                {/* 4. Descripción */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Descripción detallada de la situación *
                  </label>
                  <textarea
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe cuándo empezó, la ubicación exacta dentro de la habitación y detalles que faciliten la reparación técnica..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      color: '#0F172A',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '3px' }}>
                    Mínimo 15 caracteres. ({descripcion.length} caracteres escritos)
                  </span>
                </div>

                {/* 5. Subir Evidencias o Fotos */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Evidencias fotográficas o documentos (Opcional)
                  </label>
                  
                  <div
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#94A3B8')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block' }}>
                      Haz clic para subir una foto o archivo de evidencia
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                      Formatos: JPG, PNG, WEBP, PDF (Máx. 10 MB por archivo)
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {/* Lista de archivos cargados */}
                  {archivos.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {archivos.map((arc, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#F1F5F9',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12.5px'
                          }}
                        >
                          <span style={{ color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                            {arc.nombre} <small style={{ color: '#64748B' }}>({arc.tamano})</small>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminarArchivo(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '14px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={enviando}
                    style={{
                      padding: '11px 20px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    style={{
                      padding: '11px 24px',
                      backgroundColor: '#BA181B',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: enviando ? 'wait' : 'pointer',
                      opacity: enviando ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {enviando ? 'Enviando reporte...' : 'Enviar reporte de incidencia →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Keyframes animaciones CSS */}
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
