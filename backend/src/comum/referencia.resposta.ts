import { ApiProperty } from '@nestjs/swagger';

export class ReferenciaResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;
}
