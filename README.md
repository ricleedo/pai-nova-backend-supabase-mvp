# PAI Care & SerenAI - Backend API

A comprehensive healthcare platform backend for senior care management with AI companion capabilities. Built with Node.js, TypeScript, Express, and Supabase.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security & Compliance](#security--compliance)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Overview

PAI Care & SerenAI is a dual-platform healthcare solution:

- **SerenAI Mobile**: Senior-focused mobile app with medication reminders, daily check-ins, and AI companion (Nora)
- **PAI Care Web**: Caregiver/institution dashboard for multi-senior management, analytics, and reporting

This backend API powers both platforms with:
- JWT-based authentication with magic link support
- Role-based access control (RBAC)
- Real-time reminder scheduling
- Dose event tracking and adherence monitoring
- Automated alert generation
- Comprehensive audit logging
- HIPAA-compliant data handling

---

## Features

### Core Functionality

#### Authentication & Authorization
- JWT token-based authentication
- Magic link email authentication (magic-link only; passwords removed from flows)
- Refresh token support
- Role-based permissions (Senior, Caregiver, Institution Admin, Super Admin)

#### Senior Management
- Complete senior profile CRUD operations
- Caregiver assignment with granular permissions
- Institution association
- Customizable preferences (font size, contrast, quiet hours)
- Emergency contact management

#### Reminder & Medication Tracking
- Flexible reminder scheduling (cron-based)
- Multiple reminder types: medication, appointment, meal, activity, custom
- Dose event tracking with confirmation methods (tap, voice, caregiver)
- Skip/miss functionality with notes
- Medication stock tracking with low inventory alerts

#### Monitoring & Analytics
- Daily mood check-ins
- Adherence rate calculation (30-day rolling window)
- Automated missed dose detection
- Low adherence alerts (< 80% triggers warning, < 60% critical)
- Caregiver notes and observations

#### AI/Nora Integration Ready
- Interaction logging
- Sentiment tracking
- Conversation transcript storage
- Alert generation based on AI insights

#### Compliance & Auditing
- Comprehensive audit logs for all data modifications
- HIPAA-ready security controls
- Data encryption at rest and in transit
- User action tracking with IP logging

---

## Architecture

### Project Structure

```
pai-care-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── supabase.ts      # Supabase client setup
│   │   └── logger.ts        # Winston logger configuration
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication & authorization
│   │   ├── errorHandler.ts # Global error handling
│   │   └── validator.ts     # Zod schema validation
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication module
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   ├── seniors/         # Senior management module
│   │   │   ├── seniors.service.ts
│   │   │   ├── seniors.controller.ts
│   │   │   └── seniors.routes.ts
│   │   └── reminders/       # Reminders & dose events module
│   │       ├── reminders.service.ts
│   │       ├── reminders.controller.ts
│   │       └── reminders.routes.ts
│   ├── services/            # Background services
│   │   └── scheduler.service.ts  # Cron job scheduler
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── server.ts            # Express app entry point
├── .env.example             # Environment variables template
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # This file
```

### Design Patterns

- **Service Layer Pattern**: Business logic separated from controllers
- **Repository Pattern**: Data access abstracted through Supabase client
- **Middleware Chain**: Authentication, validation, and error handling
- **Dependency Injection**: Services imported as singletons
- **Event-Driven**: Cron-based scheduler for automated tasks

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js v20 LTS
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: JWT (jsonwebtoken)

### Key Libraries
- **@supabase/supabase-js**: Database client
- **bcryptjs**: Password hashing
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting
- **node-cron**: Task scheduling
- **winston**: Logging
- **zod**: Schema validation
- **jest**: Testing framework

---

## Getting Started

### Prerequisites

- Node.js v20+ installed
- Supabase account and project created
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pai-care-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**

   Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api

   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRY=7d

   # Enable Scheduler
   ENABLE_REMINDER_SCHEDULER=true
   ```

5. **Database is already set up!**

   The database schema has been automatically migrated to your Supabase instance. You can view the tables in your Supabase dashboard under "Table Editor".

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be running at `http://localhost:3000`

### Quick Test

```bash
# Check if the server is running
curl http://localhost:3000/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":"2025-10-04T..."}
```

---

## API Documentation

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register by email (sends verify link) | No |
| POST | `/login` | Login by email (sends sign-in link) | No |
| POST | `/magic-link` | Resend magic link to email | No |
| GET  | `/verify?token=...` | Browser/mobile verification | No |
| POST | `/verify-magic-link` | Verify token and get JWTs | No |
| POST | `/refresh` | Refresh access token | No |
| GET  | `/profile` | Get current user profile | Yes |

**Register Example:**
```http
POST /api/v1/auth/register
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "role": "senior" },
    "pendingEmailVerification": true,
    "magicLink": "http://localhost:3000/api/v1/auth/verify?token=..."
  }
}
```

**Login Example:**
```http
POST /api/v1/auth/login
{
  "email": "john@example.com"
}

Response: sends sign-in link email; returns { user, emailVerified, magicLink }
```

#### Seniors Management (`/api/v1/seniors`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Get all seniors (filtered by role) | Yes | All |
| GET | `/:id` | Get senior by ID | Yes | All |
| POST | `/` | Create new senior | Yes | Admin |
| PUT | `/:id` | Update senior | Yes | All (with permission) |
| DELETE | `/:id` | Delete senior | Yes | Admin |
| POST | `/:id/caregivers` | Assign caregiver to senior | Yes | Admin |

**Get All Seniors Example:**
```bash
GET /api/v1/seniors?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Assign Caregiver Example:**
```json
POST /api/v1/seniors/:id/caregivers
{
  "caregiver_id": "uuid-here",
  "relationship": "family",
  "permissions": {
    "view": true,
    "edit": true,
    "manage_reminders": true
  }
}
```

#### Reminders & Dose Events (`/api/v1/reminders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/seniors/:seniorId/reminders` | Get all reminders for a senior | Yes |
| GET | `/:id` | Get reminder by ID | Yes |
| POST | `/` | Create new reminder | Yes |
| PUT | `/:id` | Update reminder | Yes |
| DELETE | `/:id` | Deactivate reminder | Yes |
| GET | `/seniors/:seniorId/dose-events` | Get dose events | Yes |
| POST | `/dose-events/:eventId/confirm` | Confirm dose taken | Yes |
| POST | `/dose-events/:eventId/skip` | Skip dose | Yes |
| GET | `/seniors/:seniorId/adherence` | Get adherence stats | Yes |

**Create Reminder Example:**
```json
POST /api/v1/reminders
{
  "senior_id": "uuid-here",
  "type": "medication",
  "title": "Take Metformin",
  "description": "500mg tablet with food",
  "schedule_cron": "0 8,20 * * *",
  "active": true
}
```

**Confirm Dose Event Example:**
```json
POST /api/v1/reminders/dose-events/:eventId/confirm
{
  "method": "tap",
  "notes": "Taken with breakfast"
}
```

**Get Adherence Stats Example:**
```bash
GET /api/v1/reminders/seniors/:seniorId/adherence?days=30

Response:
{
  "success": true,
  "data": {
    "total": 60,
    "confirmed": 52,
    "missed": 5,
    "skipped": 2,
    "pending": 1,
    "adherenceRate": "86.67"
  }
}
```

---

## Database Schema

### Core Tables

#### `users`
- Primary authentication table
- Stores email, phone, role, auth_provider
- Links to either seniors or caregivers table

#### `seniors`
- Senior profiles with demographic info
- Preferences for app customization
- Emergency contact information
- Institution association (optional)

#### `caregivers`
- Caregiver profiles
- Links to users table

#### `senior_caregivers`
- Many-to-many relationship
- Granular permissions (view, edit, manage_reminders)
- Relationship type (family, professional, friend)

#### `reminders`
- Cron-based scheduling
- Multiple types: medication, appointment, meal, activity, custom
- Active/inactive flag for soft delete

#### `dose_events`
- Individual reminder occurrences
- Status: pending, confirmed, skipped, missed
- Confirmation method tracking
- Notes for context

#### `alerts`
- System-generated notifications
- Types: missed_dose, low_adherence, health_concern, stock_low
- Severity levels: info, warning, critical
- Resolution tracking

#### `audit_logs`
- Comprehensive activity tracking
- Stores entity type, action, user, changes
- IP address logging

### Entity Relationship Diagram

```
users (1) ──────── (1) seniors
  │                     │
  │                     │ (many)
  │                     │
  └── (1) caregivers ───┘
           │        senior_caregivers
           │
reminders (many) ── (1) seniors
    │
    └── (many) dose_events

seniors (1) ── (many) alerts
seniors (1) ── (many) daily_checkins
seniors (1) ── (many) notes
seniors (1) ── (many) nora_interactions
```

---

## Security & Compliance

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Seniors**: Can view own profile OR assigned caregivers can view
- **Reminders**: Accessible to senior and assigned caregivers
- **Dose Events**: Senior can view/update own events
- **Audit Logs**: Only admins can access

### Authentication

- JWT tokens with configurable expiry (default 7 days)
- Refresh tokens for extended sessions (default 30 days)
- Magic link support with 15-minute expiry
- Bcrypt password hashing (12 rounds)

### Security Features

- Helmet.js security headers
- CORS with whitelist
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod schemas
- SQL injection prevention (Supabase parameterized queries)
- Error sanitization in production

### HIPAA Compliance Checklist

- ✅ Encryption at rest (Supabase PostgreSQL)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Audit logging (all data modifications)
- ✅ Access controls (RLS policies)
- ✅ Authentication & authorization
- ⚠️ Data retention policies (implement based on requirements)
- ⚠️ Breach notification procedures (document)
- ⚠️ Business Associate Agreements (legal team)

---

## Development Guide

### Available Scripts

```bash
# Development with hot-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Adding a New Module

1. Create folder in `src/modules/your-module/`
2. Create service file: `your-module.service.ts`
3. Create controller file: `your-module.controller.ts`
4. Create routes file: `your-module.routes.ts`
5. Register routes in `src/server.ts`

**Example:**

```typescript
// src/modules/checkins/checkins.service.ts
export class CheckinsService {
  async createCheckin(seniorId: string, mood: number, notes: string) {
    // Implementation
  }
}

// src/modules/checkins/checkins.controller.ts
export class CheckinsController {
  createCheckin = asyncHandler(async (req, res) => {
    // Implementation
  });
}

// src/modules/checkins/checkins.routes.ts
import { Router } from 'express';
const router = Router();
router.post('/', checkinsController.createCheckin);
export default router;

// Register in src/server.ts
import checkinsRoutes from './modules/checkins/checkins.routes';
app.use(`/api/${API_VERSION}/checkins`, checkinsRoutes);
```

### Scheduler Jobs

The scheduler service runs three automated jobs:

1. **Reminder Check** (every 5 minutes): Processes upcoming reminders
2. **Missed Dose Check** (hourly): Marks overdue dose events as missed
3. **Daily Alerts** (midnight): Generates low adherence alerts

Enable/disable in `.env`:
```env
ENABLE_REMINDER_SCHEDULER=true
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- reminders.test.ts
```

---

## Deployment

### Environment Variables Checklist

Before deploying, ensure these are set:

```env
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ JWT_SECRET (use strong random string)
✅ NODE_ENV=production
✅ PORT
✅ ALLOWED_ORIGINS (production URLs)
✅ RATE_LIMIT settings
```

### Deployment Platforms

#### Option 1: Railway / Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch
4. Auto-deploy on push

#### Option 2: AWS ECS / DigitalOcean App Platform
1. Create Dockerfile:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```
2. Build and push container
3. Configure health check: `/health`
4. Set environment variables

#### Option 3: Vercel / Netlify Functions
- Requires serverless adaptation
- Not recommended for cron jobs

### Post-Deployment

1. **Health Check**: `curl https://your-domain.com/health`
2. **Test Authentication**: Register a test user
3. **Monitor Logs**: Check Winston logs for errors
4. **Set up monitoring**: Use Sentry, Datadog, or CloudWatch
5. **Database Backups**: Enable Supabase automated backups

---

## Troubleshooting

### Common Issues

**Issue**: `Missing Supabase configuration`
- **Solution**: Ensure `.env` file has all Supabase variables set

**Issue**: `JWT token expired`
- **Solution**: Use refresh token endpoint to get new access token

**Issue**: `Access denied (403)`
- **Solution**: Check user role and RLS policies for the resource

**Issue**: `Rate limit exceeded`
- **Solution**: Wait 15 minutes or increase `RATE_LIMIT_MAX_REQUESTS`

**Issue**: Scheduler jobs not running
- **Solution**: Check `ENABLE_REMINDER_SCHEDULER=true` in `.env`

---

## API Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Services use camelCase methods
- Database columns use snake_case
- Run `npm run format` before committing

### Commit Messages
- Use conventional commits format
- Examples: `feat:`, `fix:`, `docs:`, `refactor:`

---

## License

MIT License - See LICENSE file for details

---

## Support & Contact

For issues and questions:
- GitHub Issues: <your-repo-url>/issues
- Email: support@paicare.com
- Documentation: <your-docs-url>

---

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Authentication & authorization
- ✅ Senior management
- ✅ Reminder scheduling
- ✅ Dose event tracking
- ✅ Automated alerts

### Phase 2 (Next)
- [ ] Nora AI voice integration
- [ ] Push notifications (FCM)
- [ ] SMS/Voice reminders (Twilio)
- [ ] Analytics & reporting endpoints
- [ ] Checklist generation for institutions

### Phase 3 (Future)
- [ ] WebSocket real-time updates
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration APIs (EHR systems)
- [ ] Mobile app deep linking

---

**Built with ❤️ for better senior care**
