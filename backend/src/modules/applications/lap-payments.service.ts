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
//   async handleEasebuzzWebhook(
//     body: any,
//     headers: any,
//   ) {
//      console.log('Easebuzz LAP webhook received:', {
//     body,
//     headers,
//   });
//       const source = String(body?.udf4 || '')
//     .trim()
//     .toUpperCase();

//   if (source !== 'LAP') {
//     return {
//       success: false,
//       message: 'Webhook ignored. Not a LAP payment.',
//       source,
//     };
//   }

//    const { merchantTxn, easebuzzId } =
//   extractLapEasebuzzWebhookIds(body);

// const normalizedStatus =
//   normalizeLapEasebuzzStatus(body?.status);

//     if (!merchantTxn) {
//       throw new BadRequestException(
//         'Webhook txnid is missing.',
//       );
//     }

//     const existingRows = await this.dataSource.query(
//       `
//         SELECT
//           id,
//           status,
//           mobile,
//           customer_name AS customerName,
//           amount,
//           application_number AS applicationNumber
//         FROM lap_payment_links
//         WHERE txnid = ?
//         LIMIT 1
//       `,
//       [merchantTxn],
//     );

//     const existingPayment =
//       existingRows?.[0] || null;

//     const webhookPayload = {
//       headers,
//       body,
//     };

//     if (!existingPayment) {
//       await this.dataSource.query(
//         `
//           INSERT INTO lap_payment_links
//           (
//             application_id,
//             application_number,
//             customer_name,
//             mobile,
//             email,
//             purpose,
//             amount,
//             txnid,
//             easebuzz_id,
//             status,
//             raw_webhook_response,
//             paid_at
//           )
//           VALUES (?, ?, ?, ?, ?, 'OTHER', ?, ?, ?, ?, ?, ?)
//         `,
//         [
//           Number(body?.udf1 || 0),
//           body?.udf2 || null,
//           body?.firstname || body?.name || null,
//           body?.phone || null,
//           body?.email || null,
//           body?.amount ? Number(body.amount) : 0,
//           merchantTxn,
//           easebuzzId ? String(easebuzzId) : null,
//           normalizedStatus,
//           JSON.stringify(webhookPayload),
//           normalizedStatus === 'SUCCESS'
//             ? new Date()
//             : null,
//         ],
//       );
//     } else {
//       await this.dataSource.query(
//         `
//           UPDATE lap_payment_links
//           SET
//             status = ?,
//             easebuzz_id = COALESCE(?, easebuzz_id),
//             raw_webhook_response = ?,
//             paid_at = CASE
//               WHEN ? = 'SUCCESS' THEN CURRENT_TIMESTAMP(6)
//               ELSE paid_at
//             END
//           WHERE txnid = ?
//         `,
//         [
//           normalizedStatus,
//           easebuzzId ? String(easebuzzId) : null,
//           JSON.stringify(webhookPayload),
//           normalizedStatus,
//           merchantTxn,
//         ],
//       );
//     }

//     const previousStatus =
//       String(existingPayment?.status || '').toUpperCase();

//     let paymentSuccessSmsSent = false;
//     let paymentSuccessSmsError: string | null = null;

//     if (
//       normalizedStatus === 'SUCCESS' &&
//       previousStatus !== 'SUCCESS'
//     ) {
//       try {
//         paymentSuccessSmsSent =
//           await this.sendPaymentSuccessSms({
//             contactNumber:
//               body?.phone || existingPayment?.mobile,
//             amount: body?.amount
//               ? Number(body.amount)
//               : Number(existingPayment?.amount || 0),
//             applicationNumber:
//               body?.udf2 ||
//               existingPayment?.applicationNumber,
//             paymentDate: body?.addedon
//               ? String(body.addedon).split(' ')[0]
//               : null,
//           });
//       } catch (error: any) {
//         paymentSuccessSmsError =
//           error?.message ||
//           'Payment success SMS failed.';
//       }

//       await this.dataSource.query(
//         `
//           UPDATE lap_payment_links
//           SET raw_webhook_response = ?
//           WHERE txnid = ?
//         `,
//         [
//           JSON.stringify({
//             headers,
//             body,
//             paymentSuccessSmsSent,
//             paymentSuccessSmsError,
//           }),
//           merchantTxn,
//         ],
//       );
//     }

