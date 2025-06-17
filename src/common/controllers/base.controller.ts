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
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../generated/prisma';
import { PaginationOptions } from '../interfaces/base-service.interface';

export interface BaseControllerConfig {
  entity: string;
  createRoles?: Role[];
  updateRoles?: Role[];
  deleteRoles?: Role[];
  readRoles?: Role[];
}

export abstract class BaseController<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly service: BaseService<T, CreateDto, UpdateDto>,
    protected readonly config: BaseControllerConfig,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Create a new ${this.config.entity}` })
  @ApiResponse({
    status: 201,
    description: `${this.config.entity} created successfully`,
  })
  async create(@Body() dto: CreateDto) {
    if (this.config.createRoles?.length) {
      Roles(...this.config.createRoles);
    }
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get all ${this.config.entity}s` })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: PaginationOptions) {
    if (this.config.readRoles?.length) {
      Roles(...this.config.readRoles);
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get ${this.config.entity} by ID` })
  async findOne(@Param('id') id: string) {
    if (this.config.readRoles?.length) {
      Roles(...this.config.readRoles);
    }
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${this.config.entity}` })
  async update(@Param('id') id: string, @Body() dto: UpdateDto) {
    if (this.config.updateRoles?.length) {
      Roles(...this.config.updateRoles);
    }
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Delete ${this.config.entity}` })
  async remove(@Param('id') id: string) {
    if (this.config.deleteRoles?.length) {
      Roles(...this.config.deleteRoles);
    }
    return this.service.remove(id);
  }
}
