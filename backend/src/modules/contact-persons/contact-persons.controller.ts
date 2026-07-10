import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ContactPersonsService } from './contact-persons.service';


@ApiTags('Contact Persons')
@ApiBearerAuth()
@Controller('contact-persons')
export class ContactPersonsController {
  constructor(private readonly service: ContactPersonsService) {}
  @Post() 
  create(@Body() dto: any) { return this.service.create(dto); }
  @Get(':applicationId')
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findByApplication(applicationId); }
  @Put(':id') 
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') 
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
