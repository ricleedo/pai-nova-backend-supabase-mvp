# PAI Care & SerenAI - Architecture Documentation

## System Architecture Overview

This document provides detailed technical architecture information for the PAI Care & SerenAI backend system.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  SerenAI Mobile  │         │  PAI Care Web    │         │
│  │  (React Native)  │         │  (React)         │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │         HTTPS/REST           │
            │                              │
┌───────────┴──────────────────────────────┴──────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Rate Limiting │ CORS │ Helmet │ Authentication      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────┐
│                    Express.js Application                     │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Auth     │  │  Seniors   │  │ Reminders  │            │
│  │  Module    │  │  Module    │  │  Module    │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                    │
│  ┌─────┴────────────────┴────────────────┴──────┐           │
│  │          Service Layer (Business Logic)       │           │
│  └─────┬────────────────┬────────────────┬───────┘           │
│        │                │                │                    │
│  ┌─────┴────────────────┴────────────────┴───────┐           │
│  │         Supabase Client (Data Access)          │           │
│  └─────┬──────────────────────────────────────────┘           │
└────────┼──────────────────────────────────────────────────────┘
         │
┌────────┴──────────────────────────────────────────────────────┐
│                    Supabase Backend                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL 15 Database                                   │ │
│  │  - Row Level Security (RLS)                               │ │
│  │  - Automated Backups                                      │ │
│  │  - Real-time Subscriptions                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Background Jobs                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scheduler Service (node-cron)                        │   │
│  │  - Reminder Check (every 5 min)                       │   │
│  │  - Missed Dose Detection (hourly)                     │   │
│  │  - Daily Alert Generation (midnight)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│              Routes Layer                        │
│  - HTTP method handlers                          │
│  - Request validation (Zod schemas)              │
│  - Route-level middleware                        │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│           Controller Layer                       │
│  - Request/Response handling                     │
│  - Input sanitization                            │
│  - Response formatting                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│            Service Layer                         │
│  - Business logic                                │
│  - Data validation                               │
│  - Transaction management                        │
│  - Error handling                                │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│         Data Access Layer                        │
│  - Supabase client calls                         │
│  - Query building                                │
│  - Data transformation                           │
└─────────────────────────────────────────────────┘
```

---

## Data Flow

### Example: Creating a Reminder

```
1. Client Request
   ↓
   POST /api/v1/reminders
   Headers: { Authorization: Bearer <token> }
   Body: { senior_id, type, title, schedule_cron }

2. Middleware Chain
   ↓
   authenticateToken → Validates JWT, attaches user to request
   ↓
   validate(schema) → Validates request body against Zod schema
   ↓
   If validation fails → errorHandler → JSON error response

3. Controller Layer
   ↓
   remindersController.createReminder()
   - Extracts user from request
   - Calls service method

4. Service Layer
   ↓
   remindersService.createReminder()
   - Validates business rules
   - Checks permissions (RLS handles this)
   - Calls Supabase

5. Data Access
   ↓
   supabaseAdmin.from('reminders').insert(...)
   - Row Level Security checks
   - Database constraints validate
   - Returns created record

6. Audit Logging
   ↓
   supabaseAdmin.from('audit_logs').insert(...)
   - Logs action for compliance

7. Response
   ↓
   { success: true, message: "...", data: {...} }
   ↓
   Client receives 201 Created
```

---

## Database Architecture

### Entity Relationships

```
users
  ├─ (1:1) → seniors
  │            ├─ (1:many) → reminders
  │            │              └─ (1:many) → dose_events
  │            ├─ (1:many) → daily_checkins
  │            ├─ (1:many) → alerts
  │            ├─ (1:many) → notes
  │            ├─ (1:many) → nora_interactions
  │            ├─ (1:many) → medication_stock
  │            └─ (many:many) → caregivers
  │                              (via senior_caregivers)
  └─ (1:1) → caregivers
               └─ (many:many) → seniors
                                 (via senior_caregivers)

institutions
  └─ (1:many) → seniors
  └─ (1:many) → checklist_items
```

### Row Level Security Strategy

**Policy Pattern:**
```sql
-- Seniors can view own data
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Caregivers can view assigned seniors
CREATE POLICY "policy_name"
  ON seniors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM senior_caregivers sc
      JOIN caregivers c ON c.id = sc.caregiver_id
      WHERE sc.senior_id = seniors.id
        AND c.user_id = auth.uid()
    )
  );

-- Permission-based updates
CREATE POLICY "policy_name"
  ON table_name FOR UPDATE
  TO authenticated
  USING (has_permission())
  WITH CHECK (has_permission());
```

### Index Strategy

**Performance Indexes:**
```sql
-- Foreign key indexes (automatically created)
idx_seniors_user_id
idx_seniors_institution_id
idx_reminders_senior_id

