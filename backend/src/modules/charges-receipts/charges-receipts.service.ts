import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChargesReceipt,
  CollectionStatus,
  ScheduleStatus,
} from './entities/charges-receipt.entity';

@Injectable()
export class ChargesReceiptsService {
  constructor(
    @InjectRepository(ChargesReceipt)
    private readonly chargesReceiptRepo: Repository<ChargesReceipt>,
  ) {}

  private calculateAmounts(base: number, gstRate = 18) {
    const baseAmount = Number(base || 0);
    const gstPercent = Number(gstRate || 0);

    const gstAmount = Number(((baseAmount * gstPercent) / 100).toFixed(2));
    const grossAmount = Number((baseAmount + gstAmount).toFixed(2));

    return {
      base: baseAmount,
      gstRate: gstPercent,
      gstAmount,
      grossAmount,
    };
  }

  private calculateCollectionStatus(charge: ChargesReceipt): CollectionStatus {
    const grossAmount = Number(charge.grossAmount || 0);
    const paidAmount = Number(charge.paidAmount || 0);
    const waiverAmount = Number(charge.waiverAmount || 0);
    const refundAmount = Number(charge.refundAmount || 0);

    const adjustedPaid = paidAmount + waiverAmount - refundAmount;

    if (refundAmount > 0) {
      return CollectionStatus.REFUNDED;
    }

    if (waiverAmount >= grossAmount && grossAmount > 0) {
      return CollectionStatus.WAIVED;
    }

    if (adjustedPaid >= grossAmount && grossAmount > 0) {
      return CollectionStatus.PAID;
    }

    if (adjustedPaid > 0) {
      return CollectionStatus.PARTIAL;
    }

    return CollectionStatus.PENDING;
  }

  async create(body: any) {
    const amounts = this.calculateAmounts(body.base, body.gstRate ?? 18);

    const charge = this.chargesReceiptRepo.create({
      applicationId: Number(body.applicationId),

      name: body.name,
      sub: body.sub ?? null,
      stage: body.stage,

      ...amounts,

      paidAmount: Number(body.paidAmount ?? 0),
      waiverAmount: Number(body.waiverAmount ?? 0),
      refundAmount: Number(body.refundAmount ?? 0),

      collectionStatus: body.collectionStatus ?? CollectionStatus.PENDING,
      scheduleStatus: body.scheduleStatus ?? ScheduleStatus.DRAFT,

      paymentReference: body.paymentReference ?? null,
      paymentMode: body.paymentMode ?? null,
      receiptNo: body.receiptNo ?? null,

      noLink: body.noLink ?? false,
    });

    charge.collectionStatus = this.calculateCollectionStatus(charge);

    return this.chargesReceiptRepo.save(charge);
  }

  async createDefaultSchedule(applicationId: string | number) {
    const appId = Number(applicationId);

    const existing = await this.chargesReceiptRepo.count({
      where: { applicationId: appId },
    });

    if (existing > 0) {
      return this.findByApplicationId(appId);
    }

    const defaultCharges: any[] = [
      {
        applicationId: appId,
        name: 'Login / Application Fee',
        sub: 'Mandatory · Non-refundable after login, subject to policy',
        stage: 'At Login',
        base: 2500,
        gstRate: 18,
      },
    ];

    for (const charge of defaultCharges) {
      await this.create(charge);
    }

    return this.findByApplicationId(appId);
  }

