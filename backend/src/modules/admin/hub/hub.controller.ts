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

import { HubService } from './hub.service';

@Controller('hub')
export class HubController {
  constructor(
    private readonly hubService: HubService,
  ) {}

  @Get()
  findAll(
    @Query('search') search = '',
  ) {
    return this.hubService.findAll(search);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.hubService.findOne(id);
  }

   
  @Post()
  create(
    @Body() body: unknown,
  ) {
    return this.hubService.create(body);
  }

  
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.hubService.update(id, body);
  }
}