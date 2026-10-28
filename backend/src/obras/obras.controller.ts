import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { CriarObraDto } from './dto/criar-obra.dto.js';
import { ObraResposta } from './obra.resposta.js';
import { ObrasService } from './obras.service.js';

@ApiTags('Obras')
@Controller('obras')
export class ObrasController {
  constructor(private readonly obras: ObrasService) {}

  @Get()
  @ApiOkResponse({ type: [ObraResposta] })
  listar() {
    return this.obras.listar();
  }

  @Post()
  @ApiCreatedResponse({ type: ObraResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  criar(@Body() dto: CriarObraDto) {
    return this.obras.criar(dto);
  }
}
