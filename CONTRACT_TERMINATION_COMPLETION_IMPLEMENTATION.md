# Contract Termination & Completion Implementation Plan

## Overview
This document outlines the implementation approach for contract termination (with dispute handling) and contract completion (with mutual rating system).

---

## 1. Database Schema Changes

### 1.1 Update `ParentSubscription` Model
**File:** `shared/models/ParentSubscription.ts`

**Changes needed:**
- Add `disputeReason` field (TEXT, nullable) - stores cancellation reason
- Add `disputedBy` field (UUID, nullable) - stores who initiated the dispute (parentId or tutorId)
- Add `disputedAt` field (DATE, nullable) - timestamp when dispute was created
- Update `status` ENUM to include: `'active'`, `'cancelled'`, `'expired'`, `'created'`, `'dispute'`, `'completed'`, `'pending_completion'`

```typescript
status: {
  type: DataTypes.ENUM(
    'active', 
    'cancelled', 
    'expired', 
    'created', 
    'dispute',        // NEW: Contract is in dispute
    'completed',      // NEW: Both parties have rated
    'pending_completion' // NEW: Waiting for both ratings
  ),
  allowNull: false,
  defaultValue: 'active',
},
disputeReason: {
  type: DataTypes.TEXT,
  allowNull: true,
},
disputedBy: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: "users",
    key: "id",
  },
},
disputedAt: {
  type: DataTypes.DATE,
  allowNull: true,
},
```

### 1.2 Create `ContractReview` Model
**New File:** `shared/models/ContractReview.ts`

This model tracks ratings/reviews for contracts (different from `TutorReview` which is general tutor reviews).

```typescript
export interface ContractReviewAttributes {
  id: string;
  contractId: string; // ParentSubscription.id
  reviewerId: string;  // User who submitted the review (parentId or tutorId)
  reviewedId: string;  // User being reviewed (tutorId or parentId)
  reviewerRole: 'PARENT' | 'TUTOR';
  rating: number;      // 1-5 stars
  review: string;      // Optional text review
  createdAt?: Date;
  updatedAt?: Date;
}

// Status tracking:
// - When parent submits: contract.status = 'pending_completion' (if tutor hasn't rated)
// - When tutor submits: contract.status = 'pending_completion' (if parent hasn't rated)
// - When both submit: contract.status = 'completed'
```

---

## 2. Backend Implementation

### 2.1 Update Enums
**File:** `shared/constant/enums.ts`

Add new notification types:
```typescript
export enum NotificationType {
  // ... existing types ...
  
  // Contract Disputes
  CONTRACT_DISPUTED = 'CONTRACT_DISPUTED',
  CONTRACT_DISPUTE_RESOLVED = 'CONTRACT_DISPUTE_RESOLVED',
  
  // Contract Completion
  CONTRACT_RATING_SUBMITTED = 'CONTRACT_RATING_SUBMITTED',
  CONTRACT_COMPLETED = 'CONTRACT_COMPLETED',
}
```

### 2.2 Parent Service - Termination Endpoint
**File:** `ustaad-parent/src/modules/parent/parent.service.ts`

**New Method:**
```typescript
async terminateContract(
  parentId: string,
  contractId: string,
  reason: string
) {
  try {
    // 1. Verify contract exists and belongs to parent
    const contract = await ParentSubscription.findOne({
      where: {
        id: contractId,
        parentId: parentId,
      },
    });

    if (!contract) {
      throw new NotFoundError("Contract not found");
    }

    // 2. Check if contract can be terminated (not already completed/disputed)
    if (['completed', 'dispute', 'cancelled'].includes(contract.status)) {
      throw new BadRequestError(`Contract is already ${contract.status}`);
    }

    // 3. Calculate completed days for payment
    const completedSessions = await TutorSessionsDetail.count({
      where: {
        tutorId: contract.tutorId,
        parentId: contract.parentId,
        status: TutorSessionStatus.COMPLETED,
      },
      include: [{
        model: TutorSessions,
        where: { offerId: contract.offerId },
      }],
    });

    // 4. Update contract to DISPUTE status
    await contract.update({
      status: 'dispute',
      disputeReason: reason,
      disputedBy: parentId,
      disputedAt: new Date(),
      endDate: new Date(), // Set end date to now
    });

    // 5. Send notification to tutor
    await sendNotificationToUser({
      userId: contract.tutorId,
      type: NotificationType.CONTRACT_DISPUTED,
      title: '⚠️ Contract Disputed',
      body: `A parent has disputed the contract. Reason: ${reason.substring(0, 50)}...`,
      relatedEntityId: contract.id,
      relatedEntityType: 'contract',
      actionUrl: `/contracts/${contract.id}`,
    });

    // 6. Send notification to admin (if admin notification system exists)
    // This would require admin notification system

    // 7. Return contract with completed sessions count
    return {
      contract,
      completedSessions,
      message: 'Contract has been disputed and forwarded to admin for review',
    };
  } catch (error) {
    console.error("Error in terminateContract:", error);
    throw error;
  }
}
```

