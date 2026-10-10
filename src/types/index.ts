export type Language = 'ar' | 'en';

export type TrackSlug =
  | 'litigation'
  | 'contracts'
  | 'legislation'
  | 'governance-compliance';

export interface TrackConfig {
  id: TrackSlug;
  slug: TrackSlug;
  numberAr: string;
  numberEn: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  extendedDescriptionAr: string;
  extendedDescriptionEn: string;
  corePillarsAr: string[];
  corePillarsEn: string[];
  practicalExerciseAr: string;
  practicalExerciseEn: string;
  image: string;
  route: string;
}

export type RegistrationWindowState = 'before' | 'open' | 'closed';

export type KnowledgeLevel = 'متقدم' | 'متوسط' | 'مبتدئ';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type AppErrorCode =
  | 'REGISTRATION_CLOSED'
  | 'REGISTRATION_NOT_OPEN_YET'
  | 'EMAIL_DUPLICATE'
  | 'INVALID_REGISTRATION_DATA'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'CERTIFICATE_NOT_AVAILABLE'
  | 'SERVER_NOT_CONFIGURED';

export interface RegistrationPayload {
  full_name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  academic_level: string;
  university_id: string;
  selected_track_id: TrackSlug;
  second_track_id: TrackSlug;
  track_motivation: string; }

export interface RegistrationRecord extends RegistrationPayload {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  participant_account_created: boolean;
}

export interface ParticipantProfile {
  id: string;
  user_id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  academic_level: string;
  university_id: string;
  selected_track_id: TrackSlug;
  status: 'accepted';
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateRecord {
  id: string;
  participant_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  issued_at: string;
  issued_by: string | null;
  created_at?: string;
}

export interface ProgramSettings {
  id: string;
  registration_open_at: string;
  registration_close_at: string;
  updated_at: string;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  role: 'admin' | 'participant';
  full_name?: string;
}