//     return {
//       success: true,
//       message: 'Easebuzz webhook processed.',
//       paymentStatus: normalizedStatus,
//       txnid: merchantTxn,
//       smsSent: paymentSuccessSmsSent,
//       smsError: paymentSuccessSmsError,
//     };
//   }

// async handleEasebuzzWebhook(
//   body: any,
//   headers: any,
// ) {
//   try {
//     console.log('Easebuzz LAP webhook received:', {
//       body,
//       headers,
//     });

//     const source = String(body?.data?.udf4 || '')
//       .trim()
//       .toUpperCase();
//     console.log('Webhook source (udf4):', source);
//     if (source !== 'LAP') {
//       return {
//         success: false,
//         message: 'Webhook ignored. Not a LAP payment.',
//         source,
//       };
//     }

//     const merchantTxn =
//       body?.merchant_txn ||
//       body?.txnid ||
//       body?.referenceId ||
//       body?.merchantTxn ||
//       null;

//     const easebuzzId =
//       body?.easebuzzid ||
//       body?.payment_id ||
//       body?.transaction_id ||
//       body?.easepayid ||
//       body?.id ||
//       null;

//     if (!merchantTxn) {
//       throw new BadRequestException(
//         'Webhook txnid is missing.',
//       );
//     }

//     const paymentStatus = String(body?.status || '')
//       .trim()
//       .toLowerCase();

//     let normalizedStatus = 'RECEIVED';

//     if (
//       [
//         'success',
//         'successful',
//         'captured',
//         'paid',
//       ].includes(paymentStatus)
//     ) {
//       normalizedStatus = 'SUCCESS';
//     } else if (
//       ['failure', 'failed', 'error'].includes(
//         paymentStatus,
//       )
//     ) {
//       normalizedStatus = 'FAILED';
//     } else if (
//       ['pending', 'processing'].includes(
//         paymentStatus,
//       )
//     ) {
//       normalizedStatus = 'PROCESSING';
//     }

//     const applicationId = Number(body?.udf1 || 0);
//     const applicationNumber = body?.udf2 || null;
//     const purpose = body?.udf3 || 'OTHER';

//     const webhookPayload = {
//       provider: 'easebuzz',
//       module: 'lap',
//       eventType: 'webhook',
//       direction: 'inbound',
//       source: 'easebuzz-webhook',
//       receivedAt: new Date().toISOString(),
//       merchantTxn,
//       easebuzzId,
//       paymentStatus,
//       normalizedStatus,
//       udf1: body?.udf1 || null,
//       udf2: body?.udf2 || null,
//       udf3: body?.udf3 || null,
//       udf4: body?.udf4 || null,
//       udf5: body?.udf5 || null,
//       headers,
//       body,
//     };

//     const rawWebhookResponse =
//       JSON.stringify(webhookPayload);

//     console.log('LAP WEBHOOK DEBUG:', {
//       source,
//       merchantTxn,
//       easebuzzId,
//       paymentStatus,
//       normalizedStatus,
//       applicationId,
//       applicationNumber,
//       purpose,
//     });

//     const existingRows = await this.dataSource.query(
//       `
//         SELECT
//           id,
//           application_id AS applicationId,
//           application_number AS applicationNumber,
//           status,
//           mobile,
//           customer_name AS customerName,
//           amount
//         FROM lap_payment_links
//         WHERE txnid = ?
//         ORDER BY id DESC
//         LIMIT 1
//       `,
//       [merchantTxn],
//     );

//     const existingPayment =
//       existingRows?.[0] || null;

//     if (existingPayment) {
//       const updateResult = await this.dataSource.query(
//         `
//           UPDATE lap_payment_links
//           SET
//             status = ?,
//             easebuzz_id = COALESCE(?, easebuzz_id),
//             raw_webhook_response = ?,
//             paid_at = CASE
//               WHEN ? = 'SUCCESS' THEN CURRENT_TIMESTAMP(6)
//               ELSE paid_at
//             END
//           WHERE txnid = ?
//         `,
//         [
//           normalizedStatus,
//           easebuzzId ? String(easebuzzId) : null,
//           rawWebhookResponse,
//           normalizedStatus,
//           merchantTxn,
//         ],
//       );

