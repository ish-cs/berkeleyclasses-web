export type Term = {
  term_id: string;
  name: string;
  kind: string | null;
};

export type Subject = {
  subject_id: string;
  name: string;
  code: string | null;
};

export type Section = {
  ccn: number;
  term_id: string | null;
  subject_name: string | null;
  course_code: string | null;
  course_number: string | null;
  section_number: string | null;
  section_type: string | null;
  title: string | null;
  instructors: string | null;
  units: string | null;
  instruction_mode: string | null;
  meeting_dates: string | null;
  meeting_days: string | null;
  meeting_time: string | null;
  location: string | null;
  slug: string | null;
  description: string | null;
  open_seats: number;
  enrolled: number;
  waitlisted: number;
  capacity: number;
  last_synced: number;
};

export type SavedSchedule = {
  id: string;
  user_id: string;
  name: string;
  term_id: string | null;
  ccns: number[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WatchSubscription = {
  id: string;
  user_id: string;
  ccn: number;
  email_on_open: boolean;
  last_notified_at: string | null;
  created_at: string;
};
