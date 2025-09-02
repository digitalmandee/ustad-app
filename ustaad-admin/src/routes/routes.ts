const routes = {
  STATS: '/admin/stats',
  PARENTS: '/admin/parents',
  PARENT_BY_ID: '/admin/parents/:id',
  TUTORS: '/admin/tutors',
  TUTOR_BY_ID: '/admin/tutors/:id',
  PAYMENT_REQUESTS: '/admin/payment-requests',
  PAYMENT_REQUEST_BY_ID: '/admin/payment-requests/:id',
  PAYMENT_REQUEST_STATUS: '/admin/payment-requests',
  
  // Admin user management
  CREATE_ADMIN: '/admin/users/create',
  GET_ALL_ADMINS: '/admin/users/admins',
  DELETE_ADMIN: '/admin/users/admins',
};

export default routes;
