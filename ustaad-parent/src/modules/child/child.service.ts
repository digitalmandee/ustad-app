import { ChildCreationAttributes } from "../../models/Child";
import {
  CreateChildDto,
  UpdateChildDto,
  DeleteChildDto,
} from "../child/child.dto";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
// import { ChildNotes } from '../../models/ChildNotes';
// import { ChildReview } from '../../models/ChildReview';
import {
  Child,
  ChildNotes,
  ChildReview,
  User,
  Offer,
  ParentSubscription,
  TutorSessions,
  OfferStatus,
  ParentSubscriptionStatus,
} from "@ustaad/shared";
import { Op } from "sequelize";

export class ChildService {
  async createChild(
    data: CreateChildDto,
    userId: string,
    imageFile?: Express.Multer.File
  ): Promise<Child> {
    const childData: any = {
      ...data,
      userId,
      firstName: data.firstName.toLowerCase(),
      lastName: data.lastName.toLowerCase(),
    };

    if (imageFile) {
      const base64Image = imageFile.buffer.toString("base64");
      childData.image = `data:${imageFile.mimetype};base64,${base64Image}`;
    }

    return await Child.create(childData);
  }

  async updateChild(
    data: UpdateChildDto,
    userId: string,
    imageFile?: Express.Multer.File
  ): Promise<Child> {
    const child = await Child.findOne({
      where: {
        id: data.id,
        userId,
      },
    });

    if (!child) {
      throw new UnProcessableEntityError("child not found");
    }

    const updateData: any = {
      ...data,
      firstName: data.firstName.toLowerCase(),
      lastName: data.lastName.toLowerCase(),
    };

    if (imageFile) {
      const base64Image = imageFile.buffer.toString("base64");
      updateData.image = `data:${imageFile.mimetype};base64,${base64Image}`;
    }

    await child.update(updateData);
    return child;
  }

  async deleteChild(id: any, userId: string): Promise<void> {
    const child = await Child.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!child) {
      throw new UnProcessableEntityError("Child not found");
    }

    await this.checkActiveAssociations(child, userId);

    await child.destroy();
  }

  async checkActiveAssociations(
    child: Child,
    userId: string
  ): Promise<boolean> {
    const childName = `${child.firstName} ${child.lastName}`;

    // Check for active offers
    const activeOffer = await Offer.findOne({
      where: {
        childName,
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
        status: {
          [Op.in]: [OfferStatus.PENDING, OfferStatus.ACCEPTED],
        },
      },
    });

    if (activeOffer) {
      throw new UnProcessableEntityError(
        "Cannot delete child with active offers"
      );
    }

    // Check for active subscriptions
    const activeSubscription = await ParentSubscription.findOne({
      where: {
        parentId: userId,
        status: {
          [Op.in]: [
            ParentSubscriptionStatus.ACTIVE,
            ParentSubscriptionStatus.CREATED,
            ParentSubscriptionStatus.DISPUTE,
            ParentSubscriptionStatus.PENDING_COMPLETION,
          ],
        },
      },
      include: [
        {
          model: Offer,
          where: { childName },
          required: true,
        },
      ],
    });

    if (activeSubscription) {
      throw new UnProcessableEntityError(
        "Cannot delete child with active subscriptions"
      );
    }

    // Check for active sessions
    const activeSession = await TutorSessions.findOne({
      where: {
        parentId: userId,
        childName,
        status: {
          [Op.in]: ["active", "paused"],
        },
      },
    });

    if (activeSession) {
      throw new UnProcessableEntityError(
        "Cannot delete child with active sessions"
      );
    }

    return true;
  }

  async getChildren(userId: string): Promise<Child[]> {
    return await Child.findAll({
      where: {
        userId,
      },
    });
  }

  async getChild(id: string, userId: string): Promise<Child> {
    const child = await Child.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!child) {
      throw new UnProcessableEntityError("Child not found");
    }

    return child;
  }

  async getChildNotesByChildId(childName: string) {
    return await ChildNotes.findAll({
      where: { childName },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "image"],
        },
      ],
    });
  }
}
