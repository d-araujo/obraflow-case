import { HttpStatus, ValidationError } from '@nestjs/common';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { Decimal } from 'decimal.js';
import { DetalheErro, ErroApi } from './erro-api.js';

export function criarErroDeValidacao(erros: ValidationError[]): ErroApi {
  return new ErroApi(
    HttpStatus.BAD_REQUEST,
    'VALIDACAO',
    'Há campos inválidos na requisição.',
    achatar(erros),
  );
}

// "itens.0.quantidade": o front usa o caminho para mostrar o erro na linha certa da tabela.
function achatar(erros: ValidationError[], prefixo = ''): DetalheErro[] {
  return erros.flatMap((erro) => {
    const campo = prefixo ? `${prefixo}.${erro.property}` : erro.property;
    const proprios = Object.values(erro.constraints ?? {}).map((mensagem) => ({
      campo,
      mensagem,
    }));
    return [...proprios, ...achatar(erro.children ?? [], campo)];
  });
}

interface RegraDecimal {
  inteiros: number;
  casas: number;
  permiteZero: boolean;
}

// Valores decimais trafegam como string: número em JSON vira float no JS e perde precisão.
export function IsDecimalTexto(
  regra: RegraDecimal,
  mensagem: string,
  opcoes?: ValidationOptions,
) {
  const formato = new RegExp(
    `^\\d{1,${regra.inteiros}}(\\.\\d{1,${regra.casas}})?$`,
  );
  return ValidateBy(
    {
      name: 'isDecimalTexto',
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' &&
          formato.test(valor) &&
          (regra.permiteZero || new Decimal(valor).gt(0)),
        defaultMessage: () => mensagem,
      },
    },
    opcoes,
  );
}

export const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