### 2.3 Tutor Service - Termination Endpoint
**File:** `ustaad-tutor/src/modules/tutor/tutor.service.ts`

**Update existing `cancelContract` method:**
```typescript
async terminateContract(
  tutorId: string,
  contractId: string,
  reason: string
) {
  try {
    // Similar logic to parent termination
    const contract = await ParentSubscription.findOne({
      where: {
        id: contractId,
        tutorId: tutorId,
      },
    });

    if (!contract) {
      throw new NotFoundError("Contract not found");
    }

    if (['completed', 'dispute', 'cancelled'].includes(contract.status)) {
      throw new BadRequestError(`Contract is already ${contract.status}`);
    }

    // Calculate completed sessions
    const completedSessions = await TutorSessionsDetail.count({
      where: {
        tutorId: contract.tutorId,
        parentId: contract.parentId,
        status: TutorSessionStatus.COMPLETED,
      },
      include: [{
        model: TutorSessions,
        where: { offerId: contract.offerId },
      }],
    });

    // Update to DISPUTE
    await contract.update({
      status: 'dispute',
      disputeReason: reason,
      disputedBy: tutorId,
      disputedAt: new Date(),
      endDate: new Date(),
    });

    // Notify parent
    await sendNotificationToUser({
      userId: contract.parentId,
      type: NotificationType.CONTRACT_DISPUTED,
      title: '⚠️ Contract Disputed',
      body: `Your tutor has disputed the contract. Reason: ${reason.substring(0, 50)}...`,
      relatedEntityId: contract.id,
      relatedEntityType: 'contract',
      actionUrl: `/contracts/${contract.id}`,
    });

    return {
      contract,
      completedSessions,
      message: 'Contract has been disputed and forwarded to admin for review',
    };
  } catch (error) {
    console.error("Error in terminateContract:", error);
    throw error;
  }
}
```

### 2.4 Contract Completion & Rating System

#### Parent Service - Submit Rating
**File:** `ustaad-parent/src/modules/parent/parent.service.ts`

**New Method:**
```typescript
async submitContractRating(
  parentId: string,
  contractId: string,
  rating: number,
  review: string
) {
  try {
    // 1. Verify contract
    const contract = await ParentSubscription.findOne({
      where: {
        id: contractId,
        parentId: parentId,
      },
    });

    if (!contract) {
      throw new NotFoundError("Contract not found");
    }

    // 2. Check if contract can be rated (active or pending_completion)
    if (!['active', 'pending_completion'].includes(contract.status)) {
      throw new BadRequestError("Contract cannot be rated in its current state");
    }

    // 3. Check if parent already rated
    const existingReview = await ContractReview.findOne({
      where: {
        contractId: contractId,
        reviewerId: parentId,
      },
    });

    if (existingReview) {
      throw new ConflictError("You have already rated this contract");
    }

    // 4. Create contract review
    await ContractReview.create({
      contractId: contractId,
      reviewerId: parentId,
      reviewedId: contract.tutorId,
      reviewerRole: 'PARENT',
      rating,
      review,
    });

    // 5. Check if tutor has also rated
    const tutorReview = await ContractReview.findOne({
      where: {
        contractId: contractId,
        reviewerId: contract.tutorId,
      },
    });

    // 6. Update contract status
    if (tutorReview) {
      // Both have rated - mark as completed
      await contract.update({
        status: 'completed',
        endDate: new Date(),
      });

      // Notify both parties
      await sendNotificationToUser({
        userId: contract.tutorId,
        type: NotificationType.CONTRACT_COMPLETED,
        title: '✅ Contract Completed',
        body: 'Both parties have submitted their ratings. Contract is now completed.',
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
      });
    } else {
      // Only parent rated - mark as pending_completion
      await contract.update({
        status: 'pending_completion',
      });

      // Notify tutor to submit rating
      await sendNotificationToUser({
        userId: contract.tutorId,
        type: NotificationType.CONTRACT_RATING_SUBMITTED,
        title: '⭐ Rating Request',
        body: 'The parent has submitted their rating. Please submit yours to complete the contract.',
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
      });
    }

    return {
      contract,
      message: tutorReview 
        ? 'Contract completed! Both parties have rated.' 
        : 'Rating submitted. Waiting for tutor to rate.',
    };
  } catch (error) {
    console.error("Error in submitContractRating:", error);
    throw error;
  }
}
```

