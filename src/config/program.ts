import { RegistrationWindowState } from '../types';

/**
 * Centralized registration window fallback defaults.
 * In production, `public.program_settings` in Supabase is the authoritative source of truth.
 */
export const DEFAULT_REGISTRATION_OPEN_AT = '2026-09-25T00:00:00+03:00';

export const DEFAULT_REGISTRATION_CLOSE_AT = '2026-10-11T23:59:59+03:00';

export function computeRegistrationState(
  openAtIso: string = DEFAULT_REGISTRATION_OPEN_AT,
  closeAtIso: string = DEFAULT_REGISTRATION_CLOSE_AT,
  now: Date = new Date()
): RegistrationWindowState {
  const openTime = new Date(openAtIso).getTime();
  const closeTime = new Date(closeAtIso).getTime();
  const currentTime = now.getTime();

  if (currentTime < openTime) {
    return 'before';
  }
  if (currentTime <= closeTime) {
    return 'open';
  }
  return 'closed';
}

export interface ProgramScheduleDay {
  dayAr: string;
  dayEn: string;
  dateAr: string;
  dateEn: string;
  titleAr: string;
  titleEn: string;
  itemsAr: string[];
  itemsEn: string[];
}

export const OFFICIAL_PROGRAM_SCHEDULE: ProgramScheduleDay[] = [
  {
    dayAr: 'الاثنين',
    dayEn: 'Monday',
    dateAr: '12 أكتوبر',
    dateEn: 'October 12',
    titleAr: 'التعريف',
    titleEn: 'Orientation & Foundation',
    itemsAr: [
      'التعريف بالبرنامج',
      'التعريف بالمسار',
      'التعرف على بيئة العمل والممارسات المهنية'
    ],
    itemsEn: [
      'Introduction to the program',
      'Introduction to the specialized track',
      'Exploring the work environment and professional practices'
    ]
  },
  {
    dayAr: 'الثلاثاء',
    dayEn: 'Tuesday',
    dateAr: '13 أكتوبر',
    dateEn: 'October 13',
    titleAr: 'التعمّق في المسار',
    titleEn: 'Track Deep Dive',
    itemsAr: [
      'استعراض دورة العمل داخل القسم',
      'التعرف على الإجراءات وآليات العمل',
      'الاطلاع على نماذج مرتبطة بطبيعة العمل'
    ],
    itemsEn: [
      'Reviewing the internal workflow within the department',
      'Understanding operational procedures and mechanisms',
      'Examining real-world templates and models related to the work'
    ]
  },
  {
    dayAr: 'الأربعاء',
    dayEn: 'Wednesday',
    dateAr: '14 أكتوبر',
    dateEn: 'October 14',
    titleAr: 'التطبيق العملي والختام',
    titleEn: 'Practical Application & Closing',
    itemsAr: [
      'تنفيذ تمرين عملي يحاكي طبيعة العمل في المسار',
      'كلمة ختامية',
      'تكريم المشاركين',
      'تكريم شركاء النجاح'
    ],
    itemsEn: [
      'Executing a hands-on exercise simulating real work in the track',
      'Closing address',
      'Recognizing participants',
      'Honoring success partners'
    ]
  }
];

export interface OfficialPartner {
  nameAr: string;
  nameEn: string;
}

/**
 * Official Law Club Success Partners explicitly listed on Page 5 of the attached official deck.
 */
export const OFFICIAL_PARTNERS: OfficialPartner[] = [
  { nameAr: 'الهيئة السعودية للمحامين', nameEn: 'Saudi Bar Association' },
  { nameAr: 'هيئة حقوق الإنسان', nameEn: 'Human Rights Commission' },
  { nameAr: 'صندوق التنمية الصناعية السعودي', nameEn: 'Saudi Industrial Development Fund (SIDF)' },
  { nameAr: 'الهيئة الملكية لمحافظة العلا', nameEn: 'Royal Commission for AlUla' },
  { nameAr: 'مؤسسة محمد بن سلمان (مسك)', nameEn: 'Misk Foundation' },
  { nameAr: 'المركز الوطني للعمليات الأمنية 911', nameEn: 'National Center for Security Operations 911' },
  { nameAr: 'كيركلاند آند إيليس', nameEn: 'Kirkland & Ellis LLP' },
  { nameAr: 'خشيم ومشاركوه', nameEn: 'K&A (Khoshaim & Associates)' },
  { nameAr: 'إيه إس آند إتش كليفورد تشانس', nameEn: 'AS&H Clifford Chance' },
  { nameAr: 'شورى للمحاماة والاستشارات', nameEn: 'Shura Law Firm' },
  { nameAr: 'الخريف محامون ومستشارون', nameEn: 'Alkhorayef Law Firm' },
  { nameAr: 'الرفاعي وشركاؤه للمحاماة', nameEn: 'Al-Refaei & Co.' },
  { nameAr: 'الرويشد والرزين مستشارون ومحامون', nameEn: 'Alrowaished & Alrazeen Law Firm' },
  { nameAr: 'المدينة للمحاماة', nameEn: 'The City Law Firm' },
  { nameAr: 'شركة الشريف وشركاه محامون ومستشارون', nameEn: 'Alshareef & Partners' },
  { nameAr: 'ميتروبوليس للتدريب القانوني', nameEn: 'Metropolis Legal Training' }
];

export interface OfficialContactPerson {
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  phone: string;
}

export const OFFICIAL_CONTACTS = {
  partnershipsEmail: 'Development.lawclub@gmail.com',
  clubEmail: 'clpslawclub.ksu@gmail.com',
  socialHandle: '@LawClub',
  committeeMembers: [
    {
      nameAr: 'عبدالله الخريف',
      nameEn: 'Abdullah Al-Khorayef',
      roleAr: 'قائد لجنة التأهيل',
      roleEn: 'Head of Qualification Committee',
      phone: '0548882223'
    },
    {
      nameAr: 'عبدالله الرابح',
      nameEn: 'Abdullah Al-Rabeh',
      roleAr: 'نائب لجنة التأهيل والتطوير',
      roleEn: 'Vice Head of Qualification & Development Committee',
      phone: '055003290'
    },
    {
      nameAr: 'المها الكاملي',
      nameEn: 'Al-Maha Al-Kamli',
      roleAr: 'نائبة لجنة التأهيل والتطوير',
      roleEn: 'Vice Head of Qualification & Development Committee',
      phone: '0558264091'
    }
  ] as OfficialContactPerson[]
};

export const ACADEMIC_LEVELS = [
  { value: 'المستوى الأول - الثاني', labelAr: 'المستوى الأول - الثاني (السنة الأولى)', labelEn: 'Level 1–2 (First Year)' },
  { value: 'المستوى الثالث - الرابع', labelAr: 'المستوى الثالث - الرابع (السنة الثانية)', labelEn: 'Level 3–4 (Second Year)' },
  { value: 'المستوى الخامس - السادس', labelAr: 'المستوى الخامس - السادس (السنة الثالثة)', labelEn: 'Level 5–6 (Third Year)' },
  { value: 'المستوى السابع - الثامن', labelAr: 'المستوى السابع - الثامن (سنة التخرج)', labelEn: 'Level 7–8 (Senior Year)' },
  { value: 'طالب امتياز / تدريب تعاوني', labelAr: 'طالب تدريب تعاوني', labelEn: 'Co-op Training Student' },
  { value: 'خريج حديث', labelAr: 'خريج مقبل على سوق العمل', labelEn: 'Recent Graduate' }
];