//       console.log('LAP WEBHOOK UPDATE RESULT:', {
//         updateResult,
//         merchantTxn,
//         normalizedStatus,
//       });

//       return {
//         success: true,
//         message:
//           'Easebuzz LAP webhook processed successfully.',
//         data: {
//           txnid: merchantTxn,
//           easebuzzId,
//           previousStatus: existingPayment.status,
//           paymentStatus: normalizedStatus,
//           applicationId:
//             applicationId ||
//             Number(existingPayment.applicationId || 0),
//           applicationNumber:
//             applicationNumber ||
//             existingPayment.applicationNumber,
//         },
//       };
//     }

//     if (!applicationId) {
//       throw new BadRequestException(
//         'Application ID is missing in webhook udf1.',
//       );
//     }

//     const insertResult = await this.dataSource.query(
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
//           raw_webhook_response,
//           paid_at
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'NOT_SENT', ?, ?)
//       `,
//       [
//         applicationId,
//         applicationNumber,
//         body?.firstname ||
//           body?.name ||
//           body?.customer_name ||
//           null,
//         body?.phone || null,
//         body?.email || null,
//         purpose,
//         body?.amount ? Number(body.amount) : 0,
//         merchantTxn,
//         easebuzzId ? String(easebuzzId) : null,
//         normalizedStatus,
//         rawWebhookResponse,
//         normalizedStatus === 'SUCCESS'
//           ? new Date()
//           : null,
//       ],
//     );

//     console.log('LAP WEBHOOK INSERT RESULT:', {
//       insertResult,
//       merchantTxn,
//       normalizedStatus,
//       applicationId,
//       applicationNumber,
//     });

//     return {
//       success: true,
//       message:
//         'Easebuzz LAP webhook stored. New payment row inserted.',
//       data: {
//         txnid: merchantTxn,
//         easebuzzId,
//         paymentStatus: normalizedStatus,
//         applicationId,
//         applicationNumber,
//       },
//     };
//   } catch (error: any) {
//     console.error('LAP Easebuzz webhook error:', {
//       message: error?.message,
//       stack: error?.stack,
//       code: error?.code,
//       sqlMessage: error?.sqlMessage,
//     });

//     return {
//       success: false,
//       message:
//         error?.message ||
//         'Easebuzz LAP webhook processing failed.',
//       errorCode: error?.code || 'WEBHOOK_FAILED',
//       errors: error?.sqlMessage || null,
//     };
//   }
// }

// async handleEasebuzzWebhook(body: any, headers: any) {
//   try {
//     console.log('Easebuzz LAP webhook received:', {
//       body,
//       headers,
//     });

//     // Easebuzz response fields are nested under "data".
//     // Fallback to body so the handler also supports flat webhook payloads.
//     const data =
//       body?.data && typeof body.data === 'object'
//         ? body.data
//         : body;

//     const source = String(data?.udf4 || '')
//       .trim()
//       .toUpperCase();

//     console.log('Webhook source (udf4):', source);

//     if (source !== 'LAP') {
//       return {
//         success: false,
//         message: 'Webhook ignored. Not a LAP payment.',
//         source,
//       };
//     }

//     const merchantTxn =
//       data?.merchant_txn ||
//       data?.txnid ||
//       data?.referenceId ||
//       data?.merchantTxn ||
//       null;

//     /*
//      * transaction_id is "NA" in the link-creation response.
//      * In that case, use the Easebuzz collection-link ID.
//      */
//     const rawTransactionId =
//       data?.transaction_id ||
//       data?.payment_id ||
//       data?.easebuzzid ||
//       data?.easepayid ||
//       null;

//     const hasValidTransactionId =
//       rawTransactionId &&
//       !['NA', 'N/A', 'NULL'].includes(
//         String(rawTransactionId).trim().toUpperCase(),
//       );

//     const easebuzzId = hasValidTransactionId
//       ? String(rawTransactionId)
//       : data?.id
//         ? String(data.id)
//         : null;

//     if (!merchantTxn) {
//       throw new BadRequestException(
//         'Webhook merchant_txn is missing.',
//       );
//     }

