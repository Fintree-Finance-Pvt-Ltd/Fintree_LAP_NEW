import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { FamilyMembersService } from './family-members.service';

@ApiTags('Family Members')
@ApiBearerAuth()
@Controller('family-members')
export class FamilyMembersController {
  constructor(private readonly service: FamilyMembersService) {}

  @Post()
  create(@Body() dto: CreateFamilyMemberDto) {
    return this.service.create(dto);
  }

  @Get(':applicationId')
  find(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFamilyMemberDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post('bulk/:applicationId')
  saveBulk(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: { familyMembers: Array<Partial<CreateFamilyMemberDto> & { id?: number }> },
  ) {
    return this.service.saveBulk(applicationId, body.familyMembers || []);
  }
}
