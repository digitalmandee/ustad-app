import axios from 'axios';
import { InternalServerError } from '../../errors/internal-server-error';
import { BadRequestError } from '../../errors/bad-request-error';

/**
 * SMS Service for sending OTP messages via VeevoTech SMS API v3
 * API Documentation: https://api.veevotech.com/v3/sendsms
 */
export class SmsService {
  private readonly SMS_API_URL = process.env.SMS_API_URL;
  private readonly API_KEY = process.env.VEEVOTECH_SMS_API_KEY;
  private readonly SENDER_ID = process.env.VEEVOTECH_SENDER_ID || 'Default';

  constructor() {
    if (!this.API_KEY) {
      console.warn('⚠️ VEEVOTECH_SMS_API_KEY not configured. SMS functionality will be disabled..');
    }
  }

  /**
   * Sends an OTP message via SMS to the specified phone number
   * @param phoneNumber - The recipient's phone number (with country code)
   * @param otpCode - The OTP code to send
   * @param expiryMinutes - OTP expiry time in minutes
   * @returns Promise<void>
   */
  public async sendOtpSms(phoneNumber: string, otpCode: string, expiryMinutes: number = 10): Promise<void> {
    console.log("sendotp started")
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new BadRequestError('Invalid phone number format');
      }

      // Check if API key is configured
      if (!this.API_KEY) {
        throw new InternalServerError('SMS service not configured');
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Create SMS message
      const message = this.createOtpMessage(otpCode, expiryMinutes);

      // Prepare request payload according to VeevoTech API v3
      const payload = {
        apikey: this.API_KEY,
        receivernum: formattedPhone,
        sendernum: this.SENDER_ID,
        textmessage: message,
        // Optional parameters
        receivernetwork: '', // Optional: receiver's mobile network
        header: '' // Optional: for multiple brands on shared short code
      };

      console.log(`📱 Sending SMS OTP to ${formattedPhone} | Code: ${otpCode}`);

      // Make API request
      const response = await axios.post(this.SMS_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      // Check response according to VeevoTech API v3 format
      if (response.data && response.data.STATUS === 'SUCCESSFUL') {
        console.log(`✅ SMS OTP sent successfully to ${formattedPhone} | Message ID: ${response.data.MESSAGE_ID}`);
      } else {
        const errorMsg = response.data?.ERROR_DESCRIPTION || response.data?.ERROR_FILTER || 'Unknown API error';
        throw new Error(`SMS API error: ${errorMsg}`);
      }

    } catch (error: any) {
      console.error(`❌ SMS send failed for ${phoneNumber}`, {
        error: error?.response?.data || error.message || error,
      });

      // Handle specific API errors based on VeevoTech error codes
      if (error?.response?.data?.STATUS === 'ERROR') {
        const errorFilter = error.response.data.ERROR_FILTER;
        const errorDesc = error.response.data.ERROR_DESCRIPTION;
        
        switch (errorFilter) {
          case 'AUTH_FAILED':
            throw new InternalServerError('SMS service authentication failed');
          case 'INVALID_NUMBER':
            throw new BadRequestError('Invalid phone number format');
          case 'INSUFFICIENT_BALANCE':
            throw new InternalServerError('SMS service balance insufficient');
          case 'RATE_LIMIT_EXCEEDED':
            throw new InternalServerError('SMS rate limit exceeded');
          default:
            throw new InternalServerError(`SMS service error: ${errorDesc}`);
        }
      }

      // Handle network errors
      if (error?.response?.status === 401) {
        throw new InternalServerError('SMS service authentication failed');
      } else if (error?.response?.status === 400) {
        throw new BadRequestError('Invalid SMS request parameters');
      } else if (error?.response?.status === 429) {
        throw new InternalServerError('SMS rate limit exceeded');
      }

      throw new InternalServerError('Failed to send SMS OTP');
    }
  }

  /**
   * Creates the OTP message template
   * @param otpCode - The OTP code
   * @param expiryMinutes - Expiry time in minutes
   * @returns Formatted message string
   */
  private createOtpMessage(otpCode: string, expiryMinutes: number): string {
    return `Your Ustaad verification code is ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`;
  }

  /**
   * Validates phone number format
   * @param phoneNumber - Phone number to validate
   * @returns boolean indicating if phone number is valid
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone number format
    // Supports formats like: +1234567890, 1234567890, +91-9876543210
    const phoneRegex = /^(\+?[\d\s\-\(\)]{10,15})$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Formats phone number to international format
   * @param phoneNumber - Raw phone number
   * @returns Formatted phone number
   */
  public formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // If no country code, assume Pakistan (+92)
    if (!formatted.startsWith('+')) {
      // Remove leading 0 if present
      if (formatted.startsWith('0')) {
        formatted = formatted.substring(1);
      }
      // Add Pakistan country code
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  /**
   * Checks if SMS service is properly configured
   * @returns boolean indicating if SMS service is available
   */
  public isServiceAvailable(): boolean {
    return !!this.API_KEY;
  }

  /**
   * Sends a custom SMS message (for non-OTP purposes)
   * @param phoneNumber - Recipient phone number
   * @param message - Custom message content
   * @returns Promise<void>
   */
  public async sendCustomSms(phoneNumber: string, message: string): Promise<void> {
    try {
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new BadRequestError('Invalid phone number format');
      }

      if (!this.API_KEY) {
        throw new InternalServerError('SMS service not configured');
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        apikey: this.API_KEY,
        receivernum: formattedPhone,
        sendernum: this.SENDER_ID,
        textmessage: message
      };

      const response = await axios.post(this.SMS_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.STATUS === 'SUCCESSFUL') {
        console.log(`✅ Custom SMS sent successfully to ${formattedPhone} | Message ID: ${response.data.MESSAGE_ID}`);
      } else {
        const errorMsg = response.data?.ERROR_DESCRIPTION || response.data?.ERROR_FILTER || 'Unknown API error';
        throw new Error(`SMS API error: ${errorMsg}`);
      }

    } catch (error: any) {
      console.error(`❌ Custom SMS send failed for ${phoneNumber}`, {
        error: error?.response?.data || error.message || error,
      });
      throw new InternalServerError('Failed to send custom SMS');
    }
  }

  /**
   * Gets delivery status for a message (if webhook is configured)
   * @param messageId - The message ID returned from send request
   * @returns Promise<any> - Delivery status information
   */
  public async getDeliveryStatus(messageId: string): Promise<any> {
    // This would typically call a delivery status endpoint
    // For now, we'll return a placeholder
    console.log(`📊 Checking delivery status for message: ${messageId}`);
    return {
      messageId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const smsService = new SmsService(); 