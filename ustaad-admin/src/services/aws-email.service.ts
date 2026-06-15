import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Load configurations from environment variables
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || process.env.AWS_FROM_EMAIL || "no-reply@ustaad.app";

let sesClient: SESClient | null = null;

/**
 * Returns a cached SES client or initializes a new one.
 */
function getSESClient(): SESClient {
  if (!sesClient) {
    const config: any = { region: AWS_REGION };
    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      };
    }
    sesClient = new SESClient(config);
  }
  return sesClient;
}

/**
 * Sends an email using AWS SES (Simple Email Service)
 * @param to - Recipient email address or list of recipient email addresses
 * @param subject - Email subject line
 * @param html - HTML body content
 * @param text - Optional plain text body content
 * @returns Promise<EmailResult>
 */
export async function sendEmailViaSES(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  try {
    const client = getSESClient();
    const toAddresses = Array.isArray(to) ? to : [to];

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
          ...(text && {
            Text: {
              Charset: "UTF-8",
              Data: text,
            },
          }),
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: FROM_EMAIL,
    });

    const response = await client.send(command);

    console.log(`✅ Email sent successfully to ${toAddresses.join(", ")} | MessageId: ${response.MessageId}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error(`❌ Error sending email via AWS SES to ${to}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}
