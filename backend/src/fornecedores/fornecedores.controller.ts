import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { CriarFornecedorDto } from './dto/criar-fornecedor.dto.js';
import { FornecedorResposta } from './fornecedor.resposta.js';
import { FornecedoresService } from './fornecedores.service.js';

@ApiTags('Fornecedores')
@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedores: FornecedoresService) {}

  @Get()
  @ApiOkResponse({ type: [FornecedorResposta] })
  listar() {
    return this.fornecedores.listar();
  }

  @Post()
  @ApiCreatedResponse({ type: FornecedorResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiConflictResponse({ type: ErroResposta, description: 'CNPJ em uso.' })
  criar(@Body() dto: CriarFornecedorDto) {
    return this.fornecedores.criar(dto);
  }
}
