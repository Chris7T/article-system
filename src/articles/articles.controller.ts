import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleCreateDto } from './dto/article-create.dto';
import { ArticleUpdateDto } from './dto/article-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionType } from '../common/enums/permission-type.enum';
import { User } from '../entities/user.entity';

@Controller('articles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  create(@Body() articleCreateDto: ArticleCreateDto, @CurrentUser() user: User) {
    return this.articlesService.create(articleCreateDto, user.id);
  }

  @Get()
  @Permissions(
    PermissionType.READER,
    PermissionType.EDITOR,
    PermissionType.ADMIN,
  )
  findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  @Permissions(
    PermissionType.READER,
    PermissionType.EDITOR,
    PermissionType.ADMIN,
  )
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  update(@Param('id') id: string, @Body() articleUpdateDto: ArticleUpdateDto) {
    return this.articlesService.update(id, articleUpdateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  async remove(@Param('id') id: string) {
    await this.articlesService.remove(id);
  }
}

