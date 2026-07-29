import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

// @Module({ imports: [TypeOrmModule.forFeature([Permission])], exports: [TypeOrmModule] }),

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
    ]),
  ],

  controllers: [
    PermissionsController,
  ],

  providers: [
    PermissionsService,
  ],

  exports: [
    TypeOrmModule,
    PermissionsService,
  ],
})

export class PermissionsModule {}
