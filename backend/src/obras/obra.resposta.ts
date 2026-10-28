import { ApiProperty } from '@nestjs/swagger';

export class ObraResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Residencial Aurora' })
  nome: string;

  @ApiProperty({ example: 2, description: 'Faixas de alçada configuradas.' })
  quantidadeFaixas: number;

  @ApiProperty()
  criadoEm: Date;
}
