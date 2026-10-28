import { HttpException, HttpStatus } from '@nestjs/common';

export type CodigoErro =
  | 'VALIDACAO'
  | 'REQUISICAO_INVALIDA'
  | 'USUARIO_NAO_IDENTIFICADO'
  | 'FORA_DA_VEZ'
  | 'NAO_ENCONTRADO'
  | 'CONFLITO'
  | 'FLUXO_CONCLUIDO'
  | 'DECISAO_CONCORRENTE'
  | 'MOTIVO_OBRIGATORIO'
  | 'REFERENCIA_INVALIDA'
  | 'SEM_FAIXA_APLICAVEL'
  | 'TOTAL_ACIMA_DO_SUPORTADO'
  | 'ERRO_INTERNO';

export interface DetalheErro {
  campo: string;
  mensagem: string;
}

export class ErroApi extends HttpException {
  constructor(
    status: HttpStatus,
    readonly codigo: CodigoErro,
    mensagem: string,
    readonly detalhes?: DetalheErro[],
  ) {
    super(mensagem, status);
  }
}

export function naoEncontrado(recurso: string, id: number): ErroApi {
  return new ErroApi(
    HttpStatus.NOT_FOUND,
    'NAO_ENCONTRADO',
    `${recurso} #${id} não existe.`,
  );
}

export function referenciaInvalida(recurso: string, id: number): ErroApi {
  return new ErroApi(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'REFERENCIA_INVALIDA',
    `${recurso} #${id} não existe.`,
  );
}
