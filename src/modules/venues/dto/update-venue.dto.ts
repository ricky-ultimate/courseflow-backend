import { PartialType } from '@nestjs/swagger';
import { CreateVenueDto } from './create-venue.dto';

export class UpdateCourseDto extends PartialType(CreateVenueDto) {}
