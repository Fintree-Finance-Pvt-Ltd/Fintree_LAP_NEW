import {
  Logger,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import * as path from "path";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";

async function bootstrap() {
  const logger = new Logger("Application");

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<number>("PORT") ?? 3000;
  const apiPrefix = config.get<string>("API_PREFIX") ?? "api";

  app.setGlobalPrefix(apiPrefix);
  const uploadDir =
    config.get<string>("UPLOAD_DIR") ?? "uploads";

  app.setGlobalPrefix(apiPrefix);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      config.get<string>("FRONTEND_URL"),
      config.get<string>("SANDBOX_URL"),
    ].filter(Boolean) as string[],
    credentials: true,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new GlobalExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new TimeoutInterceptor(),
  );

  const express = (await import("express")).default;

  app.use(
    "/uploads",
    express.static(
      path.join(process.cwd(), uploadDir),
      {
        etag: true,
        lastModified: true,
        setHeaders: (res) => {
          res.setHeader(
            "Cache-Control",
            "public, max-age=86400",
          );
        },
      },
    ),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LAP Documentation API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const swaggerDocument =
    SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

  SwaggerModule.setup(
    "docs",
    app,
    swaggerDocument,
  );

  await app.listen(port);

  logger.log(
    `Application running at http://localhost:${port}/${apiPrefix}`,
  );

  logger.log(
    `Swagger available at http://localhost:${port}/docs`,
  );
}

bootstrap();