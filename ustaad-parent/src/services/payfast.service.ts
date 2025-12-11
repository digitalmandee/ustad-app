import crypto from "crypto";
import axios from "axios";
import { GenericError } from "../errors/generic-error";

interface PayFastConfig {
  merchantId: string;
  securedKey: string;
  env: "UAT" | "LIVE";
  merchantName: string;
  currencyCode: string;
  successUrl: string;
  failureUrl: string;
  checkoutUrl: string;
}

interface InitiateSubscriptionRequest {
  userId: string;
  amount: number;
  customerEmail?: string;
  customerMobile?: string;
  offerId?: string;
  childName?: string;
}

interface PayFastFormFields {
  MERCHANT_ID: string;
  MERCHANT_NAME: string;
  TOKEN: string;
  BASKET_ID: string;
  TXNAMT: string;
  CURRENCY_CODE: string;
  ORDER_DATE: string;
  TXNDESC: string;
  PROCCODE: string;
  TRAN_TYPE: string;
  SUCCESS_URL: string;
  FAILURE_URL: string;
  CHECKOUT_URL: string;
  CUSTOMER_EMAIL_ADDRESS?: string;
  CUSTOMER_MOBILE_NO?: string;
  SIGNATURE: string;
  VERSION: string;
  RECURRING_TXN: string;
}

interface ChargeRecurringRequest {
  instrumentToken: string;
  basketId: string;
  amount: number;
  customerEmail?: string;
  customerMobile?: string;
}

