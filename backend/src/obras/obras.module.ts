import { Module } from '@nestjs/common';
import { ObrasController } from './obras.controller.js';
import { ObrasService } from './obras.service.js';

@Module({
  controllers: [ObrasController],
  providers: [ObrasService],
})
export class ObrasModule {}
