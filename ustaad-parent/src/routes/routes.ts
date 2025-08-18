import { OfferStatus } from "src/constant/enums";

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
  CHILD_GET_NOTES: "/parent/child/notes/:childId",
  CHILD_GET_REVIEWS: "/parent/child/reviews/:childId",


  // offer
  OFFER_UPDATE_STATUS: '/parent/offer/:status/:offerId',
  
  // tutor reviews
  ADD_TUTOR_REVIEW: '/parent/tutor/review',
  
  // webhook
  STRIPE_WEBHOOK: '/parent/webhook/stripe',
};

export default routes;
