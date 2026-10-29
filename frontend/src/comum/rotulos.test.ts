import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatarData, formatarDataHora, hoje } from './rotulos';

// O vite.config.ts roda os testes no fuso America/Bahia (UTC-3), o dos usuários.
describe('datas no fuso America/Bahia', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('a data do pedido não volta um dia', () => {
    expect(formatarData('2026-10-29')).toBe('29/10/2026');
    expect(formatarData('2026-01-01')).toBe('01/01/2026');
  });

  it('às 23:30 em Bahia, hoje ainda é o dia local, embora em UTC já seja o seguinte', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30T02:30:00Z'));

    expect(hoje()).toBe('2026-10-29');
  });

  it('data e hora da decisão aparecem no horário local', () => {
    expect(formatarDataHora('2026-10-29T14:05:00Z')).toBe('29/10/2026, 11:05');
  });
});
