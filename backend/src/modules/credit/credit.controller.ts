import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Actor } from '../applications/applications.service';
import { CreditService } from '../credit/credit.service';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) { }

  @Get('final-credit-manager/cases')
  getFinalCreditManagerCases() {
    return this.creditService
      .getFinalCreditManagerCases();
  }

  // CREDIT MANAGER APPROVE AND SEND TO OPS MAKER
  @Post(
    ':applicationId/credit-manager/approve-to-ops-maker',
  )
  creditManagerApproveToOpsMaker(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,

    @Body()
    body: any,

    @CurrentUser()
    user: Actor,
  ) {
    return this.creditService
      .creditManagerApproveToOpsMaker(
        applicationId,
        body,
        user,
      );
  }

  // CREDIT MAKER CASE LIST
  @Get('maker/cases')
  getCreditMakerCases() {
    return this.creditService.getCreditMakerCases();
  }

  // CREDIT CHECKER CASE LIST
  @Get('checker/cases')
  getCreditCheckerCases() {
    return this.creditService.getCreditCheckerCases();
  }


  @Post(
  ':applicationId/maker/submit-to-valuation',
)
creditMakerSubmitToValuation(
  @Param(
    'applicationId',
    ParseIntPipe,
  )
  applicationId: number,

  @Body()
  body: any,

  @CurrentUser()
  actor: Actor,
) {
  return this.creditService
    .creditMakerSubmitToValuation(
      applicationId,
      body,
      actor,
    );
}




  // CM SAVE DRAFT
  @Post(':applicationId/cm/save-draft')
  cmSaveDraft(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.cmSaveDraft(applicationId, body, user);
  }

  // CM RECOMMEND AND SEND TO CREDIT MAKER
  @Post(':applicationId/cm/recommend')
  cmRecommendToCreditMaker(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.cmRecommendToCreditMaker(
      applicationId,
      body,
      user,
    );
  }

  // GET CREDIT ASSESSMENT
  @Get(':applicationId/assessment')
  getCreditAssessment(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.creditService.getCreditAssessment(applicationId);
  }

  // GET ONE APPLICATION FOR CREDIT SCREEN
  @Get(':applicationId')
  getCreditApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.creditService.getCreditApplication(applicationId);
  }


  @Get('maker/final/cases')
getFinalCreditMakerCases() {
  return this.creditService
    .getFinalCreditMakerCases();
}
  // CREDIT MAKER SAVE DRAFT
  @Post(':applicationId/maker/save-draft')
  creditMakerSaveDraft(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditMakerSaveDraft(
      applicationId,
      body,
      user,
    );
  }

  // CREDIT MAKER RAISE QUERY
  @Post(':applicationId/maker/raise-query')
  creditMakerRaiseQuery(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditMakerRaiseQuery(
      applicationId,
      body,
      user,
    );
  }

  // CREDIT MAKER SUBMIT TO CREDIT CHECKER
  @Post(':applicationId/maker/submit-to-checker')
  creditMakerSubmitToChecker(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditMakerSubmitToChecker(
      applicationId,
      body,
      user,
    );
  }


  // CREDIT CHECKER APPROVE AND SEND TO VALUATION
  @Post(':applicationId/checker/approve')
  creditCheckerApprove(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditCheckerApprove(
      applicationId,
      body,
      user,
    );
  }

  // CREDIT CHECKER RETURN TO CREDIT MAKER
  @Post(':applicationId/checker/return-to-maker')
  creditCheckerReturnToMaker(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditCheckerReturnToMaker(
      applicationId,
      body,
      user,
    );
  }

  // CREDIT CHECKER REJECT
  @Post(':applicationId/checker/reject')
  creditCheckerReject(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.creditService.creditCheckerReject(
      applicationId,
      body,
      user,
    );
  }
}