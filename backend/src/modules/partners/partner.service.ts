import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  QueryFailedError,
  Repository,
} from 'typeorm';

import {
  Partner,
  PartnerStatus,
} from './entities/partner.entity';

export interface CreatePartnerPayload {
  name?: string;
  code?: string;
  lanPrefix?: string;
}

export interface UpdatePartnerPayload {
  name?: string;
  code?: string;
  lanPrefix?: string;
}

export interface UpdatePartnerStatusPayload {
  status?: PartnerStatus | string;
}

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
  ) {}

  async findAll(search?: string): Promise<Partner[]> {
    const normalizedSearch =
      typeof search === 'string'
        ? search.trim()
        : '';

    const queryBuilder =
      this.partnerRepository.createQueryBuilder(
        'partner',
      );

    if (normalizedSearch) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            'LOWER(partner.name) LIKE LOWER(:search)',
            {
              search: `%${normalizedSearch}%`,
            },
          )
            .orWhere(
              'LOWER(partner.code) LIKE LOWER(:search)',
              {
                search: `%${normalizedSearch}%`,
              },
            )
            .orWhere(
              'LOWER(partner.lanPrefix) LIKE LOWER(:search)',
              {
                search: `%${normalizedSearch}%`,
              },
            );
        }),
      );
    }

    return queryBuilder
      .orderBy('partner.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Partner> {
    const partner =
      await this.partnerRepository.findOne({
        where: { id },
      });

    if (!partner) {
      throw new NotFoundException(
        'Partner not found.',
      );
    }

    return partner;
  }

  async create(
    payload: CreatePartnerPayload,
  ): Promise<Partner> {
    const name = this.normalizeString(
      payload?.name,
    );

    const code = this.normalizeUppercase(
      payload?.code,
    );

    const lanPrefix = this.normalizeUppercase(
      payload?.lanPrefix,
    );

    if (!name) {
      throw new BadRequestException(
        'Partner name is required.',
      );
    }

    if (!code) {
      throw new BadRequestException(
        'Partner code is required.',
      );
    }

    if (!lanPrefix) {
      throw new BadRequestException(
        'LAN prefix is required.',
      );
    }

    this.validateMaximumLengths(
      name,
      code,
      lanPrefix,
    );

    await this.ensureUniqueValues(
      code,
      lanPrefix,
    );

    const partner =
      this.partnerRepository.create({
        name,
        code,
        lanPrefix,
        currentLanSequence: 0,
        status: PartnerStatus.ACTIVE,
      });

    try {
      return await this.partnerRepository.save(
        partner,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: number,
    payload: UpdatePartnerPayload,
  ): Promise<Partner> {
    const partner = await this.findOne(id);

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException(
        'Partner update data is required.',
      );
    }

    const hasName = payload.name !== undefined;
    const hasCode = payload.code !== undefined;
    const hasLanPrefix =
      payload.lanPrefix !== undefined;

    if (!hasName && !hasCode && !hasLanPrefix) {
      throw new BadRequestException(
        'Provide at least one field to update.',
      );
    }

    const name = hasName
      ? this.normalizeString(payload.name)
      : partner.name;

    const code = hasCode
      ? this.normalizeUppercase(payload.code)
      : partner.code;

    const lanPrefix = hasLanPrefix
      ? this.normalizeUppercase(
          payload.lanPrefix,
        )
      : partner.lanPrefix;

    if (!name) {
      throw new BadRequestException(
        'Partner name cannot be empty.',
      );
    }

    if (!code) {
      throw new BadRequestException(
        'Partner code cannot be empty.',
      );
    }

    if (!lanPrefix) {
      throw new BadRequestException(
        'LAN prefix cannot be empty.',
      );
    }

    this.validateMaximumLengths(
      name,
      code,
      lanPrefix,
    );

    await this.ensureUniqueValues(
      code,
      lanPrefix,
      id,
    );

    partner.name = name;
    partner.code = code;
    partner.lanPrefix = lanPrefix;

    try {
      return await this.partnerRepository.save(
        partner,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateStatus(
    id: number,
    payload: UpdatePartnerStatusPayload,
  ): Promise<Partner> {
    const partner = await this.findOne(id);

    const status = this.normalizeStatus(
      payload?.status,
    );

    partner.status = status;

    return this.partnerRepository.save(partner);
  }

  private normalizeStatus(
    value: unknown,
  ): PartnerStatus {
    const normalizedStatus =
      typeof value === 'string'
        ? value.trim().toUpperCase()
        : '';

    if (
      !Object.values(PartnerStatus).includes(
        normalizedStatus as PartnerStatus,
      )
    ) {
      throw new BadRequestException(
        'Status must be ACTIVE or INACTIVE.',
      );
    }

    return normalizedStatus as PartnerStatus;
  }

  private async ensureUniqueValues(
    code: string,
    lanPrefix: string,
    excludedPartnerId?: number,
  ): Promise<void> {
    const codeQuery =
      this.partnerRepository
        .createQueryBuilder('partner')
        .where(
          'UPPER(partner.code) = :code',
          {
            code,
          },
        );

    if (excludedPartnerId !== undefined) {
      codeQuery.andWhere(
        'partner.id != :excludedPartnerId',
        {
          excludedPartnerId,
        },
      );
    }

    const existingCode =
      await codeQuery.getOne();

    if (existingCode) {
      throw new ConflictException(
        'Partner code already exists.',
      );
    }

    const lanPrefixQuery =
      this.partnerRepository
        .createQueryBuilder('partner')
        .where(
          'UPPER(partner.lanPrefix) = :lanPrefix',
          {
            lanPrefix,
          },
        );

    if (excludedPartnerId !== undefined) {
      lanPrefixQuery.andWhere(
        'partner.id != :excludedPartnerId',
        {
          excludedPartnerId,
        },
      );
    }

    const existingLanPrefix =
      await lanPrefixQuery.getOne();

    if (existingLanPrefix) {
      throw new ConflictException(
        'LAN prefix already exists.',
      );
    }
  }

  private normalizeString(
    value: unknown,
  ): string {
    return typeof value === 'string'
      ? value.trim()
      : '';
  }

  private normalizeUppercase(
    value: unknown,
  ): string {
    return typeof value === 'string'
      ? value.trim().toUpperCase()
      : '';
  }

  private validateMaximumLengths(
    name: string,
    code: string,
    lanPrefix: string,
  ): void {
    if (name.length > 255) {
      throw new BadRequestException(
        'Partner name cannot exceed 255 characters.',
      );
    }

    if (code.length > 30) {
      throw new BadRequestException(
        'Partner code cannot exceed 30 characters.',
      );
    }

    if (lanPrefix.length > 20) {
      throw new BadRequestException(
        'LAN prefix cannot exceed 20 characters.',
      );
    }
  }

  private handleDatabaseError(
    error: unknown,
  ): never {
    if (error instanceof QueryFailedError) {
      const databaseError =
        error as QueryFailedError & {
          driverError?: {
            code?: string;
            errno?: number;
            message?: string;
            sqlMessage?: string;
          };
        };

      const message = String(
        databaseError.driverError?.sqlMessage ||
          databaseError.driverError?.message ||
          '',
      ).toLowerCase();

      if (
        message.includes(
          'uk_partners_lan_prefix',
        ) ||
        message.includes('lan_prefix')
      ) {
        throw new ConflictException(
          'LAN prefix already exists.',
        );
      }

      if (
        message.includes('uk_partners_code')
      ) {
        throw new ConflictException(
          'Partner code already exists.',
        );
      }

      if (
        databaseError.driverError?.code ===
          'ER_DUP_ENTRY' ||
        databaseError.driverError?.errno === 1062
      ) {
        throw new ConflictException(
          'Partner code or LAN prefix already exists.',
        );
      }
    }

    throw error;
  }
}