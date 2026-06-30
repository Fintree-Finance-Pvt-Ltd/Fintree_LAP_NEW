import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import type { Actor } from '../applications/applications.service';
import { Application } from '../applications/entities/application.entity';

@Injectable()
export class DashboardsService {
  constructor(@InjectRepository(Application) private readonly applications: Repository<Application>) {}

  async rm(actor: Actor) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const owner = { createdBy: actor.id };
    const [totalCases, draftCases, submittedCases, pendingCases, approvedCases, rejectedCases, todayCases, monthlyCases] = await Promise.all([
      this.applications.count({ where: owner }),
      this.applications.count({ where: { ...owner, status: ApplicationStatus.DRAFT } }),
      this.applications.count({ where: { ...owner, status: In([ApplicationStatus.BM_PENDING, ApplicationStatus.CM_PENDING, ApplicationStatus.CREDIT_PENDING, ApplicationStatus.LEGAL_PENDING, ApplicationStatus.VALUATION_PENDING, ApplicationStatus.SANCTION_PENDING, ApplicationStatus.AGREEMENT_PENDING, ApplicationStatus.DISBURSEMENT_PENDING]) } }),
      this.applications.count({ where: { ...owner, status: In([ApplicationStatus.BM_PENDING, ApplicationStatus.CM_PENDING, ApplicationStatus.CREDIT_PENDING, ApplicationStatus.LEGAL_PENDING, ApplicationStatus.VALUATION_PENDING, ApplicationStatus.SANCTION_PENDING, ApplicationStatus.AGREEMENT_PENDING, ApplicationStatus.DISBURSEMENT_PENDING]) } }),
      this.applications.count({ where: { ...owner, status: In([ApplicationStatus.BM_APPROVED, ApplicationStatus.CM_APPROVED, ApplicationStatus.CREDIT_APPROVED, ApplicationStatus.LEGAL_APPROVED, ApplicationStatus.VALUATION_APPROVED, ApplicationStatus.SANCTION_APPROVED, ApplicationStatus.AGREEMENT_COMPLETED, ApplicationStatus.DISBURSED, ApplicationStatus.ACTIVE]) } }),
      this.applications.count({ where: { ...owner, status: ApplicationStatus.REJECTED } }),
      this.applications.count({ where: { ...owner, createdAt: Between(todayStart, todayEnd) } }),
      this.applications.count({ where: { ...owner, createdAt: Between(monthStart, now) } })
    ]);
    return { data: { totalCases, draftCases, submittedCases, pendingCases, approvedCases, rejectedCases, todayCases, monthlyCases } };
  }
}
