// src/complaints/complaints.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    matricNO: string;
    password: string;
    role: Role;
    isActive: boolean;
    lastLoginAt: Date | null;
  };
}

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new complaint' })
  create(@Body() dto: CreateComplaintDto, @Req() req: AuthenticatedRequest) {
    return this.complaintsService.create(dto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all complaints (Admin only)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.complaintsService.findAll();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending complaints (Admin only)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findPending() {
    return this.complaintsService.findPending();
  }

  @Get('resolved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resolved complaints (Admin only)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findResolved() {
    return this.complaintsService.findResolved();
  }

  @Get('my-complaints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my complaints' })
  findUserComplaints(@Req() req: AuthenticatedRequest) {
    return this.complaintsService.findUserComplaints(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complaint by ID' })
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update complaint (Admin only)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complaintsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete complaint (Admin only)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.complaintsService.remove(id);
  }
}
