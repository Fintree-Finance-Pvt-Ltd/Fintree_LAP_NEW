import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  @Public() @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(dto, response);
  }

  @Public()
  @Get('spokes')
  getSpokes() {
    return this.auth.getSpokes();
  }


  @Public() @Post('refresh')
  async refresh(@Req() request: Request) {
    const token = request.cookies?.refreshToken;
    const payload = await this.jwt.verifyAsync(token, { secret: this.config.get('JWT_REFRESH_SECRET') });
    const accessToken = await this.jwt.signAsync({ sub: payload.sub, roles: [], permissions: [] });
    return { data: { accessToken } };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('refreshToken');
    return { data: null, message: 'Logged out' };
  }

  @Get('profile')
  profile(@CurrentUser() user: { id: number; email: string; roles: string[]; permissions: string[] }) {
    return this.auth.profile(user);
  }

}



