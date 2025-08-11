import { ConflictError } from "../../errors/conflict-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { NotFoundError } from "../../errors/not-found-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ITutorOnboardingDTO } from "./admin.dto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import geohash from "ngeohash";
import { PaymentStatus } from "../../constant/enums";

import {
  User,
  Tutor,
  Subject,
  TutorEducation,
  TutorExperience,
  TutorSettings,
  ChildNotes,
  ChildReview,
  TutorLocation,
  PaymentRequest,
} from "@ustaad/shared";


export default class AdminService {
}
