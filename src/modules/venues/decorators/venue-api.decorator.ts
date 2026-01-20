import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
} from '../../../common/decorators/base-api.decorator';

export const ApiGetVenues = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all venues', description: 'Retrieve all venues' }),
    ApiResponse({
      status: 200,
      description: 'Venues retrieved successfully',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetVenueById = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get venue by ID' }),
    ApiParam({ name: 'id', type: 'string' }),
    ApiResponse({ status: 200, description: 'Venue retrieved successfully' }),
    ApiNotFoundResponse('Venue'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateVenue = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new venue' }),
    ApiResponse({ status: 201, description: 'Venue created successfully' }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateVenue = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update venue details' }),
    ApiParam({ name: 'id', type: 'string' }),
    ApiResponse({ status: 200, description: 'Venue updated successfully' }),
    ApiNotFoundResponse('Venue'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteVenue = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete (archive) a venue' }),
    ApiParam({ name: 'id', type: 'string' }),
    ApiResponse({ status: 200, description: 'Venue deleted successfully' }),
    ApiNotFoundResponse('Venue'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
