import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { IdPipe } from '../comum/id.pipe.js';
import { SalvarFaixaDto } from './dto/salvar-faixa.dto.js';
import { FaixaResposta } from './faixa.resposta.js';
import { FaixasService } from './faixas.service.js';

@ApiTags('Regras de alçada')
@Controller()
export class FaixasController {
  constructor(private readonly faixas: FaixasService) {}

  @Get('obras/:obraId/faixas')
  @ApiOkResponse({
    type: [FaixaResposta],
    description: 'Faixas em ordem crescente de limite; a sem teto por último.',
  })
  @ApiNotFoundResponse({ type: ErroResposta })
  listar(@Param('obraId', IdPipe) obraId: number) {
    return this.faixas.listar(obraId);
  }

  @Post('obras/:obraId/faixas')
  @ApiCreatedResponse({ type: FaixaResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiConflictResponse({
    type: ErroResposta,
    description: 'Limite repetido ou segunda faixa sem teto.',
  })
  @ApiUnprocessableEntityResponse({ type: ErroResposta })
  criar(@Param('obraId', IdPipe) obraId: number, @Body() dto: SalvarFaixaDto) {
    return this.faixas.criar(obraId, dto);
  }

  @Put('faixas/:id')
  @ApiOkResponse({
    type: FaixaResposta,
    description:
      'Substitui o limite e a lista ordenada de aprovadores (adicionar, remover e reordenar).',
  })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiNotFoundResponse({ type: ErroResposta })
  @ApiConflictResponse({ type: ErroResposta })
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: SalvarFaixaDto) {
    return this.faixas.atualizar(id, dto);
  }

  @Delete('faixas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Pedidos já criados não mudam: a cadeia deles é um snapshot.',
  })
  @ApiNotFoundResponse({ type: ErroResposta })
  remover(@Param('id', IdPipe) id: number) {
    return this.faixas.remover(id);
  }
}
