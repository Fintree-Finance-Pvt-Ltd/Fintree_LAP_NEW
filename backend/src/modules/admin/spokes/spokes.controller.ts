import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { SpokesService } from './spokes.service';

/*
 * DTOs are kept inside this existing controller file
 * so no additional DTO files are required.
 */

export class CreateSpokeDto {
  @Type(() => Number)
  @IsInt({ message: 'hubId must be an integer.' })
  @Min(1, { message: 'hubId must be greater than 0.' })
  hubId: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Spoke name must be a string.' })
  @IsNotEmpty({ message: 'Spoke name is required.' })
  @MaxLength(160, {
    message: 'Spoke name must not exceed 160 characters.',
  })
  name: string;
}

export class UpdateSpokeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'hubId must be an integer.' })
  @Min(1, { message: 'hubId must be greater than 0.' })
  hubId?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Spoke name must be a string.' })
  @IsNotEmpty({ message: 'Spoke name cannot be empty.' })
  @MaxLength(160, {
    message: 'Spoke name must not exceed 160 characters.',
  })
  name?: string;
}

@Controller('spokes')
export class SpokesController {
  constructor(
    private readonly spokesService: SpokesService,
  ) {}

  /*
   * GET /api/spokes
   * GET /api/spokes?search=Andheri
   */
  @Get()
  findAll(
    @Query('search') search = '',
  ) {
    return this.spokesService.findAll(search);
  }

  /*
   * GET /api/spokes/:id
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.spokesService.findOne(id);
  }

  /*
   * POST /api/spokes
   */
  @Post()
  create(
    @Body() createSpokeDto: CreateSpokeDto,
  ) {
    return this.spokesService.create(
      createSpokeDto,
    );
  }

  /*
   * PATCH /api/spokes/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpokeDto: UpdateSpokeDto,
  ) {
    return this.spokesService.update(
      id,
      updateSpokeDto,
    );
  }
}