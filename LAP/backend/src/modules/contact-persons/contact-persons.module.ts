import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { ContactPersonsController } from './contact-persons.controller';
import { ContactPersonsService } from './contact-persons.service';
import { ContactPerson } from './entities/contact-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactPerson, Application])],
  controllers: [ContactPersonsController],
  providers: [ContactPersonsService],
  exports: [ContactPersonsService]
})
export class ContactPersonsModule {}
