import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { CreateContactPersonDto } from './dto/create-contact-person.dto';
import { UpdateContactPersonDto } from './dto/update-contact-person.dto';
import { ContactPerson } from './entities/contact-person.entity';

@Injectable()
export class ContactPersonsService {
  constructor(
    @InjectRepository(ContactPerson) private readonly contacts: Repository<ContactPerson>,
    @InjectRepository(Application) private readonly applications: Repository<Application>
  ) {}

  async create(dto: CreateContactPersonDto) {
    await this.assertApplication(dto.applicationId);
    return { data: await this.contacts.save(this.contacts.create(dto)) };
  }

  async findByApplication(applicationId: number) {
    return { data: await this.contacts.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async update(id: number, dto: UpdateContactPersonDto) {
    const entity = await this.contacts.preload({ id, ...dto });
    if (!entity) throw new NotFoundException('Contact person not found');
    return { data: await this.contacts.save(entity) };
  }

  async remove(id: number) {
    const result = await this.contacts.delete(id);
    if (!result.affected) throw new NotFoundException('Contact person not found');
    return { data: null, message: 'Contact person deleted' };
  }

  private async assertApplication(applicationId: number) {
    if (!(await this.applications.exist({ where: { id: applicationId } }))) throw new NotFoundException('Application not found');
  }
}
