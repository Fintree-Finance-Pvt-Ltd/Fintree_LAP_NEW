import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";

async function bootstrap() {
  const logger = new Logger("UserService");

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>("API_PREFIX") ?? "api/");
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>("FRONTEND_URL"),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new TimeoutInterceptor(),
  );

  const uploadDir = config.get<string>('UPLOAD_DIR') ?? 'uploads';
  const express = (await import('express')).default;
  app.use('/uploads', express.static(path.join(process.cwd(), uploadDir), {
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LAP Documentation API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(config.get<number>("PORT") ?? 3000);
   logger.verbose(
    `Application is running on port: ${config.get<number>("PORT") ?? 3000}`,
  );
}

bootstrap();
