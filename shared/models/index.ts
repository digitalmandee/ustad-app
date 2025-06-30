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

export function initAllModels(sequelize: Sequelize) {
  initUserModel(sequelize);
  initOtpModel(sequelize);
  initSessionModel(sequelize);
  initTutorModel(sequelize);
  initParentModel(sequelize);
  initChildModel(sequelize);
  initChildNotesModel(sequelize);
  initChildReviewModel(sequelize);
  initSubjectModel(sequelize);
  initTutorEducationModel(sequelize);
  initTutorExperienceModel(sequelize);
  initTutorSettingsModel(sequelize);
  initTutorLocationModel(sequelize);
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
  TutorLocation
};
