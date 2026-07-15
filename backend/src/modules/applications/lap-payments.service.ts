import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { DataSource } from 'typeorm';

import {
   createLapEasyCollectLink,
  extractLapEasebuzzId,
  extractLapEasebuzzWebhookIds,
  extractLapPaymentLink,
  normalizeLapEasebuzzStatus,

} from '../../integrations/easebuzz.integration';

@Injectable()
export class LapPaymentsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

//   async createPaymentLink(
//     applicationId: number,
//     body: any,
//     actor: any,
//   ) {
//     const amount = Number(body?.amount);
//     const purpose = body?.purpose || 'LOGIN_FEE';

//     if (!applicationId) {
//       throw new BadRequestException(
//         'Application ID is required.',
//       );
//     }

//     if (!amount || amount <= 0) {
//       throw new BadRequestException(
//         'Valid payment amount is required.',
//       );
//     }

//     const applicationRows = await this.dataSource.query(
//       `
//         SELECT
//           id,
//           application_number AS applicationNumber,
//           customer_name AS customerName,
//           mobile,
//           email
//         FROM applications
//         WHERE id = ?
//         LIMIT 1
//       `,
//       [applicationId],
//     );

//     if (!applicationRows.length) {
//       throw new NotFoundException(
//         'Application not found.',
//       );
//     }

//     const application = applicationRows[0];

//     if (!application.mobile) {
//       throw new BadRequestException(
//         'Customer mobile number is missing.',
//       );
//     }

//     const existingRows = await this.dataSource.query(
//       `
//         SELECT
//           id,
//           txnid,
//           payment_link AS paymentLink,
//           status,
//           sms_status AS smsStatus,
//           amount
//         FROM lap_payment_links
//         WHERE application_id = ?
//           AND purpose = ?
//           AND status IN ('CREATED', 'SENT', 'PROCESSING')
//         ORDER BY id DESC
//         LIMIT 1
//       `,
//       [applicationId, purpose],
//     );

//     if (
//       existingRows.length &&
//       existingRows[0].paymentLink
//     ) {
//       return {
//         success: true,
//         message:
//           'Active payment link already exists for this application.',
//         data: {
//           applicationId,
//           txnid: existingRows[0].txnid,
//           amount: Number(existingRows[0].amount),
//           paymentLink: existingRows[0].paymentLink,
//           status: existingRows[0].status,
//           smsStatus: existingRows[0].smsStatus,
//         },
//       };
//     }

//     const txnid = `LAP-${applicationId}-${Date.now()}`;

// const paymentObject = {
//   applicationId,
//   applicationNumber: application.applicationNumber,
//   customerName: application.customerName,
//   mobile: application.mobile,
//   email:
//     application.email ||
//     'noemail@fintreefinance.com',
//   amount,
//   purpose,
//   merchantTxn: txnid,
// };

//     let responseData: any = null;
//     let paymentLink: string | null = null;
//     let easebuzzId: string | null = null;

//     try {
//   responseData = await createLapEasyCollectLink({
//     applicationId,
//     applicationNumber:
//       application.applicationNumber,
//     customerName: application.customerName,
//     mobile: application.mobile,
//     email: application.email || null,
//     amount,
//     purpose,
//     merchantTxn: txnid,
//   });

//   paymentLink =
//     extractLapPaymentLink(responseData);

//   easebuzzId =
//     extractLapEasebuzzId(responseData);

//       console.log('LAP EasyCollect full response:', JSON.stringify(responseData, null, 2));
//   console.log('Extracted paymentLink:', paymentLink);
//   console.log('Extracted easebuzzId:', easebuzzId);

// } catch (error: any) {
//    console.error('LAP EasyCollect create failed:', {
//     message: error?.message,
//     response: error?.response?.data,
//   });

//   responseData = {
//     success: false,
//     message:
//       error?.message ||
//       'LAP EasyCollect payment link creation failed.',
//   };
// }
// console.log('Inserting LAP payment link row:', {
//   applicationId,
//   applicationNumber: application.applicationNumber,
//   customerName: application.customerName,
//   mobile: application.mobile,
//   purpose,
//   amount,
//   txnid,
//   easebuzzId,
//   paymentLink,
// });
//     await this.dataSource.query(
//       `
//         INSERT INTO lap_payment_links
//         (
//           application_id,
//           application_number,
//           customer_name,
//           mobile,
//           email,
//           purpose,
//           amount,
//           txnid,
//           easebuzz_id,
//           payment_link,
//           status,
//           sms_status,
//           raw_request,
//           raw_create_response,
//           created_by,
//           updated_by
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_SENT', ?, ?, ?, ?)
//       `,
//       [
//         applicationId,
//         application.applicationNumber,
//         application.customerName,
//         application.mobile,
//         application.email || null,
//         purpose,
//         amount,
//         txnid,
//         easebuzzId ? String(easebuzzId) : null,
//         paymentLink,
//         paymentLink ? 'CREATED' : 'FAILED',
//         JSON.stringify(paymentObject),
//         JSON.stringify(responseData || {}),
//         actor?.id || null,
//         actor?.id || null,
//       ],
//     );

