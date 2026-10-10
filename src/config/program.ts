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
  descriptionAr: string;
  descriptionEn: string;
  image: string;
}

export const OFFICIAL_PARTNERS: OfficialPartner[] = [
  {
    nameAr: 'الشركة السعودية لتقنية المعلومات (SITE)',
    nameEn: 'Saudi Information Technology Company (SITE)',
    descriptionAr:
      'تقدم حلولًا رقمية وسيبرانية مبتكرة وموثوقة، وتطور تقنيات المستقبل لمواكبة التطلعات ومواجهة التحديات، مع تمكين الكفاءات الوطنية وتعزيز ريادة الأعمال لبناء مستقبل رقمي مستدام.',
    descriptionEn:
      'Provides innovative and trusted digital and cybersecurity solutions, develops future technologies to meet evolving ambitions and challenges, and empowers national talent and entrepreneurship to build a sustainable digital future.',
    image: '/images/partners/site.png'
  },
  {
    nameAr: 'OSOOL | أصول العقارية',
    nameEn: 'OSOOL Real Estate',
    descriptionAr:
      'شركة متخصصة في الاستثمار وإدارة الأصول العقارية، تتبنى نهجًا استراتيجيًا في تنمية الاستثمارات وتعظيم قيمة الأصول، من خلال محفظة عقارية متنوعة وشراكات نوعية، بما يرسّخ الاستدامة الاستثمارية ويحقق قيمة مضافة وعوائد طويلة الأجل وفق أعلى المعايير المهنية.',
    descriptionEn:
      'A company specialized in real estate investment and asset management, following a strategic approach to growing investments and maximizing asset value through a diversified real estate portfolio and high-quality partnerships, creating sustainable long-term value and returns.',
    image: '/images/partners/osool.png'
  },
  {
    nameAr: 'شركة الخشيم محامون ومستشارون (K&A)',
    nameEn: 'Khoshaim & Associates (K&A)',
    descriptionAr:
      'شركة محاماة سعودية متكاملة الخدمات، تتمتع بخبرة دولية واسعة، وتقدم خدمات قانونية متخصصة تستند إلى الكفاءة المهنية والتميز القانوني، وفق أفضل الممارسات والمعايير الدولية.',
    descriptionEn:
      'A full-service Saudi law firm with extensive international experience, providing specialized legal services founded on professional expertise and legal excellence in accordance with leading international practices and standards.',
    image: '/images/partners/ka.png'
  }
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
