import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { aparar, IsDecimalTexto } from '../../comum/validacao.js';
import { Unidade } from '../../generated/prisma/enums.js';

export class ItemPedidoDto {
  @ApiProperty({ example: 'Cimento CP-II 50 kg' })
  @Transform(aparar)
  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe a descrição do item.' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres.' })
  descricao: string;

  @ApiProperty({ example: '120', description: 'Até 3 casas decimais.' })
  @IsDecimalTexto(
    { inteiros: 9, casas: 3, permiteZero: false },
    'A quantidade deve ser um número maior que zero, com até 3 casas decimais.',
  )
  quantidade: string;

  @ApiProperty({ enum: Unidade, example: Unidade.UN })
  @IsEnum(Unidade, {
    message: 'Unidade inválida. Use UN, KG, M, M2, M3 ou H.',
  })
  unidade: Unidade;

  @ApiProperty({ example: '38.90', description: 'Até 2 casas decimais.' })
  @IsDecimalTexto(
    { inteiros: 12, casas: 2, permiteZero: true },
    'O preço unitário deve ser um valor maior ou igual a zero, com até 2 casas decimais.',
  )
  precoUnitario: string;
}

export class CriarPedidoDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Selecione a obra.' })
  @Min(1, { message: 'Selecione a obra.' })
  obraId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Selecione o fornecedor.' })
  @Min(1, { message: 'Selecione o fornecedor.' })
  fornecedorId: number;

  @ApiProperty({ example: '2026-10-28', description: 'AAAA-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Informe a data do pedido no formato AAAA-MM-DD.',
  })
  @IsISO8601({ strict: true }, { message: 'A data do pedido não existe.' })
  dataPedido: string;

  @ApiPropertyOptional({ example: 'Reposição para a concretagem da laje.' })
  @Transform(aparar)
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  @MaxLength(1000, {
    message: 'As observações devem ter no máximo 1000 caracteres.',
  })
  observacoes?: string;

  @ApiProperty({
    type: [ItemPedidoDto],
    description:
      'Totais não são aceitos: o back calcula o total de cada item e do pedido.',
  })
  @IsArray({ message: 'Os itens devem ser enviados em uma lista.' })
  @ArrayMinSize(1, { message: 'O pedido precisa de pelo menos um item.' })
  @ArrayMaxSize(100, { message: 'O pedido aceita no máximo 100 itens.' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}
