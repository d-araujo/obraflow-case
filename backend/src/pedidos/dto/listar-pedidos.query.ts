import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { StatusPedido } from '../../generated/prisma/enums.js';

export class ListarPedidosQuery {
  @ApiPropertyOptional({ enum: StatusPedido })
  @IsOptional()
  @IsEnum(StatusPedido, {
    message: 'Status inválido. Use PENDENTE, APROVADO ou REJEITADO.',
  })
  status?: StatusPedido;

  @ApiPropertyOptional({
    description: 'Só os pedidos cuja etapa atual cabe a este usuário.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O aprovador deve ser um id inteiro.' })
  @Min(1, { message: 'O aprovador deve ser um id inteiro.' })
  aprovadorId?: number;
}
