import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Permission } from '../entities/permission.entity';
import { PermissionType } from '../common/enums/permission-type.enum';
import { UserCreateDto } from './dto/user-create.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  private async getPermissionByCode(
    code: PermissionType,
  ): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { code },
    });
  }

  private formatUserResponse(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async create(userCreateDto: UserCreateDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: userCreateDto.email },
      withDeleted: true,
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userCreateDto.password, 10);

    const user = this.userRepository.create({
      name: userCreateDto.name,
      email: userCreateDto.email,
      password: hashedPassword,
    });

    const permission = await this.getPermissionByCode(userCreateDto.permission_id);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    user.permission = permission;

    const savedUser = await this.userRepository.save(user);

    const userWithPermission = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['permission'],
    });

    return this.formatUserResponse(userWithPermission);
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: ['permission'],
    });

    return users.map((user) => this.formatUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['permission'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async update(id: string, userUpdateDto: UserUpdateDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['permission'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userUpdateDto.email && userUpdateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userUpdateDto.email },
        withDeleted: true,
      });

      if (existingUser && !existingUser.deletedAt) {
        throw new ConflictException('Email already exists');
      }
    }

    if (userUpdateDto.name) {
      user.name = userUpdateDto.name;
    }

    if (userUpdateDto.email) {
      user.email = userUpdateDto.email;
    }

    if (userUpdateDto.password) {
      user.password = await bcrypt.hash(userUpdateDto.password, 10);
    }

    if (userUpdateDto.permission_id) {
      const permission = await this.getPermissionByCode(userUpdateDto.permission_id);

      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      user.permission = permission;
    }

    const updatedUser = await this.userRepository.save(user);

    const userWithPermission = await this.userRepository.findOne({
      where: { id: updatedUser.id },
      relations: ['permission'],
    });

    return this.formatUserResponse(userWithPermission);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softRemove(user);

    return { message: 'User deleted successfully' };
  }
}

