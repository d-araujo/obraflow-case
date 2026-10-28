import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { IdPipe } from '../comum/id.pipe.js';
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js';
import { CriarPedidoDto } from './dto/criar-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';
import { RejeitarPedidoDto } from './dto/rejeitar-pedido.dto.js';
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

  @Post(':id/aprovar')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('usuario')
  @ApiOkResponse({ type: PedidoDetalheResposta })
  @ApiUnauthorizedResponse({ type: ErroResposta })
  @ApiForbiddenResponse({
    type: ErroResposta,
    description: 'Quem age não é o aprovador da etapa atual.',
  })
  @ApiNotFoundResponse({ type: ErroResposta })
  @ApiConflictResponse({
    type: ErroResposta,
    description: 'Fluxo concluído ou decisão concorrente.',
  })
  aprovar(@Param('id', IdPipe) id: number, @UsuarioAtual() usuarioId: number) {
    return this.pedidos.aprovar(id, usuarioId);
  }

  @Post(':id/rejeitar')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('usuario')
  @ApiOkResponse({ type: PedidoDetalheResposta })
  @ApiBadRequestResponse({
    type: ErroResposta,
    description: 'Motivo ausente.',
  })
  @ApiUnauthorizedResponse({ type: ErroResposta })
  @ApiForbiddenResponse({ type: ErroResposta })
  @ApiNotFoundResponse({ type: ErroResposta })
  @ApiConflictResponse({ type: ErroResposta })
  rejeitar(
    @Param('id', IdPipe) id: number,
    @UsuarioAtual() usuarioId: number,
    @Body() dto: RejeitarPedidoDto,
  ) {
    return this.pedidos.rejeitar(id, usuarioId, dto.motivo);
  }
}
