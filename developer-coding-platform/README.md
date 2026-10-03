# Developer Coding Challenge Platform

A production-ready RESTful API backend built with **Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, and JavaScript** for conducting automated and manual developer coding assessments.

The platform enables a **Host** to create coding problems, set test cases, assign them to developers with unique secure challenge tokens, evaluate submissions automatically in a safe isolated environment, and perform manual review with marks and feedback.

---

## Table of Contents

1. [Features](#1-features)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Folder Structure](#3-architecture--folder-structure)
4. [MongoDB Atlas Setup](#4-mongodb-atlas-setup)
5. [Environment Variables](#5-environment-variables)
6. [Installation & Setup](#6-installation--setup)
7. [User Roles & Security Architecture](#7-user-roles--security-architecture)
8. [Code Execution Security](#8-code-execution-security)
9. [Complete API Endpoints List](#9-complete-api-endpoints-list)
10. [Database Schemas](#10-database-schemas)
11. [Postman End-to-End Testing Flow](#11-postman-end-to-end-testing-flow)
12. [Example API Requests & Responses](#12-example-api-requests--responses)
13. [Graceful Shutdown](#13-graceful-shutdown)
14. [Troubleshooting](#14-troubleshooting)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Features

### Host Capabilities
* **Authentication**: Register and login as a Host.
* **Problem Management**: Create, view, update, and delete coding problems with allowed languages, constraints, examples, public and hidden test cases.
* **Problem Ownership**: Strict ownership bounds — Hosts can only modify/delete problems they created.
* **Assignment & Unique Links**: Assign problems to specific developers and generate cryptographically secure unique challenge links (`/challenge/:token`).
* **Submissions Inspection**: View code submissions, submission history, and automatic test results.
* **Manual Evaluation**: Award final marks and structured feedback to developers.
* **Host Dashboard**: View high-level metrics (total problems, assigned developers, total assignments, pending evaluations, recent submissions).

### Developer Capabilities
* **Authentication**: Register and login as a Developer.
* **Challenge Access**: Open unique challenge links assigned to them without exposing hidden test cases.
* **Solution Submission**: Submit solution code in supported languages (JavaScript, Python, Java, C++).
* **Automatic Evaluation**: Receive instant test execution feedback and calculated automatic marks.
* **Submission History**: View past submission attempts per assignment.
* **Final Results**: View host feedback and final awarded marks once evaluated.
* **Developer Dashboard**: View personal metrics (total assignments, pending challenges, average marks, score summary).

---

## 2. Technology Stack

* **Backend Framework**: Node.js & Express.js
* **Database**: MongoDB Atlas / MongoDB
* **ODM**: Mongoose v8
* **Authentication**: JSON Web Tokens (jsonwebtoken) & bcryptjs
* **Configuration & Middleware**: dotenv, CORS
* **Development Server**: Nodemon

---

## 3. Architecture & Folder Structure

Built using clean **MVC Architecture** with decoupled services, custom middleware, and centralized error handling.

```
developer-coding-platform/
├── src/
│   ├── config/
│   │   └── database.js          # Mongoose database connection setup
│   ├── controllers/
│   │   ├── authController.js        # Auth logic (Register, Login, Me)
│   │   ├── problemController.js     # Problem CRUD & ownership
│   │   ├── assignmentController.js  # Problem assignments & challenge tokens
│   │   ├── submissionController.js  # Code submissions & evaluation
│   │   └── dashboardController.js   # Host & Developer analytics
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT protection middleware
│   │   ├── roleMiddleware.js       # Role authorization (host / developer)
│   │   ├── errorMiddleware.js      # Centralized error handler
│   │   └── validationMiddleware.js # Input request validators
│   ├── models/
│   │   ├── User.js                 # User schema & password hashing
│   │   ├── Problem.js              # Problem schema & test case definitions
│   │   ├── Assignment.js           # Assignment schema & token indexes
│   │   └── Submission.js           # Submission schema & evaluation records
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth routes
│   │   ├── problemRoutes.js        # /api/problems routes
│   │   ├── assignmentRoutes.js     # /api/assignments routes
│   │   ├── submissionRoutes.js     # /api/submissions routes
│   │   └── dashboardRoutes.js      # /api/dashboard routes
│   ├── services/
│   │   ├── codeExecutionService.js # Isolated code execution engine
│   │   ├── challengeService.js     # Token & link generator + problem sanitization
│   │   └── scoringService.js       # Automatic score calculation
│   ├── utils/
│   │   ├── generateChallengeToken.js # Crypto random hex generator
│   │   ├── response.js             # Standardized JSON response helper
│   │   └── validation.js           # Data validation helper utilities
│   ├── app.js                      # Express application setup
│   └── server.js                   # Server entry point & graceful shutdown
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. MongoDB Atlas Setup

1. Log into your **MongoDB Atlas** account (or local MongoDB server).
2. Create a new Cluster and Database named `developer_platform`.
3. Create a Database User with read/write permissions.
4. Obtain the connection URI in the format:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/developer_platform?retryWrites=true&w=majority`
5. Replace `<username>` and `<password>` with your database credentials in your `.env` file.

---

## 5. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/developer_platform?retryWrites=true&w=majority
JWT_SECRET=replace_with_long_secure_secret_key_2026
CLIENT_URL=http://localhost:3000
CODE_EXECUTION_MODE=mock
```

---

## 6. Installation & Setup

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

---

## 7. User Roles & Security Architecture

The system enforces strict role-based access control (RBAC):

1. **Host**:
   - Authorized to create/modify/delete own problems.
   - Authorized to assign problems and view submissions for their assignments.
   - Authorized to evaluate submissions with final marks and feedback.

2. **Developer**:
   - Authorized to view assigned challenges using unique tokens.
   - Authorized to submit code for active assigned challenges.
   - Authorized to view own submission history and evaluated marks.

3. **Ownership Protection Rules**:
   - Host A cannot view or modify Host B's problems or assignments.
   - Developer A cannot view Developer B's assignments or submissions.
   - Request bodies containing `createdBy`, `developerId`, or `hostId` are overridden with authenticated `req.user.userId`.

---

## 8. Code Execution Security

* **No direct `eval()` or `child_process.exec()` on Main Node.js Thread**: Arbitrary untrusted developer code is **never** executed inside the main Express application process.
* **Decoupled Service Abstraction**: All evaluations go through `codeExecutionService.js`.
* **Execution Modes**:
  - `CODE_EXECUTION_MODE=mock`: Standard safe mode for validation and demonstration.
  - Future production modes can plug directly into Docker sandboxes, Judge0, or isolated worker containers without altering API controllers.
* **Hidden Test Cases Protection**: Developers never receive hidden test cases in API responses. Hidden test cases are evaluated strictly backend-side.

---

## 9. Complete API Endpoints List

### Health & Information
* `GET /` - API running status
* `GET /api/health` - Database & server health status

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Register host or developer
* `POST /api/auth/login` - Authenticate user & get JWT
* `GET /api/auth/me` - Get current authenticated user details

### Problems (`/api/problems`)
* `POST /api/problems` - Create a problem (Host only)
* `GET /api/problems` - List problems (Filtered by role/ownership)
* `GET /api/problems/:id` - Get problem details
* `PUT /api/problems/:id` - Update problem (Host owner only)
* `DELETE /api/problems/:id` - Delete problem (Host owner only)

### Assignments (`/api/assignments` & `/api/challenges`)
* `POST /api/assignments` - Assign problem to developer (Host only)
* `GET /api/assignments` - List assignments (Role filtered)
* `GET /api/assignments/:id` - Get assignment details
* `POST /api/assignments/:id/open` - Mark assignment opened (Assigned developer)
* `GET /api/challenges/:token` - Open challenge by unique token (Assigned developer)

### Submissions & Evaluation (`/api/submissions`)
* `POST /api/submissions` - Submit code solution (Assigned developer)
* `GET /api/submissions/my` - View logged-in developer submissions
* `GET /api/submissions/:id` - View single submission details
* `GET /api/assignments/:id/submissions` - View assignment submission history
* `POST /api/submissions/:id/evaluate` - Manual review & grade submission (Host owner)

### Dashboard (`/api/dashboard`)
* `GET /api/dashboard/host` - Host analytics & dashboard stats
* `GET /api/dashboard/developer` - Developer analytics & dashboard stats

---

## 10. Database Schemas

### User Model
* `name` (String, required)
* `email` (String, required, unique, lowercase)
* `password` (String, required, select: false)
* `role` (Enum: `['host', 'developer']`)
* `timestamps` (true)

### Problem Model
* `title` (String, required)
* `description` (String, required)
* `difficulty` (Enum: `['easy', 'medium', 'hard']`)
* `allowedLanguages` (Array of Strings: `['javascript', 'python', 'java', 'cpp']`)
* `inputFormat`, `outputFormat`, `constraints` (Strings)
* `examples` (Array of `{ input, output, explanation }`)
* `testCases` (Array of `{ input, expectedOutput, isHidden }`)
* `maxMarks` (Number, default 100)
* `timeLimit` (Number, default 2 seconds)
* `createdBy` (Ref `User`)
* `isActive` (Boolean, default true)

### Assignment Model
* `problemId` (Ref `Problem`)
* `hostId` (Ref `User`)
* `developerId` (Ref `User`)
* `uniqueToken` (String, unique, crypto hex)
* `status` (Enum: `['assigned', 'opened', 'submitted', 'evaluated', 'expired']`)
* `expiresAt`, `openedAt`, `submittedAt`, `assignedAt` (Dates)

### Submission Model
* `assignmentId` (Ref `Assignment`)
* `problemId` (Ref `Problem`)
* `developerId` (Ref `User`)
* `code` (String, required)
* `language` (String, required)
* `status` (Enum: `['submitted', 'running', 'passed', 'failed', 'evaluated']`)
* `testResults` (Array of test case outputs & execution times)
* `automaticMarks` (Number)
* `finalMarks` (Number, default null)
* `feedback` (String)
* `evaluatedBy` (Ref `User`)
* `evaluatedAt` (Date)

---

## 11. Postman End-to-End Testing Flow

Follow this exact 14-step testing workflow in Postman:

1. **Register Host**: `POST /api/auth/register` with `role: "host"`
2. **Login Host**: `POST /api/auth/login` to obtain Host JWT Token.
3. **Register Developer**: `POST /api/auth/register` with `role: "developer"`
4. **Login Developer**: `POST /api/auth/login` to obtain Developer JWT Token.
5. **Create Problem (Host)**: `POST /api/problems` using Host Bearer Token. Note the returned `problemId`.
6. **Assign Problem (Host)**: `POST /api/assignments` with `problemId`, `developerId`, and `expiresAt`. Copy the returned `challengeUrl` and `uniqueToken`.
7. **Get Challenge by Token (Developer)**: `GET /api/challenges/:token` using Developer Bearer Token.
8. **Submit Code (Developer)**: `POST /api/submissions` with `assignmentId`, `code`, and `language`.
9. **Get Developer Submissions (Developer)**: `GET /api/submissions/my`.
10. **View Submissions for Assignment (Host)**: `GET /api/assignments/:id/submissions` using Host Token. Note `submissionId`.
11. **Evaluate Submission (Host)**: `POST /api/submissions/:id/evaluate` with `finalMarks: 95` and `feedback`.
12. **Check Host Dashboard (Host)**: `GET /api/dashboard/host`.
13. **Check Developer Dashboard (Developer)**: `GET /api/dashboard/developer`.
14. **Check Health**: `GET /api/health`.

---

## 12. Example API Requests & Responses

### Sample Problem Creation Request (`POST /api/problems`)
```json
{
  "title": "Two Sum",
  "description": "Given an array of integers and a target value, return the indexes of two numbers whose sum equals the target.",
  "difficulty": "easy",
  "allowedLanguages": ["javascript", "python"],
  "inputFormat": "Array of integers and target number",
  "outputFormat": "Space separated indices",
  "constraints": "2 <= nums.length <= 10000",
  "examples": [
    {
      "input": "2 7 11 15\n9",
      "output": "0 1",
      "explanation": "2 + 7 = 9, so indices are 0 and 1"
    }
  ],
  "testCases": [
    {
      "input": "2 7 11 15\n9",
      "expectedOutput": "0 1",
      "isHidden": false
    },
    {
      "input": "3 2 4\n6",
      "expectedOutput": "1 2",
      "isHidden": true
    }
  ],
  "maxMarks": 100,
  "timeLimit": 2
}
```

### Assignment Response (`POST /api/assignments`)
```json
{
  "success": true,
  "message": "Problem assigned successfully",
  "data": {
    "assignment": {
      "_id": "66f9a8b12c9a1d0012345678",
      "problemId": "66f9a7a02c9a1d0012345677",
      "hostId": "66f9a5002c9a1d0012345670",
      "developerId": "66f9a6002c9a1d0012345671",
      "uniqueToken": "a8f5d92b6f1e4d7a91c82e3f4567890abcdef1234567890abcdef1234567890a",
      "status": "assigned",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "assignedAt": "2026-10-01T08:00:00.000Z"
    },
    "challengeUrl": "http://localhost:3000/challenge/a8f5d92b6f1e4d7a91c82e3f4567890abcdef1234567890abcdef1234567890a"
  }
}
```

### Code Submission Request (`POST /api/submissions`)
```json
{
  "assignmentId": "66f9a8b12c9a1d0012345678",
  "language": "javascript",
  "code": "function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const diff = target - nums[i]; if (map.has(diff)) return [map.get(diff), i]; map.set(nums[i], i); } return []; }"
}
```

### Host Evaluation Request (`POST /api/submissions/:id/evaluate`)
```json
{
  "finalMarks": 95,
  "feedback": "Optimal O(n) hash map solution. Great work handling edge cases!"
}
```

---

## 13. Graceful Shutdown

The application includes process listeners for `SIGINT` and `SIGTERM`. When stopped, it safely stops accepting incoming HTTP requests and closes all active MongoDB database connections before exiting clean.

---

## 14. Troubleshooting

* **MongoDB Connection Failed**: Ensure your `MONGO_URI` is correct and your IP address is whitelisted in MongoDB Atlas Network Access.
* **401 Unauthorized**: Check that you are passing the `Authorization: Bearer <JWT_TOKEN>` header.
* **403 Forbidden**: Ensure the logged-in user role matches the endpoint requirements (e.g., Host role for problem creation or evaluation).
* **Expired Challenge**: Ensure `expiresAt` is set to a future ISO date string.

---

## 15. Future Roadmap

- Integration with Monaco Editor for frontend code completion.
- Isolated Docker sandbox worker pool for multi-language execution (Python 3, Java 21, GCC C++20).
- Leaderboard & team assessment metrics.
- Email notifications for challenge invitations.
- Plagiarism & code similarity detection engine.
