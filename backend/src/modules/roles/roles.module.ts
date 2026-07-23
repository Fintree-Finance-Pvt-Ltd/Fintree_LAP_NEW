import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({ imports: [TypeOrmModule.forFeature([Role])], exports: [TypeOrmModule], providers: [RolesService], controllers: [RolesController] })
export class RolesModule {}