//     // if (!paymentLink) {
//     //   throw new BadRequestException(
//     //     'Payment link not received from Easebuzz.',
//     //   );
//     // }
//       if (!paymentLink) {
//   console.error('Payment link not received from Easebuzz:', {
//     txnid,
//     responseData,
//   });

//   return {
//     success: false,
//     message: 'Payment link not received from Easebuzz.',
//     debug: {
//       txnid,
//       responseData,
//     },
//   };
// }

//     let smsSent = false;
//     let smsError: string | null = null;

//     try {
//       smsSent = await this.sendPaymentLinkSms({
//         contactNumber: application.mobile,
//         customerName: application.customerName,
//         amount,
//         paymentLink,
//         applicationNumber:
//           application.applicationNumber,
//       });
//     } catch (error: any) {
//       smsError =
//         error?.message ||
//         'Payment link SMS sending failed.';
//     }

//     await this.dataSource.query(
//       `
//         UPDATE lap_payment_links
//         SET
//           status = ?,
//           sms_status = ?,
//           updated_by = ?
//         WHERE txnid = ?
//       `,
//       [
//         smsSent ? 'SENT' : 'CREATED',
//         smsSent ? 'SENT' : 'FAILED',
//         actor?.id || null,
//         txnid,
//       ],
//     );

//     return {
//       success: true,
//       message: smsSent
//         ? 'Payment link created and sent to customer.'
//         : 'Payment link created but SMS failed.',
//       data: {
//         applicationId,
//         applicationNumber:
//           application.applicationNumber,
//         txnid,
//         amount,
//         paymentLink,
//         smsSent,
//         smsError,
//       },
//     };
//   }


