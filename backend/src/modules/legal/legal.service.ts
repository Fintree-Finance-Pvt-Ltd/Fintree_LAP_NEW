import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Application } from '../applications/entities/application.entity';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
  ) {}

  async getCasesRequiringAttention() {
    /*
     * Use the stage type already defined on the Application entity.
     * This avoids importing an ApplicationStage enum that is not
     * exported from application.entity.ts.
     */
    const legalStages = [
      'LEGAL',
      'LEGAL_VALUATION',
    ] as Application['stage'][];

    const applications = await this.applications.find({
      where: {
        stage: In(legalStages),
      },
      select: {
        applicationNumber: true,
        customerName: true,
        requestedAmount: true,
        stage: true,
        status: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: applications.map((application) => ({
        application_number: application.applicationNumber,
        customer_name: application.customerName,
        requested_amount: application.requestedAmount,
        stage: application.stage,
        status: application.status,
      })),
    };
  }

  async getStatus(id: number) {
    const application = await this.applications.findOne({
      where: {
        id,
      },
    });

    if (!application) {
      throw new NotFoundException(
        `Application ${id} was not found.`,
      );
    }

    return {
      data: {
        applicationId: Number(application.id),
        applicationNumber: application.applicationNumber,
        stage: application.stage,
        status: application.status,
      },
    };
  }
}