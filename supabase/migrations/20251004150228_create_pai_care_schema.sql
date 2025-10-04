/*
  # PAI Care & SerenAI Database Schema
  
  ## Overview
  Healthcare platform for senior care management with AI companion.
  
  ## 1. New Tables
  
  ### Authentication & Users
    - `users` - Core user authentication and profile
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `phone` (text, unique, nullable)
      - `role` (enum: senior, caregiver, institution_admin, super_admin)
      - `auth_provider` (enum: password, magic_link, oauth)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ### Core Entities
    - `institutions` - Care facilities and organizations
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (enum: assisted_living, nursing_home, hospital, home_care)
      - `address` (jsonb)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
    
    - `seniors` - Senior citizen profiles
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `date_of_birth` (date)
      - `emergency_contact` (jsonb)
      - `institution_id` (uuid, references institutions, nullable)
      - `preferences` (jsonb - font size, quiet hours, etc)
      - `created_at` (timestamptz)
    
    - `caregivers` - Caregiver profiles
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `created_at` (timestamptz)
  
  ### Relationships
    - `senior_caregivers` - Many-to-many relationship
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `caregiver_id` (uuid, references caregivers)
      - `relationship` (text - family, professional, friend)
      - `permissions` (jsonb - view, edit, manage_reminders)
      - `created_at` (timestamptz)
  
  ### Reminders & Events
    - `reminders` - Scheduled reminders for seniors
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `type` (enum: medication, appointment, meal, activity, custom)
      - `title` (text)
      - `description` (text, nullable)
      - `schedule_cron` (text - cron expression)
      - `active` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
    
    - `dose_events` - Individual reminder occurrences
      - `id` (uuid, primary key)
      - `reminder_id` (uuid, references reminders)
      - `senior_id` (uuid, references seniors)
      - `scheduled_at` (timestamptz)
      - `status` (enum: pending, confirmed, skipped, missed)
      - `confirmed_at` (timestamptz, nullable)
      - `confirmation_method` (enum: tap, voice, caregiver, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    
    - `checklist_items` - Institution-level checklists
      - `id` (uuid, primary key)
      - `institution_id` (uuid, references institutions)
      - `senior_id` (uuid, references seniors, nullable)
      - `title` (text)
      - `time_window` (text)
      - `status` (enum: pending, completed, skipped)
      - `completed_by` (uuid, references users, nullable)
      - `completed_at` (timestamptz, nullable)
      - `due_date` (date)
      - `created_at` (timestamptz)
  
  ### Monitoring & Engagement
    - `daily_checkins` - Senior daily mood/wellness check
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `mood` (int - 1-5 scale)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    
    - `notes` - Caregiver notes about seniors
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `author_id` (uuid, references users)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `audit_logs` - Comprehensive audit trail
      - `id` (uuid, primary key)
      - `entity_type` (text)
      - `entity_id` (uuid)
      - `action` (text)
      - `user_id` (uuid, references users)
      - `changes` (jsonb)
      - `ip_address` (text, nullable)
      - `created_at` (timestamptz)
  
  ### AI/Nora Features
    - `nora_interactions` - AI companion conversation logs
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `type` (enum: reminder, checkin, conversation, alert)
      - `transcript` (text)
      - `sentiment` (text, nullable)
      - `created_at` (timestamptz)
    
    - `alerts` - System-generated alerts
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `type` (enum: missed_dose, low_adherence, health_concern, stock_low)
      - `severity` (enum: info, warning, critical)
      - `message` (text)
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, references users, nullable)
      - `created_at` (timestamptz)
    
    - `medication_stock` - Track medication inventory
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references seniors)
      - `reminder_id` (uuid, references reminders)
      - `medication_name` (text)
      - `current_quantity` (int)
      - `unit` (text - pills, ml, doses)
      - `low_threshold` (int)
      - `updated_at` (timestamptz)
  
  ## 2. Security
    - Enable RLS on all tables
    - Policies for role-based access control
    - Audit logging for all data modifications
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('senior', 'caregiver', 'institution_admin', 'super_admin');
CREATE TYPE auth_provider AS ENUM ('password', 'magic_link', 'oauth');
CREATE TYPE institution_type AS ENUM ('assisted_living', 'nursing_home', 'hospital', 'home_care');
CREATE TYPE reminder_type AS ENUM ('medication', 'appointment', 'meal', 'activity', 'custom');
CREATE TYPE event_status AS ENUM ('pending', 'confirmed', 'skipped', 'missed');
CREATE TYPE confirmation_method AS ENUM ('tap', 'voice', 'caregiver');
CREATE TYPE checklist_status AS ENUM ('pending', 'completed', 'skipped');
CREATE TYPE interaction_type AS ENUM ('reminder', 'checkin', 'conversation', 'alert');
CREATE TYPE alert_type AS ENUM ('missed_dose', 'low_adherence', 'health_concern', 'stock_low');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  role user_role NOT NULL DEFAULT 'senior',
  auth_provider auth_provider NOT NULL DEFAULT 'password',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type institution_type NOT NULL,
  address jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Seniors table
CREATE TABLE IF NOT EXISTS seniors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_of_birth date NOT NULL,
  emergency_contact jsonb DEFAULT '{}',
  institution_id uuid REFERENCES institutions(id) ON DELETE SET NULL,
  preferences jsonb DEFAULT '{"font_size": "large", "contrast": "normal"}',
  created_at timestamptz DEFAULT now()
);

-- Caregivers table
CREATE TABLE IF NOT EXISTS caregivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Senior-Caregiver relationship
CREATE TABLE IF NOT EXISTS senior_caregivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  caregiver_id uuid REFERENCES caregivers(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  permissions jsonb DEFAULT '{"view": true, "edit": false, "manage_reminders": false}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(senior_id, caregiver_id)
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  type reminder_type NOT NULL,
  title text NOT NULL,
  description text,
  schedule_cron text NOT NULL,
  active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Dose events table
CREATE TABLE IF NOT EXISTS dose_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE,
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status event_status DEFAULT 'pending',
  confirmed_at timestamptz,
  confirmation_method confirmation_method,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  title text NOT NULL,
  time_window text NOT NULL,
  status checklist_status DEFAULT 'pending',
  completed_by uuid REFERENCES users(id),
  completed_at timestamptz,
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Daily check-ins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  mood int CHECK (mood >= 1 AND mood <= 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES users(id),
  changes jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Nora interactions table
CREATE TABLE IF NOT EXISTS nora_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  transcript text NOT NULL,
  sentiment text,
  created_at timestamptz DEFAULT now()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  message text NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Medication stock table
CREATE TABLE IF NOT EXISTS medication_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  current_quantity int DEFAULT 0,
  unit text DEFAULT 'pills',
  low_threshold int DEFAULT 7,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seniors_user_id ON seniors(user_id);
CREATE INDEX IF NOT EXISTS idx_seniors_institution_id ON seniors(institution_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_senior_id ON reminders(senior_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_senior_id ON dose_events(senior_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_scheduled_at ON dose_events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dose_events_status ON dose_events(status);
CREATE INDEX IF NOT EXISTS idx_alerts_senior_id ON alerts(senior_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seniors ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nora_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Seniors
CREATE POLICY "Seniors can view own profile"
  ON seniors FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM senior_caregivers sc
      JOIN caregivers c ON c.id = sc.caregiver_id
      WHERE sc.senior_id = seniors.id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can update assigned seniors"
  ON seniors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM senior_caregivers sc
      JOIN caregivers c ON c.id = sc.caregiver_id
      WHERE sc.senior_id = seniors.id 
        AND c.user_id = auth.uid()
        AND (sc.permissions->>'edit')::boolean = true
    )
  );

-- RLS Policies for Caregivers
CREATE POLICY "Caregivers can view own profile"
  ON caregivers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Reminders
CREATE POLICY "View reminders for accessible seniors"
  ON reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seniors s
      WHERE s.id = reminders.senior_id 
        AND (
          s.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM senior_caregivers sc
            JOIN caregivers c ON c.id = sc.caregiver_id
            WHERE sc.senior_id = s.id AND c.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Manage reminders with permission"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM senior_caregivers sc
      JOIN caregivers c ON c.id = sc.caregiver_id
      WHERE sc.senior_id = reminders.senior_id 
        AND c.user_id = auth.uid()
        AND (sc.permissions->>'manage_reminders')::boolean = true
    )
  );

-- RLS Policies for Dose Events
CREATE POLICY "View dose events for accessible seniors"
  ON dose_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seniors s
      WHERE s.id = dose_events.senior_id 
        AND (
          s.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM senior_caregivers sc
            JOIN caregivers c ON c.id = sc.caregiver_id
            WHERE sc.senior_id = s.id AND c.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Seniors can update own dose events"
  ON dose_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seniors s
      WHERE s.id = dose_events.senior_id AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for Alerts
CREATE POLICY "View alerts for accessible seniors"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seniors s
      WHERE s.id = alerts.senior_id 
        AND (
          s.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM senior_caregivers sc
            JOIN caregivers c ON c.id = sc.caregiver_id
            WHERE sc.senior_id = s.id AND c.user_id = auth.uid()
          )
        )
    )
  );

-- RLS Policies for Audit Logs (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
        AND users.role IN ('institution_admin', 'super_admin')
    )
  );