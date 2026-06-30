import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ContactPersonsService } from './contact-persons.service';
import { CreateContactPersonDto } from './dto/create-contact-person.dto';
import { UpdateContactPersonDto } from './dto/update-contact-person.dto';

@ApiTags('Contact Persons')
@ApiBearerAuth()
@Controller('contact-persons')
export class ContactPersonsController {
  constructor(private readonly service: ContactPersonsService) {}
  @Post() @Permissions(PERMISSIONS.CONTACT_PERSON_MANAGE)
  create(@Body() dto: CreateContactPersonDto) { return this.service.create(dto); }
  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findByApplication(applicationId); }
  @Put(':id') @Permissions(PERMISSIONS.CONTACT_PERSON_MANAGE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactPersonDto) { return this.service.update(id, dto); }
  @Delete(':id') @Permissions(PERMISSIONS.CONTACT_PERSON_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
