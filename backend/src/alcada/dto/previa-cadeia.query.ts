import { ApiProperty } from '@nestjs/swagger';
import { IsDecimalTexto } from '../../comum/validacao.js';

export class PreviaCadeiaQuery {
  @ApiProperty({ example: '12500.00', description: 'Total do pedido.' })
  @IsDecimalTexto(
    { inteiros: 12, casas: 2, permiteZero: true },
    'Informe o total como valor não negativo com até 2 casas decimais (ex.: "12500.00").',
  )
  total: string;
}
