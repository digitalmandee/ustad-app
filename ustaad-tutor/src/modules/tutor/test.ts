async cancelContract(tutorId: string, contractId: string) {
    try {
      // First, verify that the contract exists and belongs to this tutor
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          tutorId: tutorId,
        },
      });

      if (!contract) {
        throw new NotFoundError(
          "Contract not found or you don't have permission to cancel this contract"
        );
      }

      // Check if contract is already cancelled
      if (contract.status === "cancelled") {
        throw new BadRequestError("Contract is already cancelled");
      }

      // Update the contract status to cancelled
      await ParentSubscription.update(
        {
          status: "cancelled",
          endDate: new Date(), // Set end date to current date
        },
        {
          where: {
            id: contractId,
            tutorId: tutorId,
          },
        }
      );

      // Get the updated contract with related data
      const updatedContract = await ParentSubscription.findOne({
        where: { id: contractId },
        include: [
          {
            model: User,
            as: "parent",
            foreignKey: "parentId",
            attributes: ["id", "fullName", "email", "image", "role"],
          },
          {
            model: Offer,
            attributes: [
              "id",
              "childName",
              "subject",
              "startDate",
              "startTime",
              "endTime",
              "description",
              "daysOfWeek",
            ],
            required: false,
          },
        ],
      });

      return updatedContract;
    } catch (error) {
      console.error("Error in cancelContract:", error);
      throw error;
    }
  }

  async createHelpRequestAgainstContract(
    tutorId: string,
    requesterRole: UserRole,
    contractId: string,
    subject: string,
    message: string
  ) {
    try {
      let contract: any;

      console.log("requesterRole", requesterRole);
      console.log("contractId", contractId);
      console.log("tutorId", tutorId);

      if (requesterRole === UserRole.TUTOR) {
        contract = await ParentSubscription.findOne({
          where: {
            id: contractId,
            tutorId: tutorId,
          },
        });
      } else if (requesterRole === UserRole.PARENT) {
        contract = await ParentSubscription.findOne({
          where: {
            id: contractId,
            parentId: tutorId,
          },
        });
      }

      if (!contract) {
        throw new NotFoundError(
          "Contract not found or you don't have permission to create help request for this contract"
        );
      }

      const data: any = {
        parentId: contract.parentId,
        tutorId: contract.tutorId,
        contractId: contract.id,
      };

      // Create help request against the parent from this contract
      const helpRequest = await HelpRequests.create({
        requesterId:
          requesterRole === UserRole.TUTOR ? tutorId : contract.parentId,
        againstId:
          requesterRole === UserRole.TUTOR ? contract.parentId : tutorId,
        requester: requesterRole,
        subject: `Contract Help Request: ${subject}`,
        message: `Contract ID: ${contractId}\n\n${message}`,
        status: HelpRequestStatus.OPEN,
        type: HelpRequestType.CONTRACT,
        data,
      });

      const contractData = contract.toJSON() as any;

      return {
        helpRequest,
        contract: {
          id: contract.id,
          parentName: contractData.parent?.fullName,
          childName: contractData.Offer?.childName,
          subject: contractData.Offer?.subject,
        },
      };
    } catch (error) {
      console.error("Error in createHelpRequestAgainstContract:", error);
      throw error;
    }
  }
}