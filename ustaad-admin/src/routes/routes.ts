const routes = {
  STATS: "/admin/stats",
  PARENTS: "/admin/parents",
  PARENT_BY_ID: "/admin/parents/:id",
  TUTORS: "/admin/tutors",
  TUTOR_BY_ID: "/admin/tutors/:id",
  PAYMENT_REQUESTS: "/admin/payment-requests",
  PAYMENT_REQUEST_BY_ID: "/admin/payment-requests/:id",
  PAYMENT_REQUEST_STATUS: "/admin/payment-requests",

  // User management
  PENDING_ONBOARD_USERS: "/admin/users/pending-onboard",
  APPROVE_ONBOARDING: "/admin/users/approve-onboarding",

  // Admin user management
  CREATE_ADMIN: "/admin/users/create",
  GET_ALL_ADMINS: "/admin/users/admins",
  DELETE_ADMIN: "/admin/users/admins",

  // Contract dispute management
  DISPUTED_CONTRACTS: "/admin/contracts/disputed",
  RESOLVE_DISPUTE: "/admin/contracts/:contractId/resolve",
  REFUND: "/admin/contracts/refund",

  // User data retrieval
  USER_DATA_BY_ID: "/admin/users/data/:id",
  DELETE_USER: "/admin/users/:id",
};

export default routes;
