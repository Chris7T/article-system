import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';
import { ArticleCreateDto } from './dto/article-create.dto';
import { ArticleUpdateDto } from './dto/article-update.dto';
import { ArticleResponseDto } from './dto/article-response.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private formatArticleResponse(article: Article): ArticleResponseDto {
    return plainToInstance(ArticleResponseDto, article, {
      excludeExtraneousValues: true,
    });
  }

  async create(articleCreateDto: ArticleCreateDto, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const article = this.articleRepository.create({
      title: articleCreateDto.title,
      content: articleCreateDto.content,
      author: user,
    });

    const savedArticle = await this.articleRepository.save(article);

    const articleWithAuthor = await this.articleRepository.findOne({
      where: { id: savedArticle.id },
      relations: ['author'],
    });

    return this.formatArticleResponse(articleWithAuthor);
  }

  async findAll() {
    const articles = await this.articleRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    return articles.map((article) => this.formatArticleResponse(article));
  }

  async findOne(id: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.formatArticleResponse(article);
  }

  async update(id: string, articleUpdateDto: ArticleUpdateDto) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (articleUpdateDto.title) {
      article.title = articleUpdateDto.title;
    }

    if (articleUpdateDto.content) {
      article.content = articleUpdateDto.content;
    }

    const updatedArticle = await this.articleRepository.save(article);

    const articleWithAuthor = await this.articleRepository.findOne({
      where: { id: updatedArticle.id },
      relations: ['author'],
    });

    return this.formatArticleResponse(articleWithAuthor);
  }

  async remove(id: string) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.articleRepository.softRemove(article);

    return { message: 'Article deleted successfully' };
  }
}

