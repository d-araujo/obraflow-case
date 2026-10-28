import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DetalheErroResposta {
  @ApiProperty({ example: 'itens.0.quantidade' })
  campo: string;

  @ApiProperty({
    example: 'A quantidade deve ser um número maior que zero.',
  })
  mensagem: string;
}

export class ErroResposta {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'SEM_FAIXA_APLICAVEL' })
  codigo: string;

  @ApiProperty({
    example: 'A obra "Residencial Aurora" não tem faixas de alçada.',
  })
  mensagem: string;

  @ApiPropertyOptional({ type: [DetalheErroResposta] })
  detalhes?: DetalheErroResposta[];

  @ApiProperty({ example: '/pedidos' })
  caminho: string;

  @ApiProperty({ example: '2026-10-28T14:00:00.000Z' })
  dataHora: string;
}