  async findByApplicationId(applicationId: string | number) {
    const appId = Number(applicationId);

    const charges = await this.chargesReceiptRepo.find({
      where: { applicationId: appId },
      order: { id: 'ASC' },
    });

    const summary = charges.reduce(
      (acc, item) => {
        acc.baseCharges += Number(item.base || 0);
        acc.gstTax += Number(item.gstAmount || 0);
        acc.totalApproved += Number(item.grossAmount || 0);
        acc.customerPaid += Number(item.paidAmount || 0);
        acc.waived += Number(item.waiverAmount || 0);
        acc.refunded += Number(item.refundAmount || 0);

        return acc;
      },
      {
        baseCharges: 0,
        gstTax: 0,
        totalApproved: 0,
        customerPaid: 0,
        waived: 0,
        refunded: 0,
        balanceDue: 0,
      },
    );

    summary.balanceDue =
      summary.totalApproved -
      summary.customerPaid -
      summary.waived +
      summary.refunded;

    Object.keys(summary).forEach((key) => {
      const k = key as keyof typeof summary;
      summary[k] = Number(summary[k].toFixed(2));
    });

    return {
      applicationId: appId,
      scheduleStatus: charges[0]?.scheduleStatus ?? ScheduleStatus.DRAFT,
      charges,
      summary,
    };
  }

