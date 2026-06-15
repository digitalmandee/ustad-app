const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

// Load environment variables from develop.env
require("dotenv").config({ path: path.join(__dirname, "develop.env") });

// Live credentials matching your workspace settings
// const MERCHANT_ID = 102;
// const SECURED_KEY = "zWHjBp2AlttNu1sK";
const MERCHANT_ID = "243567";
const SECURED_KEY = "ivL78zj1quN5BuZ63OG7Y2tU_D";
const MERCHANT_NAME = "ustaad";
const CUSTOMER_MOBILE = "92-3243214234"; // Correct format: 92-3XXXXXXXXX per pay.md

// API URLs (Using LIVE endpoints since UAT credentials are not recognized)
// const TRANSACTION_BASE_URL =
//   "https://ipguat.apps.net.pk/Ecommerce/api/Transaction";
// const TOKENIZATION_BASE_URL = "https://apipxyuat.apps.net.pk:8443/api";
const TRANSACTION_BASE_URL =
  "https://ipg1.apps.net.pk/Ecommerce/api/Transaction";
const TOKENIZATION_BASE_URL = "https://apipxy.apps.net.pk:8443/api";

/**
 * Helper: Generate SHA256 Signature for Checkout Form
 */
function generateCheckoutSignature(fields) {
  const sortedFields = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("&");

  return crypto
    .createHash("sha256")
    .update(sortedFields + SECURED_KEY)
    .digest("hex");
}

// ============================================================================
// FLOW A: INITIAL CHECKOUT / SUBSCRIPTION INITIATION (FIRST STEP)
// ============================================================================

/**
 * A1. Get Access Token for Checkout API
 */
