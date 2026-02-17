import { OfferStatus } from "@ustaad/shared";

const routes = {
  PARENT_ONBOARDING: "/parent/onboarding",
  PARENT_Profile_EDIT: "/parent/profile/edit",
  PARENT_Profile: "/parent/profile",
  ADD_PARENT_CUSTOMER_ID: "/parent/customer-id",
  ADD_PARENT_SUBSCRIPTION: "/parent/subscription",
  CANCEL_PARENT_SUBSCRIPTION: "/parent/subscription/cancel/:subscriptionId",
  GET_ALL_SUBSCRIPTIONS: "/parent/subscriptions",
  GET_TUTOR_PROFILE: "/parent/tutor/:tutorId",

  // Payment Method routes
  PARENT_PAYMENT_METHODS: "/parent/payment-methods",
  PARENT_PAYMENT_METHOD: "/parent/payment-methods/:paymentMethodId",

  CHILD_CREATE: "/parent/child/add",
  CHILD_UPDATE: "/parent/child/update",
  CHILD_DELETE: "/parent/child/:id",
  CHILD_GET_ALL: "/parent/children",
  CHILD_GET_ONE: "/parent/child/:id",
  CHILD_GET_NOTES: "/parent/child/notes/:childName",
  CHILD_GET_REVIEWS: "/parent/child/reviews/:childId",

  // offer
  OFFER_UPDATE_STATUS: "/parent/offer/:status/:offerId",

  // tutor reviews
  ADD_TUTOR_REVIEW: "/parent/tutor/review",

  // Contract termination and completion
  GET_ACTIVE_CONTRACTS: "/parent/contracts",
  TERMINATE_CONTRACT: "/parent/contracts/:contractId",
  SUBMIT_CONTRACT_RATING: "/parent/contracts/:contractId/rating",

  // Analytics
  MONTHLY_SPENDING: "/parent/monthly-spending",

  // webhook
  STRIPE_WEBHOOK: "/parent/webhook/stripe",

  // PayFast routes
  PAYFAST_SUBSCRIPTION_INITIATE: "/parent/payfast/subscription/initiate",
  PAYFAST_IPN: "/parent/payfast/ipn",
  SUBSCRIPTION_STATUS: "/parent/subscriptions/status",
  SUBSCRIPTION_CHARGE: "/parent/subscriptions/charge",

  // PayFast Tokenization routes
  PAYFAST_GET_INSTRUMENTS: "/parent/payfast/instruments",
  PAYFAST_RECURRING_OTP: "/parent/payfast/recurring/otp",
  PAYFAST_INITIATE_RECURRING: "/parent/payfast/recurring/initiate",

  // PayFast Callback routes
  PAYFAST_SUCCESS: "/parent/payfast/success",

  // 3DS Callback webhook
  PAYFAST_3DS_CALLBACK: "/parent/payfast/3dscallback",

  // Notifications
  GET_TRANSACTIONS: "/parent/transactions",
  DELETE_NOTIFICATION: "/parent/notification/:id",
  BULK_DELETE_NOTIFICATIONS: "/parent/notifications/bulk-delete",

  // Bypass routes
  PAYMENT_INTENT_BYPASS: "/parent/payment/intent-bypass",
  UPDATE_PARENT_DOCUMENTS: "/parent/update-documents",
  PARENT_Profile_IMAGE_DELETE: "/parent/profile/image/delete",
  UPDATE_BANK_DETAILS: "/parent/bank-details",

  // Tutor Payment Request routes
  ADD_PAYMENT_REQUEST: "/parent/payment-request",
  GET_PAYMENT_REQUESTS: "/parent/payment-request",
};

export default routes;
