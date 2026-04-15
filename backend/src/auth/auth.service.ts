import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.validateUser(loginDto.username, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const userId = (user as any)._id;
    const payload = { username: user.username, sub: userId };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: userId, username: user.username, fullName: user.fullName },
    };
  }
}
