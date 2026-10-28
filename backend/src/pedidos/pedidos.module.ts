import { Module } from '@nestjs/common';
import { AlcadaModule } from '../alcada/alcada.module.js';
import { PedidosController } from './pedidos.controller.js';
import { PedidosService } from './pedidos.service.js';

@Module({
  imports: [AlcadaModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
