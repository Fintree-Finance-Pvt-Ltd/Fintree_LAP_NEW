import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import fileConfig from './config/file.config';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtpModule } from './modules/otp/otp.module';

import { BmModule } from './modules/bm/bm.module';
import { ChargesReceiptsModule } from './modules/charges-receipts/charges-receipts.module';
import { CoApplicantsModule } from './modules/co-applicants/co-applicants.module';
import { ContactPersonsModule } from './modules/contact-persons/contact-persons.module';
import { CustomerProfilesModule } from './modules/customer-profiles/customer-profiles.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GeoModule } from './modules/geo/geo.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { VarificationModule } from './modules/varification/varification.module';
import { FieldVisitsModule } from './modules/visits/field-visits.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { CreditModule } from './modules/credit/credit.module';
import { ValuationModule } from './modules/valuation/valuation.module';
import { LegalModule } from './modules/legal/legal.module';
import { OpsModule } from './modules/operation/ops.module';
import { LmsModule } from './modules/lms/lms.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, fileConfig],
      validate: validateEnvironment,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Resolves to C:/Fintree_LAP_NEW/backend/uploads
      serveRoot: '/uploads',
      serveStaticOptions: {
        setHeaders: (res) => {
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Access-Control-Allow-Origin', '*');
        },
      },
    }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    ScheduleModule.forRoot(),
    AuthModule,
    OtpModule,
    UsersModule,
    BmModule,
    RolesModule,
    PermissionsModule,
    AuditModule,
    ApplicationsModule,
    CustomerProfilesModule,
    CreditModule,
    ContactPersonsModule,
    CoApplicantsModule,
    DocumentsModule,
    WorkflowModule,
    NotificationsModule,
    DashboardsModule,
    FieldVisitsModule,
    GeoModule,
    VarificationModule,
    ChargesReceiptsModule,
    ValuationModule,
    LegalModule,
    LmsModule,
    
    OpsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class AppModule {}
