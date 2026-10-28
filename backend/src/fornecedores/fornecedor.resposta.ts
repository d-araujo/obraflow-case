import { ApiProperty } from '@nestjs/swagger';

export class FornecedorResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cimentos Bahia Ltda.' })
  nome: string;

  @ApiProperty({ type: String, nullable: true, example: '12.345.678/0001-90' })
  cnpj: string | null;
}
