
import { UserRole } from "../../constant/enums";
import { User, Parent, Tutor, TutorEducation, TutorExperience, Child, ParentTransaction, ParentSubscription } from "@ustaad/shared";
import { Op } from "sequelize";

export default class AdminService {
  async getStats() {
    const totalUsers = await User.count();
    const totalParents = await User.count({ where: { role: UserRole.PARENT } });
    const totalTutors = await User.count({ where: { role: UserRole.TUTOR } });

    return { totalUsers, totalParents, totalTutors };
  }

  async getAllParents(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Parent.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'image', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async getParentById(id: string) {
    // id refers to parent.userId or parent.id? We'll support both
    const parent = await Parent.findOne({
      where: { [Op.or]: [{ id }, { userId: id }] },
      include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'image', 'role'] },
      ],
    });
    if (!parent) return null;

    // Fetch associated data
    const children = await Child.findAll({ where: { userId: parent.userId } });
    const subscriptions = await ParentSubscription.findAll({ where: { parentId: parent.userId } });
    const transactions = await ParentTransaction.findAll({ where: { parentId: parent.userId } });

    return { parent, children, subscriptions, transactions };
  }

  async getAllTutors(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Tutor.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'image', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async getTutorById(id: string) {
    const tutor = await Tutor.findOne({
      where: { [Op.or]: [{ id }, { userId: id }] },
      include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'image', 'role'] },
      ],
    });
    if (!tutor) return null;

    const education = await TutorEducation.findAll({ where: { tutorId: tutor.userId } });
    const experience = await TutorExperience.findAll({ where: { tutorId: tutor.userId } });

    return { tutor, education, experience };
  }
}
