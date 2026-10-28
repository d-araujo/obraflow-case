import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { naoEncontrado } from '../comum/erro-api.js';
import { ErroResposta } from '../comum/erro-resposta.js';
import { IdPipe } from '../comum/id.pipe.js';
import { descreverFaltaDeFaixa } from './cadeia.js';
import { CadeiaService } from './cadeia.service.js';
import { PreviaCadeiaQuery } from './dto/previa-cadeia.query.js';
import { PreviaCadeiaResposta } from './previa-cadeia.resposta.js';

@ApiTags('Regras de alçada')
@Controller('obras/:obraId/cadeia')
export class CadeiaController {
  constructor(private readonly cadeia: CadeiaService) {}

  @Get()
  @ApiOperation({
    summary: 'Prévia da cadeia de aprovação que um total geraria na obra',
  })
  @ApiOkResponse({ type: PreviaCadeiaResposta })
  @ApiBadRequestResponse({ type: ErroResposta })
  @ApiNotFoundResponse({ type: ErroResposta })
  async previa(
    @Param('obraId', IdPipe) obraId: number,
    @Query() { total }: PreviaCadeiaQuery,
  ): Promise<PreviaCadeiaResposta> {
    const calculo = await this.cadeia.calcular(obraId, total);
    if (!calculo) throw naoEncontrado('Obra', obraId);

    const { obra, nomes, resultado } = calculo;
    if (!resultado.aplicavel) {
      return {
        aplicavel: false,
        etapas: [],
        motivo: resultado.motivo,
        mensagem: descreverFaltaDeFaixa(resultado, obra.nome, total),
      };
    }
    return {
      aplicavel: true,
      etapas: resultado.etapas.map(({ ordem, aprovadorId }) => ({
        ordem,
        aprovador: { id: aprovadorId, nome: nomes.get(aprovadorId) ?? '' },
      })),
      motivo: null,
      mensagem: null,
    };
  }
}
