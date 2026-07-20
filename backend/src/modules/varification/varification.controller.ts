import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { VarificationService } from "./varification.service";
@ApiTags("Varification")
@ApiBearerAuth()
@Controller()
export class VarificationController {
  constructor(private readonly service: VarificationService) {}
  @Post("pan/verify") @HttpCode(HttpStatus.OK) async verifyPan(
    @Body() body: any,
  ) {
    return this.service.verifyPan(
      body?.panNumber,
      body?.name,
      Number(body?.applicationId),
    );
  }
  @Post("gst/verify") @HttpCode(HttpStatus.OK) async verifyGst(
    @Body() body: any,
  ) {
    return this.service.verifyGst(body?.gstNumber, Number(body?.applicationId));
  }
  @Post("aadhaar/init") @HttpCode(HttpStatus.OK) async initAadhaarKyc(
    @Body() body: any,
  ) {
    return this.service.initAadhaarKyc(Number(body?.applicationId));
  }
  @Public()
  @Post("aadhaar/webhook")
  @HttpCode(HttpStatus.OK)
  async aadhaarWebhook(@Body() body: any) {
    return this.service.updateAadhaarKycStatus(body);
  }
  @Public()
  @Post("lap-webhook/v1/digi-aadhaar-webhook")
  @HttpCode(HttpStatus.OK)
  async digitapAadhaarWebhook(@Body() body: any) {
    return this.service.updateAadhaarKycStatus(body);
  }
}
