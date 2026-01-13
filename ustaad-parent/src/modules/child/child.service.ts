import { ChildCreationAttributes } from "../../models/Child";
import {
  CreateChildDto,
  UpdateChildDto,
  DeleteChildDto,
} from "../child/child.dto";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
// import { ChildNotes } from '../../models/ChildNotes';
// import { ChildReview } from '../../models/ChildReview';
import { Child, ChildNotes, ChildReview } from "@ustaad/shared";

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

    await child.destroy();
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
    // return "Child Notes";
    return await ChildNotes.findAll({ where: { childName } });
  }
}
