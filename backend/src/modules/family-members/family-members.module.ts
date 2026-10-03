import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { FamilyMember } from './entities/family-member.entity';
import { FamilyMembersController } from './family-members.controller';
import { FamilyMembersService } from './family-members.service';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMember, Application])],
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
  exports: [FamilyMembersService],
})
export class FamilyMembersModule {}
