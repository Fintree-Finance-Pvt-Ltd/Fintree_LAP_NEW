import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CreateVisitDto } from '../visits/dto/create-visit.dto';
import { ApplicationsService } from './applications.service';
import type { Actor } from './applications.service';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TransitionApplicationDto } from './dto/transition-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get() @Permissions(PERMISSIONS.APPLICATION_READ)
  findAll(@Query() query: ApplicationFilterDto) { return this.service.findAll(query); }

  @Get('search') @Permissions(PERMISSIONS.APPLICATION_READ)
  search(@Query('q') q = '') { return this.service.search(q); }

  @Get('paginated') @Permissions(PERMISSIONS.APPLICATION_READ)
  paginated(@Query() query: ApplicationFilterDto) { return this.service.findAll(query); }

  @Post() @Permissions(PERMISSIONS.APPLICATION_CREATE)
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: Actor) { return this.service.create(dto, user); }

  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  findOne(@Param('applicationId', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Patch(':applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  update(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto, @CurrentUser() user: Actor) { return this.service.update(id, dto, user); }

  @Put(':applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  replace(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto, @CurrentUser() user: Actor) { return this.service.update(id, dto, user); }

  @Delete(':applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  remove(@Param('applicationId', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Post(':applicationId/visits') @Permissions(PERMISSIONS.VISIT_CREATE)
  addVisit(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: CreateVisitDto, @CurrentUser() user: Actor) { return this.service.addVisit(id, dto, user); }

  @Get(':applicationId/visits') @Permissions(PERMISSIONS.APPLICATION_READ)
  listVisits(@Param('applicationId', ParseIntPipe) id: number) { return this.service.listVisits(id); }

  @Post(':applicationId/documents') @UseInterceptors(FileInterceptor('file')) @Permissions(PERMISSIONS.DOCUMENT_UPLOAD)
  addDocument(@Param('applicationId', ParseIntPipe) id: number, @Body('documentType') documentType: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: Actor) { return this.service.addDocument(id, documentType, file, user); }

  @Get(':applicationId/documents') @Permissions(PERMISSIONS.APPLICATION_READ)
  listDocuments(@Param('applicationId', ParseIntPipe) id: number) { return this.service.listDocuments(id); }

  @Post(':applicationId/transitions') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  transition(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: TransitionApplicationDto, @CurrentUser() user: Actor) { return this.service.transition(id, dto, user); }

  @Get(':applicationId/workflow-history') @Permissions(PERMISSIONS.APPLICATION_READ)
  workflowHistory(@Param('applicationId', ParseIntPipe) id: number) { return this.service.workflowHistory(id); }
}
