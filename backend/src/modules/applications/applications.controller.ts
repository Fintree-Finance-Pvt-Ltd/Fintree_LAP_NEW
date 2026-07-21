import { Body, Controller, Delete, Get, Param, Headers,ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

import type { Actor } from './applications.service';
import { ApplicationsService } from './applications.service';
import { LapPaymentsService } from './lap-payments.service';
import { Public } from 'src/common/decorators/public.decorator';
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService,
  private readonly lapPaymentsService: LapPaymentsService,) { }

  @Get() 
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('search') 
  search(@Query('q') q = '') { return this.service.search(q); }

  @Get('paginated') 
  paginated(@Query() query: any) { return this.service.findAll(query); }

  @Post() 
  create(@Body() dto: any, @CurrentUser() user: Actor) { return this.service.create(dto, user); }

  // 1. ENDPOINT: POST /applications/draft
  // Used to initialize a brand new lead in the database table with partial data
  @Post('draft') 
  draft(@Body() dto: any, @CurrentUser() user: Actor) { 
    return this.service.draft(dto, user); 
  }

  @Post('submit') 
  submit(@Body() dto: any, @CurrentUser() user: Actor) { return this.service.submit(dto, user); }

  // 2. ENDPOINT: POST /applications/submit-draft
  // Used to trigger final validation processing for workflow transitions
  @Post('submit-draft') 
  submitDraft(@Body() dto: any, @CurrentUser() user: Actor) {
    return this.service.submitDraft(dto.applicationId, dto, user);
  }

  @Get(':applicationId') 
  findOne(@Param('applicationId', ParseIntPipe) id: number) { return this.service.findOne(id); }


  // 3. ENDPOINT: PATCH /applications/:applicationId
  // FIXED: Changed DTO definition type to accept partial fields from the profile schema layout
  @Patch(':applicationId')
  @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  update(
    @Param('applicationId', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: Actor,
  ) {
    console.log('PATCH controller hit:', id);
    return this.service.update(id, dto, user);
  }

  @Put(':applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  replace(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: any, @CurrentUser() user: Actor) {
    return this.service.update(id, dto, user);
  }

  @Delete(':applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  remove(@Param('applicationId', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Post(':applicationId/visits') @Permissions(PERMISSIONS.VISIT_CREATE)
  addVisit(
    @Param('applicationId', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.addVisit(id, body, user);
  }

  @Get(':applicationId/visits') @Permissions(PERMISSIONS.APPLICATION_READ)
  listVisits(@Param('applicationId', ParseIntPipe) id: number) { return this.service.listVisits(id); }

  @Post(':applicationId/documents') @UseInterceptors(FileInterceptor('file')) @Permissions(PERMISSIONS.DOCUMENT_UPLOAD)
  addDocument(@Param('applicationId', ParseIntPipe) id: number, @Body('documentType') documentType: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: Actor) { return this.service.addDocument(id, documentType, file, user); }

  @Get(':applicationId/documents') @Permissions(PERMISSIONS.APPLICATION_READ)
  listDocuments(@Param('applicationId', ParseIntPipe) id: number) { return this.service.listDocuments(id); }

  @Post(':applicationId/transitions') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  transition(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: any, @CurrentUser() user: Actor) { return this.service.transition(id, dto, user); }

  @Get(':applicationId/workflow-history')
  workflowHistory(@Param('applicationId', ParseIntPipe) id: number) { return this.service.workflowHistory(id); }

  @Get(':applicationId/workflow')
  workflowStatus(@Param('applicationId', ParseIntPipe) id: number) { return this.service.workflowStatus(id); }

  @Post(':applicationId/workflow')
  recordWorkflowStep(@Param('applicationId', ParseIntPipe) id: number, @Body() dto: any, @CurrentUser() user: Actor) { return this.service.recordWorkflowStep(id, dto, user); }

@Post(':id/submit-to-bm')
submitToBm(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: Actor,
) {
  return this.service.submitToBm(id, user);
}

@Post(':id/submit-to-cm')
submitToCm(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: Actor,
) {
  return this.service.submitToCm(id, user);
}

@Post(':id/submit-to-credit')
submitToCredit(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: Actor,
) {
  return this.service.submitToCredit(id, body, user);
}

@Post(':id/easebuzz/create-link')
createEasebuzzPaymentLink(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: Actor,
) {
  return this.lapPaymentsService.createPaymentLink(
    id,
    body,
    user,
  );
}
@Public()
@Post('easebuzz/webhook')
async handleEasebuzzWebhook(
  @Body() body: any,
  @Headers() headers: any,
) {
  return this.lapPaymentsService.handleEasebuzzWebhook(
    body,
    headers,
  );
}



}