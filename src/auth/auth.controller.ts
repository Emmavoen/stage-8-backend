import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto'; // Import DTO

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Trigger Google Sign-In' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google Callback (Returns JWT)' })
  @ApiResponse({ status: 200, type: AuthResponseDto }) // <--- LINK DTO HERE
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const token = this.jwtService.sign({
      email: req.user.email,
      sub: req.user.id,
    });
    res.json({ token, user: req.user });
  }
}
