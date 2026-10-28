import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurarApp, configurarSwagger } from './configurar-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  configurarSwagger(app);
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
