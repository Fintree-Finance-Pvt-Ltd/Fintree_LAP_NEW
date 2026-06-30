import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ApplicationGeoLocation,
  GeoLocationType,
} from './entities/geo-location.entity';

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(ApplicationGeoLocation)
    private readonly geoLocationRepository:
      Repository<ApplicationGeoLocation>,
  ) {}

  private validateApplicationId(
    applicationId: number,
  ): void {
    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      throw new BadRequestException(
        'Invalid application ID.',
      );
    }
  }

  private parseLocationType(
    value: unknown,
  ): GeoLocationType {
    const locationType = String(value || '')
      .trim()
      .toUpperCase() as GeoLocationType;

    if (
      !Object.values(GeoLocationType).includes(
        locationType,
      )
    ) {
      throw new BadRequestException(
        'Location type must be RESIDENCE, BUSINESS, or PROPERTY.',
      );
    }

    return locationType;
  }

  private parseLatitude(value: unknown): number {
    const latitude = Number(value);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new BadRequestException(
        'Invalid latitude.',
      );
    }

    return latitude;
  }

  private parseLongitude(value: unknown): number {
    const longitude = Number(value);

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'Invalid longitude.',
      );
    }

    return longitude;
  }

  private parseAccuracy(
    value: unknown,
  ): number | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }

    const accuracy = Number(value);

    if (
      !Number.isFinite(accuracy) ||
      accuracy < 0
    ) {
      throw new BadRequestException(
        'Invalid location accuracy.',
      );
    }

    return accuracy;
  }

  async saveLiveLocation(
    applicationId: number,
    body: {
      locationType?: string;
      latitude?: number | string;
      longitude?: number | string;
      accuracyMeters?: number | string;
      gpsAddress?: string;
    },
  ) {
    this.validateApplicationId(applicationId);

    const locationType =
      this.parseLocationType(
        body?.locationType,
      );

    const latitude = this.parseLatitude(
      body?.latitude,
    );

    const longitude = this.parseLongitude(
      body?.longitude,
    );

    const accuracyMeters =
      this.parseAccuracy(
        body?.accuracyMeters,
      );

    const gpsAddress =
      String(body?.gpsAddress || '').trim() ||
      null;

    let location =
      await this.geoLocationRepository.findOne({
        where: {
          applicationId,
          locationType,
        },
      });

    if (location) {
      location.latitude =
        latitude.toFixed(7);

      location.longitude =
        longitude.toFixed(7);

      location.accuracyMeters =
        accuracyMeters !== null
          ? accuracyMeters.toFixed(2)
          : null;

      location.gpsAddress = gpsAddress;
      location.capturedAt = new Date();
    } else {
      location =
        this.geoLocationRepository.create({
          applicationId,
          locationType,
          latitude: latitude.toFixed(7),
          longitude: longitude.toFixed(7),

          accuracyMeters:
            accuracyMeters !== null
              ? accuracyMeters.toFixed(2)
              : null,

          gpsAddress,
          capturedAt: new Date(),
        });
    }

    const saved =
      await this.geoLocationRepository.save(
        location,
      );

    return {
      success: true,
      message: `${locationType} location captured successfully.`,
      data: {
        id: saved.id,
        applicationId:
          saved.applicationId,
        locationType:
          saved.locationType,
        latitude: Number(
          saved.latitude,
        ),
        longitude: Number(
          saved.longitude,
        ),
        accuracyMeters:
          saved.accuracyMeters !== null &&
          saved.accuracyMeters !== undefined
            ? Number(
                saved.accuracyMeters,
              )
            : null,
        gpsAddress:
          saved.gpsAddress || null,
        capturedAt:
          saved.capturedAt,
      },
    };
  }

  async getLiveLocations(
    applicationId: number,
  ) {
    this.validateApplicationId(applicationId);

    const locations =
      await this.geoLocationRepository.find({
        where: {
          applicationId,
        },
        order: {
          updatedAt: 'DESC',
        },
      });

    return {
      success: true,
      message:
        'Geo locations fetched successfully.',
      data: locations.map(
        (location) => ({
          id: location.id,
          applicationId:
            location.applicationId,
          locationType:
            location.locationType,
          latitude: Number(
            location.latitude,
          ),
          longitude: Number(
            location.longitude,
          ),
          accuracyMeters:
            location.accuracyMeters !==
              null &&
            location.accuracyMeters !==
              undefined
              ? Number(
                  location.accuracyMeters,
                )
              : null,
          gpsAddress:
            location.gpsAddress || null,
          capturedAt:
            location.capturedAt,
        }),
      ),
    };
  }
}