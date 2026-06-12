const axios = require("axios");
const FormData = require("form-data");

// ============================================================================
// CONFIGURATION
// ============================================================================
// Change this to your live URL or any target environment URL
const BASE_URL = "http://15.235.204.49:5000";

// Generate unique credentials to prevent "already exists" errors
const rand = Date.now().toString().slice(-6);
const parentEmail = `parent_${rand}@test.com`;
const tutorEmail = `tutor_${rand}@test.com`;
const parentPhone = `92318${rand}0`; // 12 digits
const tutorPhone = `92300${rand}0`; // 12 digits
const parentCnic = `42101${rand}12`; // Exactly 13 digits (5 + 6 + 2)
const tutorCnic = `42101${rand}34`; // Exactly 13 digits (5 + 6 + 2)

const password = "Password123!";

console.log(
  "================================================================="
);
console.log("🚀 STARTING AUTOMATED PROFILE CREATION AND CHAT OFFER WORKFLOW");
console.log(`🌐 Base URL: ${BASE_URL}`);
console.log(
  "=================================================================\n"
);

async function runWorkflow() {
  try {
    // -------------------------------------------------------------------------
    // 1. SIGNUP PARENT & TUTOR
    // -------------------------------------------------------------------------
    console.log(`📩 Registering Parent: ${parentEmail}`);
    const parentSignupRes = await axios.post(`${BASE_URL}/auth/user-signup`, {
      role: "PARENT",
      firstName: "realparent",
      lastName: "tester",
      gender: "male", // lowercase required
      password: password,
      cnic: parentCnic,
      address: "123 Parent Street",
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan",
      email: parentEmail,
      phone: parentPhone,
    });
    console.log("✅ Parent registered successfully");

    console.log(`📩 Registering Tutor: ${tutorEmail}`);
    const tutorSignupRes = await axios.post(`${BASE_URL}/auth/user-signup`, {
      role: "TUTOR",
      firstName: "realtutor",
      lastName: "tester",
      gender: "female", // lowercase required
      password: password,
      cnic: tutorCnic,
      address: "456 Tutor Road",
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan",
      email: tutorEmail,
      phone: tutorPhone,
    });
    console.log("✅ Tutor registered successfully");

    // -------------------------------------------------------------------------
    // 2. SIGNIN PARENT & TUTOR TO GET TOKENS
    // -------------------------------------------------------------------------
    console.log("\n🔑 Signing in Parent...");
    const parentSigninRes = await axios.post(`${BASE_URL}/auth/user-signin`, {
      email: parentEmail,
      password: password,
    });
    const parentToken = parentSigninRes.data.data.token;
    const parentUserId = parentSigninRes.data.data.id;
    console.log("✅ Parent Signed In.");
    console.log(`Parent ID: ${parentUserId}`);

    console.log("🔑 Signing in Tutor...");
    const tutorSigninRes = await axios.post(`${BASE_URL}/auth/user-signin`, {
      email: tutorEmail,
      password: password,
    });
    const tutorToken = tutorSigninRes.data.data.token;
    const tutorUserId = tutorSigninRes.data.data.id;
    console.log("✅ Tutor Signed In.");
    console.log(`Tutor ID: ${tutorUserId}`);

    // -------------------------------------------------------------------------
    // 3. ONBOARD PARENT PROFILE
    // -------------------------------------------------------------------------
    console.log("\n📁 Onboarding Parent profile...");
    const parentForm = new FormData();
    parentForm.append("bankName", "Meezan Bank");
    parentForm.append("accountNumber", "12345678901234");

    // Add mock files
    parentForm.append("idFront", Buffer.from("id-front-dummy-file"), {
      filename: "id-front.png",
      contentType: "image/png",
    });
    parentForm.append("idBack", Buffer.from("id-back-dummy-file"), {
      filename: "id-back.png",
      contentType: "image/png",
    });

    const parentOnboardRes = await axios.post(
      `${BASE_URL}/parent/onboarding`,
      parentForm,
      {
        headers: {
          ...parentForm.getHeaders(),
          Authorization: `Bearer ${parentToken}`,
        },
      }
    );
    console.log("✅ Parent profile onboarded successfully");

    // -------------------------------------------------------------------------
    // 4. ONBOARD TUTOR PROFILE
    // -------------------------------------------------------------------------
    console.log("📁 Onboarding Tutor profile...");
    const tutorForm = new FormData();
    tutorForm.append("bankName", "Habib Bank Limited");
    tutorForm.append("accountNumber", "98765432109876");
    tutorForm.append("grade", "high school");
    tutorForm.append("curriculum", "cambridge");
    tutorForm.append("subjects", "math");

    // Add mock files
    tutorForm.append("resume", Buffer.from("resume-dummy-file"), {
      filename: "resume.pdf",
      contentType: "application/pdf",
    });
    tutorForm.append("idFront", Buffer.from("id-front-dummy-file"), {
      filename: "id-front.png",
      contentType: "image/png",
    });
    tutorForm.append("idBack", Buffer.from("id-back-dummy-file"), {
      filename: "id-back.png",
      contentType: "image/png",
    });

    const tutorOnboardRes = await axios.post(
      `${BASE_URL}/tutor/onboarding`,
      tutorForm,
      {
        headers: {
          ...tutorForm.getHeaders(),
          Authorization: `Bearer ${tutorToken}`,
        },
      }
    );
    console.log("✅ Tutor profile onboarded successfully");

    // -------------------------------------------------------------------------
    // 5. PARENT ADDS A CHILD (Using lowercase to avoid case-sensitive comparison bugs)
    // -------------------------------------------------------------------------
    console.log("\n👶 Adding Child to Parent profile...");
    const childForm = new FormData();
    childForm.append("firstName", "alice"); // lowercase for clean matching
    childForm.append("lastName", "doe");
    childForm.append("gender", "female");
    childForm.append("grade", "grade 5");
    childForm.append("age", "10");
    childForm.append("schoolName", "Beaconhouse School");
    childForm.append("curriculum", "Cambridge");

    const childRes = await axios.post(
      `${BASE_URL}/parent/child/add`,
      childForm,
      {
        headers: {
          ...childForm.getHeaders(),
          Authorization: `Bearer ${parentToken}`,
        },
      }
    );
    console.log("✅ Child added successfully");

    // -------------------------------------------------------------------------
    // 6. CREATE CHAT CONVERSATION BETWEEN TUTOR AND PARENT
    // -------------------------------------------------------------------------
    console.log(
      "\n💬 Creating chat room conversation between tutor and parent..."
    );
    const conversationRes = await axios.post(
      `${BASE_URL}/chat/conversations`,
      {
        type: "DIRECT",
        participantIds: [parentUserId],
      },
      {
        headers: {
          Authorization: `Bearer ${tutorToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const conversationId = conversationRes.data.data.id;
    console.log(`✅ Conversation created. ID: ${conversationId}`);

    // -------------------------------------------------------------------------
    // 7. TUTOR SENDS TUTORING OFFER TO PARENT
    // -------------------------------------------------------------------------
    console.log("📄 Tutor sending recurring offer to Parent...");
    const messageRes = await axios.post(
      `${BASE_URL}/chat/messages`,
      {
        conversationId: conversationId,
        type: "OFFER",
        content: "Hi! I would love to teach Alice. Here is my tutoring offer.",
        offer: {
          receiverId: parentUserId,
          childName: "alice", // Matches lowercase firstName
          amountMonthly: 5.0,
          subject: ["math"],
          startDate: "2026-06-12",
          startTime: "10:00:00",
          endTime: "11:00:00",
          description: "Monthly Math Tutoring",
          daysOfWeek: ["monday", "wednesday"],
          sessions: 8,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tutorToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Retrieve offer ID from message metadata
    const offerId = messageRes.data.data.metadata.offerId;
    console.log(`✅ Offer successfully sent.`);

    // -------------------------------------------------------------------------
    // 8. FINAL WORKFLOW OUTPUT
    // -------------------------------------------------------------------------
    console.log(
      "\n================================================================="
    );
    console.log("🎉 WORKFLOW RESULT DETAILS:");
    console.log(
      "================================================================="
    );
    console.log(`🔑 Parent Auth Token:  ${parentToken}`);
    console.log(`📄 Generated Offer ID: ${offerId}`);
    console.log(
      "=================================================================\n"
    );
  } catch (error) {
    console.error("\n❌ Workflow execution failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runWorkflow();
