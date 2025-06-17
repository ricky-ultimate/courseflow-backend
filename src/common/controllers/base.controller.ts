import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { BaseService } from '../services/base.service';
import { RolesGuard } from '../guards/roles.guard';
import { PaginationOptions } from '../interfaces/base-service.interface';

export abstract class BaseController<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly service: BaseService<T, CreateDto, UpdateDto>,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({
    status: 201,
    description: 'Entity created successfully',
  })
  async create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all entities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: PaginationOptions) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get entity by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update entity' })
  async update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete entity' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
