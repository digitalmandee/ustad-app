import { Child, ChildCreationAttributes } from "../../models/Child";
import {
  CreateChildDto,
  UpdateChildDto,
  DeleteChildDto,
} from "../child/child.dto";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";

export class ChildService {
  async createChild(data: CreateChildDto, userId: string): Promise<Child> {
    const childData: ChildCreationAttributes = {
      ...data,
      userId,
    };
    return await Child.create(childData);
  }

  async updateChild(data: UpdateChildDto, userId: string): Promise<Child> {
    const child = await Child.findOne({
      where: {
        id: data.id,
        userId,
      },
    });

    if (!child) {
      throw new UnProcessableEntityError("child not found");
    }

    await child.update(data);
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
}
