import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  RegistrationPayload,
  RegistrationRecord,
  ParticipantProfile,
  CertificateRecord,
  ProgramSettings,
  RegistrationWindowState,
  AuthSessionUser,
  TrackSlug
} from '../types';
import {
  DEFAULT_REGISTRATION_OPEN_AT,
  DEFAULT_REGISTRATION_CLOSE_AT,
  computeRegistrationState
} from '../config/program';
import { supabase, isSupabaseConfigured } from '../integrations/supabase/client';
import { buildOfficialCertificateSvgDataUrl } from './certificateGenerator';

interface ReviewApplicationResult {
  status: 'accepted' | 'rejected';
  participant?: ParticipantProfile;
  generatedCredentials?: {
    email: string;
    temporaryPassword: string;
  };
}

interface ProgramStoreContextValue {
  settings: ProgramSettings;
  registrationState: RegistrationWindowState;
  currentUser: AuthSessionUser | null;
  authLoading: boolean;
  registrations: RegistrationRecord[];
  participants: ParticipantProfile[];
  certificates: Record<string, CertificateRecord>;
  submitApplication: (payload: RegistrationPayload) => Promise<{ id: string }>;
  signIn: (email: string, password: string) => Promise<AuthSessionUser>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateParticipantPassword: (newPassword: string) => Promise<void>;
  reviewApplication: (
    registrationId: string,
    decision: 'accepted' | 'rejected',
    overrideTrackId?: TrackSlug
  ) => Promise<ReviewApplicationResult>;
  issueOrUploadCertificate: (
    participantId: string,
    file?: File | null
  ) => Promise<CertificateRecord>;
  getSignedCertificateUrl: (participantId: string) => Promise<string | null>;
  updateRegistrationWindow: (openAtIso: string, closeAtIso: string) => Promise<void>;
  getMyParticipantProfile: () => ParticipantProfile | null;
  getMyCertificate: () => CertificateRecord | null;
}

const ProgramStoreContext = createContext<ProgramStoreContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'masar_program_settings_v1',
  REGISTRATIONS: 'masar_registrations_v1',
  PARTICIPANTS: 'masar_participants_v1',
  CERTIFICATES: 'masar_certificates_v1',
  AUTH_HASHES: 'masar_auth_hashes_v1',
  SESSION: 'masar_active_session_v1'
};

