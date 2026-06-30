import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { CoApplicantsModule } from './modules/co-applicants/co-applicants.module';
import { ContactPersonsModule } from './modules/contact-persons/contact-persons.module';
import { CustomerProfilesModule } from './modules/customer-profiles/customer-profiles.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { FieldVisitsModule } from './modules/visits/field-visits.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { GeoModule } from './modules/geo/geo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, authConfig, fileConfig], validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    AuthModule,
    OtpModule,
    UsersModule,
    BmModule,
    RolesModule,
    PermissionsModule,
    AuditModule,
    ApplicationsModule,
    CustomerProfilesModule,
    ContactPersonsModule,
    CoApplicantsModule,
    DocumentsModule,
    WorkflowModule,
    NotificationsModule,
    DashboardsModule,
    FieldVisitsModule,
    UsersModule,
    GeoModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor }
  ]
})
export class AppModule {}
