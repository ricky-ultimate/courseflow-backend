import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'; // Added Query
import { ApiTags } from '@nestjs/swagger'; // Removed specific decorators
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Venue, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface'; // Added
import {
  ApiCreateVenue,
  ApiDeleteVenue,
  ApiGetVenueById,
  ApiGetVenues,
  ApiUpdateVenue,
} from './decorators/venue-api.decorator';

@ApiTags('Venues')
@Controller('venues')
@CrudRoles({
  entity: 'venue',
  create: [Role.ADMIN],
  read: [],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class VenuesController extends BaseController<Venue, CreateVenueDto, UpdateVenueDto> {
  constructor(private readonly venuesService: VenuesService) {
    super(venuesService);
  }

  @Post()
  @ApiCreateVenue()
  create(@Body() createDto: CreateVenueDto) {
    return this.venuesService.create(createDto);
  }

  @Get()
  @ApiGetVenues()
  findAll(@Query() query?: PaginationOptions) {
    return this.venuesService.findAll(query);
  }

  @Get(':id')
  @ApiGetVenueById()
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateVenue()
  update(@Param('id') id: string, @Body() updateDto: UpdateVenueDto) {
    return this.venuesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiDeleteVenue()
  remove(@Param('id') id: string) {
    return this.venuesService.remove(id);
  }
}
