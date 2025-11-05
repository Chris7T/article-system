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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { ArticleCreateDto } from './dto/article-create.dto';
import { ArticleUpdateDto } from './dto/article-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionType } from '../common/enums/permission-type.enum';
import { User } from '../entities/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  @ApiOperation({ summary: 'Create a new article (Editor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Article successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin access required' })
  create(@Body() articleCreateDto: ArticleCreateDto, @CurrentUser() user: User) {
    return this.articlesService.create(articleCreateDto, user.id);
  }

  @Get()
  @Permissions(
    PermissionType.READER,
    PermissionType.EDITOR,
    PermissionType.ADMIN,
  )
  @ApiOperation({ summary: 'Get all articles with pagination (Reader/Editor/Admin)' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of articles' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.articlesService.findAll(paginationQuery);
  }

  @Get(':id')
  @Permissions(
    PermissionType.READER,
    PermissionType.EDITOR,
    PermissionType.ADMIN,
  )
  @ApiOperation({ summary: 'Get article by ID (Reader/Editor/Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article found' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  @ApiOperation({ summary: 'Update article (Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article successfully updated' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin access required' })
  update(@Param('id') id: string, @Body() articleUpdateDto: ArticleUpdateDto) {
    return this.articlesService.update(id, articleUpdateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PermissionType.EDITOR, PermissionType.ADMIN)
  @ApiOperation({ summary: 'Delete article (soft delete) (Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Article UUID' })
  @ApiResponse({ status: 204, description: 'Article successfully deleted' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin access required' })
  async remove(@Param('id') id: string) {
    await this.articlesService.remove(id);
  }
}

