import { Sequelize } from "sequelize";
import { initChildModel, Child } from "./Child";
import { initChildNotesModel, ChildNotes } from "./ChildNotes";
import { initChildReviewModel, ChildReview } from "./ChildReview";
import { initParentModel, Parent } from "./Parent";
import { initUserModel, User } from "./User";
import { initOtpModel, Otp } from "./Otp";

import { initSessionModel, Session } from "./Session";
import { initSubjectModel, Subject } from "./Subjects";
import { initTutorModel, Tutor } from "./Tutor";
import { initTutorEducationModel, TutorEducation } from "./TutorEducation";
import { initTutorExperienceModel, TutorExperience } from "./TutorExperience";
import { initTutorSettingsModel, TutorSettings } from "./TutorSettings";
import { initTutorLocationModel, TutorLocation } from "./TutorLocations";
import { initParentSubscriptionModel, ParentSubscription } from "./ParentSubscription";
import { initTutorSessionsModel, TutorSessions } from "./TutorSessions";
import { initPaymentRequestModel, PaymentRequest } from "./PaymentRequest";
import { initPaymentMethodModel, PaymentMethod } from "./PaymentMethod";

// Chat models
import { initConversationModel, Conversation } from "./Conversation";
import { initConversationParticipantModel, ConversationParticipant } from "./ConversationParticipant";
import { initMessageModel, Message } from "./Message";
import { initOfferModel, Offer } from "./Offer";

export function initAllModels(sequelize: Sequelize) {
  initUserModel(sequelize);
  initOtpModel(sequelize);
  initSessionModel(sequelize);
  initTutorModel(sequelize);
  initParentModel(sequelize);
  initChildModel(sequelize);
  initSubjectModel(sequelize);
  initChildNotesModel(sequelize);
  initChildReviewModel(sequelize);
  initTutorEducationModel(sequelize);
  initTutorExperienceModel(sequelize);
  initTutorSettingsModel(sequelize);
  initTutorLocationModel(sequelize);
  initParentSubscriptionModel(sequelize);
  initTutorSessionsModel(sequelize);
  initPaymentRequestModel(sequelize);
  initPaymentMethodModel(sequelize);
  
  // Initialize chat models
  initConversationModel(sequelize);
  initConversationParticipantModel(sequelize);
  initMessageModel(sequelize);
  initOfferModel(sequelize);
}

export {
  Child,
  ChildNotes,
  ChildReview,
  Parent,
  Session,
  Subject,
  Tutor,
  TutorEducation,
  TutorExperience,
  TutorSettings,
  User,
  Otp,
  TutorLocation,
  ParentSubscription,
  TutorSessions,
  PaymentRequest,
  PaymentMethod,
  // Chat models
  Conversation,
  ConversationParticipant,
  Message,
  Offer
};
