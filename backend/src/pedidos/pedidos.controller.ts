import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { IdPipe } from '../comum/id.pipe.js';
import { CriarPedidoDto } from './dto/criar-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';
import {
  PedidoDetalheResposta,
  PedidoResumoResposta,
} from './pedido.resposta.js';
import { PedidosService } from './pedidos.service.js';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @ApiCreatedResponse({ type: PedidoDetalheResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiUnprocessableEntityResponse({
    type: ErroResposta,
    description:
      'Nenhuma faixa cobre o total (SEM_FAIXA_APLICAVEL) ou obra/fornecedor inexistente.',
  })
  criar(@Body() dto: CriarPedidoDto) {
    return this.pedidos.criar(dto);
  }

  @Get()
  @ApiOkResponse({ type: [PedidoResumoResposta] })
  @ApiBadRequestResponse({ type: ErroResposta })
  listar(@Query() filtro: ListarPedidosQuery) {
    return this.pedidos.listar(filtro);
  }

  @Get(':id')
  @ApiOkResponse({ type: PedidoDetalheResposta })
  @ApiNotFoundResponse({ type: ErroResposta })
  detalhar(@Param('id', IdPipe) id: number) {
    return this.pedidos.detalhar(id);
  }
}
