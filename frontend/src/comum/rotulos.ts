import type { StatusEtapa, StatusPedido, Unidade } from '../api/tipos';

export const UNIDADES: { value: Unidade; label: string }[] = [
  { value: 'UN', label: 'un' },
  { value: 'KG', label: 'kg' },
  { value: 'M', label: 'm' },
  { value: 'M2', label: 'm²' },
  { value: 'M3', label: 'm³' },
  { value: 'H', label: 'h' },
];

export function rotuloUnidade(unidade: Unidade): string {
  return UNIDADES.find((u) => u.value === unidade)?.label ?? unidade;
}

export const STATUS_PEDIDO: Record<
  StatusPedido,
  { rotulo: string; cor: string }
> = {
  PENDENTE: { rotulo: 'Pendente', cor: 'yellow' },
  APROVADO: { rotulo: 'Aprovado', cor: 'teal' },
  REJEITADO: { rotulo: 'Rejeitado', cor: 'red' },
};

export const STATUS_ETAPA: Record<StatusEtapa, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovou',
  REJEITADA: 'Rejeitou',
  CANCELADA: 'Cancelada',
};

const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

// A data do pedido é um dia de calendário (AAAA-MM-DD); formatar em UTC evita que o fuso
// do navegador a empurre para o dia anterior.
export function formatarData(dia: string): string {
  return data.format(new Date(`${dia}T00:00:00Z`));
}

export function formatarDataHora(iso: string): string {
  return dataHora.format(new Date(iso));
}
