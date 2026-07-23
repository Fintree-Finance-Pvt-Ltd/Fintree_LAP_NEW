// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './entities/user.entity';

// @Module({ imports: [TypeOrmModule.forFeature([User])], exports: [TypeOrmModule] })
// export class UsersModule {}
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "./entities/user.entity";
import { Role } from "../roles/entities/role.entity";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Role]),
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}