#### Tutor Service - Submit Rating
**File:** `ustaad-tutor/src/modules/tutor/tutor.service.ts`

**Similar method for tutor:**
```typescript
async submitContractRating(
  tutorId: string,
  contractId: string,
  rating: number,
  review: string
) {
  // Similar logic but for tutor role
  // Check if contract belongs to tutor
  // Create ContractReview with reviewerRole: 'TUTOR'
  // Check if parent has rated
  // Update contract status accordingly
}
```

### 2.5 Admin Service - Dispute Resolution
**File:** `ustaad-admin/src/modules/admin/admin.service.ts`

**New Methods:**
```typescript
// Get all disputed contracts
async getDisputedContracts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const { rows, count } = await ParentSubscription.findAndCountAll({
    where: {
      status: 'dispute',
    },
    include: [
      {
        model: User,
        as: 'parent',
        attributes: ['id', 'fullName', 'email', 'phone'],
      },
      {
        model: User,
        as: 'tutor',
        attributes: ['id', 'fullName', 'email', 'phone'],
      },
      {
        model: Offer,
        attributes: ['id', 'childName', 'subject', 'amountMonthly'],
      },
    ],
    order: [['disputedAt', 'DESC']],
    limit,
    offset,
  });

  // Calculate completed sessions for each contract
  const contractsWithDetails = await Promise.all(
    rows.map(async (contract) => {
      const completedSessions = await TutorSessionsDetail.count({
        where: {
          tutorId: contract.tutorId,
          parentId: contract.parentId,
          status: TutorSessionStatus.COMPLETED,
        },
        include: [{
          model: TutorSessions,
          where: { offerId: contract.offerId },
        }],
      });

      return {
        ...contract.toJSON(),
        completedSessions,
      };
    })
  );

  return {
    items: contractsWithDetails,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

// Resolve dispute
async resolveDispute(
  contractId: string,
  finalStatus: 'cancelled' | 'active' | 'completed',
  adminNotes?: string
) {
  const contract = await ParentSubscription.findByPk(contractId);
  
  if (!contract) {
    throw new Error("Contract not found");
  }

  if (contract.status !== 'dispute') {
    throw new Error("Contract is not in dispute status");
  }

  // Update contract
  await contract.update({
    status: finalStatus,
    endDate: finalStatus === 'cancelled' ? new Date() : contract.endDate,
    // You might want to add adminNotes field to store resolution notes
  });

  // Notify both parties
  await sendNotificationToUser({
    userId: contract.parentId,
    type: NotificationType.CONTRACT_DISPUTE_RESOLVED,
    title: '📋 Dispute Resolved',
    body: `Your contract dispute has been resolved. Status: ${finalStatus}`,
    relatedEntityId: contract.id,
  });

  await sendNotificationToUser({
    userId: contract.tutorId,
    type: NotificationType.CONTRACT_DISPUTE_RESOLVED,
    title: '📋 Dispute Resolved',
    body: `Your contract dispute has been resolved. Status: ${finalStatus}`,
    relatedEntityId: contract.id,
  });

  // If cancelled, ensure tutor gets paid for completed days
  if (finalStatus === 'cancelled') {
    // Calculate payment for completed sessions
    // This would integrate with your payment system
    // Create payment request for tutor
  }

  return contract;
}
```

---

## 3. API Routes

### 3.1 Parent Routes
**File:** `ustaad-parent/src/routes/routes.ts`

```typescript
const routes = {
  // ... existing routes ...
  
  TERMINATE_CONTRACT: '/parent/contracts/:contractId/terminate',
  COMPLETE_CONTRACT: '/parent/contracts/:contractId/complete',
  SUBMIT_CONTRACT_RATING: '/parent/contracts/:contractId/rating',
};
```

