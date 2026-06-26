import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(
    SmsService.name,
  );

  async sendOtp(
    mobile: string,
    otp: string,
  ) {
    const apiUrl = this.getRequiredEnvironment(
      'ALOT_API_URL',
    );

    const smsParams = {
      user: this.getRequiredEnvironment(
        'ALOT_USER',
      ),

      password:
        this.getRequiredEnvironment(
          'ALOT_PASSWORD',
        ),

      senderid:
        this.getRequiredEnvironment(
          'SENDER_ID',
        ),

      channel: 'TRANS',
      DCS: '0',
      flashsms: '0',

      number: mobile,

      text:
        `OTP for mobile number verification is ${otp}. ` +
        `Do not share this OTP with anyone. ` +
        `Thanks & Regards Fintree Finance Private Limited.`,

      route: '5',

      DLTTemplateId:
        this.getRequiredEnvironment(
          'MOBILE_OTP_TEMPLATE_ID',
        ).trim(),

      PEID:
        this.getRequiredEnvironment(
          'DLT_PEID',
        ),
    };

    try {
      const response = await axios.get(
        apiUrl,
        {
          params: smsParams,
          timeout: 15_000,
        },
      );

      this.logger.log(
        `OTP SMS submitted for mobile ending ${mobile.slice(
          -4,
        )}`,
      );

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `OTP SMS provider failed for mobile ending ${mobile.slice(
          -4,
        )}: ${message}`,
      );

      throw new ServiceUnavailableException(
        'Unable to send OTP SMS. Please try again.',
      );
    }
  }

  private getRequiredEnvironment(
    key: string,
  ) {
    const value =
      process.env[key]?.trim();

    if (!value) {
      throw new ServiceUnavailableException(
        `${key} is not configured.`,
      );
    }

    return value;
  }
}