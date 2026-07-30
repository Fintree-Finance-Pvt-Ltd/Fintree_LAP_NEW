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
import { User } from '../../users/entities/user.entity';

import type {
  CreateSpokeDto,
  UpdateSpokeDto,
} from './spokes.controller';

const ADMINISTRATION_ROLE_ALIASES = {
  BM: [
    'BM',
    'BRANCH MANAGER',
  ],

  CM: [
    'CM',
    'CREDIT MANAGER',
  ],

  RM: [
    'RM',
    'RELATIONSHIP MANAGER',
  ],
} as const;

export type SpokeResponse = {
  id: number;
  name: string;
  hubId: number;
  hubName: string;
};

type AdministrationUserResponse = {
  id: number;
  name: string;
  email: string;
  location: string;
};

export type SpokeAdministrationResponse = {
  id: number;
  name: string;

  hubId: number;
  hubName: string;

  bmCount: number;
  cmCount: number;
  rmCount: number;

  coverageRadiusKm: number | null;

  bmUsers: AdministrationUserResponse[];
  cmUsers: AdministrationUserResponse[];
  rmUsers: AdministrationUserResponse[];
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

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) {}

  /*
   * Return all Spokes with Hub relation.
   *
   * Existing functionality remains unchanged.
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
   *
   * Existing functionality remains unchanged.
   */
  async findOne(
    id: number,
  ): Promise<SpokeResponse> {
    const spoke =
      await this.findSpokeById(id);

    return this.toResponse(spoke);
  }

  /*
   * GET /api/spokes/administration
   *
   * User-to-Spoke mapping:
   *
   * users.location
   *       ↓
   * spokes.name
   *       ↓
   * spokes.hub
   *
   * No User table modification is required.
   *
   * All role counting is performed here.
   * React only displays the returned values.
   */
  async getAdministrationData() {
    const [
      spokes,
      activeUsers,
    ] = await Promise.all([
      this.spokeRepository.find({
        relations: ['hub'],
        order: {
          name: 'ASC',
        },
      }),

      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect(
          'user.roles',
          'role',
        )
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.location',
          'user.isActive',

          'role.id',
          'role.code',
          'role.name',
        ])
        .where(
          'user.isActive = :isActive',
          {
            isActive: true,
          },
        )
        .orderBy(
          'user.name',
          'ASC',
        )
        .getMany(),
    ]);

    /*
     * Group users once by normalized location.
     *
     * This avoids repeatedly searching all users
     * for every Spoke.
     */
    const usersByLocation =
      this.groupUsersByLocation(
        activeUsers,
      );

    const data:
      SpokeAdministrationResponse[] =
        spokes.map((spoke) => {
          const normalizedSpokeName =
            this.normalizeLocation(
              spoke.name,
            );

          /*
           * users.location must match
           * the current Spoke name.
           */
          const spokeUsers =
            usersByLocation.get(
              normalizedSpokeName,
            ) ?? [];

          const bmUsers =
            spokeUsers.filter((user) =>
              this.userHasAnyRole(
                user,
                ADMINISTRATION_ROLE_ALIASES
                  .BM,
              ),
            );

          const cmUsers =
            spokeUsers.filter((user) =>
              this.userHasAnyRole(
                user,
                ADMINISTRATION_ROLE_ALIASES
                  .CM,
              ),
            );

          const rmUsers =
            spokeUsers.filter((user) =>
              this.userHasAnyRole(
                user,
                ADMINISTRATION_ROLE_ALIASES
                  .RM,
              ),
            );

          return {
            id:
              Number(spoke.id),

            name:
              spoke.name,

            hubId:
              Number(spoke.hub.id),

            hubName:
              spoke.hub.name,

            /*
             * UI-ready counts.
             *
             * React should display these directly.
             */
            bmCount:
              bmUsers.length,

            cmCount:
              cmUsers.length,

            rmCount:
              rmUsers.length,

            /*
             * Coverage radius is not present
             * in the current Spoke entity/table.
             */
            coverageRadiusKm:
              null,

            /*
             * Already filtered user details.
             *
             * These can be used later for
             * tooltips, modals or detailed views.
             */
            bmUsers:
              this.toAdministrationUsers(
                bmUsers,
              ),

            cmUsers:
              this.toAdministrationUsers(
                cmUsers,
              ),

            rmUsers:
              this.toAdministrationUsers(
                rmUsers,
              ),
          };
        });

    return {
      success: true,
      message:
        'Spoke administration data fetched successfully.',
      data,
    };
  }

  /*
   * Create a Spoke and assign the Hub entity.
   *
   * Existing functionality remains unchanged.
   */
  async create(
    createSpokeDto: CreateSpokeDto,
  ): Promise<SpokeResponse> {
    const name =
      this.normalizeName(
        createSpokeDto.name,
      );

    const hub =
      await this.findHubById(
        createSpokeDto.hubId,
      );

    await this.ensureUniqueName(
      name,
      Number(hub.id),
    );

    const spoke =
      this.spokeRepository.create({
        name,
        hub,
      });

    const savedSpoke =
      await this.spokeRepository.save(
        spoke,
      );

    savedSpoke.hub = hub;

    return this.toResponse(
      savedSpoke,
    );
  }

  /*
   * Update Spoke name, Hub, or both.
   *
   * Existing functionality remains unchanged.
   */
  async update(
    id: number,
    updateSpokeDto: UpdateSpokeDto,
  ): Promise<SpokeResponse> {
    if (
      updateSpokeDto.name ===
        undefined &&
      updateSpokeDto.hubId ===
        undefined
    ) {
      throw new BadRequestException(
        'Provide hubId or name to update the spoke.',
      );
    }

    const spoke =
      await this.findSpokeById(id);

    let targetHub =
      spoke.hub;

    if (
      updateSpokeDto.hubId !==
      undefined
    ) {
      targetHub =
        await this.findHubById(
          updateSpokeDto.hubId,
        );
    }

    const targetName =
      updateSpokeDto.name !==
      undefined
        ? this.normalizeName(
            updateSpokeDto.name,
          )
        : spoke.name;

    await this.ensureUniqueName(
      targetName,
      Number(targetHub.id),
      Number(spoke.id),
    );

    spoke.name =
      targetName;

    spoke.hub =
      targetHub;

    const savedSpoke =
      await this.spokeRepository.save(
        spoke,
      );

    savedSpoke.hub =
      targetHub;

    return this.toResponse(
      savedSpoke,
    );
  }

  /*
   * Normalize users.location and spokes.name
   * before comparing them.
   *
   * Examples:
   *
   * " Andheri  Spoke " → "andheri spoke"
   * "ANDHERI SPOKE"    → "andheri spoke"
   */
  private normalizeLocation(
    value: unknown,
  ): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /*
   * Normalize role code or role name.
   *
   * Examples:
   *
   * "BRANCH_MANAGER" → "BRANCH MANAGER"
   * "branch-manager" → "BRANCH MANAGER"
   */
  private normalizeRoleValue(
    value: unknown,
  ): string {
    return String(value ?? '')
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  /*
   * Group active users using users.location.
   */
  private groupUsersByLocation(
    users: User[],
  ): Map<string, User[]> {
    const usersByLocation =
      new Map<string, User[]>();

    for (const user of users) {
      const normalizedLocation =
        this.normalizeLocation(
          user.location,
        );

      if (!normalizedLocation) {
        continue;
      }

      const existingUsers =
        usersByLocation.get(
          normalizedLocation,
        ) ?? [];

      existingUsers.push(user);

      usersByLocation.set(
        normalizedLocation,
        existingUsers,
      );
    }

    return usersByLocation;
  }

  /*
   * Check the user's roles against both:
   *
   * - role.code
   * - role.name
   *
   * This supports databases where role codes
   * and display names are different.
   */
  private userHasAnyRole(
    user: User,
    expectedRoles:
      readonly string[],
  ): boolean {
    const normalizedExpectedRoles =
      new Set(
        expectedRoles.map((role) =>
          this.normalizeRoleValue(
            role,
          ),
        ),
      );

    return (user.roles ?? []).some(
      (role) => {
        const normalizedCode =
          this.normalizeRoleValue(
            role.code,
          );

        const normalizedName =
          this.normalizeRoleValue(
            role.name,
          );

        return (
          normalizedExpectedRoles.has(
            normalizedCode,
          ) ||
          normalizedExpectedRoles.has(
            normalizedName,
          )
        );
      },
    );
  }

  /*
   * Return clean user information without
   * password hashes or unnecessary fields.
   */
  private toAdministrationUsers(
    users: User[],
  ): AdministrationUserResponse[] {
    return users
      .map((user) => ({
        id:
          Number(user.id),

        name:
          user.name,

        email:
          user.email,

        location:
          user.location,
      }))
      .sort((first, second) =>
        first.name.localeCompare(
          second.name,
        ),
      );
  }

  /*
   * Find Spoke with Hub relation.
   *
   * Existing functionality remains unchanged.
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
   *
   * Existing functionality remains unchanged.
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
   *
   * Existing functionality remains unchanged.
   */
  private async ensureUniqueName(
    name: string,
    hubId: number,
    excludeSpokeId?: number,
  ): Promise<void> {
    const query =
      this.spokeRepository
        .createQueryBuilder('spoke')
        .innerJoin(
          'spoke.hub',
          'hub',
        )
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

    if (
      excludeSpokeId !==
      undefined
    ) {
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
   * Normalize and validate Spoke name.
   *
   * Existing functionality remains unchanged.
   */
  private normalizeName(
    value: string,
  ): string {
    const name =
      String(value ?? '')
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
   * Convert entity into existing API shape.
   *
   * Existing functionality remains unchanged.
   */
  private toResponse(
    spoke: Spoke,
  ): SpokeResponse {
    return {
      id:
        Number(spoke.id),

      name:
        spoke.name,

      hubId:
        Number(spoke.hub.id),

      hubName:
        spoke.hub.name,
    };
  }
}