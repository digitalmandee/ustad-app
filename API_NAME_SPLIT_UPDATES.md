# API Updates: User & Child Name Split

This document lists the APIs updated to use `firstName` and `lastName` instead of `fullName`.

## 1. ustaad-auth (Authentication)

| API Endpoints              | Type         | Impact      | Fields                  |
| :------------------------- | :----------- | :---------- | :---------------------- |
| `POST /auth/signup`        | Request Body | Required    | `firstName`, `lastName` |
| `POST /auth/google-signup` | Request Body | Required    | `firstName`, `lastName` |
| `POST /auth/login`         | Response     | User Object | `firstName`, `lastName` |
| `POST /auth/verify-otp`    | Response     | User Object | `firstName`, `lastName` |

## 2. ustaad-tutor (Tutor Management)

| API Endpoints                 | Type         | Impact      | Fields                  |
| :---------------------------- | :----------- | :---------- | :---------------------- |
| `PUT /profile` (Edit Profile) | Request Body | Optional    | `firstName`, `lastName` |
| `GET /profile`                | Response     | User Object | `firstName`, `lastName` |
| `GET /tutors/search`          | Response     | User Object | `firstName`, `lastName` |

## 3. ustaad-parent (Parent & Child Management)

| API Endpoints                 | Type         | Impact       | Fields                  |
| :---------------------------- | :----------- | :----------- | :---------------------- |
| `PUT /profile` (Edit Profile) | Request Body | Optional     | `firstName`, `lastName` |
| `GET /profile`                | Response     | User Object  | `firstName`, `lastName` |
| `POST /child` (Add Child)     | Request Body | Required     | `firstName`, `lastName` |
| `PUT /child/:id` (Edit Child) | Request Body | Optional     | `firstName`, `lastName` |
| `GET /child`                  | Response     | Child Object | `firstName`, `lastName` |

## 4. ustaad-chat (Chat & Conversations)

| API Endpoints             | Type         | Impact         | Fields                           |
| :------------------------ | :----------- | :------------- | :------------------------------- |
| `GET /chat/conversations` | Response     | Metadata       | `name`, `lastMessage.senderName` |
| `GET /chat/messages`      | Response     | Message Object | `senderName`                     |
| `/chat/notifications`     | Push Payload | Metadata       | `senderName`                     |

## 5. ustaad-admin (Admin Panel)

| API Endpoints           | Type              | Impact     | Fields                                |
| :---------------------- | :---------------- | :--------- | :------------------------------------ |
| `POST /admin/create`    | Request Body      | Required   | `firstName`, `lastName`               |
| `GET /admin/parents`    | Response / Search | Attributes | `firstName`, `lastName`               |
| `GET /admin/tutors`     | Response / Search | Attributes | `firstName`, `lastName`               |
| `GET /admin/disputes`   | Response          | Attributes | `parent.firstName`, `tutor.firstName` |
| `GET /admin/onboarding` | Response          | Attributes | `firstName`, `lastName`               |

---

### Key Information for Developers:

- **Request Bodies**: APIs creating or updating a User or Child now require `firstName` and `lastName`.
- **Responses**: The `fullName` field is replaced by `firstName` and `lastName`.
- **Search**: Search queries now filter across both `firstName` and `lastName` using a Case-Insensitive search.
