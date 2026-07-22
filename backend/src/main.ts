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
  origin: [
    config.get<string>("FRONTEND_URL"),
    config.get<string>("SANDBOX_URL"),
  ].filter(Boolean),
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






// import {
//   Logger,
//   ValidationPipe,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { NestFactory } from '@nestjs/core';
// import {
//   DocumentBuilder,
//   SwaggerModule,
// } from '@nestjs/swagger';

// import cookieParser from 'cookie-parser';
// import helmet from 'helmet';
// import * as path from 'path';

// import { AppModule } from './app.module';
// import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
// import { ResponseInterceptor } from './common/interceptors/response.interceptor';
// import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

// async function bootstrap() {
//   const logger = new Logger('Bootstrap');

//   const app = await NestFactory.create(
//     AppModule,
//     {
//       logger: [
//         'log',
//         'error',
//         'warn',
//         'debug',
//         'verbose',
//       ],
//     },
//   );

//   const config = app.get(ConfigService);

//   /*
//    * Remove starting and trailing slashes.
//    *
//    * Correct:
//    * API_PREFIX=api
//    *
//    * Avoid:
//    * API_PREFIX=api/
//    * API_PREFIX=/api
//    */
//   const apiPrefix = (
//     config.get<string>('API_PREFIX') || 'api'
//   ).replace(/^\/+|\/+$/g, '');

//   const port = Number(
//     config.get<string>('PORT') || 9000,
//   );

//   app.setGlobalPrefix(apiPrefix);

//   app.use(helmet());
//   app.use(cookieParser());

//   const allowedOrigins = [
//     config.get<string>('FRONTEND_URL'),
//     config.get<string>('SANDBOX_URL'),
//     'http://localhost:5173',
//   ].filter(
//     (value): value is string =>
//       Boolean(value),
//   );

//   app.enableCors({
//     origin: allowedOrigins,
//     credentials: true,
//     optionsSuccessStatus: 204,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   app.useGlobalFilters(
//     new GlobalExceptionFilter(),
//   );

//   app.useGlobalInterceptors(
//     new ResponseInterceptor(),
//     new TimeoutInterceptor(),
//   );

//   const uploadDir =
//     config.get<string>('UPLOAD_DIR') ||
//     'uploads';

//   const express =
//     (await import('express')).default;

//   app.use(
//     '/uploads',
//     express.static(
//       path.join(
//         process.cwd(),
//         uploadDir,
//       ),
//       {
//         etag: true,
//         lastModified: true,
//         setHeaders: (res) => {
//           res.setHeader(
//             'Cache-Control',
//             'public, max-age=86400',
//           );
//         },
//       },
//     ),
//   );

//   const swaggerConfig =
//     new DocumentBuilder()
//       .setTitle('LAP Documentation API')
//       .setVersion('1.0')
//       .addBearerAuth()
//       .build();

//   const swaggerDocument =
//     SwaggerModule.createDocument(
//       app,
//       swaggerConfig,
//     );

//   SwaggerModule.setup(
//     'docs',
//     app,
//     swaggerDocument,
//   );

//   await app.listen(
//     port,
//     '0.0.0.0',
//   );

//   logger.log(
//     `Application running at http://localhost:${port}/${apiPrefix}`,
//   );

//   logger.log(
//     `Swagger running at http://localhost:${port}/docs`,
//   );
// }

// bootstrap().catch((error) => {
//   console.error(
//     'Application bootstrap failed:',
//     error,
//   );

//   process.exit(1);
// });