  async update(id: number, body: any) {
    const charge = await this.chargesReceiptRepo.findOne({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Charge receipt not found');
    }

    if (body.name !== undefined) charge.name = body.name;
    if (body.sub !== undefined) charge.sub = body.sub;
    if (body.stage !== undefined) charge.stage = body.stage;

    if (body.paidAmount !== undefined) {
      charge.paidAmount = Number(body.paidAmount || 0);
    }

    if (body.waiverAmount !== undefined) {
      charge.waiverAmount = Number(body.waiverAmount || 0);
    }

    if (body.refundAmount !== undefined) {
      charge.refundAmount = Number(body.refundAmount || 0);
    }

    if (body.scheduleStatus !== undefined) {
      charge.scheduleStatus = body.scheduleStatus;
    }

    if (body.paymentMode !== undefined) {
      charge.paymentMode = body.paymentMode;
    }

    if (body.paymentReference !== undefined) {
      charge.paymentReference = body.paymentReference;
    }

    if (body.receiptNo !== undefined) {
      charge.receiptNo = body.receiptNo;
    }

    if (body.noLink !== undefined) {
      charge.noLink = body.noLink;
    }

    if (body.base !== undefined || body.gstRate !== undefined) {
      const amounts = this.calculateAmounts(
        body.base ?? Number(charge.base),
        body.gstRate ?? Number(charge.gstRate),
      );

      charge.base = amounts.base;
      charge.gstRate = amounts.gstRate;
      charge.gstAmount = amounts.gstAmount;
      charge.grossAmount = amounts.grossAmount;
    }

    charge.collectionStatus = this.calculateCollectionStatus(charge);

    return this.chargesReceiptRepo.save(charge);
  }

  async submitSchedule(applicationId: string | number) {
    const appId = Number(applicationId);

    await this.chargesReceiptRepo.update(
      { applicationId: appId },
      { scheduleStatus: ScheduleStatus.SUBMITTED },
    );

    return this.findByApplicationId(appId);
  }

  async approveSchedule(applicationId: string | number) {
    const appId = Number(applicationId);

    await this.chargesReceiptRepo.update(
      { applicationId: appId },
      { scheduleStatus: ScheduleStatus.APPROVED },
    );

    return this.findByApplicationId(appId);
  }

  async rejectSchedule(applicationId: string | number) {
    const appId = Number(applicationId);

    await this.chargesReceiptRepo.update(
      { applicationId: appId },
      { scheduleStatus: ScheduleStatus.REJECTED },
    );

    return this.findByApplicationId(appId);
  }

  async markPaid(id: number, body: any) {
    const charge = await this.chargesReceiptRepo.findOne({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Charge receipt not found');
    }

    charge.paidAmount = Number(body.paidAmount ?? charge.grossAmount);
    charge.paymentMode = body.paymentMode ?? null;
    charge.paymentReference = body.paymentReference ?? null;
    charge.receiptNo = body.receiptNo ?? `RCP-${Date.now()}`;

    charge.collectionStatus = this.calculateCollectionStatus(charge);

    return this.chargesReceiptRepo.save(charge);
  }

  async waiveCharge(id: number, body: any) {
    const charge = await this.chargesReceiptRepo.findOne({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Charge receipt not found');
    }

    charge.waiverAmount = Number(body.waiverAmount ?? charge.grossAmount);
    charge.collectionStatus = this.calculateCollectionStatus(charge);

    return this.chargesReceiptRepo.save(charge);
  }

  async refundCharge(id: number, body: any) {
    const charge = await this.chargesReceiptRepo.findOne({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Charge receipt not found');
    }

    charge.refundAmount = Number(body.refundAmount ?? 0);
    charge.collectionStatus = this.calculateCollectionStatus(charge);

    return this.chargesReceiptRepo.save(charge);
  }

  async remove(id: number) {
    const charge = await this.chargesReceiptRepo.findOne({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Charge receipt not found');
    }

    await this.chargesReceiptRepo.delete(id);

    return {
      message: 'Charge receipt deleted successfully',
    };
  }

async createEasebuzzPaymentLink(applicationId: number) {
  const appId = Number(applicationId);

  if (!Number.isInteger(appId) || appId <= 0) {
    throw new BadRequestException('Invalid application ID.');
  }

  const charges: ChargesReceipt[] = await this.chargesReceiptRepo.find({
    where: {
      applicationId: appId,
    },
    order: {
      id: 'ASC',
    },
  });

  if (!charges.length) {
    throw new BadRequestException(
      'No charge schedule found for this application.',
    );
  }

  const notApproved = charges.some(
    (charge: ChargesReceipt) =>
      charge.scheduleStatus !== ScheduleStatus.APPROVED,
  );

  if (notApproved) {
    throw new BadRequestException(
      'Payment link can be created only after charge schedule is approved.',
    );
  }

  const pendingCharges = charges.filter((charge: ChargesReceipt) => {
    const grossAmount = Number(charge.grossAmount || 0);
    const paidAmount = Number(charge.paidAmount || 0);
    const waiverAmount = Number(charge.waiverAmount || 0);
    const refundAmount = Number(charge.refundAmount || 0);

    const outstanding =
      grossAmount - paidAmount - waiverAmount + refundAmount;

    return outstanding > 0;
  });

  if (!pendingCharges.length) {
    throw new BadRequestException(
      'No pending charge amount found for payment link.',
    );
  }

  const amount = pendingCharges.reduce(
    (sum: number, charge: ChargesReceipt) => {
      const grossAmount = Number(charge.grossAmount || 0);
      const paidAmount = Number(charge.paidAmount || 0);
      const waiverAmount = Number(charge.waiverAmount || 0);
      const refundAmount = Number(charge.refundAmount || 0);

      const outstanding =
        grossAmount - paidAmount - waiverAmount + refundAmount;

      return sum + outstanding;
    },
    0,
  );

  const providerReference = `EBZ-${appId}-${Date.now()}`;

  /*
    TODO:
    Connect actual Easebuzz payment-link API here.
    Do not call Easebuzz directly from React.
    Keep Easebuzz key/salt only in backend .env.
  */

  return {
    success: true,
    message:
      'Charge schedule is approved and payment demand is ready for Easebuzz link creation.',
    data: {
      applicationId: appId,
      amount: Number(amount.toFixed(2)),
      scheduleStatus: ScheduleStatus.APPROVED,
      provider: 'EASEBUZZ',
      providerReference,
      paymentLink: null,
      charges: pendingCharges.map((charge: ChargesReceipt) => {
        const grossAmount = Number(charge.grossAmount || 0);
        const paidAmount = Number(charge.paidAmount || 0);
        const waiverAmount = Number(charge.waiverAmount || 0);
        const refundAmount = Number(charge.refundAmount || 0);

        return {
          id: charge.id,
          name: charge.name,
          amount: Number(
            (
              grossAmount -
              paidAmount -
              waiverAmount +
              refundAmount
            ).toFixed(2),
          ),
        };
      }),
    },
  };
}

}