-- Query optimization indexes
idx_dose_events_senior_id
idx_dose_events_scheduled_at
idx_dose_events_status

-- Composite indexes for common queries
idx_dose_events_senior_status (senior_id, status)
idx_alerts_senior_resolved (senior_id, resolved_at)
```

---

## Authentication & Authorization

### JWT Token Flow

```
Registration/Login
       ↓
Generate single-use magic link (15 minutes)
On verify → issue Access Token (7 days) and Refresh Token (30 days)
       ↓
Return both to client
       ↓
Client stores tokens (secure storage)
       ↓
API Request with Access Token
       ↓
authenticateToken middleware verifies
       ↓
Attach user to request object
       ↓
Controller/Service uses user.id, user.role
       ↓
RLS policies enforce data access
```

### Magic-Link Only Strategy

- Users initiate register/login with an email address
- Backend generates a single-use JWT (with `jti`) valid for 15 minutes and emails a link
- Verification endpoints:
  - GET `/api/v1/auth/verify?token=...` (browser/mobile friendly)
  - POST `/api/v1/auth/verify-magic-link` with `{ token }`
- On success: marks `users.email_verified = true`, consumes the `jti`, returns access and refresh tokens
- On expiry: if the user is still unverified, the system deletes the user automatically

### Token Structure

```typescript
// Access Token Payload
{
  userId: "uuid",
  role: "senior" | "caregiver" | "institution_admin" | "super_admin",
  email: "user@example.com",
  iat: 1234567890,
  exp: 1234567890 + (7 * 24 * 60 * 60) // 7 days
}

// Refresh Token Payload
{
  userId: "uuid",
  type: "refresh",
  iat: 1234567890,
  exp: 1234567890 + (30 * 24 * 60 * 60) // 30 days
}
```

### Permission Matrix

| Role | View Seniors | Edit Seniors | Manage Reminders | View Reports | Admin Access |
|------|--------------|--------------|------------------|--------------|--------------|
| Senior | Own only | Own only | Own only | Own only | No |
| Caregiver | Assigned | With permission | With permission | Assigned | No |
| Institution Admin | All in institution | All in institution | All in institution | All in institution | Yes |
| Super Admin | All | All | All | All | Yes |

---

## Scheduler Architecture

### Cron Jobs

```javascript
// Job Registry
const jobs = {
  reminderCheck: {
    schedule: '*/5 * * * *',  // Every 5 minutes
    handler: checkPendingReminders
  },
  missedDoseCheck: {
    schedule: '0 * * * *',     // Every hour
    handler: checkMissedDoses
  },
  dailyAlerts: {
    schedule: '0 0 * * *',     // Midnight daily
    handler: generateDailyAlerts
  }
}
```

### Scheduler Flow

```
Server Starts
     ↓
schedulerService.start()
     ↓
Register cron jobs with node-cron
     ↓
Jobs run on schedule
     ↓
Each job:
  1. Queries database
  2. Processes records
  3. Updates status/creates alerts
  4. Logs activity
     ↓
On server shutdown:
  schedulerService.stop()
```

---

## Error Handling Strategy

### Error Hierarchy

```typescript
Error (base)
  └─ AppError (operational errors)
       ├─ 400 Bad Request
       ├─ 401 Unauthorized
       ├─ 403 Forbidden
       ├─ 404 Not Found
       ├─ 409 Conflict
       └─ 500 Internal Server Error
```

### Error Flow

```
Service throws AppError
     ↓
asyncHandler catches error
     ↓
Passes to global errorHandler middleware
     ↓
errorHandler:
  - Logs error with context
  - Sanitizes error message (production)
  - Formats JSON response
     ↓
Client receives error response
```

---

## API Versioning Strategy

**Current Approach: URL Versioning**

```
/api/v1/auth/...
/api/v1/seniors/...
/api/v1/reminders/...
```

**Future Migration Path:**

When breaking changes are needed:
1. Create new routes: `/api/v2/...`
2. Maintain v1 for 6 months
3. Add deprecation warnings to v1
4. Sunset v1 after migration period

---

## Performance Optimization

### Query Optimization

```typescript
// Bad: N+1 query problem
const seniors = await getSeniors();
for (const senior of seniors) {
  const reminders = await getReminders(senior.id); // N queries
}

// Good: Single query with joins
const seniors = await supabase
  .from('seniors')
  .select('*, reminders(*)')  // Join in single query
```

### Caching Strategy (Future)

```
┌─────────────────────────────────────────┐
│  Redis Cache Layer (Future Enhancement) │
├─────────────────────────────────────────┤
│  - Session data (5 min TTL)             │
│  - Frequently accessed seniors (1 hr)   │
│  - Adherence stats (30 min)             │
│  - Static lookups (24 hr)               │
└─────────────────────────────────────────┘
```

---

## Security Architecture

### Defense in Depth

```
Layer 1: Network
  - HTTPS only
  - Rate limiting
  - CORS whitelist

