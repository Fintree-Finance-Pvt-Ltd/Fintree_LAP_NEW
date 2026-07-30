import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InjectRepository,
} from '@nestjs/typeorm';
import {
  Repository,
} from 'typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import type { Spoke } from '../../auth/entities/spoke.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

const FINTREE_ORGANIZATION_NAME =
  'Fintree Finance';

/*
 * Role aliases used only for Administration
 * aggregation.
 *
 * Matching is performed against both:
 * - roles.code
 * - roles.name
 *
 * Underscores and hyphens are normalized.
 */
const ADMINISTRATION_ROLE_ALIASES = {
  ASM: [
    'ASM',
    'AREA SALES MANAGER',
  ],

  ACM: [
    'ACM',
    'AREA CREDIT MANAGER',
  ],
} as const;

type HubResponse = {
  id: number;
  name: string;
  organization: string;
};

type AdministrationUserResponse = {
  id: number;
  name: string;
  email: string;
  location: string;
};

type LinkedSpokeResponse = {
  id: number;
  name: string;
};

export type HubAdministrationResponse = {
  id: number;
  name: string;
  organization: string;

  /*
   * UI-ready values.
   *
   * The frontend does not need to join names
   * or calculate counts.
   */
  asm: string;
  acm: string;

  asmCount: number;
  acmCount: number;

  linkedSpokesCount: number;
  creditTeamCount: number;
  operationsCount: number;

  linkedSpokes: LinkedSpokeResponse[];

  /*
   * Included for future details/modals.
   * These are already filtered by the backend.
   */
  asmUsers: AdministrationUserResponse[];
  acmUsers: AdministrationUserResponse[];
};

@Injectable()
export class HubService {
  constructor(
    @InjectRepository(Hub)
    private readonly hubRepository:
      Repository<Hub>,

    @InjectRepository(Organization)
    private readonly organizationRepository:
      Repository<Organization>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) { }

