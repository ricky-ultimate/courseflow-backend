import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { BaseService } from '../../common/services/base.service';
import { Venue } from '../../generated/prisma';

@Injectable()
export class VenuesService extends BaseService<
  Venue,
  CreateVenueDto,
  UpdateVenueDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'venue',
      identifierField: 'id',
      uniqueFields: ['name'],
      softDelete: true,
      defaultOrderBy: { name: 'asc' },
    });
  }
}
