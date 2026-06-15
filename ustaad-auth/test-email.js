const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envFile = process.env.NODE_ENV || 'develop.env';
const envPath = path.resolve(__dirname, envFile);
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Import the service from compiled dist folder
const { sendEmailViaSES } = require('./dist/src/services/aws-email.service');

async function run() {
  const toEmail = process.argv[2];
  if (!toEmail) {
    console.error('Error: Please provide a recipient email address as an argument.');
    console.log('Usage: node test-email.js <recipient-email>');
    process.exit(1);
  }

  console.log(`Sending test email to: ${toEmail}...`);
  console.log(`AWS Region: ${process.env.AWS_REGION}`);
  console.log(`AWS Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'undefined'}`);
  console.log(`AWS SES From Email: ${process.env.AWS_SES_FROM_EMAIL || process.env.AWS_FROM_EMAIL}`);

  const subject = 'Test SES Email from Ustaad Auth Service (JS)';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #4A90E2;">Ustaad SES Email Test (JS)</h2>
      <p>Hello,</p>
      <p>This is a test email sent from the <strong>ustaad-auth</strong> microservice using the JS test script.</p>
      <p>Sent at: <strong>${new Date().toISOString()}</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #999;">If you received this, the AWS SES configuration is working correctly!</small>
    </div>
  `;
  const text = `Ustaad SES Email Test (JS)\n\nThis is a test email sent from the ustaad-auth microservice using the JS test script.\n\nSent at: ${new Date().toISOString()}`;

  const result = await sendEmailViaSES(toEmail, subject, html, text);

  if (result.success) {
    console.log('🎉 Success! Test email sent successfully.');
    console.log(`Message ID: ${result.messageId}`);
  } else {
    console.error('❌ Failed to send test email.');
    console.error(`Error: ${result.error}`);
  }
}

run().catch((err) => {
  console.error('Fatal error in test script:', err);
  process.exit(1);
});