//     /*
//      * Do not use body.status because it is boolean:
//      * {
//      *   "status": true,
//      *   "data": { ... }
//      * }
//      *
//      * For this payload:
//      * payment_made = 0
//      * state = active
//      * Therefore the payment is still PROCESSING.
//      */
//     const paymentMade = Number(
//       data?.payment_made ?? 0,
//     );

//     const rawPaymentStatus =
//       data?.payment_status ||
//       data?.transaction_status ||
//       (typeof data?.status === 'string'
//         ? data.status
//         : null) ||
//       data?.state ||
//       (typeof body?.status === 'string'
//         ? body.status
//         : null) ||
//       '';

//     const paymentStatus = String(rawPaymentStatus)
//       .trim()
//       .toLowerCase();

//     let normalizedStatus = 'RECEIVED';

//     if (
//       paymentMade === 1 ||
//       [
//         'success',
//         'successful',
//         'captured',
//         'paid',
//         'completed',
//       ].includes(paymentStatus)
//     ) {
//       normalizedStatus = 'SUCCESS';
//     } else if (
//       [
//         'failure',
//         'failed',
//         'error',
//         'cancelled',
//         'canceled',
//         'expired',
//       ].includes(paymentStatus)
//     ) {
//       normalizedStatus = 'FAILED';
//     } else if (
//       paymentMade === 0 ||
//       [
//         'pending',
//         'processing',
//         'active',
//         'initiated',
//         'created',
//         'unpaid',
//       ].includes(paymentStatus)
//     ) {
//       normalizedStatus = 'PROCESSING';
//     }

//     const parsedApplicationId = Number(data?.udf1);

//     const applicationId = Number.isFinite(
//       parsedApplicationId,
//     )
//       ? parsedApplicationId
//       : 0;

//     const applicationNumber =
//       data?.udf2 || null;

//     const purpose =
//       data?.udf3 || 'OTHER';

//     const customerName =
//       data?.firstname ||
//       data?.name ||
//       data?.customer_name ||
//       null;

//     const mobile =
//       data?.phone ||
//       data?.mobile ||
//       null;

//     const email =
//       data?.email || null;

//     const parsedAmount = Number(data?.amount);

//     const amount = Number.isFinite(parsedAmount)
//       ? parsedAmount
//       : 0;

//     const paymentLink =
//       data?.payment_url ||
//       body?.short_url ||
//       null;

//     const webhookPayload = {
//       provider: 'easebuzz',
//       module: 'lap',
//       eventType: 'webhook',
//       direction: 'inbound',
//       source: 'easebuzz-webhook',
//       receivedAt: new Date().toISOString(),

//       merchantTxn,
//       easebuzzId,
//       collectionLinkId: data?.id || null,
//       transactionId: data?.transaction_id || null,

//       paymentStatus,
//       paymentMade,
//       normalizedStatus,

//       applicationId,
//       applicationNumber,
//       purpose,

//       customerName,
//       mobile,
//       email,
//       amount,
//       paymentLink,

//       udf1: data?.udf1 || null,
//       udf2: data?.udf2 || null,
//       udf3: data?.udf3 || null,
//       udf4: data?.udf4 || null,
//       udf5: data?.udf5 || null,

//       rootStatus: body?.status,
//       rootMessage: body?.message || null,
//       acceptPartialPayment:
//         body?.accept_partial_payment ?? null,
//       shortUrl: body?.short_url || null,

//       headers,
//       body,
//     };

//     const rawWebhookResponse =
//       JSON.stringify(webhookPayload);

//     console.log('LAP WEBHOOK DEBUG:', {
//       source,
//       merchantTxn,
//       easebuzzId,
//       paymentStatus,
//       paymentMade,
//       normalizedStatus,
//       applicationId,
//       applicationNumber,
//       purpose,
//       amount,
//       paymentLink,
//     });

//     const existingRows =
//       await this.dataSource.query(
//         `
//           SELECT
//             id,
//             application_id AS applicationId,
//             application_number AS applicationNumber,
//             status,
//             mobile,
//             customer_name AS customerName,
//             amount
//           FROM lap_payment_links
//           WHERE txnid = ?
//           ORDER BY id DESC
//           LIMIT 1
//         `,
//         [merchantTxn],
//       );