async createPaymentLink(
  applicationId: number,
  body: any,
  actor: any,
) {
  try {
    const amount = Number(body?.amount);
    const purpose = body?.purpose || 'LOGIN_FEE';

    console.log('CREATE PAYMENT LINK START:', {
      applicationId,
      body,
      amount,
      purpose,
    });

    if (!applicationId) {
      return {
        success: false,
        message: 'Application ID is required.',
      };
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        message: 'Valid payment amount is required.',
      };
    }

    // const applicationRows = await this.dataSource.query(
    //   `
    //     SELECT
    //       id,
    //       application_id AS applicationNumber,
    //       first_name AS customerName,
    //       mobile,
    //       email
    //     FROM customer_profiles
    //     WHERE id = ?
    //     LIMIT 1
    //   `,
    //   [applicationId],
    // );

    const applicationRows = await this.dataSource.query(
  `
    SELECT
      cp.application_id AS applicationId,
      a.application_number AS applicationNumber,
      COALESCE(
        NULLIF(
          TRIM(
            CONCAT(
              COALESCE(cp.first_name, ''),
              ' ',
              COALESCE(cp.middle_name, ''),
              ' ',
              COALESCE(cp.last_name, '')
            )
          ),
          ''
        ),
        a.customer_name
      ) AS customerName,
      COALESCE(cp.mobile, a.mobile) AS mobile,
      cp.email AS email
    FROM customer_profiles cp
    INNER JOIN applications a
      ON a.id = cp.application_id
    WHERE cp.application_id = ?
    LIMIT 1
  `,
  [applicationId],
);
    console.log('APPLICATION ROWS:', applicationRows);

    if (!applicationRows.length) {
      return {
        success: false,
        message: 'Application not found.',
      };
    }

    const application = applicationRows[0];

    if (!application.mobile) {
      return {
        success: false,
        message: 'Customer mobile number is missing.',
        debug: {
          application,
        },
      };
    }

    const existingRows = await this.dataSource.query(
      `
        SELECT
          id,
          txnid,
          payment_link AS paymentLink,
          status,
          sms_status AS smsStatus,
          amount
        FROM lap_payment_links
        WHERE application_id = ?
          AND purpose = ?
          AND status IN ('CREATED', 'SENT', 'PROCESSING')
        ORDER BY id DESC
        LIMIT 1
      `,
      [applicationId, purpose],
    );

    console.log('EXISTING PAYMENT ROWS:', existingRows);

    // if (
    //   existingRows.length &&
    //   existingRows[0].paymentLink
    // ) {
    //   return {
    //     success: true,
    //     message:
    //       'Active payment link already exists for this application.',
    //     data: {
    //       applicationId,
    //       txnid: existingRows[0].txnid,
    //       amount: Number(existingRows[0].amount),
    //       paymentLink: existingRows[0].paymentLink,
    //       status: existingRows[0].status,
    //       smsStatus: existingRows[0].smsStatus,
    //     },
    //   };
    // }

if (
  existingRows.length &&
  existingRows[0].paymentLink
) {
  await this.dataSource.query(
    `
      UPDATE lap_payment_links
      SET
        status = 'SENT',
        sms_status = 'SENT',
        updated_by = ?
      WHERE id = ?
    `,
    [
      actor?.id || null,
      existingRows[0].id,
    ],
  );

  return {
    success: true,
    message:
      'Active payment link already exists. SMS will be handled by Easebuzz.',
    data: {
      applicationId,
      txnid: existingRows[0].txnid,
      amount: Number(existingRows[0].amount),
      paymentLink: existingRows[0].paymentLink,
      status: 'SENT',
      smsStatus: 'SENT',
      smsSentBy: 'EASEBUZZ',
    },
  };
}

    const txnid = `LAP-${applicationId}-${Date.now()}`;

    const paymentObject = {
      applicationId,
      applicationNumber: application.applicationNumber,
      customerName: application.customerName,
      mobile: application.mobile,
      email:
        application.email ||
        'noemail@fintreefinance.com',
      amount,
      purpose,
      merchantTxn: txnid,
    };

    let responseData: any = null;
    let paymentLink: string | null = null;
    let easebuzzId: string | null = null;

    try {
      console.log('CALLING LAP EASYCOLLECT:', paymentObject);

      responseData =
        await createLapEasyCollectLink({
          applicationId,
          applicationNumber:
            application.applicationNumber,
          customerName: application.customerName,
          mobile: application.mobile,
          email: application.email || null,
          amount,
          purpose,
          merchantTxn: txnid,
        });

      console.log(
        'LAP EASYCOLLECT RESPONSE:',
        JSON.stringify(responseData, null, 2),
      );

      paymentLink =
        extractLapPaymentLink(responseData);

      easebuzzId =
        extractLapEasebuzzId(responseData);

      console.log('EXTRACTED PAYMENT DATA:', {
        paymentLink,
        easebuzzId,
      });
    } catch (error: any) {
      console.error('LAP EASYCOLLECT ERROR:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
      });

      responseData = {
        success: false,
        message:
          error?.message ||
          'LAP EasyCollect payment link creation failed.',
        response: error?.response?.data || null,
      };
    }

    console.log('INSERTING LAP PAYMENT LINK:', {
      applicationId,
      txnid,
      paymentLink,
      easebuzzId,
      responseData,
    });

    await this.dataSource.query(
      `
        INSERT INTO lap_payment_links
        (
          application_id,
          application_number,
          customer_name,
          mobile,
          email,
          purpose,
          amount,
          txnid,
          easebuzz_id,
          payment_link,
          status,
          sms_status,
          raw_request,
          raw_create_response,
          created_by,
          updated_by
        )
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      `,
     [
  applicationId,
  application.applicationNumber,
  application.customerName,
  application.mobile,
  application.email || null,
  purpose,
  amount,
  txnid,
  easebuzzId ? String(easebuzzId) : null,
  paymentLink,
  paymentLink ? 'SENT' : 'FAILED',
  paymentLink ? 'SENT' : 'NOT_SENT',
  JSON.stringify(paymentObject),
  JSON.stringify(responseData || {}),
  actor?.id || null,
  actor?.id || null,
],
    );

    if (!paymentLink) {
      return {
        success: false,
        message:
          'Payment link not received from Easebuzz.',
        debug: {
          txnid,
          responseData,
        },
      };
    }

  return {
  success: true,
  message:
    'Payment link created and SMS sent by Easebuzz.',
  data: {
    applicationId,
    applicationNumber:
      application.applicationNumber,
    txnid,
    amount,
    paymentLink,
    easebuzzId,
    smsSentBy: 'EASEBUZZ',
    smsStatus: 'SENT',
  },
};
  } catch (error: any) {
    console.error('CREATE PAYMENT LINK FINAL ERROR:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      response: error?.response?.data,
    });

    return {
      success: false,
      message:
        error?.message ||
        'Create payment link failed.',
      debug: {
        code: error?.code,
        sqlMessage: error?.sqlMessage,
        response: error?.response?.data,
      },
    };
  }
}
  async handleEasebuzzWebhook(
    body: any,
    headers: any,
  ) {
   const { merchantTxn, easebuzzId } =
  extractLapEasebuzzWebhookIds(body);

const normalizedStatus =
  normalizeLapEasebuzzStatus(body?.status);

    if (!merchantTxn) {
      throw new BadRequestException(
        'Webhook txnid is missing.',
      );
    }

    const existingRows = await this.dataSource.query(
      `
        SELECT
          id,
          status,
          mobile,
          customer_name AS customerName,
          amount,
          application_number AS applicationNumber
        FROM lap_payment_links
        WHERE txnid = ?
        LIMIT 1
      `,
      [merchantTxn],
    );

    const existingPayment =
      existingRows?.[0] || null;

    const webhookPayload = {
      headers,
      body,
    };

    if (!existingPayment) {
      await this.dataSource.query(
        `
          INSERT INTO lap_payment_links
          (
            application_id,
            application_number,
            customer_name,
            mobile,
            email,
            purpose,
            amount,
            txnid,
            easebuzz_id,
            status,
            raw_webhook_response,
            paid_at
          )
          VALUES (?, ?, ?, ?, ?, 'OTHER', ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(body?.udf1 || 0),
          body?.udf2 || null,
          body?.firstname || body?.name || null,
          body?.phone || null,
          body?.email || null,
          body?.amount ? Number(body.amount) : 0,
          merchantTxn,
          easebuzzId ? String(easebuzzId) : null,
          normalizedStatus,
          JSON.stringify(webhookPayload),
          normalizedStatus === 'SUCCESS'
            ? new Date()
            : null,
        ],
      );
    } else {
      await this.dataSource.query(
        `
          UPDATE lap_payment_links
          SET
            status = ?,
            easebuzz_id = COALESCE(?, easebuzz_id),
            raw_webhook_response = ?,
            paid_at = CASE
              WHEN ? = 'SUCCESS' THEN CURRENT_TIMESTAMP(6)
              ELSE paid_at
            END
          WHERE txnid = ?
        `,
        [
          normalizedStatus,
          easebuzzId ? String(easebuzzId) : null,
          JSON.stringify(webhookPayload),
          normalizedStatus,
          merchantTxn,
        ],
      );
    }

    const previousStatus =
      String(existingPayment?.status || '').toUpperCase();

    let paymentSuccessSmsSent = false;
    let paymentSuccessSmsError: string | null = null;

    if (
      normalizedStatus === 'SUCCESS' &&
      previousStatus !== 'SUCCESS'
    ) {
      try {
        paymentSuccessSmsSent =
          await this.sendPaymentSuccessSms({
            contactNumber:
              body?.phone || existingPayment?.mobile,
            amount: body?.amount
              ? Number(body.amount)
              : Number(existingPayment?.amount || 0),
            applicationNumber:
              body?.udf2 ||
              existingPayment?.applicationNumber,
            paymentDate: body?.addedon
              ? String(body.addedon).split(' ')[0]
              : null,
          });
      } catch (error: any) {
        paymentSuccessSmsError =
          error?.message ||
          'Payment success SMS failed.';
      }

      await this.dataSource.query(
        `
          UPDATE lap_payment_links
          SET raw_webhook_response = ?
          WHERE txnid = ?
        `,
        [
          JSON.stringify({
            headers,
            body,
            paymentSuccessSmsSent,
            paymentSuccessSmsError,
          }),
          merchantTxn,
        ],
      );
    }

    return {
      success: true,
      message: 'Easebuzz webhook processed.',
      paymentStatus: normalizedStatus,
      txnid: merchantTxn,
      smsSent: paymentSuccessSmsSent,
      smsError: paymentSuccessSmsError,
    };
  }

  private async sendPaymentLinkSms(input: {
    contactNumber: string;
    customerName: string;
    amount: number;
    paymentLink: string;
    applicationNumber: string;
  }) {
    if (
      !input.contactNumber ||
      !input.amount ||
      !input.paymentLink
    ) {
      return false;
    }

    if (!process.env.SMS_API_URL) {
      return false;
    }

    const message =
      `Dear ${input.customerName || 'Customer'}, ` +
      `please pay ₹${input.amount} for application ${input.applicationNumber} using this secure payment link: ` +
      `${input.paymentLink} - Fintree Finance`;

    await axios.post(
      process.env.SMS_API_URL,
      {
        mobile: input.contactNumber,
        message,
      },
      {
        headers: {
          Authorization: process.env.SMS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      },
    );

    return true;
  }

  private async sendPaymentSuccessSms(input: {
    contactNumber: string;
    amount: number;
    applicationNumber: string;
    paymentDate: string | null;
  }) {
    if (
      !input.contactNumber ||
      !input.amount ||
      !input.applicationNumber
    ) {
      return false;
    }

    if (!process.env.SMS_API_URL) {
      return false;
    }

    const message =
      `Dear Customer, payment of ₹${input.amount} for application ${input.applicationNumber} has been received successfully` +
      `${input.paymentDate ? ` on ${input.paymentDate}` : ''}. - Fintree Finance`;

    await axios.post(
      process.env.SMS_API_URL,
      {
        mobile: input.contactNumber,
        message,
      },
      {
        headers: {
          Authorization: process.env.SMS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      },
    );

    return true;
  }
}