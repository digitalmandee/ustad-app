import { Op } from "sequelize";
import { UserReport, UserBlock, User, ReportStatus } from "@ustaad/shared";
import { BadRequestError } from "../../errors/bad-request-error";
import { NotFoundError } from "../../errors/not-found-error";
import { GenericError } from "../../errors/generic-error";
import { ReportUserDto, BlockUserDto } from "./social.dto";

export class SocialService {
  /**
   * Reports a user
   */
  public async reportUser(reporterId: string, dto: ReportUserDto) {
    const { reportedId, reason, description } = dto;

    if (reporterId === reportedId) {
      throw new BadRequestError("You cannot report yourself");
    }

    const reportedUser = await User.findByPk(reportedId);
    if (!reportedUser) {
      throw new NotFoundError("User to report not found");
    }

    try {
      const report = await UserReport.create({
        reporterId,
        reportedId,
        reason,
        description,
        status: ReportStatus.PENDING,
      });

      return report;
    } catch (err: any) {
      throw new GenericError(err, "Failed to create report");
    }
  }

  /**
   * Blocks a user
   */
  public async blockUser(blockerId: string, dto: BlockUserDto) {
    const { blockedId } = dto;

    if (blockerId === blockedId) {
      throw new BadRequestError("You cannot block yourself");
    }

    const blockedUser = await User.findByPk(blockedId);
    if (!blockedUser) {
      throw new NotFoundError("User to block not found");
    }

    try {
      const [block, created] = await UserBlock.findOrCreate({
        where: { blockerId, blockedId },
        defaults: { blockerId, blockedId },
      });

      return block;
    } catch (err: any) {
      throw new GenericError(err, "Failed to block user");
    }
  }

  /**
   * Unblocks a user
   */
  public async unblockUser(blockerId: string, blockedId: string) {
    try {
      const deleted = await UserBlock.destroy({
        where: { blockerId, blockedId },
      });

      if (!deleted) {
        throw new NotFoundError("Block record not found");
      }

      return { success: true };
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      throw new GenericError(err, "Failed to unblock user");
    }
  }

  /**
   * Gets list of blocked users
   */
  public async getBlockedUsers(blockerId: string) {
    try {
      const blocks = await UserBlock.findAll({
        where: { blockerId },
        include: [
          {
            model: User,
            as: "blocked",
            attributes: ["id", "firstName", "lastName", "image", "role"],
          },
        ],
      });

      return blocks.map((b) => b.get("blocked"));
    } catch (err: any) {
      throw new GenericError(err, "Failed to fetch blocked users");
    }
  }

  /**
   * Checks if a block exists between two users
   */
  public async isBlocked(userA: string, userB: string) {
    const block = await UserBlock.findOne({
      where: {
        [Op.or]: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });

    return !!block;
  }
}

export const socialService = new SocialService();