//     const existingPayment =
//       existingRows?.[0] || null;

//     if (existingPayment) {
//       /*
//        * Prevent a later link-status callback from changing an
//        * already successful payment back to PROCESSING.
//        */
//       const nextStatus =
//         existingPayment.status === 'SUCCESS' &&
//         normalizedStatus !== 'SUCCESS'
//           ? 'SUCCESS'
//           : normalizedStatus;

//       const updateResult =
//         await this.dataSource.query(
//           `
//             UPDATE lap_payment_links
//             SET
//               status = ?,
//               easebuzz_id = COALESCE(?, easebuzz_id),
//               payment_link = COALESCE(?, payment_link),
//               raw_webhook_response = ?,
//               paid_at = CASE
//                 WHEN ? = 'SUCCESS'
//                   THEN COALESCE(
//                     paid_at,
//                     CURRENT_TIMESTAMP(6)
//                   )
//                 ELSE paid_at
//               END
//             WHERE txnid = ?
//           `,
//           [
//             nextStatus,
//             easebuzzId,
//             paymentLink,
//             rawWebhookResponse,
//             nextStatus,
//             merchantTxn,
//           ],
//         );

//       console.log('LAP WEBHOOK UPDATE RESULT:', {
//         updateResult,
//         merchantTxn,
//         normalizedStatus: nextStatus,
//       });

//       return {
//         success: true,
//         message:
//           'Easebuzz LAP webhook processed successfully.',
//         data: {
//           txnid: merchantTxn,
//           easebuzzId,
//           previousStatus:
//             existingPayment.status,
//           paymentStatus: nextStatus,
//           applicationId:
//             applicationId ||
//             Number(
//               existingPayment.applicationId || 0,
//             ),
//           applicationNumber:
//             applicationNumber ||
//             existingPayment.applicationNumber,
//           paymentLink,
//         },
//       };
//     }

//     if (!applicationId) {
//       throw new BadRequestException(
//         'Application ID is missing in webhook data.udf1.',
//       );
//     }

//     const insertResult =
//       await this.dataSource.query(
//         `
//           INSERT INTO lap_payment_links
//           (
//             application_id,
//             application_number,
//             customer_name,
//             mobile,
//             email,
//             purpose,
//             amount,
//             txnid,
//             easebuzz_id,
//             payment_link,
//             status,
//             sms_status,
//             raw_webhook_response,
//             paid_at
//           )
//           VALUES (
//             ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
//             'NOT_SENT', ?, ?
//           )
//         `,
//         [
//           applicationId,
//           applicationNumber,
//           customerName,
//           mobile,
//           email,
//           purpose,
//           amount,
//           merchantTxn,
//           easebuzzId,
//           paymentLink,
//           normalizedStatus,
//           rawWebhookResponse,
//           normalizedStatus === 'SUCCESS'
//             ? new Date()
//             : null,
//         ],
//       );

//     console.log('LAP WEBHOOK INSERT RESULT:', {
//       insertResult,
//       merchantTxn,
//       normalizedStatus,
//       applicationId,
//       applicationNumber,
//     });

//     return {
//       success: true,
//       message:
//         'Easebuzz LAP webhook stored. New payment row inserted.',
//       data: {
//         txnid: merchantTxn,
//         easebuzzId,
//         paymentStatus: normalizedStatus,
//         applicationId,
//         applicationNumber,
//         paymentLink,
//       },
//     };
//   } catch (error: any) {
//     console.error('LAP Easebuzz webhook error:', {
//       message: error?.message,
//       stack: error?.stack,
//       code: error?.code,
//       sqlMessage: error?.sqlMessage,
//     });

//     return {
//       success: false,
//       message:
//         error?.message ||
//         'Easebuzz LAP webhook processing failed.',
//       errorCode:
//         error?.code || 'WEBHOOK_FAILED',
//       errors:
//         error?.sqlMessage || null,
//     };
//   }
// }