**File:** `ustaad-parent/src/modules/parent/parent.routes.ts`

```typescript
// Terminate contract (with reason)
router.post(
  routes.TERMINATE_CONTRACT,
  authenticateJwt,
  parentController.terminateContract
);

// Complete contract (submit rating)
router.post(
  routes.SUBMIT_CONTRACT_RATING,
  authenticateJwt,
  parentController.submitContractRating
);
```

### 3.2 Tutor Routes
**File:** `ustaad-tutor/src/routes/routes.ts`

```typescript
const routes = {
  // ... existing routes ...
  
  TERMINATE_CONTRACT: '/tutor/contracts/:contractId/terminate',
  SUBMIT_CONTRACT_RATING: '/tutor/contracts/:contractId/rating',
};
```

**File:** `ustaad-tutor/src/modules/tutor/tutor.routes.ts`

```typescript
// Terminate contract (with reason)
router.post(
  routes.TERMINATE_CONTRACT,
  authenticateJwt,
  tutorController.terminateContract
);

// Submit rating
router.post(
  routes.SUBMIT_CONTRACT_RATING,
  authenticateJwt,
  tutorController.submitContractRating
);
```

### 3.3 Admin Routes
**File:** `ustaad-admin/src/routes/routes.ts`

```typescript
const routes = {
  // ... existing routes ...
  
  DISPUTED_CONTRACTS: '/admin/contracts/disputed',
  RESOLVE_DISPUTE: '/admin/contracts/:contractId/resolve',
};
```

**File:** `ustaad-admin/src/modules/admin/admin.routes.ts`

```typescript
// Get disputed contracts
router.get(
  routes.DISPUTED_CONTRACTS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getDisputedContracts
);

// Resolve dispute
router.put(
  routes.RESOLVE_DISPUTE,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.resolveDispute
);
```

---

## 4. Controllers

### 4.1 Parent Controller
**File:** `ustaad-parent/src/modules/parent/parent.controller.ts`

```typescript
terminateContract = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: parentId } = req.user;
    const { contractId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return sendErrorResponse(res, "Cancellation reason is required", 400);
    }

    const result = await this.parentService.terminateContract(
      parentId,
      contractId,
      reason
    );

    return sendSuccessResponse(
      res,
      "Contract terminated and forwarded to admin",
      200,
      result
    );
  } catch (error: any) {
    console.error("Terminate contract error:", error);
    return sendErrorResponse(
      res,
      error.message || "Failed to terminate contract",
      400
    );
  }
};

submitContractRating = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: parentId } = req.user;
    const { contractId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendErrorResponse(res, "Rating must be between 1 and 5", 400);
    }

    const result = await this.parentService.submitContractRating(
      parentId,
      contractId,
      rating,
      review || ''
    );

    return sendSuccessResponse(
      res,
      result.message,
      200,
      result
    );
  } catch (error: any) {
    console.error("Submit contract rating error:", error);
    return sendErrorResponse(
      res,
      error.message || "Failed to submit rating",
      400
    );
  }
};
```

### 4.2 Tutor Controller
**Similar implementation for tutor**

### 4.3 Admin Controller
**File:** `ustaad-admin/src/modules/admin/admin.controller.ts`

```typescript
getDisputedContracts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await this.adminService.getDisputedContracts(page, limit);
    
    return sendSuccessResponse(
      res,
      "Disputed contracts retrieved successfully",
      200,
      result
    );
  } catch (error: any) {
    throw new GenericError(error, `Error from getDisputedContracts ${__filename}`);
  }
};

resolveDispute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contractId } = req.params;
    const { finalStatus, adminNotes } = req.body;

    if (!['cancelled', 'active', 'completed'].includes(finalStatus)) {
      return sendErrorResponse(res, "Invalid final status", 400);
    }

    const result = await this.adminService.resolveDispute(
      contractId,
      finalStatus,
      adminNotes
    );

    return sendSuccessResponse(
      res,
      "Dispute resolved successfully",
      200,
      result
    );
  } catch (error: any) {
    throw new GenericError(error, `Error from resolveDispute ${__filename}`);
  }
};
```

---

## 5. Frontend Implementation Considerations

### 5.1 Termination Flow
1. **UI Component:** Modal/Dialog for termination
   - Text area for cancellation reason (required)
   - Submit button
   - Cancel button

2. **API Call:**
   ```typescript
   POST /parent/contracts/:contractId/terminate
   Body: { reason: string }
   ```

