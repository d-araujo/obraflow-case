import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResposta {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({ example: 'ana@obraflow.dev' })
  email: string;
}
