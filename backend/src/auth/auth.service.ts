import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.userEmail },
    });
    if (existingUser) {
      throw new ConflictException('Un utilizator cu acest email există deja.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        email: dto.tenantEmail,
        users: {
          create: {
            name: dto.userName,
            email: dto.userEmail,
            password: hashedPassword,
            role: 'admin',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    return this.buildAuthResponse(user.id, user.email, tenant.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorectă.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Email sau parolă incorectă.');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.tenantId,
      user.role,
    );
  }

  private buildAuthResponse(
    userId: number,
    email: string,
    tenantId: number,
    role: string,
  ) {
    const payload = { sub: userId, email, tenantId, role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email, tenantId, role },
    };
  }
}
