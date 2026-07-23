import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import { Spoke } from '../../auth/entities/spoke.entity';
import type {
  CreateSpokeDto,
  UpdateSpokeDto,
} from './spokes.controller';

export type SpokeResponse = {
  id: number;
  name: string;
  hubId: number;
  hubName: string;
};

@Injectable()
export class SpokesService {
  constructor(
    @InjectRepository(Spoke)
    private readonly spokeRepository:
      Repository<Spoke>,

    @InjectRepository(Hub)
    private readonly hubRepository:
      Repository<Hub>,
  ) {}

  /*
   * Return all Spokes with Hub relation.
   *
   * Search supports:
   * - Spoke name
   * - Hub name
   */
  async findAll(
    search = '',
  ): Promise<SpokeResponse[]> {
    const normalizedSearch =
      String(search ?? '').trim();

    let where:
      | FindOptionsWhere<Spoke>[]
      | undefined;

    if (normalizedSearch) {
      const searchValue =
        `%${normalizedSearch}%`;

      where = [
        {
          name: Like(searchValue),
        },
        {
          hub: {
            name: Like(searchValue),
          },
        },
      ];
    }

    const spokes =
      await this.spokeRepository.find({
        relations: ['hub'],
        where,
        order: {
          id: 'DESC',
        },
      });

    return spokes.map((spoke) =>
      this.toResponse(spoke),
    );
  }

  /*
   * Return one Spoke with Hub relation.
   */
  async findOne(
    id: number,
  ): Promise<SpokeResponse> {
    const spoke =
      await this.findSpokeById(id);

    return this.toResponse(spoke);
  }

  /*
   * Create a Spoke and assign the Hub entity
   * to the ManyToOne relation.
   */
  async create(
    createSpokeDto: CreateSpokeDto,
  ): Promise<SpokeResponse> {
    const name = this.normalizeName(
      createSpokeDto.name,
    );

    const hub = await this.findHubById(
      createSpokeDto.hubId,
    );

    await this.ensureUniqueName(
      name,
      Number(hub.id),
    );

    /*
     * Assign the Hub entity itself.
     * Do not save hubId directly.
     */
    const spoke =
      this.spokeRepository.create({
        name,
        hub,
      });

    const savedSpoke =
      await this.spokeRepository.save(
        spoke,
      );

    /*
     * TypeORM keeps the assigned relation in
     * memory after save, but explicitly assigning
     * it ensures response mapping is safe.
     */
    savedSpoke.hub = hub;

    return this.toResponse(savedSpoke);
  }

  /*
   * Update Spoke name, Hub, or both.
   */
  async update(
    id: number,
    updateSpokeDto: UpdateSpokeDto,
  ): Promise<SpokeResponse> {
    if (
      updateSpokeDto.name === undefined &&
      updateSpokeDto.hubId === undefined
    ) {
      throw new BadRequestException(
        'Provide hubId or name to update the spoke.',
      );
    }

    const spoke =
      await this.findSpokeById(id);

    let targetHub = spoke.hub;

    /*
     * Find and assign the new Hub entity when
     * hubId is provided.
     */
    if (updateSpokeDto.hubId !== undefined) {
      targetHub = await this.findHubById(
        updateSpokeDto.hubId,
      );
    }

    const targetName =
      updateSpokeDto.name !== undefined
        ? this.normalizeName(
            updateSpokeDto.name,
          )
        : spoke.name;

    await this.ensureUniqueName(
      targetName,
      Number(targetHub.id),
      Number(spoke.id),
    );

    spoke.name = targetName;
    spoke.hub = targetHub;

    const savedSpoke =
      await this.spokeRepository.save(
        spoke,
      );

    savedSpoke.hub = targetHub;

    return this.toResponse(savedSpoke);
  }

  /*
   * Find Spoke with Hub relation.
   */
  private async findSpokeById(
    id: number,
  ): Promise<Spoke> {
    const spoke =
      await this.spokeRepository.findOne({
        where: {
          id,
        },
        relations: ['hub'],
      });

    if (!spoke) {
      throw new NotFoundException(
        'Spoke not found',
      );
    }

    if (!spoke.hub) {
      throw new NotFoundException(
        'Hub relation not found for Spoke',
      );
    }

    return spoke;
  }

  /*
   * Find Hub before assigning it to Spoke.
   */
  private async findHubById(
    hubId: number,
  ): Promise<Hub> {
    const hub =
      await this.hubRepository.findOne({
        where: {
          id: hubId,
        },
      });

    if (!hub) {
      throw new NotFoundException(
        'Hub not found',
      );
    }

    return hub;
  }

  /*
   * Prevent duplicate Spoke names under
   * the same Hub.
   */
  private async ensureUniqueName(
    name: string,
    hubId: number,
    excludeSpokeId?: number,
  ): Promise<void> {
    const query =
      this.spokeRepository
        .createQueryBuilder('spoke')
        .innerJoin('spoke.hub', 'hub')
        .where(
          'LOWER(TRIM(spoke.name)) = LOWER(:name)',
          {
            name,
          },
        )
        .andWhere(
          'hub.id = :hubId',
          {
            hubId,
          },
        );

    if (excludeSpokeId !== undefined) {
      query.andWhere(
        'spoke.id != :excludeSpokeId',
        {
          excludeSpokeId,
        },
      );
    }

    const existingSpoke =
      await query.getOne();

    if (existingSpoke) {
      throw new ConflictException(
        `A spoke named "${name}" already exists under the selected hub.`,
      );
    }
  }

  /*
   * Normalize and validate Spoke name
   * before saving.
   */
  private normalizeName(
    value: string,
  ): string {
    const name = String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ');

    if (!name) {
      throw new BadRequestException(
        'Spoke name is required.',
      );
    }

    if (name.length > 160) {
      throw new BadRequestException(
        'Spoke name must not exceed 160 characters.',
      );
    }

    return name;
  }

  /*
   * Convert entity response into clean API shape.
   */
  private toResponse(
    spoke: Spoke,
  ): SpokeResponse {
    return {
      id: Number(spoke.id),
      name: spoke.name,
      hubId: Number(spoke.hub.id),
      hubName: spoke.hub.name,
    };
  }
}