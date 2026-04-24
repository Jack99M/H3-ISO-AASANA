const ALLOWED = new Set(['programado', 'abordando', 'despego', 'cancelado', 'retrasado']);

export const STATUS_LABELS = {
  programado: 'Programado',
  abordando: 'Abordando',
  despego: 'Despegó',
  cancelado: 'Cancelado',
  retrasado: 'Retrasado',
};

/** Icono decorativo por estado (FIDS / aeropuerto) */
export const STATUS_ICONS = {
  programado: '✈',
  abordando: '▶',
  despego: '↑',
  cancelado: '✕',
  retrasado: '⏱',
};

export function statusBadgeClass(status) {
  if (!ALLOWED.has(status)) {
    return 'aasana-badge';
  }
  return `aasana-badge aasana-badge--${status}`;
}