3. **After Submission:**
   - Show success message
   - Update contract status in UI to "Dispute"
   - Contract should appear in "Disputed" section
   - Show message: "Your contract has been forwarded to admin for review"

### 5.2 Completion Flow
1. **UI Component:** Rating Modal
   - Star rating component (1-5 stars)
   - Optional text review field
   - Submit button

2. **API Call:**
   ```typescript
   POST /parent/contracts/:contractId/rating
   Body: { rating: number, review?: string }
   ```

3. **After Submission:**
   - If only one party rated: Show "Waiting for [other party] to rate"
   - If both rated: Show "Contract completed!" and update status to "Completed"

### 5.3 Admin Panel
1. **Disputed Contracts List:**
   - Table showing all disputed contracts
   - Columns: Contract ID, Parent, Tutor, Child Name, Dispute Reason, Disputed By, Disputed At, Completed Sessions, Actions

2. **Dispute Resolution Modal:**
   - Show contract details
   - Show dispute reason
   - Show completed sessions count
   - Dropdown to select final status (Cancelled, Active, Completed)
   - Text area for admin notes
   - Resolve button

---

## 6. Payment Calculation for Terminated Contracts

When a contract is terminated and resolved as "cancelled", calculate payment:

```typescript
async calculateTutorPaymentForTerminatedContract(contractId: string) {
  const contract = await ParentSubscription.findByPk(contractId);
  
  // Get all completed sessions
  const completedSessions = await TutorSessionsDetail.findAll({
    where: {
      tutorId: contract.tutorId,
      parentId: contract.parentId,
      status: TutorSessionStatus.COMPLETED,
    },
    include: [{
      model: TutorSessions,
      where: { offerId: contract.offerId },
    }],
  });

  // Calculate total payment
  const totalAmount = completedSessions.reduce((sum, session) => {
    return sum + (session.TutorSession?.price || 0);
  }, 0);

  // Create payment request for tutor
  await PaymentRequests.create({
    tutorId: contract.tutorId,
    subscriptionId: contract.id,
    amount: totalAmount,
    status: TutorPaymentStatus.REQUESTED,
  });

  return {
    completedSessions: completedSessions.length,
    totalAmount,
  };
}
```

---

## 7. Database Migration

Create migration to:
1. Add new fields to `parent_subscriptions` table:
   - `disputeReason` (TEXT, nullable)
   - `disputedBy` (UUID, nullable)
   - `disputedAt` (TIMESTAMP, nullable)
   - Update `status` ENUM to include new values

2. Create `contract_reviews` table:
   - `id` (UUID, primary key)
   - `contractId` (UUID, foreign key to parent_subscriptions)
   - `reviewerId` (UUID, foreign key to users)
   - `reviewedId` (UUID, foreign key to users)
   - `reviewerRole` (ENUM: 'PARENT', 'TUTOR')
   - `rating` (INTEGER, 1-5)
   - `review` (TEXT, nullable)
   - `createdAt`, `updatedAt` (TIMESTAMP)

---

## 8. Testing Checklist

- [ ] Parent can terminate contract with reason
- [ ] Tutor can terminate contract with reason
- [ ] Terminated contract status changes to "dispute"
- [ ] Disputed contract appears in admin panel
- [ ] Admin can view dispute details
- [ ] Admin can resolve dispute
- [ ] Both parties notified on dispute resolution
- [ ] Tutor receives payment for completed sessions on cancellation
- [ ] Parent can submit rating for contract
- [ ] Tutor can submit rating for contract
- [ ] Contract status updates correctly based on rating submissions
- [ ] Contract marked as "completed" when both parties rate
- [ ] Notifications sent appropriately at each step
- [ ] Cannot rate/terminate already completed contracts
- [ ] Cannot submit duplicate ratings

---

## 9. Summary

This implementation provides:
1. **Termination Flow:** Both parties can terminate with reason → Status changes to "Dispute" → Admin reviews → Admin resolves
2. **Completion Flow:** Either party can initiate completion → Submit rating → System checks if both rated → Marks as completed when both have rated
3. **Payment Protection:** Tutor always gets paid for completed teaching days, even if contract is terminated
4. **Admin Oversight:** All disputes go to admin panel for review and resolution
5. **Notifications:** All parties notified at each step of the process

The implementation follows the existing codebase patterns and integrates seamlessly with current models and services.

