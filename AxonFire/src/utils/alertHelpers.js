const PRIORIDAD_CONFIG = {
  ALTA: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'ALTA' },
  MEDIA: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'MEDIA' },
  BAJA: { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', label: 'BAJA' },
};

export function getPrioridadConfig(prioridad) {
  const key = String(prioridad || '').toUpperCase();
  return PRIORIDAD_CONFIG[key] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', label: key || '—' };
}

export function getPriorityColor(prioridad) {
  return getPrioridadConfig(prioridad).color;
}

export function getAlertIcon(tipo = '') {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('incendio') || t.includes('fuego') || t.includes('estructural') || t.includes('forestal'))
    return { icon: 'fire', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' };
  if (t.includes('rescate') || t.includes('accidente') || t.includes('vehicular') || t.includes('automovil'))
    return { icon: 'car-wrench', color: '#f97316', bg: 'rgba(249,115,22,0.2)' };
  if (t.includes('gas') || t.includes('quimico') || t.includes('hazmat') || t.includes('materia'))
    return { icon: 'biohazard', color: '#a855f7', bg: 'rgba(168,85,247,0.2)' };
  if (t.includes('medic') || t.includes('ambulancia') || t.includes('salud'))
    return { icon: 'ambulance', color: '#f87171', bg: 'rgba(248,113,113,0.2)' };
  return { icon: 'alert-circle', color: '#64748b', bg: 'rgba(100,116,139,0.2)' };
}

export function getTipoAlerta(alerta) {
  return alerta?.subCategoriaAlerta?.nombre_sub_categoria
    || alerta?.subCategoriaAlerta?.nombre
    || alerta?.observaciones
    || 'Incidente';
}
