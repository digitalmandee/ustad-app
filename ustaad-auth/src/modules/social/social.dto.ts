import { ReportReason } from "@ustaad/shared";

export interface ReportUserDto {
  reportedId: string;
  reason: ReportReason;
  description: string;
}

export interface BlockUserDto {
  blockedId: string;
}
