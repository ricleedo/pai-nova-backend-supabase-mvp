# PAI Care & SerenAI - Quick Start Guide

Get your backend API up and running in 5 minutes!

---

## Prerequisites

- Node.js v20+ installed
- A Supabase account (free tier works great!)
- Git installed

---

## Step 1: Get Supabase Credentials

1. Go to https://app.supabase.com
2. Create a new project or select existing one
3. Navigate to **Project Settings → API**
4. Copy these values:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public` key → This is your `SUPABASE_ANON_KEY`
   - `service_role secret` key → This is your `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Configure Environment

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your Supabase credentials:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   JWT_SECRET=your_random_secret_key_min_32_chars
   ```

   **Important:** Generate a strong JWT secret:
   ```bash
   # On Mac/Linux:
   openssl rand -base64 32

   # Or use any random string generator
   ```

---

## Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages (takes about 1-2 minutes).

---

## Step 4: Verify Database Schema

The database schema has already been migrated to your Supabase instance!

**To verify:**
1. Go to your Supabase dashboard
2. Click on **Table Editor** in the sidebar
3. You should see tables like: `users`, `seniors`, `caregivers`, `reminders`, etc.

---

## Step 5: Start the Server

**Development mode (with hot-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

---

## Step 6: Test the API

**Check if server is running:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-04T..."
}
```

---

## Step 7: Create Your First User

**Register a senior user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senior@example.com",
    "password": "SecurePass123!",
    "role": "senior",
    "name": "John Doe"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "senior@example.com",
      "role": "senior"
    },
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

**Save the `token` from the response - you'll need it for authenticated requests!**

---

## Step 8: Make Authenticated Requests

**Get your profile:**
```bash
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get all seniors (you'll see the one you just created):**
```bash
curl http://localhost:3000/api/v1/seniors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Issues & Solutions

### Issue: "Missing Supabase configuration"
**Solution:** Make sure your `.env` file has all three Supabase variables set correctly.

### Issue: "Port 3000 already in use"
**Solution:** Either stop the other service using port 3000, or change the port in `.env`:
```env
PORT=3001
```

### Issue: "JWT secret not set"
**Solution:** Add a strong random string as `JWT_SECRET` in your `.env` file.

### Issue: Can't connect to database
**Solution:**
1. Check your internet connection
2. Verify Supabase credentials are correct
3. Make sure you copied the full URLs/keys without extra spaces

---

## What's Next?

Now that your backend is running, you can:

1. **Explore the API:** Check out the full API documentation in [README.md](README.md)
2. **Create more users:** Register caregivers and institution admins
3. **Add reminders:** Create medication reminders for seniors
4. **View the database:** Explore your Supabase dashboard to see data
5. **Build a frontend:** Connect your React or React Native app to this API

---

## API Endpoints Quick Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (email only, magic-link)
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/profile` - Get profile (auth required)
 - `POST /api/v1/auth/magic-link` - Resend magic link by email
 - `POST /api/v1/auth/verify-magic-link` - Verify token and get JWTs
 - `GET /api/v1/auth/verify?token=...` - Browser-friendly verification

### Magic Link
- `POST /api/v1/auth/magic-link` → body `{ "email": "user@example.com" }` to send an email
- `POST /api/v1/auth/verify-magic-link` → body `{ "token": "..." }` to verify and get tokens

### Seniors
- `GET /api/v1/seniors` - List seniors (auth required)
- `GET /api/v1/seniors/:id` - Get senior details (auth required)
- `POST /api/v1/seniors` - Create senior (admin only)
- `PUT /api/v1/seniors/:id` - Update senior (auth required)

### Reminders
- `GET /api/v1/reminders/seniors/:seniorId/reminders` - Get reminders
- `POST /api/v1/reminders` - Create reminder (auth required)
- `POST /api/v1/reminders/dose-events/:eventId/confirm` - Confirm dose
- `GET /api/v1/reminders/seniors/:seniorId/adherence` - Get adherence stats

For complete API documentation, see [README.md](README.md#api-documentation)

---

## Development Tips

### Hot Reload
The dev server watches for file changes and auto-restarts:
```bash
npm run dev
```

### View Logs
Logs are written to the console and to `./logs/` directory:
```bash
tail -f logs/combined.log
```

### Check TypeScript
```bash
npm run lint
npm run build
```

### Format Code
```bash
npm run format
```

---

## Getting Help

- **Full Documentation:** See [README.md](README.md)
- **Architecture Details:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues:** Check existing issues or create a new one
- **Database:** View data in Supabase dashboard → Table Editor

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | - | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | - | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key |
| `JWT_SECRET` | Yes | - | Secret for signing JWT tokens |
| `FRONTEND_URL` | Yes | http://localhost:3001 | Base URL used to build magic link |
| `APP_NAME` | No | PAI Care | Used in email templates |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `JWT_EXPIRY` | No | 7d | Access token expiry |
| `ENABLE_REMINDER_SCHEDULER` | No | true | Enable background jobs |
| `SMTP_HOST` | For emails | - | SMTP server hostname |
| `SMTP_PORT` | For emails | 587 | SMTP server port |
| `SMTP_SECURE` | For emails | false | Use TLS (true for 465) |
| `SMTP_USER` | For emails | - | SMTP username |
| `SMTP_PASS` | For emails | - | SMTP password |
| `SMTP_FROM` | For emails | no-reply@example.com | From address for emails |

---

**You're all set! Happy coding! 🚀**
