import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErroResposta } from '../comum/erro-resposta.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { UsuarioResposta } from './usuario.resposta.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOkResponse({ type: [UsuarioResposta] })
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  @ApiCreatedResponse({ type: UsuarioResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiConflictResponse({ type: ErroResposta, description: 'E-mail em uso.' })
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuarios.criar(dto);
  }
}