async function getCheckoutAccessToken(basketId, amount) {
  const url = `${TRANSACTION_BASE_URL}/GetAccessToken`;
  console.log(`\n🔑 [Step A1] Requesting Checkout Access Token from: ${url}`);

  try {
    const response = await axios.post(
      url,
      {
        MERCHANT_ID: MERCHANT_ID,
        SECURED_KEY: SECURED_KEY,
        BASKET_ID: basketId,
        TXNAMT: amount,
        CURRENCY_CODE: "PKR",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // console.log("response", response);

    if (response.status === 200 && response.data?.ACCESS_TOKEN) {
      console.log("✅ Checkout Token received:", response.data.ACCESS_TOKEN);
      return response.data.ACCESS_TOKEN;
    }
    throw new Error("Access token not found in response.");
  } catch (error) {
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    console.error("❌ Failed to get checkout access token:", error.message);
    throw error;
  }
}

/**
 * A2. Initiate Subscription (Generate Redirect Form Payload)
 */
async function initiateSubscription(amount, customerEmail, customerMobile) {
  console.log(`\n🛒 [Step A2] Initiating Subscription for amount: ${amount}`);
  const basketId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  // const basketId = "SUB-1781267179741-2I0XS1";

  try {
    const formattedAmount = Number(amount).toFixed(2);
    const token = await getCheckoutAccessToken(basketId, formattedAmount);
    const orderDate = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const formFields = {
      MERCHANT_ID: MERCHANT_ID,
      MERCHANT_NAME: MERCHANT_NAME,
      TOKEN: token,
      BASKET_ID: basketId,
      TXNAMT: Number(amount).toFixed(2),
      CURRENCY_CODE: "PKR",
      ORDER_DATE: orderDate,
      TXNDESC: `Subscription payment - Basket ID: ${basketId}`,
      PROCCODE: "00",
      TRAN_TYPE: "ECOMM_PURCHASE",
      SUCCESS_URL: "https://your-frontend.com/payfast/success",
      FAILURE_URL: "https://webhook.site/f43417cd-0c18-4d01-b8cc-25b367d2243c",
      CHECKOUT_URL: "http://15.235.204.49:5000/parent/payfast/ipn",
      VERSION: "MERCHANT-CART-0.1",
      RECURRING_TXN: "TRUE",
      CUSTOMER_EMAIL_ADDRESS: customerEmail,
      CUSTOMER_MOBILE_NO: customerMobile,
    };

    // Generate SHA256 Signature (excluding SIGNATURE key itself)
    formFields.SIGNATURE = generateCheckoutSignature(formFields);

    console.log("✅ Subscription Initiation successful!");
    console.log(
      "Form POST Target URL:",
      `${TRANSACTION_BASE_URL}/PostTransaction`
    );
    console.log("Form Payload Fields:", JSON.stringify(formFields, null, 2));

    return {
      payfastUrl: `${TRANSACTION_BASE_URL}/PostTransaction`,
      formFields,
      basketId,
    };
  } catch (error) {
    console.error("❌ Subscription initiation failed:", error.message);
    throw error;
  }
}

// ============================================================================
// FLOW B: TOKENIZED RECURRING CHARGES (THE OTHER FLOW)
// ============================================================================

/**
 * B1. Get Access Token for Tokenization APIs
 */
async function getTokenizationAccessToken() {
  const url = `${TOKENIZATION_BASE_URL}/token`;
  console.log(
    `\n🔑 [Step B1] Requesting Tokenization Access Token from: ${url}`
  );

  try {
    const body = new URLSearchParams();
    body.append("merchant_id", MERCHANT_ID);
    body.append("secured_key", SECURED_KEY);
    body.append("grant_type", "client_credentials");
    body.append("customer_ip", "127.0.0.1"); // Required field per pay.md

    const response = await axios.post(url, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.status === 200 && response.data?.token) {
      console.log("✅ Tokenization Token received:", response.data.token);
      return response.data.token;
    }
    throw new Error("Tokenization token not found in response.");
  } catch (error) {
    console.error(
      "❌ Failed to get tokenization access token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * B2. Get Lists of Instruments (Saved Cards)
 */
async function getListsOfInstruments(accessToken, userMobileNumber) {
  const url = `${TOKENIZATION_BASE_URL}/user/instruments`;
  console.log(
    `\n💳 [Step B2] Retrieving saved cards for mobile: ${userMobileNumber}`
  );

  try {
    const response = await axios.get(url, {
      params: {
        merchant_user_id: "923181656210",
        user_mobile_number: "923181656210",
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "✅ Instruments response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error(
      "❌ Failed to get instruments:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * B3. Request OTP for Recurring Payment
 */
async function recurringTransactionOTP(accessToken, params) {
  const url = `${TOKENIZATION_BASE_URL}/transaction/recurring/otp`;
  console.log(
    `\n💬 [Step B3] Requesting OTP for instrument: ${params.instrumentToken}`
  );

  try {
    // Generate tokenization API secured_hash: instrument_token + merchant_user_id + user_mobile_number
    const hashData = `${params.instrumentToken}${params.userMobileNumber}${params.userMobileNumber}`;
    const securedHash = crypto
      .createHash("sha256")
      .update(hashData + SECURED_KEY)
      .digest("hex");

    const formData = new URLSearchParams({
      instrument_token: params.instrumentToken,
      merchant_user_id: params.userMobileNumber,
      user_mobile_number: params.userMobileNumber,
      basket_id: params.basketId,
      order_date: params.orderDate,
      txnamt: params.amount,
      cvv: params.cvv,
      currency_code: "PKR",
      customer_ip: "127.0.0.1", // Required field per pay.md
      merCatCode: "0000", // Required field per pay.md
      secured_hash: securedHash,
    });

    const response = await axios.post(url, formData.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ OTP Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(
      "❌ Failed to initiate recurring transaction OTP:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * B4. Execute Recurring Payment with OTP
 */
async function initiateRecurringPayment(accessToken, params) {
  const url = `${TOKENIZATION_BASE_URL}/transaction/recurring`;
  console.log(
    `\n💸 [Step B4] Executing recurring payment with OTP for basket ID: ${params.basketId}`
  );

  try {
    // Generate tokenization API secured_hash: instrument_token + merchant_user_id + user_mobile_number + txnamt + basket_id [+ otp]
    let hashData = `${params.instrumentToken}${params.userMobileNumber}${params.userMobileNumber}${params.amount}${params.basketId}`;
    if (params.otp) {
      hashData += params.otp;
    }
    const securedHash = crypto
      .createHash("sha256")
      .update(hashData + SECURED_KEY)
      .digest("hex");

    const formData = new URLSearchParams({
      instrument_token: params.instrumentToken,
      merchant_user_id: params.userMobileNumber,
      user_mobile_number: params.userMobileNumber,
      basket_id: params.basketId,
      order_date: params.orderDate,
      txndesc: `Recurring payment test - ${params.basketId}`,
      txnamt: params.amount,
      cvv: params.cvv,
      currency_code: "PKR",
      otp: params.otp,
      customer_ip: "127.0.0.1", // Required field per pay.md
      merCatCode: "0000", // Required field per pay.md
      secured_hash: securedHash,
    });

    if (params.transactionId)
      formData.append("transaction_id", params.transactionId);

    const response = await axios.post(url, formData.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(
      "✅ Payment Execution Response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error(
      "❌ Failed to execute recurring payment:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// ==========================================
// TEST EXECUTION RUNNER
// ==========================================
async function runDemo() {
  const demoEmail = "parentrealdevmine@gmail.com";
  // const demoMobile = CUSTOMER_MOBILE;
  const demoMobile = "923188277301";
  const demoAmount = "5.00";

  console.log(
    "================================================================="
  );
  console.log("🎬 STARTING COMPLETE PAYFAST WORKFLOW DEMO");
  console.log(
    "================================================================="
  );

  try {
    // -----------------------------------------------------------------
    // 1. FIRST FLOW: Initiate standard subscription checkout
    // -----------------------------------------------------------------
    const initResult = await initiateSubscription(
      demoAmount,
      demoEmail,
      demoMobile
    );

    console.log(
      "\n💡 [FLOW INFO] In production, the parent now submits the form fields above."
    );
    console.log(
      "PayFast returns the card instrument token via the IPN webhook post-checkout."
    );

    // -----------------------------------------------------------------
    // 2. SECOND FLOW: Tokenized Recurring Charges (Simulated)
    // -----------------------------------------------------------------
    const tokenizationToken = await getTokenizationAccessToken();
    const instruments = await getListsOfInstruments(
      tokenizationToken,
      demoMobile
    );

    if (!instruments || instruments.length === 0) {
      console.log(
        "\n⚠️ No saved instruments found. Steps B3 & B4 skipped (need a tokenized card)."
      );
      return;
    }

    const firstInstrumentToken = instruments[0].instrument_token;
    const demoBasketId = `TEST-RECUR-${Date.now()}`;
    const demoOrderDate = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const otpResult = await recurringTransactionOTP(tokenizationToken, {
      instrumentToken: firstInstrumentToken,
      userMobileNumber: demoMobile,
      basketId: demoBasketId,
      orderDate: demoOrderDate,
      amount: demoAmount,
      cvv: "123",
    });

    const mockOtp = "123456";
    await initiateRecurringPayment(tokenizationToken, {
      instrumentToken: firstInstrumentToken,
      userMobileNumber: demoMobile,
      basketId: demoBasketId,
      orderDate: demoOrderDate,
      amount: demoAmount,
      cvv: "123",
      otp: mockOtp,
      transactionId: otpResult.transaction_id || null,
    });
  } catch (err) {
    console.error("\n❌ Workflow demo halted due to errors.");
  }
}

runDemo();