Layer 2: Application
  - Helmet security headers
  - Input validation (Zod)
  - JWT authentication
  - RBAC authorization

Layer 3: Database
  - Row Level Security (RLS)
  - Parameterized queries
  - Foreign key constraints
  - Check constraints

Layer 4: Audit
  - Comprehensive logging
  - Audit trail for all changes
  - IP address tracking
```

### Sensitive Data Handling

```typescript
// Password storage
bcrypt.hash(password, 12)  // 12 rounds

// JWT secrets
process.env.JWT_SECRET  // 256-bit random string

// Database credentials
process.env.SUPABASE_SERVICE_ROLE_KEY  // Never in code

// Audit logging
await logAction({
  entity_type: 'user',
  action: 'password_change',
  user_id: userId,
  ip_address: req.ip
});
```

---

## Monitoring & Observability

### Logging Strategy

```typescript
// Log Levels
logger.error()  // Errors requiring immediate attention
logger.warn()   // Potential issues
logger.info()   // Important events
logger.debug()  // Detailed troubleshooting

// Structured Logging
logger.info('User login', {
  userId: user.id,
  role: user.role,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Health Checks

```
GET /health
Response:
{
  success: true,
  status: "healthy",
  timestamp: "2025-10-04T15:00:00.000Z"
}

Future Enhancements:
{
  success: true,
  status: "healthy",
  checks: {
    database: "healthy",
    scheduler: "healthy",
    cache: "healthy"
  },
  uptime: 123456,
  version: "1.0.0"
}
```

---

## Scalability Considerations

### Current Architecture (MVP)

```
Single Node Architecture
- Express.js server (1 instance)
- Supabase (managed, auto-scaling)
- Node-cron scheduler (in-process)
```

### Future Scaling Path

```
┌─────────────────────────────────────────────┐
│          Load Balancer (ALB/Nginx)          │
└───────────────┬─────────────────────────────┘
                │
    ┌───────────┴───────────┬───────────┐
    │                       │           │
┌───┴────┐             ┌────┴───┐   ┌──┴─────┐
│ API    │             │ API    │   │ API    │
│ Node 1 │             │ Node 2 │   │ Node 3 │
└───┬────┘             └────┬───┘   └──┬─────┘
    │                       │           │
    └───────────┬───────────┴───────────┘
                │
    ┌───────────┴────────────────────────┐
    │  Redis Cache (session/queue)       │
    └───────────┬────────────────────────┘
                │
    ┌───────────┴────────────────────────┐
    │  Supabase (managed PostgreSQL)     │
    └────────────────────────────────────┘

    ┌────────────────────────────────────┐
    │  Separate Worker Service           │
    │  (cron jobs/background tasks)      │
    └────────────────────────────────────┘
```

---

## Testing Strategy

### Test Pyramid

```
        ┌────────────┐
        │    E2E     │  (10%)
        └────────────┘
      ┌────────────────┐
      │  Integration   │  (30%)
      └────────────────┘
    ┌──────────────────────┐
    │    Unit Tests        │  (60%)
    └──────────────────────┘
```

### Test Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: Critical paths
- E2E Tests: User journeys

---

## Deployment Pipeline

```
Developer
  ↓ git push
GitHub Repository
  ↓ webhook trigger
GitHub Actions CI/CD
  ↓
  1. Install dependencies
  2. Run linter (ESLint)
  3. Run tests (Jest)
  4. Build TypeScript
  5. Run security scan
  ↓ if all pass
Deploy to Staging
  ↓ manual approval
Deploy to Production
  ↓
Health check verification
```

---

## Configuration Management

### Environment Variables

```
Development: .env (local file)
Staging: Platform environment variables
Production: Secrets manager (AWS Secrets Manager/Railway)
```

### Feature Flags (Future)

```typescript
const features = {
  ENABLE_NORA_AI: process.env.FEATURE_NORA === 'true',
  ENABLE_VOICE_REMINDERS: process.env.FEATURE_VOICE === 'true',
  ENABLE_ANALYTICS: process.env.FEATURE_ANALYTICS === 'true'
};
```

---

## API Rate Limiting

### Current Strategy

```
Window: 15 minutes
Max Requests: 100
Scope: Per IP address
Response: 429 Too Many Requests
```

### Future Enhancement

```typescript
// Different limits per endpoint type
const rateLimits = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },     // 5 per 15 min
  reads: { windowMs: 15 * 60 * 1000, max: 200 },  // 200 per 15 min
  writes: { windowMs: 15 * 60 * 1000, max: 50 }   // 50 per 15 min
};
```

---

This architecture documentation provides the technical foundation for the PAI Care & SerenAI backend system. It should be updated as the system evolves and new patterns are introduced.
