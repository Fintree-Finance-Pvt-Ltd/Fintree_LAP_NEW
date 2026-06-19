import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    PassportModule,
    JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get('JWT_ACCESS_SECRET'), signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRES_IN') } }) })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
})
export class AuthModule {}
