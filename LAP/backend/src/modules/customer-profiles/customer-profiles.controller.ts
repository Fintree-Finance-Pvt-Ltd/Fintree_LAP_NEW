import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { CustomerProfilesService } from './customer-profiles.service';

@ApiTags('Customer Profiles')
@ApiBearerAuth()
@Controller('customer-profiles')
export class CustomerProfilesController {
  constructor(private readonly service: CustomerProfilesService) {}
  @Post() 
  create(@Body() dto: CreateCustomerProfileDto) { return this.service.create(dto); }
  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findByApplication(applicationId); }
  @Put(':applicationId') @Permissions(PERMISSIONS.CUSTOMER_PROFILE_MANAGE)
  update(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: UpdateCustomerProfileDto) { return this.service.update(applicationId, dto); }
}
