import { MyApi } from "./src/sdk.js";

async function runTest() {
  console.log("🚀 Starting SDK Verification Test...");

  // Initialize SDK
  // Make sure your backend logic at localhost:2800 matches this configuration
  const api = new MyApi({
    baseUrl: "http://localhost:2800/v1",
  });

  try {
    // 1. Test Login
    // console.log("1️⃣  Testing Login...");
    // Replace with valid credentials for your local environment
    const credentials = {
      apiKey:
        "04cc7f0e904a78a31a5aae1d552526483c619379a6642bac58d338fc19af1e60",
      secret:
        "eb8cf17a585c450d23beedc12480e8e3b27ba6597527846d05a65674072cc767",
    };

    // This calls api.login -> which POSTs to /merchant/get-merchant
    // per your modifications in sdk.js
    const loginResult = await api.login(credentials);

    // console.log("✅ Login successful!");
    console.log("loginResult", loginResult.data.data.keyCombo);

    const permissions = await api.getPermissions();
    console.log("✅ Permissions retrieved:", permissions);

    // 2. Test an Authenticated Endpoint (Example)
    // Uncomment and adjust the following lines to test a specific resource
    /*
    console.log("\n2️⃣  Testing Get Resource...");
    const user = await api.getUser("123");
    console.log("✅ Resource retrieved:", user);
    */
  } catch (error) {
    console.error("\n❌ Test Failed:");
    // console.log(error);
    if (error.response) {
      // Server responded with a status code outside 2xx range
      console.error(
        `   Status: ${error.response.status} ${error.response.statusText}`
      );
      console.error("   Data:", error.response.data);
    } else if (error.request) {
      // Request was made but no response was received
      console.error(
        "   No response received from server. Is it running at http://localhost:2800?"
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("   Error:", error.message);
    }
  }
}

runTest();
