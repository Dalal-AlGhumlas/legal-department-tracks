import { ParticipantProfile } from '../types';
import { TRACKS_BY_SLUG } from '../config/tracks';

/**
 * Generates a high-resolution SVG certificate data URL in the official Masar identity
 * when an admin issues a certificate or when rendering a private signed certificate preview.
 */
export function buildOfficialCertificateSvgDataUrl(
  participant: ParticipantProfile,
  issuedDateIso: string
): string {
  const track = TRACKS_BY_SLUG[participant.selected_track_id];
  const trackNameAr = track ? track.nameAr : participant.selected_track_id;
  const formattedDate = new Date(issuedDateIso).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850" direction="rtl">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&amp;display=swap');
        .ar-title { font-family: 'Amiri', serif; font-weight: 700; fill: #3C4620; }
        .ar-body { font-family: 'Amiri', serif; font-weight: 400; fill: #3C4620; }
        .ar-accent { font-family: 'Amiri', serif; font-weight: 700; fill: #4B5D16; }
      </style>
    </defs>
    <rect width="1200" height="850" fill="#F6F1E6" />
    <rect x="36" y="36" width="1128" height="778" fill="none" stroke="#3C4620" stroke-width="2" />
    <rect x="48" y="48" width="1104" height="754" fill="none" stroke="#DDD2BC" stroke-width="1" />

    <!-- Top Masar 4-Path Emblem -->
    <g transform="translate(540, 85)">
      <path d="M44 18 L56 25 L56 54 L26 76 L6 76 L44 50 Z" fill="#DFB86B" />
      <path d="M60 15 L72 22 L72 54 L50 76 L32 76 L60 51 Z" fill="#F2B635" />
      <path d="M76 12 L88 19 L88 54 L76 76 L56 76 L76 52 Z" fill="#E45C10" />
      <path d="M92 9 L104 16 L104 54 L114 76 L82 76 L92 53 Z" fill="#3C4620" />
    </g>

    <text x="600" y="205" text-anchor="middle" font-size="22" class="ar-body">نادي القانون — جامعة الملك سعود</text>
    <text x="600" y="265" text-anchor="middle" font-size="44" class="ar-title">شهادة إتمام حضور البرنامج التدريبي</text>
    <text x="600" y="315" text-anchor="middle" font-size="28" class="ar-accent">مسارات الإدارات القانونية ٢٠٢٦ م</text>

    <line x1="420" y1="345" x2="780" y2="345" stroke="#DDD2BC" stroke-width="1.5" />

    <text x="600" y="405" text-anchor="middle" font-size="24" class="ar-body">يشهد نادي القانون بجامعة الملك سعود بأن المشارك / المشاركة:</text>
    <text x="600" y="470" text-anchor="middle" font-size="42" class="ar-title">${escapeXml(participant.full_name)}</text>

    <text x="600" y="535" text-anchor="middle" font-size="24" class="ar-body">قد أتم حضور وملازمة المسار التدريبي التخصصي:</text>
    <text x="600" y="590" text-anchor="middle" font-size="34" class="ar-accent">مسار ${escapeXml(trackNameAr)}</text>

    <text x="600" y="645" text-anchor="middle" font-size="21" class="ar-body">ضمن برنامج مسارات الإدارات القانونية المنعقد خلال الفترة من ١٢ إلى ١٤ أكتوبر ٢٠٢٦ م</text>

    <line x1="180" y1="705" x2="1020" y2="705" stroke="#DDD2BC" stroke-width="1" />

    <text x="950" y="750" text-anchor="middle" font-size="18" class="ar-body">تاريخ الإصدار: ${escapeXml(formattedDate)}</text>
    <text x="600" y="750" text-anchor="middle" font-size="18" class="ar-title">نادي القانون — كلية الحقوق والعلوم السياسية</text>
    <text x="250" y="750" text-anchor="middle" font-size="16" class="ar-body">الرقم الجامعي: ${escapeXml(participant.university_id)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
