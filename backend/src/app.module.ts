import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlcadaModule } from './alcada/alcada.module.js';
import { FornecedoresModule } from './fornecedores/fornecedores.module.js';
import { ObrasModule } from './obras/obras.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ObrasModule,
    UsuariosModule,
    FornecedoresModule,
    AlcadaModule,
    PedidosModule,
  ],
})
export class AppModule {}
