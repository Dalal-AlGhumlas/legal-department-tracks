import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
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
import { buildOfficialCertificateFile } from './certificateGenerator';

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
  dataLoading: boolean;
  registrations: RegistrationRecord[];
  participants: ParticipantProfile[];
  certificates: Record<string, CertificateRecord>;
  myParticipantProfile: ParticipantProfile | null;
  myCertificate: CertificateRecord | null;
  loadProgramSettings: () => Promise<ProgramSettings>;
  loadAdminRegistrations: () => Promise<RegistrationRecord[]>;
  loadParticipants: () => Promise<ParticipantProfile[]>;
  loadParticipantProfile: (userId?: string) => Promise<ParticipantProfile | null>;
  loadCertificates: () => Promise<Record<string, CertificateRecord>>;
  refreshAdminData: () => Promise<void>;
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

const ProgramStoreContext = createContext<ProgramStoreContextValue | undefined>(
  undefined
);

export const ProgramStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [settings, setSettings] = useState<ProgramSettings>({
    id: 'default',
    registration_open_at: DEFAULT_REGISTRATION_OPEN_AT,
    registration_close_at: DEFAULT_REGISTRATION_CLOSE_AT,
    updated_at: new Date().toISOString()
  });

  const [registrationState, setRegistrationState] =
    useState<RegistrationWindowState>(() =>
      computeRegistrationState(
        DEFAULT_REGISTRATION_OPEN_AT,
        DEFAULT_REGISTRATION_CLOSE_AT
      )
    );

  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Authoritative state loaded from Supabase (starts empty — no fake/demo data)
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [certificates, setCertificates] = useState<
    Record<string, CertificateRecord>
  >({});
  const [myParticipantProfile, setMyParticipantProfile] =
    useState<ParticipantProfile | null>(null);
  const [myCertificate, setMyCertificate] = useState<CertificateRecord | null>(
    null
  );

  // Recalculate registration window state periodically and when settings change
  useEffect(() => {
    const updateWindow = () => {
      setRegistrationState(
        computeRegistrationState(
          settings.registration_open_at,
          settings.registration_close_at
        )
      );
    };
    updateWindow();
    const timer = setInterval(updateWindow, 15000);
    return () => clearInterval(timer);
  }, [settings]);

  // ---------------------------------------------------------------------------
  // 1. DATA LOADING / REFETCH FUNCTIONS (SUPABASE SINGLE SOURCE OF TRUTH)
  // ---------------------------------------------------------------------------
  const loadProgramSettings = useCallback(async (): Promise<ProgramSettings> => {
    if (!isSupabaseConfigured || !supabase) {
      return settings;
    }

    const { data, error } = await supabase
      .from('program_settings')
      .select('id, registration_open_at, registration_close_at, updated_at')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      const nextSettings: ProgramSettings = {
        id: data.id,
        registration_open_at: data.registration_open_at,
        registration_close_at: data.registration_close_at,
        updated_at: data.updated_at
      };
      setSettings(nextSettings);
      return nextSettings;
    }

    return settings;
  }, [settings]);

  const loadAdminRegistrations = useCallback(async (): Promise<
    RegistrationRecord[]
  > => {
    if (!isSupabaseConfigured || !supabase) {
      setRegistrations([]);
      return [];
    }

    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('UNAUTHORIZED');
    }

    const rows = ((data || []) as RegistrationRecord[]).map((r) => ({
      ...r,
      participant_account_created: Boolean(r.participant_account_created)
    }));
    setRegistrations(rows);
    return rows;
  }, []);

  const loadParticipants = useCallback(async (): Promise<
    ParticipantProfile[]
  > => {
    if (!isSupabaseConfigured || !supabase) {
      setParticipants([]);
      return [];
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('UNAUTHORIZED');
    }

    const rows = (data || []) as ParticipantProfile[];
    setParticipants(rows);
    return rows;
  }, []);

  const loadCertificates = useCallback(async (): Promise<
    Record<string, CertificateRecord>
  > => {
    if (!isSupabaseConfigured || !supabase) {
      setCertificates({});
      return {};
    }

    const { data, error } = await supabase
      .from('certificates')
      .select(
        'id, participant_id, user_id, storage_path, file_name, issued_at, issued_by, created_at'
      );

    if (error) {
      throw new Error('UNAUTHORIZED');
    }

    const map: Record<string, CertificateRecord> = {};
    for (const row of (data || []) as CertificateRecord[]) {
      map[row.participant_id] = row;
    }
    setCertificates(map);
    return map;
  }, []);

  const loadParticipantProfile = useCallback(
    async (targetUserId?: string): Promise<ParticipantProfile | null> => {
      const uid = targetUserId || currentUser?.id;
      if (!isSupabaseConfigured || !supabase || !uid) {
        setMyParticipantProfile(null);
        setMyCertificate(null);
        return null;
      }

      setDataLoading(true);
      try {
        const { data: profileRow, error: profileErr } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();

        if (profileErr || !profileRow) {
          setMyParticipantProfile(null);
          setMyCertificate(null);
          return null;
        }

        const typedProfile = profileRow as ParticipantProfile;
        setMyParticipantProfile(typedProfile);

        // Fetch participant's own certificate metadata
        const { data: certRow } = await supabase
          .from('certificates')
          .select(
            'id, participant_id, user_id, storage_path, file_name, issued_at, issued_by, created_at'
          )
          .eq('user_id', uid)
          .eq('participant_id', typedProfile.id)
          .maybeSingle();

        if (certRow) {
          const typedCert = certRow as CertificateRecord;
          setMyCertificate(typedCert);
          setCertificates((prev) => ({
            ...prev,
            [typedProfile.id]: typedCert
          }));
        } else {
          setMyCertificate(null);
        }

        return typedProfile;
      } finally {
        setDataLoading(false);
      }
    },
    [currentUser?.id]
  );

  const refreshAdminData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setDataLoading(true);
    try {
      await Promise.all([
        loadProgramSettings(),
        loadAdminRegistrations(),
        loadParticipants(),
        loadCertificates()
      ]);
    } finally {
      setDataLoading(false);
    }
  }, [
    loadProgramSettings,
    loadAdminRegistrations,
    loadParticipants,
    loadCertificates
  ]);

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION & STRICT ROLE RESOLUTION
  // ---------------------------------------------------------------------------
  const resolveAuthenticatedUser = useCallback(
    async (
      userId: string,
      email: string,
      metadataName?: string
    ): Promise<AuthSessionUser | null> => {
      if (!supabase) return null;

      // Query user_roles for this user
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError || !rolesData || rolesData.length === 0) {
        return null;
      }

      const hasAdminRole = rolesData.some((r) => r.role === 'admin');
      const hasParticipantRole = rolesData.some((r) => r.role === 'participant');

      if (hasAdminRole) {
        return {
          id: userId,
          email,
          role: 'admin',
          full_name: metadataName
        };
      }

      if (hasParticipantRole) {
        // Verify that an active participant profile actually exists
        const { data: partProfile, error: partErr } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (partErr || !partProfile) {
          return null;
        }

        const typedProfile = partProfile as ParticipantProfile;
        setMyParticipantProfile(typedProfile);

        // Also load participant's certificate metadata
        const { data: certRow } = await supabase
          .from('certificates')
          .select(
            'id, participant_id, user_id, storage_path, file_name, issued_at, issued_by, created_at'
          )
          .eq('user_id', userId)
          .eq('participant_id', typedProfile.id)
          .maybeSingle();

        if (certRow) {
          const typedCert = certRow as CertificateRecord;
          setMyCertificate(typedCert);
          setCertificates((prev) => ({
            ...prev,
            [typedProfile.id]: typedCert
          }));
        } else {
          setMyCertificate(null);
        }

        return {
          id: userId,
          email: typedProfile.email || email,
          role: 'participant',
          full_name: typedProfile.full_name
        };
      }

      return null;
    },
    []
  );

  // Startup session check + onAuthStateChange subscription
  useEffect(() => {
    loadProgramSettings().catch(() => {
      // Keep default fallback settings if offline
    });

    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    const sb = supabase;
    let isMounted = true;

    const initializeAuth = async () => {
      setAuthLoading(true);
      try {
        const {
          data: { session }
        } = await sb.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          const resolved = await resolveAuthenticatedUser(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          );
          if (!isMounted) return;
          setCurrentUser(resolved);
          if (resolved?.role === 'admin') {
            await refreshAdminData();
          }
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentUser(null);
        setRegistrations([]);
        setParticipants([]);
        setCertificates({});
        setMyParticipantProfile(null);
        setMyCertificate(null);
        setAuthLoading(false);
        return;
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        (async () => {
          const resolved = await resolveAuthenticatedUser(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          );
          if (!isMounted) return;
          setCurrentUser(resolved);
          if (resolved?.role === 'admin') {
            await refreshAdminData();
          }
          setAuthLoading(false);
        })();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProgramSettings, resolveAuthenticatedUser, refreshAdminData]);

  // ---------------------------------------------------------------------------
  // 3. AUTHORITATIVE SERVER-SIDE REGISTRATION SUBMISSION (POST /api/register)
  // ---------------------------------------------------------------------------
  const submitApplication = useCallback(
    async (payload: RegistrationPayload): Promise<{ id: string }> => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          university: payload.university,
          major: payload.major,
          academic_level: payload.academic_level,
          university_id: payload.university_id,
          selected_track_id: payload.selected_track_id,
          track_motivation: payload.track_motivation,
          has_previous_legal_training: payload.has_previous_legal_training,
          previous_training_details: payload.previous_training_details,
          legal_department_knowledge_level:
            payload.legal_department_knowledge_level,
          attendance_commitment_confirmed:
            payload.attendance_commitment_confirmed
        })
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body?.ok || !body?.id) {
        const errCode = body?.error || 'INVALID_REGISTRATION_DATA';
        if (errCode === 'EMAIL_DUPLICATE') {
          throw new Error('EMAIL_DUPLICATE');
        }
        if (
          errCode === 'REGISTRATION_CLOSED' ||
          errCode === 'REGISTRATION_NOT_OPEN_YET'
        ) {
          throw new Error('REGISTRATION_CLOSED');
        }
        throw new Error(errCode);
      }

      return { id: String(body.id) };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // 4. REAL SUPABASE AUTHENTICATION ACTIONS
  // ---------------------------------------------------------------------------
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthSessionUser> => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('SERVER_NOT_CONFIGURED');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error || !data.user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      const resolved = await resolveAuthenticatedUser(
        data.user.id,
        data.user.email || normalizedEmail,
        data.user.user_metadata?.full_name
      );

      if (!resolved) {
        await supabase.auth.signOut();
        throw new Error('ACCOUNT_NOT_ACTIVE');
      }

      setCurrentUser(resolved);

      if (resolved.role === 'admin') {
        await refreshAdminData();
      }

      return resolved;
    },
    [resolveAuthenticatedUser, refreshAdminData]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setRegistrations([]);
    setParticipants([]);
    setCertificates({});
    setMyParticipantProfile(null);
    setMyCertificate(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('SERVER_NOT_CONFIGURED');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/dashboard`
    });
    if (error) {
      throw new Error('INVALID_CREDENTIALS');
    }
  }, []);

  // Safe must_change_password update via narrow PostgreSQL RPC
  const updateParticipantPassword = useCallback(
    async (newPassword: string) => {
      if (!currentUser || !isSupabaseConfigured || !supabase) {
        throw new Error('UNAUTHORIZED');
      }

      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authErr) {
        throw new Error('UNAUTHORIZED');
      }

      const { error: rpcErr } = await supabase.rpc('mark_own_password_changed');
      if (rpcErr) {
        throw new Error('FORBIDDEN');
      }

      await loadParticipantProfile(currentUser.id);
    },
    [currentUser, loadParticipantProfile]
  );

  // ---------------------------------------------------------------------------
  // 5. ADMIN ACTIONS (SUPABASE EDGE FUNCTION + LIVE DATA REFRESH)
  // ---------------------------------------------------------------------------
  const reviewApplication = useCallback(
    async (
      registrationId: string,
      decision: 'accepted' | 'rejected',
      overrideTrackId?: TrackSlug
    ): Promise<ReviewApplicationResult> => {
      if (
        !currentUser ||
        currentUser.role !== 'admin' ||
        !isSupabaseConfigured ||
        !supabase
      ) {
        throw new Error('FORBIDDEN');
      }

      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'review_registration',
          registrationId,
          decision,
          overrideTrackId
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'FORBIDDEN');
      }

      // Immediately refresh authoritative registrations & participants from Supabase
      await Promise.all([loadAdminRegistrations(), loadParticipants()]);

      return {
        status: decision,
        participant: data?.participant,
        generatedCredentials: data?.credentials
      };
    },
    [currentUser, loadAdminRegistrations, loadParticipants]
  );

  const issueOrUploadCertificate = useCallback(
    async (
      participantId: string,
      file?: File | null
    ): Promise<CertificateRecord> => {
      if (
        !currentUser ||
        currentUser.role !== 'admin' ||
        !isSupabaseConfigured ||
        !supabase
      ) {
        throw new Error('FORBIDDEN');
      }

      const participant = participants.find((p) => p.id === participantId);
      if (!participant) {
        throw new Error('CERTIFICATE_NOT_AVAILABLE');
      }

      const issuedAt = new Date().toISOString();
      const uploadFile: File =
        file || buildOfficialCertificateFile(participant, issuedAt);

      const ext =
        uploadFile.name.split('.').pop()?.toLowerCase() || 'svg';
      const storagePath = `${participant.user_id}/certificate-${participant.selected_track_id}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('certificates')
        .upload(storagePath, uploadFile, {
          upsert: true,
          contentType: uploadFile.type || undefined
        });

      if (uploadErr) {
        throw new Error('FORBIDDEN');
      }

      const { data: certRow, error: dbErr } = await supabase
        .from('certificates')
        .upsert(
          {
            participant_id: participant.id,
            user_id: participant.user_id,
            storage_path: storagePath,
            file_name: uploadFile.name,
            issued_at: issuedAt,
            issued_by: currentUser.id
          },
          { onConflict: 'participant_id' }
        )
        .select(
          'id, participant_id, user_id, storage_path, file_name, issued_at, issued_by, created_at'
        )
        .single();

      if (dbErr || !certRow) {
        throw new Error('FORBIDDEN');
      }

      await loadCertificates();
      return certRow as CertificateRecord;
    },
    [currentUser, participants, loadCertificates]
  );

  const getSignedCertificateUrl = useCallback(
    async (participantId: string): Promise<string | null> => {
      if (!currentUser || !isSupabaseConfigured || !supabase) {
        return null;
      }

      const cert =
        currentUser.role === 'admin'
          ? certificates[participantId]
          : myCertificate?.participant_id === participantId
          ? myCertificate
          : certificates[participantId];

      if (!cert) {
        return null;
      }

      // Enforce ownership check: Participant A can never access Participant B's certificate
      if (currentUser.role !== 'admin' && cert.user_id !== currentUser.id) {
        throw new Error('FORBIDDEN');
      }

      const { data, error } = await supabase.storage
        .from('certificates')
        .createSignedUrl(cert.storage_path, 300);

      if (error || !data?.signedUrl) {
        return null;
      }

      return data.signedUrl;
    },
    [currentUser, certificates, myCertificate]
  );

  const updateRegistrationWindow = useCallback(
    async (openAtIso: string, closeAtIso: string) => {
      if (
        !currentUser ||
        currentUser.role !== 'admin' ||
        !isSupabaseConfigured ||
        !supabase
      ) {
        throw new Error('FORBIDDEN');
      }

      const openTime = new Date(openAtIso).getTime();
      const closeTime = new Date(closeAtIso).getTime();

      if (
        Number.isNaN(openTime) ||
        Number.isNaN(closeTime) ||
        openTime >= closeTime
      ) {
        throw new Error('INVALID_REGISTRATION_DATA');
      }

      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from('program_settings')
        .update({
          registration_open_at: openAtIso,
          registration_close_at: closeAtIso,
          updated_at: updatedAt,
          updated_by: currentUser.id
        })
        .eq('id', 'default');

      if (error) {
        throw new Error('FORBIDDEN');
      }

      await loadProgramSettings();
    },
    [currentUser, loadProgramSettings]
  );

  const getMyParticipantProfile = useCallback((): ParticipantProfile | null => {
    if (!currentUser || currentUser.role !== 'participant') return null;
    return myParticipantProfile;
  }, [currentUser, myParticipantProfile]);

  const getMyCertificate = useCallback((): CertificateRecord | null => {
    if (!currentUser || currentUser.role !== 'participant') return null;
    if (!myCertificate || myCertificate.user_id !== currentUser.id) return null;
    return myCertificate;
  }, [currentUser, myCertificate]);

  return (
    <ProgramStoreContext.Provider
      value={{
        settings,
        registrationState,
        currentUser,
        authLoading,
        dataLoading,
        registrations,
        participants,
        certificates,
        myParticipantProfile,
        myCertificate,
        loadProgramSettings,
        loadAdminRegistrations,
        loadParticipants,
        loadParticipantProfile,
        loadCertificates,
        refreshAdminData,
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
