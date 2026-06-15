export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

export interface Event {
  id: number;
  collaborator_name: string;
  collaborator_email: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  reminder_datetime?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator_username?: string;
  creator_first_name?: string;
  creator_last_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
}

export interface EmailLog {
  id: number;
  event_id?: number;
  recipient_email: string;
  recipient_name?: string;
  subject?: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  event_title?: string;
  collaborator_name?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface DashboardStats {
  events: { total: number; future: number };
  reminders: { total: number; sent: number; pending: number };
  users: { total: number; active: number };
  upcoming_7_days: number;
  email_logs: { total: number; sent: number };
  top_collaborators: Array<{ collaborator_name: string; collaborator_email: string; event_count: string }>;
  events_by_month: Array<{ month: string; count: string }>;
}

export interface Collaborator {
  collaborator_name: string;
  collaborator_email: string;
}

export interface EventFilters {
  search?: string;
  collaborator_email?: string;
  start_date?: string;
  end_date?: string;
  reminder_sent?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEvents {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}
