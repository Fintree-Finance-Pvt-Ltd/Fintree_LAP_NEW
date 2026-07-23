import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import { Organization } from '../../auth/entities/organization.entity';

const FINTREE_ORGANIZATION_NAME =
  'Fintree Finance';

type HubResponse = {
  id: number;
  name: string;
  organization: string;
};

@Injectable()
export class HubService {
  constructor(
    @InjectRepository(Hub)
    private readonly hubRepository: Repository<Hub>,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async findAll(
    searchValue: unknown = '',
  ): Promise<HubResponse[]> {
    const search =
      typeof searchValue === 'string'
        ? searchValue.trim().toLowerCase()
        : '';

    const query =
      this.hubRepository
        .createQueryBuilder('hub')
        .leftJoinAndSelect(
          'hub.organization',
          'organization',
        )
        .orderBy('hub.id', 'DESC');

    if (search) {
      query.andWhere(
        'LOWER(hub.name) LIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const hubs = await query.getMany();

    return hubs.map((hub) =>
      this.toResponse(hub),
    );
  }

  async findOne(
    id: number,
  ): Promise<HubResponse> {
    const hub =
      await this.findHubOrFail(id);

    return this.toResponse(hub);
  }

  async create(
    payload: unknown,
  ) {
    const name =
      this.validateAndExtractName(payload);

    const organization =
      await this.findFintreeOrganization();

    await this.ensureUniqueHubName(
      name,
      organization.id,
    );

    const hub =
      this.hubRepository.create({
        name,
        organization,
      });

    const savedHub =
      await this.hubRepository.save(hub);

  
    savedHub.organization =
      organization;

    return {
      success: true,
      message:
        'Hub created successfully.',
      data: this.toResponse(savedHub),
    };
  }


  async update(
    id: number,
    payload: unknown,
  ) {
    const name =
      this.validateAndExtractName(payload);

    const hub =
      await this.findHubOrFail(id);

    if (!hub.organization) {
      throw new NotFoundException(
        'Organization associated with this Hub was not found.',
      );
    }

    await this.ensureUniqueHubName(
      name,
      hub.organization.id,
      id,
    );


    hub.name = name;

    const savedHub =
      await this.hubRepository.save(hub);

    return {
      success: true,
      message:
        'Hub updated successfully.',
      data: this.toResponse(savedHub),
    };
  }

  /**
   * Find Hub with Organization relation.
   */
  private async findHubOrFail(
    id: number,
  ): Promise<Hub> {
    const hub =
      await this.hubRepository.findOne({
        where: {
          id,
        },
        relations: [
          'organization',
        ],
      });

    if (!hub) {
      throw new NotFoundException(
        `Hub with ID ${id} was not found.`,
      );
    }

    return hub;
  }

  private async findFintreeOrganization():
    Promise<Organization> {
    const organization =
      await this.organizationRepository.findOne({
        where: {
          name: FINTREE_ORGANIZATION_NAME,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        `Organization "${FINTREE_ORGANIZATION_NAME}" was not found.`,
      );
    }

    return organization;
  }

  private validateAndExtractName(
    payload: unknown,
  ): string {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new BadRequestException(
        'A valid request body is required.',
      );
    }

    const body =
      payload as Record<string, unknown>;

    const allowedFields = ['name'];

    const invalidFields =
      Object.keys(body).filter(
        (field) =>
          !allowedFields.includes(field),
      );

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Only the Hub name can be provided. Invalid field(s): ${invalidFields.join(', ')}.`,
      );
    }

    if (typeof body.name !== 'string') {
      throw new BadRequestException(
        'Hub name is required.',
      );
    }

    const name = body.name.trim();

    if (!name) {
      throw new BadRequestException(
        'Hub name is required.',
      );
    }

    if (name.length > 255) {
      throw new BadRequestException(
        'Hub name cannot exceed 255 characters.',
      );
    }

    return name;
  }

  private async ensureUniqueHubName(
    name: string,
    organizationId: number,
    excludeHubId?: number,
  ): Promise<void> {
    const query =
      this.hubRepository
        .createQueryBuilder('hub')
        .innerJoin(
          'hub.organization',
          'organization',
        )
        .where(
          'LOWER(TRIM(hub.name)) = LOWER(:name)',
          {
            name,
          },
        )
        .andWhere(
          'organization.id = :organizationId',
          {
            organizationId,
          },
        );

    if (excludeHubId !== undefined) {
      query.andWhere(
        'hub.id != :excludeHubId',
        {
          excludeHubId,
        },
      );
    }

    const existingHub =
      await query.getOne();

    if (existingHub) {
      throw new ConflictException(
        `A Hub named "${name}" already exists.`,
      );
    }
  }
  private toResponse(
    hub: Hub,
  ): HubResponse {
    return {
      id: Number(hub.id),
      name: hub.name,
      organization:
        hub.organization?.name ||
        FINTREE_ORGANIZATION_NAME,
    };
  }
}