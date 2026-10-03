import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { FamilyMember } from './entities/family-member.entity';

@Injectable()
export class FamilyMembersService {
  constructor(
    @InjectRepository(FamilyMember) private readonly familyRepo: Repository<FamilyMember>,
    @InjectRepository(Application) private readonly applications: Repository<Application>
  ) {}

  async create(dto: CreateFamilyMemberDto) {
    await this.assertApplication(dto.applicationId);
    const member = this.familyRepo.create(dto);
    return { data: await this.familyRepo.save(member) };
  }

  async findByApplication(applicationId: number) {
    return {
      data: await this.familyRepo.find({
        where: { applicationId },
        order: { id: 'ASC' },
      }),
    };
  }

  async update(id: number, dto: Partial<CreateFamilyMemberDto>) {
    const entity = await this.familyRepo.preload({ id, ...dto });
    if (!entity) throw new NotFoundException('Family member not found');
    return { data: await this.familyRepo.save(entity) };
  }

  async remove(id: number) {
    const result = await this.familyRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Family member not found');
    return { data: null, message: 'Family member deleted' };
  }

  async saveBulk(applicationId: number, members: Array<Partial<CreateFamilyMemberDto> & { id?: number }>) {
    await this.assertApplication(applicationId);

    const savedRecords: FamilyMember[] = [];
    for (const item of members) {
      if (!item.name || !item.relation) continue;

      if (item.id) {
        const preloaded = await this.familyRepo.preload({
          ...item,
          id: Number(item.id),
          applicationId,
        });
        if (preloaded) {
          savedRecords.push(await this.familyRepo.save(preloaded));
        }
      } else {
        const newEntity = this.familyRepo.create({
          ...item,
          applicationId,
        });
        savedRecords.push(await this.familyRepo.save(newEntity));
      }
    }

    return { data: savedRecords };
  }

  private async assertApplication(applicationId: number) {
    if (!(await this.applications.exist({ where: { id: applicationId } }))) {
      throw new NotFoundException('Application not found');
    }
  }
}