  async findAll(
    searchValue: unknown = '',
  ): Promise<HubResponse[]> {
    const search =
      typeof searchValue === 'string'
        ? searchValue
          .trim()
          .toLowerCase()
        : '';

    const query =
      this.hubRepository
        .createQueryBuilder('hub')
        .leftJoinAndSelect(
          'hub.organization',
          'organization',
        )
        .orderBy(
          'hub.id',
          'DESC',
        );

    if (search) {
      query.andWhere(
        'LOWER(hub.name) LIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const hubs =
      await query.getMany();

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

  /*
   * GET /hubs/administration
   *
   * User mapping:
   *
   * users.location
   *      ↓
   * spokes.name
   *      ↓
   * spokes.hub
   *
   * No aggregation is required on the frontend.
   */
  async getAdministrationData() {
    const [
      hubs,
      activeUsers,
    ] = await Promise.all([
      this.hubRepository
        .createQueryBuilder('hub')
        .leftJoinAndSelect(
          'hub.organization',
          'organization',
        )
        .leftJoinAndSelect(
          'hub.spokes',
          'spoke',
        )
        .orderBy(
          'hub.name',
          'ASC',
        )
        .addOrderBy(
          'spoke.name',
          'ASC',
        )
        .getMany(),

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
     * Group active users by their normalized
     * location so they can be matched against
     * Spoke names efficiently.
     */
    const usersByLocation =
      this.groupUsersByLocation(
        activeUsers,
      );

    const data:
      HubAdministrationResponse[] =
      hubs.map((hub) => {
        const linkedSpokes =
          hub.spokes ?? [];

        /*
         * Fetch all users whose location matches
         * any Spoke belonging to the current Hub.
         */
        const directHubUsers =
          usersByLocation.get(
            this.normalizeLocation(
              hub.name,
            ),
          ) ?? [];

        const linkedSpokeUsers =
          this.getUsersForSpokes(
            linkedSpokes,
            usersByLocation,
          );

        const hubUsers =
          this.mergeUniqueUsers([
            ...directHubUsers,
            ...linkedSpokeUsers,
          ]);

        const asmUsers =
          hubUsers.filter((user) =>
            this.userHasAnyRole(
              user,
              ADMINISTRATION_ROLE_ALIASES
                .ASM,
            ),
          );

        const acmUsers =
          hubUsers.filter((user) =>
            this.userHasAnyRole(
              user,
              ADMINISTRATION_ROLE_ALIASES
                .ACM,
            ),
          );

        /*
         * Credit team includes roles whose code
         * or name contains "CREDIT", along with
         * common abbreviated roles such as CM
         * and ACM.
         */
        const creditTeamUsers =
          hubUsers.filter((user) =>
            this.isCreditTeamUser(
              user,
            ),
          );

        /*
         * Operations team includes roles whose
         * code/name contains OPERATION or uses
         * common OPS abbreviations.
         */
        const operationsUsers =
          hubUsers.filter((user) =>
            this.isOperationsUser(
              user,
            ),
          );

        return {
          id:
            Number(hub.id),

          name:
            hub.name,

          organization:
            hub.organization?.name ||
            FINTREE_ORGANIZATION_NAME,

          /*
           * The UI can display these values
           * directly without joining names.
           */
          asm:
            this.formatUserNames(
              asmUsers,
            ),

          acm:
            this.formatUserNames(
              acmUsers,
            ),

          asmCount:
            asmUsers.length,

          acmCount:
            acmUsers.length,

          linkedSpokesCount:
            linkedSpokes.length,

          creditTeamCount:
            creditTeamUsers.length,

          operationsCount:
            operationsUsers.length,

          linkedSpokes:
            linkedSpokes.map(
              (spoke) => ({
                id:
                  Number(spoke.id),

                name:
                  spoke.name,
              }),
            ),

          asmUsers:
            this.toAdministrationUsers(
              asmUsers,
            ),

          acmUsers:
            this.toAdministrationUsers(
              acmUsers,
            ),
        };
      });

    return {
      success: true,
      message:
        'Hub administration data fetched successfully.',
      data,
    };
  }

  async create(
    payload: unknown,
  ) {
    const name =
      this.validateAndExtractName(
        payload,
      );

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
      await this.hubRepository.save(
        hub,
      );

    savedHub.organization =
      organization;

    return {
      success: true,
      message:
        'Hub created successfully.',
      data:
        this.toResponse(savedHub),
    };
  }

  async update(
    id: number,
    payload: unknown,
  ) {
    const name =
      this.validateAndExtractName(
        payload,
      );

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
      await this.hubRepository.save(
        hub,
      );

    return {
      success: true,
      message:
        'Hub updated successfully.',
      data:
        this.toResponse(savedHub),
    };
  }

  /*
   * Normalize Hub/Spoke/User location values.
   *
   * Examples:
   * " Delhi  Spoke " → "delhi spoke"
   * "DELHI SPOKE"    → "delhi spoke"
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
   * Normalize Role codes and names.
   *
   * Examples:
   * "CREDIT_MAKER" → "CREDIT MAKER"
   * "ops-checker"  → "OPS CHECKER"
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
   * Group users by users.location.
   */
  private groupUsersByLocation(
    users: User[],
  ): Map<string, User[]> {
    const usersByLocation =
      new Map<string, User[]>();

    for (const user of users) {
      const location =
        this.normalizeLocation(
          user.location,
        );

      if (!location) {
        continue;
      }

      const existingUsers =
        usersByLocation.get(
          location,
        ) ?? [];

      existingUsers.push(user);

      usersByLocation.set(
        location,
        existingUsers,
      );
    }

    return usersByLocation;
  }

  /*
   * Return users belonging to all Spokes
   * associated with one Hub.
   */
  private getUsersForSpokes(
    spokes: Spoke[],
    usersByLocation:
      Map<string, User[]>,
  ): User[] {
    const uniqueUsers =
      new Map<number, User>();

    for (const spoke of spokes) {
      const normalizedSpokeName =
        this.normalizeLocation(
          spoke.name,
        );

      const spokeUsers =
        usersByLocation.get(
          normalizedSpokeName,
        ) ?? [];

      for (const user of spokeUsers) {
        uniqueUsers.set(
          Number(user.id),
          user,
        );
      }
    }

    return Array.from(
      uniqueUsers.values(),
    );
  }

  /*
   * Compare aliases against both:
   * - role.code
   * - role.name
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
   * Return all normalized role code/name values
   * assigned to a user.
   */
  private getUserRoleValues(
    user: User,
  ): string[] {
    const roleValues =
      new Set<string>();

    for (
      const role of
      user.roles ?? []
    ) {
      const code =
        this.normalizeRoleValue(
          role.code,
        );

      const name =
        this.normalizeRoleValue(
          role.name,
        );

      if (code) {
        roleValues.add(code);
      }

      if (name) {
        roleValues.add(name);
      }
    }

    return Array.from(
      roleValues,
    );
  }

  /*
   * Determine whether a user belongs to
   * the Credit team.
   */
  private isCreditTeamUser(
    user: User,
  ): boolean {
    const roleValues =
      this.getUserRoleValues(user);

    return roleValues.some(
      (roleValue) =>
        roleValue.includes(
          'CREDIT',
        ) ||
        roleValue === 'CM' ||
        roleValue === 'ACM' ||
        roleValue ===
        'CREDIT MANAGER' ||
        roleValue ===
        'AREA CREDIT MANAGER',
    );
  }

  /*
   * Determine whether a user belongs to
   * the Operations team.
   */
  private isOperationsUser(
    user: User,
  ): boolean {
    const roleValues =
      this.getUserRoleValues(user);

    return roleValues.some(
      (roleValue) =>
        roleValue.includes(
          'OPERATION',
        ) ||
        roleValue === 'OPS' ||
        roleValue.startsWith(
          'OPS ',
        ),
    );
  }

  /*
   * Return a UI-ready value.
   *
   * One ASM:
   * "Aditi Sharma"
   *
   * Multiple ASMs:
   * "Aditi Sharma, Rohan Mehta"
   *
   * No ASM:
   * "Not Assigned"
   */
  private formatUserNames(
    users: User[],
  ): string {
    if (!users.length) {
      return 'Not Assigned';
    }

    return users
      .map((user) =>
        user.name.trim(),
      )
      .filter(Boolean)
      .sort((first, second) =>
        first.localeCompare(
          second,
        ),
      )
      .join(', ');
  }

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

  private mergeUniqueUsers(
    users: User[],
  ): User[] {
    const uniqueUsers =
      new Map<number, User>();

    for (const user of users) {
      uniqueUsers.set(
        Number(user.id),
        user,
      );
    }

    return Array.from(
      uniqueUsers.values(),
    );
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
      await this
        .organizationRepository
        .findOne({
          where: {
            name:
              FINTREE_ORGANIZATION_NAME,
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
      payload as Record<
        string,
        unknown
      >;

    const allowedFields = [
      'name',
    ];

    const invalidFields =
      Object.keys(body).filter(
        (field) =>
          !allowedFields.includes(
            field,
          ),
      );

    if (
      invalidFields.length > 0
    ) {
      throw new BadRequestException(
        `Only the Hub name can be provided. Invalid field(s): ${invalidFields.join(', ')}.`,
      );
    }

    if (
      typeof body.name !==
      'string'
    ) {
      throw new BadRequestException(
        'Hub name is required.',
      );
    }

    const name =
      body.name.trim();

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

    if (
      excludeHubId !==
      undefined
    ) {
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
      id:
        Number(hub.id),

      name:
        hub.name,

      organization:
        hub.organization?.name ||
        FINTREE_ORGANIZATION_NAME,
    };
  }
}