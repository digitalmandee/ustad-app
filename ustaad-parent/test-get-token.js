const path = require("path");
const axios = require("axios");

// Load environment variables from develop.env
require("dotenv").config({ path: path.join(__dirname, "develop.env") });

const merchantId = process.env.PAYFAST_MERCHANT_ID || "";
const securedKey = process.env.PAYFAST_SECURED_KEY || "";
const env = process.env.PAYFAST_ENV || "UAT";

async function testGetTokenizationAccessToken() {
  const baseUrl =
    env === "UAT"
      ? "https://apipxy.apps.net.pk:8443/api"
      : "https://apipxyuat.apps.net.pk:8443/api";

  const url = `${baseUrl}/token`;

  console.log("--- PayFast Tokenization API Test ---");
  console.log(`URL: ${url}`);
  console.log(`Merchant ID: ${merchantId}`);
  console.log(`Secured Key: ${securedKey}`);
  console.log(`Environment: ${env}`);
  console.log("------------------------------------");

  try {
    const body = new URLSearchParams();
    body.append("merchant_id", merchantId);
    body.append("secured_key", securedKey);
    body.append("grant_type", "client_credentials");

    const response = await axios.post(url, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("Status Code:", response.status);
    console.log("Response Body:", response.data);

    if (response.data && response.data.token) {
      console.log("\n✅ Successfully retrieved token:", response.data.token);
    } else {
      console.log("\n❌ Failed: Token not found in response.");
    }
  } catch (error) {
    console.error("\n❌ Request failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testGetTokenizationAccessToken();