// One-way digest so plaintext passwords are never persisted
async function hashCredential(email: string, password: string): Promise<string> {
  const normalized = `${email.trim().toLowerCase()}::masar_salt_2026::${password}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if subtle crypto unavailable
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

function generateSecurePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  const randomValues = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
  }
  return 'Masar@2026!';
}

const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 'reg-1001',
    full_name: 'سارة بنت عبدالرحمن العتيبي',
    email: 'sara.alotaibi@student.ksu.edu.sa',
    phone: '0551234567',
    university: 'جامعة الملك سعود',
    major: 'الحقوق',
    academic_level: 'المستوى السابع - الثامن',
    university_id: '443201984',
    selected_track_id: 'litigation',
    track_motivation:
      'أرغب في التعمق في آليات إعداد المذكرات القضائية وتقييم مخاطر النزاعات قبل خوضها، والتعرف على كيفية إدارة العلاقة مع مكاتب المحاماة الخارجية.',
    has_previous_legal_training: true,
    previous_training_details: 'برنامج مساجلة للمناظرات القانونية بنادي القانون - جامعة الملك سعود',
    legal_department_knowledge_level: 'متوسط',
    attendance_commitment_confirmed: true,
    status: 'accepted',
    created_at: '2026-10-02T10:15:00+03:00',
    updated_at: '2026-10-04T14:20:00+03:00',
    reviewed_at: '2026-10-04T14:20:00+03:00',
    reviewed_by: 'admin-1',
    participant_account_created: true
  },
  {
    id: 'reg-1002',
    full_name: 'فيصل بن محمد الدوسري',
    email: 'faisal.aldosari@student.ksu.edu.sa',
    phone: '0509876543',
    university: 'جامعة الملك سعود',
    major: 'الحقوق',
    academic_level: 'المستوى الخامس - السادس',
    university_id: '444109231',
    selected_track_id: 'contracts',
    track_motivation:
      'أهتم بصياغة العقود التجارية ومراجعتها، وأتطلع للتدرب العملي على البنود الحمائية التي تقي المنشآت من النزاعات التعاقدية.',
    has_previous_legal_training: false,
    previous_training_details: null,
    legal_department_knowledge_level: 'مبتدئ',
    attendance_commitment_confirmed: true,
    status: 'pending',
    created_at: '2026-10-06T16:40:00+03:00',
    updated_at: '2026-10-06T16:40:00+03:00',
    reviewed_at: null,
    reviewed_by: null,
    participant_account_created: false
  },
  {
    id: 'reg-1003',
    full_name: 'نورة بنت خالد الشهري',
    email: 'noura.alshehri@student.ksu.edu.sa',
    phone: '0543218765',
    university: 'جامعة الملك سعود',
    major: 'الحقوق',
    academic_level: 'المستوى السابع - الثامن',
    university_id: '443998120',
    selected_track_id: 'governance-compliance',
    track_motivation:
      'لدي شغف بمجال الحوكمة والالتزام الرقابي وأعمال مجالس الإدارة ولجانها، وأرغب في فهم التطبيق العملي لبناء أطر الامتثال داخل الشركات.',
    has_previous_legal_training: true,
    previous_training_details: 'ورشة عمل تطوير الكفاءات القانونية - نادي القانون',
    legal_department_knowledge_level: 'متقدم',
    attendance_commitment_confirmed: true,
    status: 'pending',
    created_at: '2026-10-07T11:05:00+03:00',
    updated_at: '2026-10-07T11:05:00+03:00',
    reviewed_at: null,
    reviewed_by: null,
    participant_account_created: false
  },
  {
    id: 'reg-1004',
    full_name: 'سلطان بن عبدالعزيز القحطاني',
    email: 'sultan.alqahtani@student.ksu.edu.sa',
    phone: '0564455667',
    university: 'جامعة الملك سعود',
    major: 'الحقوق',
    academic_level: 'خريج حديث',
    university_id: '442100452',
    selected_track_id: 'legislation',
    track_motivation:
      'أطمح للتخصص في الصياغة التشريعية وإعداد اللوائح والسياسات الداخلية وتقديم الرأي القانوني للإدارات التنفيذية.',
    has_previous_legal_training: true,
    previous_training_details: 'تدريب تعاوني في إدارة الشؤون القانونية (٣ أشهر)',
    legal_department_knowledge_level: 'متوسط',
    attendance_commitment_confirmed: true,
    status: 'pending',
    created_at: '2026-10-08T09:30:00+03:00',
    updated_at: '2026-10-08T09:30:00+03:00',
    reviewed_at: null,
    reviewed_by: null,
    participant_account_created: false
  }
];

const INITIAL_PARTICIPANTS: ParticipantProfile[] = [
  {
    id: 'part-1001',
    user_id: 'user-part-1001',
    registration_id: 'reg-1001',
    full_name: 'سارة بنت عبدالرحمن العتيبي',
    email: 'sara.alotaibi@student.ksu.edu.sa',
    phone: '0551234567',
    university: 'جامعة الملك سعود',
    major: 'الحقوق',
    academic_level: 'المستوى السابع - الثامن',
    university_id: '443201984',
    selected_track_id: 'litigation',
    status: 'accepted',
    must_change_password: false,
    created_at: '2026-10-04T14:20:00+03:00',
    updated_at: '2026-10-04T14:20:00+03:00'
  }
];

export const ProgramStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [settings, setSettings] = useState<ProgramSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 'default',
      registration_open_at: DEFAULT_REGISTRATION_OPEN_AT,
      registration_close_at: DEFAULT_REGISTRATION_CLOSE_AT,
      updated_at: new Date().toISOString()
    };
  });

  const [registrationState, setRegistrationState] = useState<RegistrationWindowState>(() =>
    computeRegistrationState(settings.registration_open_at, settings.registration_close_at)
  );

  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_REGISTRATIONS;
  });

  const [participants, setParticipants] = useState<ParticipantProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PARTICIPANTS;
  });

  const [certificates, setCertificates] = useState<Record<string, CertificateRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const samplePart = INITIAL_PARTICIPANTS[0];
    const issuedAt = '2026-10-14T17:00:00+03:00';
    return {
      [samplePart.id]: {
        id: 'cert-1001',
        participant_id: samplePart.id,
        user_id: samplePart.user_id,
        storage_path: `certificates/${samplePart.user_id}/certificate-litigation.svg`,
        file_name: 'شهادة-مسارات-الإدارات-القانونية-سارة-العتيبي.svg',
        issued_at: issuedAt,
        issued_by: 'admin-1',
        signed_url: buildOfficialCertificateSvgDataUrl(samplePart, issuedAt)
      }
    };
  });

  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Recalculate registration window state periodically and when settings change
  useEffect(() => {
    const updateWindow = () => {
      setRegistrationState(
        computeRegistrationState(settings.registration_open_at, settings.registration_close_at)
      );
    };
    updateWindow();
    const timer = setInterval(updateWindow, 15000);
    return () => clearInterval(timer);
  }, [settings]);

  // Persist local state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    } catch {
      // ignore
    }
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
    } catch {
      // ignore
    }
  }, [participants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
    } catch {
      // ignore
    }
  }, [certificates]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Initialize default hashed credentials for preview accounts (never storing plaintext passwords)
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.AUTH_HASHES);
        const map: Record<string, { hash: string; user: AuthSessionUser }> = raw
          ? JSON.parse(raw)
          : {};

        const adminEmail = 'development.lawclub@gmail.com';
        if (!map[adminEmail]) {
          map[adminEmail] = {
            hash: await hashCredential(adminEmail, 'MasarAdmin2026!'),
            user: {
              id: 'admin-1',
              email: adminEmail,
              role: 'admin',
              full_name: 'لجنة التأهيل والتطوير — نادي القانون'
            }
          };
        }

        const sampleParticipantEmail = 'sara.alotaibi@student.ksu.edu.sa';
        if (!map[sampleParticipantEmail]) {
          map[sampleParticipantEmail] = {
            hash: await hashCredential(sampleParticipantEmail, 'MasarPart2026!'),
            user: {
              id: 'user-part-1001',
              email: sampleParticipantEmail,
              role: 'participant',
              full_name: 'سارة بنت عبدالرحمن العتيبي'
            }
          };
        }

        localStorage.setItem(STORAGE_KEYS.AUTH_HASHES, JSON.stringify(map));
      } catch {
        // ignore
      }
    })();
  }, []);

  // Sync with live Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    (async () => {
      setAuthLoading(true);
      try {
        // Load program_settings
        const { data: ps } = await supabase
          .from('program_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (ps) {
          setSettings({
            id: ps.id,
            registration_open_at: ps.registration_open_at,
            registration_close_at: ps.registration_close_at,
            updated_at: ps.updated_at
          });
        }

        // Check active session
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const role = roleData?.role === 'admin' ? 'admin' : 'participant';
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            role,
            full_name: session.user.user_metadata?.full_name
          });
        }
      } catch {
        // Fallback to local state if tables not migrated yet
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const submitApplication = useCallback(
    async (payload: RegistrationPayload): Promise<{ id: string }> => {
      // 1. Enforce registration deadline check
      const currentState = computeRegistrationState(
        settings.registration_open_at,
        settings.registration_close_at
      );
      if (currentState !== 'open') {
        throw new Error('REGISTRATION_CLOSED');
      }

      // 2. Try server-side endpoint /api/register first (enforces deadline on server)
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            openAt: settings.registration_open_at,
            closeAt: settings.registration_close_at
          })
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error === 'REGISTRATION_CLOSED' || errData.error === 'REGISTRATION_NOT_OPEN_YET') {
            throw new Error('REGISTRATION_CLOSED');
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'REGISTRATION_CLOSED') {
          throw err;
        }
        // If static preview without Express running, proceed to Supabase / local store
      }

      // 3. If Supabase is configured, insert into public.registrations (trigger + RLS also enforce deadline)
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('registrations')
          .insert({
            full_name: payload.full_name.trim(),
            email: payload.email.trim().toLowerCase(),
            phone: payload.phone.trim(),
            university: payload.university.trim(),
            major: payload.major.trim(),
            academic_level: payload.academic_level,
            university_id: payload.university_id.trim(),
            selected_track_id: payload.selected_track_id,
            track_motivation: payload.track_motivation.trim(),
            has_previous_legal_training: payload.has_previous_legal_training,
            previous_training_details: payload.has_previous_legal_training
              ? payload.previous_training_details?.trim() || null
              : null,
            legal_department_knowledge_level: payload.legal_department_knowledge_level,
            attendance_commitment_confirmed: payload.attendance_commitment_confirmed,
            status: 'pending'
          })
          .select('id')
          .single();

        if (error) {
          if (error.message?.includes('duplicate') || error.code === '23505') {
            throw new Error('EMAIL_DUPLICATE');
          }
          if (error.message?.includes('REGISTRATION_CLOSED')) {
            throw new Error('REGISTRATION_CLOSED');
          }
          throw error;
        }
        return { id: data.id };
      }

      // 4. Local PostgreSQL-compatible store
      const normalizedEmail = payload.email.trim().toLowerCase();
      const exists = registrations.some(
        (r) => r.email.trim().toLowerCase() === normalizedEmail
      );
      if (exists) {
        throw new Error('EMAIL_DUPLICATE');
      }

      const newRecord: RegistrationRecord = {
        id: `reg-${Date.now()}`,
        full_name: payload.full_name.trim(),
        email: normalizedEmail,
        phone: payload.phone.trim(),
        university: payload.university.trim(),
        major: payload.major.trim(),
        academic_level: payload.academic_level,
        university_id: payload.university_id.trim(),
        selected_track_id: payload.selected_track_id,
        track_motivation: payload.track_motivation.trim(),
        has_previous_legal_training: payload.has_previous_legal_training,
        previous_training_details: payload.has_previous_legal_training
          ? payload.previous_training_details?.trim() || null
          : null,
        legal_department_knowledge_level: payload.legal_department_knowledge_level,
        attendance_commitment_confirmed: payload.attendance_commitment_confirmed,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        participant_account_created: false
      };

      setRegistrations((prev) => [newRecord, ...prev]);
      return { id: newRecord.id };
    },
    [settings, registrations]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthSessionUser> => {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (error || !data.user) {
          throw new Error('INVALID_CREDENTIALS');
        }
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const userObj: AuthSessionUser = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          role: roleRow?.role === 'admin' ? 'admin' : 'participant',
          full_name: data.user.user_metadata?.full_name
        };
        setCurrentUser(userObj);
        return userObj;
      }

      // Verify against hashed credentials store
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_HASHES);
      const map: Record<string, { hash: string; user: AuthSessionUser }> = raw
        ? JSON.parse(raw)
        : {};
      const entry = map[normalizedEmail];
      if (!entry) {
        throw new Error('INVALID_CREDENTIALS');
      }
      const computedHash = await hashCredential(normalizedEmail, password);
      if (computedHash !== entry.hash) {
        throw new Error('INVALID_CREDENTIALS');
      }

      setCurrentUser(entry.user);
      return entry.user;
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/dashboard`
      });
    }
  }, []);

  const updateParticipantPassword = useCallback(
    async (newPassword: string) => {
      if (!currentUser) throw new Error('NOT_AUTHENTICATED');

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        await supabase
          .from('participants')
          .update({ must_change_password: false, updated_at: new Date().toISOString() })
          .eq('user_id', currentUser.id);
      } else {
        const raw = localStorage.getItem(STORAGE_KEYS.AUTH_HASHES);
        const map: Record<string, { hash: string; user: AuthSessionUser }> = raw
          ? JSON.parse(raw)
          : {};
        const normalizedEmail = currentUser.email.trim().toLowerCase();
        map[normalizedEmail] = {
          hash: await hashCredential(normalizedEmail, newPassword),
          user: currentUser
        };
        localStorage.setItem(STORAGE_KEYS.AUTH_HASHES, JSON.stringify(map));
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.user_id === currentUser.id
            ? { ...p, must_change_password: false, updated_at: new Date().toISOString() }
            : p
        )
      );
    },
    [currentUser]
  );

  const reviewApplication = useCallback(
    async (
      registrationId: string,
      decision: 'accepted' | 'rejected',
      overrideTrackId?: TrackSlug
    ): Promise<ReviewApplicationResult> => {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('FORBIDDEN_ADMIN_ONLY');
      }

      // If Supabase is configured, invoke the server-side Edge Function `admin-actions`
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('admin-actions', {
          body: {
            action: 'review_registration',
            registrationId,
            decision,
            overrideTrackId
          }
        });
        if (error) throw error;
        return {
          status: decision,
          participant: data?.participant,
          generatedCredentials: data?.credentials
        };
      }

      const targetReg = registrations.find((r) => r.id === registrationId);
      if (!targetReg) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      const finalTrackId: TrackSlug = overrideTrackId || targetReg.selected_track_id;
      const nowIso = new Date().toISOString();

      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registrationId
            ? {
                ...r,
                status: decision,
                selected_track_id: finalTrackId,
                reviewed_at: nowIso,
                reviewed_by: currentUser.id,
                updated_at: nowIso,
                participant_account_created:
                  decision === 'accepted' ? true : r.participant_account_created
              }
            : r
        )
      );

      if (decision === 'rejected') {
        return { status: 'rejected' };
      }

      // Check if participant account already exists for this registration
      const existingParticipant = participants.find(
        (p) => p.registration_id === registrationId
      );

      if (existingParticipant) {
        const updatedParticipant: ParticipantProfile = {
          ...existingParticipant,
          selected_track_id: finalTrackId,
          updated_at: nowIso
        };
        setParticipants((prev) =>
          prev.map((p) => (p.id === existingParticipant.id ? updatedParticipant : p))
        );
        return {
          status: 'accepted',
          participant: updatedParticipant
        };
      }

      // Generate secure one-time temporary password (never stored in plaintext in participant/registration tables)
      const temporaryPassword = generateSecurePassword(10);
      const newUserId = `user-part-${Date.now()}`;
      const normalizedEmail = targetReg.email.trim().toLowerCase();

      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_HASHES);
      const map: Record<string, { hash: string; user: AuthSessionUser }> = raw
        ? JSON.parse(raw)
        : {};

      map[normalizedEmail] = {
        hash: await hashCredential(normalizedEmail, temporaryPassword),
        user: {
          id: newUserId,
          email: normalizedEmail,
          role: 'participant',
          full_name: targetReg.full_name
        }
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_HASHES, JSON.stringify(map));

      const newParticipant: ParticipantProfile = {
        id: `part-${Date.now()}`,
        user_id: newUserId,
        registration_id: targetReg.id,
        full_name: targetReg.full_name,
        email: normalizedEmail,
        phone: targetReg.phone,
        university: targetReg.university,
        major: targetReg.major,
        academic_level: targetReg.academic_level,
        university_id: targetReg.university_id,
        selected_track_id: finalTrackId,
        status: 'accepted',
        must_change_password: true,
        created_at: nowIso,
        updated_at: nowIso
      };

      setParticipants((prev) => [newParticipant, ...prev]);

      return {
        status: 'accepted',
        participant: newParticipant,
        generatedCredentials: {
          email: normalizedEmail,
          temporaryPassword
        }
      };
    },
    [currentUser, registrations, participants]
  );

  const issueOrUploadCertificate = useCallback(
    async (
      participantId: string,
      file?: File | null
    ): Promise<CertificateRecord> => {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('FORBIDDEN_ADMIN_ONLY');
      }

      const participant = participants.find((p) => p.id === participantId);
      if (!participant) {
        throw new Error('PARTICIPANT_NOT_FOUND');
      }

      const issuedAt = new Date().toISOString();
      const storagePath = `${participant.user_id}/certificate-${participant.selected_track_id}-${Date.now()}.${
        file ? file.name.split('.').pop() || 'pdf' : 'svg'
      }`;

      if (isSupabaseConfigured && supabase && file) {
        const { error: uploadErr } = await supabase.storage
          .from('certificates')
          .upload(storagePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: certRow, error: dbErr } = await supabase
          .from('certificates')
          .upsert(
            {
              participant_id: participant.id,
              user_id: participant.user_id,
              storage_path: storagePath,
              file_name: file.name,
              issued_at: issuedAt,
              issued_by: currentUser.id
            },
            { onConflict: 'participant_id' }
          )
          .select('*')
          .single();

        if (dbErr) throw dbErr;
        return certRow as CertificateRecord;
      }

      // Convert uploaded file to private data URL or generate official SVG certificate
      let dataUrl: string;
      let fileName: string;

      if (file) {
        fileName = file.name;
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
          reader.readAsDataURL(file);
        });
      } else {
        fileName = `شهادة-مسارات-${participant.full_name.replace(/\s+/g, '-')}.svg`;
        dataUrl = buildOfficialCertificateSvgDataUrl(participant, issuedAt);
      }

      const certRecord: CertificateRecord = {
        id: `cert-${Date.now()}`,
        participant_id: participant.id,
        user_id: participant.user_id,
        storage_path: `certificates/${storagePath}`,
        file_name: fileName,
        issued_at: issuedAt,
        issued_by: currentUser.id,
        signed_url: dataUrl
      };

      setCertificates((prev) => ({
        ...prev,
        [participant.id]: certRecord
      }));

      return certRecord;
    },
    [currentUser, participants]
  );

  const getSignedCertificateUrl = useCallback(
    async (participantId: string): Promise<string | null> => {
      if (!currentUser) return null;

      const cert = certificates[participantId];
      if (!cert) return null;

      // Enforce strict ownership: Participant A can NEVER access Participant B's certificate
      if (currentUser.role !== 'admin' && cert.user_id !== currentUser.id) {
        throw new Error('FORBIDDEN_CERTIFICATE_OWNERSHIP_VIOLATION');
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.storage
          .from('certificates')
          .createSignedUrl(cert.storage_path, 300); // 5-minute signed URL
        if (error || !data?.signedUrl) return null;
        return data.signedUrl;
      }

      return cert.signed_url || null;
    },
    [currentUser, certificates]
  );

  const updateRegistrationWindow = useCallback(
    async (openAtIso: string, closeAtIso: string) => {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('FORBIDDEN_ADMIN_ONLY');
      }

      const nextSettings: ProgramSettings = {
        id: 'default',
        registration_open_at: openAtIso,
        registration_close_at: closeAtIso,
        updated_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('program_settings')
          .update({
            registration_open_at: openAtIso,
            registration_close_at: closeAtIso,
            updated_at: nextSettings.updated_at,
            updated_by: currentUser.id
          })
          .eq('id', 'default');
      }

      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextSettings)
        });
      } catch {
        // ignore if static preview
      }

      setSettings(nextSettings);
    },
    [currentUser]
  );

  const getMyParticipantProfile = useCallback((): ParticipantProfile | null => {
    if (!currentUser) return null;
    return participants.find((p) => p.user_id === currentUser.id) || null;
  }, [currentUser, participants]);

  const getMyCertificate = useCallback((): CertificateRecord | null => {
    const myProfile = getMyParticipantProfile();
    if (!myProfile) return null;
    const cert = certificates[myProfile.id];
    if (!cert || cert.user_id !== currentUser?.id) return null;
    return cert;
  }, [getMyParticipantProfile, certificates, currentUser]);

  return (
    <ProgramStoreContext.Provider
      value={{
        settings,
        registrationState,
        currentUser,
        authLoading,
        registrations,
        participants,
        certificates,
        submitApplication,
        signIn,
        signOut,
        requestPasswordReset,
        updateParticipantPassword,
        reviewApplication,
        issueOrUploadCertificate,
        getSignedCertificateUrl,
        updateRegistrationWindow,
        getMyParticipantProfile,
        getMyCertificate
      }}
    >
      {children}
    </ProgramStoreContext.Provider>
  );
};

export function useProgramStore(): ProgramStoreContextValue {
  const ctx = useContext(ProgramStoreContext);
  if (!ctx) {
    throw new Error('useProgramStore must be used within a ProgramStoreProvider');
  }
  return ctx;
}
