import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { verifyPassword } from '../../common/utils/hash.util';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { MobileOtpSession } from './entities/mobile-otp-session.entity';
import { Spoke } from './entities/spoke.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Spoke) private readonly spokes: Repository<Spoke>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(MobileOtpSession) private readonly mobileOtpSessions: Repository<MobileOtpSession>,
  ) {}

  async getSpokes() {
    const spokes = await this.spokes.find({ select: ['id', 'name'], order: { name: 'ASC' } });
    return { data: spokes.map((s) => ({ id: s.id, name: s.name })) };
  }

  async login(dto: LoginDto, response: Response) {
    const user = await this.users.findOne({ where: { email: dto.email }, relations: ['roles', 'roles.permissions'] });
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');

    const roles = user.roles?.map((role) => role.code) ?? [];
    const permissions = [...new Set(user.roles?.flatMap((role) => role.permissions?.map((permission) => permission.code) ?? []) ?? [])];

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      spoke: dto.spoke,
    });

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
    });

    return {
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissions,
          spoke: dto.spoke,
        },
      },
    };
  }

  profile(user: { id: number; email: string; roles: string[]; permissions: string[] }) {
    return { data: user };
  }

  // OTP endpoints (dev/test behavior)
  // - send-mobile-otp generates otp='0000' and returns verificationToken.
  // - verify-mobile-otp accepts otp='0000' for the given mobile.
  async sendMobileOtp(body: { mobile: string }) {
    const mobile = body.mobile?.trim();
    if (!mobile) throw new UnauthorizedException('mobile is required');

    const otp = '0000';
    const verificationToken = crypto.randomUUID?.() ?? `vt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const session = this.mobileOtpSessions.create({
      mobile,
      verificationToken,
      otp,
    });

    await this.mobileOtpSessions.save(session);

    return { data: { verificationToken, mobile } };
  }

  async verifyMobileOtp(body: { mobile: string; otp: string }) {
    const mobile = body.mobile?.trim();
    const otp = body.otp?.trim();
    if (!mobile || !otp) throw new UnauthorizedException('mobile and otp are required');

    const session = await this.mobileOtpSessions.findOne({ where: { mobile, otp }, order: { createdAt: 'DESC' } });
    if (!session) throw new UnauthorizedException('Invalid OTP');

    session.verifiedAt = new Date();
    await this.mobileOtpSessions.save(session);

    return { data: { verificationToken: session.verificationToken } };
  }
}