async handleEasebuzzWebhook(body: any, headers: any) {
  try {
    console.log('Easebuzz webhook received:', {
      body,
      headers,
    });

    // Supports both:
    // 1. Flat Easebuzz webhook: body.txnid
    // 2. Nested response: body.data.merchant_txn
    const data =
      body?.data && typeof body.data === 'object'
        ? body.data
        : body;

    const merchantTxn =
      data?.txnid ||
      data?.merchant_txn ||
      data?.merchantTxn ||
      data?.referenceId ||
      null;

    if (!merchantTxn) {
      throw new BadRequestException(
        'Easebuzz transaction ID is missing.',
      );
    }

    const easebuzzId =
      data?.easepayid ||
      data?.easebuzzid ||
      data?.payment_id ||
      data?.transaction_id ||
      data?.id ||
      null;

    /*
     * Only validate udf4 when Easebuzz sends it.
     * The failure payload provided does not contain udf4.
     */
    const source = String(data?.udf4 || '')
      .trim()
      .toUpperCase();

    if (source && source !== 'LAP') {
      return {
        success: false,
        message: 'Webhook ignored. Not a LAP payment.',
        source,
      };
    }

    /*
     * Avoid reading a boolean API status such as:
     * { status: true, data: {...} }
     */
    const rawPaymentStatus =
      typeof data?.status === 'string'
        ? data.status
        : data?.payment_status ||
          data?.transaction_status ||
          data?.unmappedstatus ||
          data?.state ||
          '';

    const paymentStatus = String(rawPaymentStatus)
      .trim()
      .toLowerCase();

    let normalizedStatus:
      | 'RECEIVED'
      | 'PROCESSING'
      | 'SUCCESS'
      | 'FAILED' = 'RECEIVED';

    if (
      [
        'success',
        'successful',
        'captured',
        'paid',
        'completed',
      ].includes(paymentStatus)
    ) {
      normalizedStatus = 'SUCCESS';
    } else if (
      [
        'failure',
        'failed',
        'error',
        'bounced',
        'cancelled',
        'canceled',
        'expired',
        'declined',
      ].includes(paymentStatus)
    ) {
      normalizedStatus = 'FAILED';
    } else if (
      [
        'pending',
        'processing',
        'active',
        'initiated',
        'created',
        'unpaid',
      ].includes(paymentStatus)
    ) {
      normalizedStatus = 'PROCESSING';
    }

    const parsedApplicationId = Number(data?.udf1);

    const applicationId = Number.isFinite(
      parsedApplicationId,
    )
      ? parsedApplicationId
      : 0;

    const applicationNumber =
      data?.udf2 || null;

    const purpose =
      data?.udf3 ||
      data?.productinfo ||
      'OTHER';

    const customerName =
      data?.firstname ||
      data?.name ||
      data?.customer_name ||
      null;

    const mobile =
      data?.phone ||
      data?.mobile ||
      null;

    const email =
      data?.email || null;

    const parsedAmount = Number(data?.amount);

    const amount = Number.isFinite(parsedAmount)
      ? parsedAmount
      : 0;

    const paymentLink =
      data?.payment_url ||
      body?.short_url ||
      null;

    const errorMessage =
      data?.error_Message ||
      data?.error_message ||
      data?.message ||
      null;

    const webhookPayload = {
      provider: 'easebuzz',
      module: 'lap',
      eventType: 'payment-webhook',
      direction: 'inbound',
      receivedAt: new Date().toISOString(),

      merchantTxn,
      easebuzzId,
      paymentStatus,
      normalizedStatus,

      applicationId: applicationId || null,
      applicationNumber,
      purpose,

      customerName,
      mobile,
      email,
      amount,
      paymentLink,

      bankReferenceNumber:
        data?.bank_ref_num || null,
      authorizationReferenceNumber:
        data?.auth_ref_num || null,
      upiVirtualAddress:
        data?.upi_va || null,
      paymentSource:
        data?.payment_source || null,
      paymentGatewayType:
        data?.PG_TYPE || null,

      errorMessage,

      udf1: data?.udf1 || null,
      udf2: data?.udf2 || null,
      udf3: data?.udf3 || null,
      udf4: data?.udf4 || null,
      udf5: data?.udf5 || null,
      udf10: data?.udf10 || null,

      headers,
      body,
    };

    const rawWebhookResponse =
      JSON.stringify(webhookPayload);

    console.log('Easebuzz webhook mapped:', {
      merchantTxn,
      easebuzzId,
      paymentStatus,
      normalizedStatus,
      applicationId,
      applicationNumber,
      amount,
      errorMessage,
    });

    const existingRows =
      await this.dataSource.query(
        `
          SELECT
            id,
            application_id AS applicationId,
            application_number AS applicationNumber,
            status,
            customer_name AS customerName,
            mobile,
            amount
          FROM lap_payment_links
          WHERE txnid = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        [merchantTxn],
      );

    const existingPayment =
      existingRows?.[0] || null;

    if (existingPayment) {
      /*
       * Do not downgrade a successful payment if an older or
       * duplicate failed/pending callback arrives later.
       */
      const nextStatus =
        existingPayment.status === 'SUCCESS' &&
        normalizedStatus !== 'SUCCESS'
          ? 'SUCCESS'
          : normalizedStatus;

      const updateResult =
        await this.dataSource.query(
          `
            UPDATE lap_payment_links
            SET
              status = ?,
              easebuzz_id = COALESCE(?, easebuzz_id),
              customer_name = COALESCE(?, customer_name),
              mobile = COALESCE(?, mobile),
              email = COALESCE(?, email),
              amount = CASE
                WHEN ? > 0 THEN ?
                ELSE amount
              END,
              payment_link = COALESCE(?, payment_link),
              raw_webhook_response = ?,
              paid_at = CASE
                WHEN ? = 'SUCCESS'
                  THEN COALESCE(
                    paid_at,
                    CURRENT_TIMESTAMP(6)
                  )
                ELSE paid_at
              END
            WHERE txnid = ?
          `,
          [
            nextStatus,
            easebuzzId
              ? String(easebuzzId)
              : null,
            customerName,
            mobile,
            email,
            amount,
            amount,
            paymentLink,
            rawWebhookResponse,
            nextStatus,
            merchantTxn,
          ],
        );

      console.log(
        'Easebuzz webhook update result:',
        {
          updateResult,
          merchantTxn,
          previousStatus:
            existingPayment.status,
          nextStatus,
        },
      );

      return {
        success: true,
        message:
          'Easebuzz webhook processed successfully.',
        data: {
          txnid: merchantTxn,
          easebuzzId,
          previousStatus:
            existingPayment.status,
          paymentStatus: nextStatus,
          providerStatus: paymentStatus,
          applicationId:
            applicationId ||
            Number(
              existingPayment.applicationId || 0,
            ),
          applicationNumber:
            applicationNumber ||
            existingPayment.applicationNumber,
          errorMessage,
        },
      };
    }

    /*
     * A new row requires udf1 because application_id is mandatory.
     * Failure callbacks such as the supplied payload usually update
     * an already-created payment row using txnid.
     */
    if (!applicationId) {
      throw new BadRequestException(
        `Payment record not found for txnid ${merchantTxn}, and application ID is missing in udf1.`,
      );
    }

    const insertResult =
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
            raw_webhook_response,
            paid_at
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'NOT_SENT', ?, ?
          )
        `,
        [
          applicationId,
          applicationNumber,
          customerName,
          mobile,
          email,
          purpose,
          amount,
          merchantTxn,
          easebuzzId
            ? String(easebuzzId)
            : null,
          paymentLink,
          normalizedStatus,
          rawWebhookResponse,
          normalizedStatus === 'SUCCESS'
            ? new Date()
            : null,
        ],
      );

    console.log(
      'Easebuzz webhook insert result:',
      {
        insertResult,
        merchantTxn,
        normalizedStatus,
        applicationId,
      },
    );

    return {
      success: true,
      message:
        'Easebuzz webhook stored successfully.',
      data: {
        txnid: merchantTxn,
        easebuzzId,
        paymentStatus: normalizedStatus,
        providerStatus: paymentStatus,
        applicationId,
        applicationNumber,
        errorMessage,
      },
    };
  } catch (error: any) {
    console.error(
      'Easebuzz webhook processing error:',
      {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        sqlMessage: error?.sqlMessage,
      },
    );

    return {
      success: false,
      message:
        error?.message ||
        'Easebuzz webhook processing failed.',
      errorCode:
        error?.code || 'WEBHOOK_FAILED',
      errors:
        error?.sqlMessage || null,
    };
  }
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