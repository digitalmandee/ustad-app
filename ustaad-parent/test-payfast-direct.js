const axios = require("axios");
const crypto = require("crypto");

// ============================================================================
// CONFIGURATION & CREDENTIALS FROM THE PAYFAST PDF GUIDE (Page 13)
// ============================================================================
const MERCHANT_ID = "102";
const SECURED_KEY = "zWHjBp2AlttNu1sK";
const BASKET_ID = `ITEM-${Date.now()}`;
const TXNAMT = "100.00";
const CURRENCY_CODE = "PKR";

const GET_ACCESS_TOKEN_URL =
  "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken";
const POST_TRANSACTION_URL =
  "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction";

console.log(
  "================================================================="
);
console.log("🚀 STARTING DIRECT PAYFAST API TESTING SCRIPT");
console.log(
  `📄 Reference Document: payfast.pdf (Merchant Integration Guide v1.2)`
);
console.log(
  "=================================================================\n"
);

/**
 * 1. Helper to generate standard PayFast SHA256 Signature for Checkout
 */
function generateCheckoutSignature(fields, securedKey) {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(fields).sort();

  // Map to key=value pairs and join with &
  const sortedParamsString = sortedKeys
    .map((key) => `${key}=${fields[key]}`)
    .join("&");

  // Generate SHA256 hash
  return crypto
    .createHash("sha256")
    .update(sortedParamsString + securedKey)
    .digest("hex");
}

/**
 * 2. Helper to generate standard PayFast IPN Validation Hash (Page 19)
 * Format: basket_id|secured_key|merchant_id|err_code
 */
function calculateIPNValidationHash(basketId, securedKey, merchantId, errCode) {
  const hashString = `${basketId}|${securedKey}|${merchantId}|${errCode}`;
  return crypto.createHash("sha256").update(hashString).digest("hex");
}

async function runTests() {
  let token = null;

  // -------------------------------------------------------------------------
  // TEST 1: Request Access Token from PayFast UAT Endpoint (Page 8 / Page 14)
  // -------------------------------------------------------------------------
  console.log(
    "-----------------------------------------------------------------"
  );
  console.log("TEST 1: Request Access Token from PayFast Sandbox");
  console.log(`POST URL: ${GET_ACCESS_TOKEN_URL}`);
  console.log("Payload:", {
    MERCHANT_ID,
    SECURED_KEY,
    BASKET_ID,
    TXNAMT,
    CURRENCY_CODE,
  });
  console.log(
    "-----------------------------------------------------------------"
  );

  try {
    const tokenResponse = await axios.post(
      GET_ACCESS_TOKEN_URL,
      {
        MERCHANT_ID,
        SECURED_KEY,
        BASKET_ID,
        TXNAMT,
        CURRENCY_CODE,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CURL/PHP PayFast Example", // Empty user agents are not allowed per Page 8
        },
      }
    );

    console.log("Response Status:", tokenResponse.status);
    console.log("Response Data:", JSON.stringify(tokenResponse.data, null, 2));

    if (tokenResponse.data && tokenResponse.data.ACCESS_TOKEN) {
      token = tokenResponse.data.ACCESS_TOKEN;
      console.log("\n✅ Test 1 Passed: Successfully retrieved ACCESS_TOKEN!");
    } else {
      console.log("\n⚠️ Test 1 Warning: ACCESS_TOKEN not found in response.");
    }
  } catch (error) {
    console.error("\n❌ Test 1 Failed: Token request failed.");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error Message:", error.message);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 2: Verify Validation Hash Formula using PDF Example Vector (Page 19)
  // -------------------------------------------------------------------------
  console.log(
    "\n-----------------------------------------------------------------"
  );
  console.log("TEST 2: Verify Validation Hash Formula (Vector from Page 19)");
  console.log(
    "-----------------------------------------------------------------"
  );

  const testBasketId = "BAS-01";
  const testSecuredKey = "jdnkaabcks";
  const testMerchantId = "102";
  const testErrCode = "000";
  const expectedHash =
    "e8192a7554dd699975adf39619c703a492392edf5e416a61e183866ecdf6a2a2";

  console.log("Input Parameters:");
  console.log(`- Basket ID:         ${testBasketId}`);
  console.log(`- Merchant Sec Key:  ${testSecuredKey}`);
  console.log(`- Merchant ID:       ${testMerchantId}`);
  console.log(`- Error Code:        ${testErrCode}`);
  console.log(
    `Expected Hash string sequence: "${testBasketId}|${testSecuredKey}|${testMerchantId}|${testErrCode}"`
  );
  console.log(`Expected Output SHA256:       "${expectedHash}"`);

  const computedHash = calculateIPNValidationHash(
    testBasketId,
    testSecuredKey,
    testMerchantId,
    testErrCode
  );
  console.log(`Computed Output SHA256:       "${computedHash}"`);

  if (computedHash === expectedHash) {
    console.log(
      "\n✅ Test 2 Passed: Computed validation hash matches the PDF vector exactly!"
    );
  } else {
    console.log(
      "\n❌ Test 2 Failed: Computed validation hash does not match PDF vector."
    );
  }

  // -------------------------------------------------------------------------
  // TEST 3: Generate Checkout Form & Signature Payload (Page 9-12 / Page 15-17)
  // -------------------------------------------------------------------------
  console.log(
    "\n-----------------------------------------------------------------"
  );
  console.log("TEST 3: Generate Checkout Form & Signature Payload");
  console.log(
    "-----------------------------------------------------------------"
  );

  const useToken = token || "MOCK_TOKEN_VAL_12345";
  const orderDate = new Date().toISOString().replace("T", " ").substring(0, 19);

  // Form parameters structure from Page 9-12 of the PDF
  const formFields = {
    MERCHANT_ID: MERCHANT_ID,
    MERCHANT_NAME: "UAT Demo Merchant",
    TOKEN: useToken,
    PROCCODE: "00",
    TXNAMT: TXNAMT,
    CUSTOMER_MOBILE_NO: "03000000000",
    CUSTOMER_EMAIL_ADDRESS: "some-email@example.com",
    VERSION: "MERCHANTCART-0.1",
    TXNDESC: "Item Purchased from Cart",
    SUCCESS_URL: "http://merchant-site-example.com/success",
    FAILURE_URL: "http://merchant-site-example.com/failure",
    BASKET_ID: BASKET_ID,
    ORDER_DATE: orderDate,
    CHECKOUT_URL: "http://merchant-site-example.com/checkout",
    RECURRING_TXN: "TRUE",
  };

  console.log(
    "Form fields to sort & sign (excluding SIGNATURE key):",
    JSON.stringify(formFields, null, 2)
  );

  const signature = generateCheckoutSignature(formFields, SECURED_KEY);
  formFields.SIGNATURE = signature;

  console.log(`\nGenerated Signature: "${signature}"`);
  console.log("Form target post URL:", POST_TRANSACTION_URL);
  console.log(
    "\n✅ Test 3 Passed: Successfully generated signed checkout form payload."
  );

  console.log(
    "\n================================================================="
  );
  console.log("🏁 DIRECT PAYFAST API TESTING COMPLETE");
  console.log(
    "================================================================="
  );
}

runTests();
