import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { PermissionType } from '../common/enums/permission-type.enum';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(userRegisterDto: UserRegisterDto) {
    const user = await this.usersService.create({
      ...userRegisterDto,
      permission_id: PermissionType.READER,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      permissions: [user.permission_id],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['permission'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async login(userLoginDto: UserLoginDto) {
    const user = await this.validateUser(userLoginDto.email, userLoginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.permission || !user.permission.code) {
      throw new UnauthorizedException('User has no valid permission');
    }

    const typeId = user.permission.code;
    const typeNameMap: Record<PermissionType, string> = {
      [PermissionType.READER]: 'reader',
      [PermissionType.EDITOR]: 'editor',
      [PermissionType.ADMIN]: 'admin',
    };

    const payload = {
      sub: user.id,
      email: user.email,
      permissions: [typeId],
    };

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      permission_id: typeId,
      permission_name: typeNameMap[typeId] || 'reader',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse,
    };
  }

  async logout() {
    return { message: 'Logged out successfully' };
  }
}

