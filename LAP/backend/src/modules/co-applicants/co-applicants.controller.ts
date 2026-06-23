import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CoApplicantsService } from './co-applicants.service';
import { CreateCoApplicantDto } from './dto/create-co-applicant.dto';
import { UpdateCoApplicantDto } from './dto/update-co-applicant.dto';

@ApiTags('Co Applicants')
@ApiBearerAuth()
@Controller('co-applicants')
export class CoApplicantsController {
  constructor(private readonly service: CoApplicantsService) {}
  @Post() @Permissions(PERMISSIONS.CO_APPLICANT_MANAGE)
  create(@Body() dto: CreateCoApplicantDto) { return this.service.create(dto); }
  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findByApplication(applicationId); }
  @Put(':id') @Permissions(PERMISSIONS.CO_APPLICANT_MANAGE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCoApplicantDto) { return this.service.update(id, dto); }
  @Delete(':id') @Permissions(PERMISSIONS.CO_APPLICANT_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
