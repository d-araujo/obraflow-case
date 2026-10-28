import { Decimal } from 'decimal.js';
import type { Faixa, SalvarFaixa } from '../../api/tipos';
import { paraDecimal, type ValorDigitado } from '../../comum/dinheiro';

export interface ValoresFaixa {
  semTeto: boolean;
  limite: ValorDigitado;
  aprovadorIds: number[];
}

export function valoresDaFaixa(faixa: Faixa | null): ValoresFaixa {
  return {
    semTeto: faixa ? faixa.limiteMaximo === null : false,
    limite: faixa?.limiteMaximo ?? '',
    aprovadorIds: faixa?.aprovadores.map((a) => a.usuario.id) ?? [],
  };
}

export function validarFaixa(valores: ValoresFaixa): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!valores.semTeto) {
    const limite = paraDecimal(valores.limite);
    if (!limite || limite.lte(0)) {
      erros.limite = 'Informe um limite maior que zero.';
    } else if (limite.decimalPlaces() > 2) {
      erros.limite = 'Use no máximo 2 casas decimais.';
    }
  }
  if (valores.aprovadorIds.length === 0) {
    erros.aprovadorIds = 'Adicione pelo menos um aprovador.';
  }
  return erros;
}

export function paraSalvarFaixa(valores: ValoresFaixa): SalvarFaixa {
  return {
    limiteMaximo: valores.semTeto
      ? null
      : new Decimal(valores.limite).toFixed(2),
    aprovadorIds: valores.aprovadorIds,
  };
}
