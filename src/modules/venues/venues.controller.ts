import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Venue, Role } from '../../generated/prisma';

@ApiTags('Venues')
@ApiBearerAuth('JWT-auth')
@Controller('venues')
@CrudRoles({
  entity: 'venue',
  create: [Role.ADMIN],
  read: [], // Everyone can see venues
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class VenuesController extends BaseController<
  Venue,
  CreateVenueDto,
  UpdateVenueDto
> {
  constructor(private readonly venuesService: VenuesService) {
    super(venuesService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiResponse({ status: 201, description: 'Venue created successfully' })
  create(@Body() createDto: CreateVenueDto) {
    return this.venuesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all venues' })
  findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update venue details' })
  update(@Param('id') id: string, @Body() updateDto: UpdateVenueDto) {
    return this.venuesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (archive) a venue' })
  remove(@Param('id') id: string) {
    return this.venuesService.remove(id);
  }
}
