export type UserRole = 'senior' | 'caregiver' | 'institution_admin' | 'super_admin';
export type AuthProvider = 'password' | 'magic_link' | 'oauth';
export type InstitutionType = 'assisted_living' | 'nursing_home' | 'hospital' | 'home_care';
export type ReminderType = 'medication' | 'appointment' | 'meal' | 'activity' | 'custom';
export type EventStatus = 'pending' | 'confirmed' | 'skipped' | 'missed';
export type ConfirmationMethod = 'tap' | 'voice' | 'caregiver';
export type ChecklistStatus = 'pending' | 'completed' | 'skipped';
export type InteractionType = 'reminder' | 'checkin' | 'conversation' | 'alert';
export type AlertType = 'missed_dose' | 'low_adherence' | 'health_concern' | 'stock_low';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  auth_provider: AuthProvider;
  created_at: string;
  updated_at: string;
}

export interface Senior {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  emergency_contact: Record<string, any>;
  institution_id?: string;
  preferences: Record<string, any>;
  created_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface SeniorCaregiver {
  id: string;
  senior_id: string;
  caregiver_id: string;
  relationship: string;
  permissions: {
    view: boolean;
    edit: boolean;
    manage_reminders: boolean;
  };
  created_at: string;
}

export interface Reminder {
  id: string;
  senior_id: string;
  type: ReminderType;
  title: string;
  description?: string;
  schedule_cron: string;
  active: boolean;
  created_by: string;
  created_at: string;
}

export interface DoseEvent {
  id: string;
  reminder_id: string;
  senior_id: string;
  scheduled_at: string;
  status: EventStatus;
  confirmed_at?: string;
  confirmation_method?: ConfirmationMethod;
  notes?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  senior_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email?: string;
  };
}
