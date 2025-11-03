/**
 * Formata data para exibição
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata data e hora para exibição
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formata porcentagem
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(0)}%`;
};

/**
 * Formata peso em kg
 */
export const formatWeight = (weight: number): string => {
  return `${weight.toFixed(2)} kg`;
};