export class PayFastService {
  private config: PayFastConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      merchantId: process.env.PAYFAST_MERCHANT_ID || "",
      securedKey: process.env.PAYFAST_SECURED_KEY || "",
      env: (process.env.PAYFAST_ENV as "UAT" | "LIVE") || "UAT",
      merchantName: process.env.PAYFAST_MERCHANT_NAME || "Test Merchant",
      currencyCode: process.env.PAYFAST_CURRENCY_CODE || "PKR",
      // successUrl: process.env.PAYFAST_SUCCESS_URL || "https://fasdfsadfasdfasdfsf.com/payfast/success",
      successUrl: "https://583cfb3ef492.ngrok-free.app/parent/payfast/success",
      failureUrl: "https://583cfb3ef492.ngrok-free.app/parent/payfast/failure",
      // failureUrl: process.env.PAYFAST_FAILURE_URL || "https://fasdfsadfasdfasdfsf.com/payfast/success",
      // checkoutUrl: `${process.env.PAYFAST_CHECKOUT_URL}/api/payfast/ipn` || "",
      checkoutUrl: "https://583cfb3ef492.ngrok-free.app/api/payfast/ipn",
    };

    if (!this.config.merchantId || !this.config.securedKey) {
      console.warn("⚠️ PayFast credentials not configured");
    }
  }

  /**
   * Get PayFast API base URL based on environment
   */
  private getBaseUrl(): string {
    return this.config.env === "LIVE"
      ? "https://ipg1.apps.net.pk/Ecommerce/api/Transaction"
      : "https://ipguat.apps.net.pk/Ecommerce/api/Transaction";
  }

  /**
   * Get PayFast Tokenization API base URL based on environment
   */
  // https://apipxyuat.apps.net.pk:8443
  private getTokenizationBaseUrl(): string {
    return this.config.env === "LIVE"
      ? "https://apipxy.apps.net.pk:8443/api"
      : "https://apipxyuat.apps.net.pk:8443/api";
  }
  /**
   * Get PayFast access token
   */
  async getAccessToken(basketId: string, txnAmt: string): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const url = `${this.getBaseUrl()}/GetAccessToken`;


      console.log("url", url);
      console.log("this.config.merchantId", this.config.merchantId);
      console.log("this.config.securedKey", this.config.securedKey);
      console.log("basketId", basketId);
      console.log("txnAmt", txnAmt);
      console.log("this.config.currencyCode", this.config.currencyCode);
      
      const response = await axios.post(
        url,
        {
          MERCHANT_ID: this.config.merchantId,
          SECURED_KEY: this.config.securedKey,
          BASKET_ID: basketId,
          TXNAMT: txnAmt,
          CURRENCY_CODE: this.config.currencyCode
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("response", response);
      

      if (response.status === 200) {
        this.accessToken = response.data.ACCESS_TOKEN;
        // Token typically expires in 1 hour, cache for 55 minutes
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        return this.accessToken;
      }

      throw new Error("Failed to get access token from PayFast");
    } catch (error: any) {
      console.error("PayFast getAccessToken error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to get PayFast access token"
      );
    }
  }

  /**
   * Generate unique basket ID
   */
  generateBasketId(prefix: string = "SUB"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate signature for PayFast request
   */
  private generateSignature(fields: Record<string, string>): string {
    // Sort fields alphabetically
    const sortedFields = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join("&");

    // Generate SHA256 hash
    return crypto
      .createHash("sha256")
      .update(sortedFields + this.config.securedKey)
      .digest("hex");
  }

  /**
   * Validate IPN hash
   */
  validateIPNHash(
    basketId: string,
    errCode: string,
    receivedHash: string
  ): boolean {
    const hashString = `${basketId}|${this.config.securedKey}|${this.config.merchantId}|${errCode}`;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(hashString)
      .digest("hex");

    return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
  }

  /**
   * Initiate subscription payment
   */
  async initiateSubscription(
    request: InitiateSubscriptionRequest
  ): Promise<{
    payfastUrl: string;
    formFields: PayFastFormFields;
    basketId: string;
  }> {
    try {
      console.log("request", request.amount);
      
      // Generate basket ID
      const basketId = this.generateBasketId("SUB");
      
      const token = await this.getAccessToken(basketId, Number(request.amount).toFixed(2));
      // Format order date


      console.log("token", token);
      
      const orderDate = new Date().toISOString().replace("T", " ").substring(0, 19);

      // Prepare form fields
      const formFields: PayFastFormFields = {
        MERCHANT_ID: this.config.merchantId,
        MERCHANT_NAME: this.config.merchantName,
        TOKEN: token,
        BASKET_ID: basketId,
        TXNAMT: Number(request.amount).toFixed(2),
        CURRENCY_CODE: this.config.currencyCode,
        ORDER_DATE: orderDate,
        TXNDESC: `Subscription purchase - for offer ${request.offerId} against child ${request.childName}`,
        PROCCODE: "00",
        TRAN_TYPE: "ECOMM_PURCHASE",
        SUCCESS_URL: this.config.successUrl,
        FAILURE_URL: this.config.failureUrl,
        CHECKOUT_URL: this.config.checkoutUrl,
        SIGNATURE: "",
        VERSION: "MERCHANT-CART-0.1",
        RECURRING_TXN: "TRUE",
      };

      // Add optional fields
      if (request.customerEmail) {
        formFields.CUSTOMER_EMAIL_ADDRESS = request.customerEmail;
      }
      if (request.customerMobile) {
        formFields.CUSTOMER_MOBILE_NO = request.customerMobile;
      }

      // Generate signature (excluding SIGNATURE field)
      const fieldsForSignature = { ...formFields };
      delete fieldsForSignature.SIGNATURE;
      formFields.SIGNATURE = this.generateSignature(fieldsForSignature);

      const payfastUrl = `${this.getBaseUrl()}/PostTransaction`;

      return {
        payfastUrl,
        formFields,
        basketId,
      };
    } catch (error: any) {
      console.error("PayFast initiateSubscription error:", error);
      throw new GenericError(error, "Failed to initiate PayFast subscription");
    }
  }

  /**
   * Charge recurring payment using stored token
   */
  async chargeRecurringPayment(
    request: ChargeRecurringRequest
  ): Promise<{
    success: boolean;
    basketId: string;
    response: any;
  }> {
    try {
      // Get access token
      const token = await this.getAccessToken(request.basketId, request.amount.toFixed(2));

      // Format order date
      const orderDate = new Date().toISOString().replace("T", " ").substring(0, 19);

      // Prepare charge request
      const chargeData = {
        MERCHANT_ID: this.config.merchantId,
        MERCHANT_NAME: this.config.merchantName,
        TOKEN: token,
        INSTRUMENT_TOKEN: request.instrumentToken,
        BASKET_ID: request.basketId,
        TXNAMT: request.amount.toFixed(2),
        CURRENCY_CODE: this.config.currencyCode,
        ORDER_DATE: orderDate,
        TXNDESC: `Recurring subscription payment - ${request.basketId}`,
        PROCCODE: "00",
        TRAN_TYPE: "ECOMM_PURCHASE",
        RECURRING_TXN: "TRUE",
        SIGNATURE: "",
        VERSION: "MERCHANT-CART-0.1",
      };

      // Add optional fields
      if (request.customerEmail) {
        (chargeData as any).CUSTOMER_EMAIL_ADDRESS = request.customerEmail;
      }
      if (request.customerMobile) {
        (chargeData as any).CUSTOMER_MOBILE_NO = request.customerMobile;
      }

      // Generate signature
      const fieldsForSignature = { ...chargeData };
      delete fieldsForSignature.SIGNATURE;
      chargeData.SIGNATURE = this.generateSignature(fieldsForSignature);

      // Make API call to PayFast
      const url = `${this.getBaseUrl()}/PostTransaction`;
      const response = await axios.post(url, chargeData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        basketId: request.basketId,
        response: response.data,
      };
    } catch (error: any) {
      console.error("PayFast chargeRecurringPayment error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to charge recurring payment"
      );
    }
  }

  /**
   * 3.1 Get Access Token for Tokenization APIs
   */
  async getTokenizationAccessToken(): Promise<string> {
    try {
      const url = `${this.getTokenizationBaseUrl()}/token`;

      const response = await axios.post(
        url,
        new URLSearchParams({
          merchant_id: this.config.merchantId,
          secured_key: this.config.securedKey,
          grant_type: "client_credentials",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status === 200 && response.data.access_token) {
        return response.data.access_token;
      }

      throw new Error("Failed to get access token from PayFast tokenization API");
    } catch (error: any) {
      console.error("PayFast getTokenizationAccessToken error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to get PayFast tokenization access token"
      );
    }
  }

  /**
   * 3.15 Get Lists of Instruments
   */
  async getListsOfInstruments(
    merchantUserId: string,
    userMobileNumber: string
  ): Promise<any> {
    try {
      const accessToken = await this.getTokenizationAccessToken();
      const url = `${this.getTokenizationBaseUrl()}/user/instruments`;

      const response = await axios.get(url, {
        params: {
          merchant_user_id: merchantUserId,
          user_mobile_number: userMobileNumber,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("PayFast getListsOfInstruments error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to get lists of instruments"
      );
    }
  }

  /**
   * 3.5 Recurring Transaction OTP
   */
  async recurringTransactionOTP(request: {
    instrumentToken: string;
    merchantUserId: string;
    userMobileNumber: string;
    basketId: string;
    orderDate: string;
    txnamt: string;
    cvv: string;
    currencyCode?: string;
    data3dsCallbackUrl?: string;
    checkoutUrl?: string;
  }): Promise<any> {
    try {
      const accessToken = await this.getTokenizationAccessToken();
      const url = `${this.getTokenizationBaseUrl()}/transaction/recurring/otp`;

      const formData = new URLSearchParams({
        instrument_token: request.instrumentToken,
        merchant_user_id: request.merchantUserId,
        user_mobile_number: request.userMobileNumber,
        basket_id: request.basketId,
        order_date: request.orderDate,
        txnamt: request.txnamt,
        cvv: request.cvv,
        currency_code: request.currencyCode || this.config.currencyCode,
      });

      if (request.data3dsCallbackUrl) {
        formData.append("data_3ds_callback_url", request.data3dsCallbackUrl);
      }
      if (request.checkoutUrl) {
        formData.append("checkout_url", request.checkoutUrl);
      }

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("PayFast recurringTransactionOTP error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to initiate recurring transaction OTP"
      );
    }
  }

  /**
   * 3.6 Initiate Recurring Payment
   */
  async initiateRecurringPayment(request: {
    instrumentToken: string;
    merchantUserId: string;
    userMobileNumber: string;
    basketId: string;
    orderDate: string;
    txndesc: string;
    txnamt: string;
    cvv: string;
    transactionId?: string;
    currencyCode?: string;
    otp?: string;
    data3dsSecureId?: string;
    data3dsPares?: string;
    checkoutUrl?: string;
  }): Promise<any> {
    try {
      const accessToken = await this.getTokenizationAccessToken();
      const url = `${this.getTokenizationBaseUrl()}/transaction/recurring`;

      const formData = new URLSearchParams({
        instrument_token: request.instrumentToken,
        merchant_user_id: request.merchantUserId,
        user_mobile_number: request.userMobileNumber,
        basket_id: request.basketId,
        order_date: request.orderDate,
        txndesc: request.txndesc,
        txnamt: request.txnamt,
        cvv: request.cvv,
        currency_code: request.currencyCode || this.config.currencyCode,
      });

      if (request.otp) {
        formData.append("otp", request.otp);
      }
      if (request.transactionId) {
        formData.append("transaction_id", request.transactionId);
      }
      if (request.data3dsSecureId) {
        formData.append("data_3ds_secureid", request.data3dsSecureId);
      }
      if (request.data3dsPares) {
        formData.append("data_3ds_pares", request.data3dsPares);
      }
      if (request.checkoutUrl) {
        formData.append("checkout_url", request.checkoutUrl);
      }

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("PayFast initiateRecurringPayment error:", error.response?.data || error.message);
      throw new GenericError(
        error,
        "Failed to initiate recurring payment"
      );
    }
  }
}

export default PayFastService;
