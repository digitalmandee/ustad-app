const routes = {
  TUTOR_ONBOARDING: "/tutor/onboarding",
  TUTOR_Profile_EDIT: "/tutor/profile/edit",
  TUTOR_Profile: "/tutor/profile",
  ALL_EXPERIENCE: "/tutor/experience",
  ADD_EXPERIENCE: "/tutor/experience/add",
  DELETE_EXPERIENCE: "/tutor/experience/delete/:experienceId",
  EDIT_EXPERIENCE: "/tutor/experience/edit/:experienceId",
  ALL_EDUCATION: "/tutor/education",
  ADD_EDUCATION: "/tutor/education/add",
  DELETE_EDUCATION: "/tutor/education/delete/:educationId",
  EDIT_EDUCATION: "/tutor/education/edit/:educationId",
  ADD_TUTOR_ABOUT: "/tutor/about/add",
  EDIT_TUTOR_ABOUT: "/tutor/about/edit",
  SET_TUTOR_SUBJECT_SETTINGS: "/tutor/subject/settings",
  GET_TUTOR_SUBJECT_SETTINGS: "/tutor/subject/settings",
  UPDATE_TUTOR_SUBJECT_SETTINGS: "/tutor/subject/settings",
  GET_TUTOR_SESSIONS: "/tutor/sessions",
  GET_TUTOR_SESSION: "/tutor/session",
  ADD_TUTOR_SESSION: "/tutor/session",
  DELETE_TUTOR_SESSION: "/tutor/session",
  EDIT_TUTOR_SESSION: "/tutor/session",
  
  
  
  // Child 
  
  ADD_CHILD_NOTE: "/tutor/child/notes",
  ADD_CHILD_REVIEW: "/tutor/child/reviews",

  TUTOR_LOCATION: "/tutor/location",
  GET_TUTORS_LOCATIONS: "/tutor/locations",
  ADD_PAYMENT_REQUEST: "/tutor/payment-request",
  GET_PAYMENT_REQUESTS: "/tutor/payment-request",
  
  // Analytics
  MONTHLY_EARNINGS: "/tutor/monthly-earnings",
  
  // Help Request
  HELP_REQUEST: "/tutor/help-requests",
  GET_HELP_REQUESTS: "/tutor/help-requests",
  
  // Contracts
  GET_CONTRACTS: "/tutor/contracts",
  CANCEL_CONTRACT: "/tutor/contracts/:contractId/cancel",
  HELP_REQUEST_CONTRACT: "/tutor/contracts/:contractId/help-request",


  // Notifications
  NOTIFICATION_HISTORY: "/tutor/notification/history",
  NOTIFICATION_READ: "/tutor/notification/read/:notificationId",


};

export default routes;
