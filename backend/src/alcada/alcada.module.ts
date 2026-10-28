import { Module } from '@nestjs/common';
import { FaixasController } from './faixas.controller.js';
import { FaixasService } from './faixas.service.js';

@Module({
  controllers: [FaixasController],
  providers: [FaixasService],
})
export class AlcadaModule {}
