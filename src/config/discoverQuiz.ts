import { TrackSlug } from '../types';

export interface DiscoverOption {
  id: string;
  track: TrackSlug;
  textAr: string;
  textEn: string;
}

export interface DiscoverQuestion {
  id: number;
  promptAr: string;
  promptEn: string;
  options: DiscoverOption[];
}

/**
 * Deterministic 5-question interest-based recommendation quiz.
 * Each option maps to one of the four tracks based on official track dimensions:
 * - litigation: disputes, advocacy, legal argumentation, case analysis
 * - contracts: agreements, negotiation, drafting, contractual relationships
 * - legislation: regulations, legal drafting, policy, legislative analysis
 * - governance-compliance: governance, compliance, controls, organizational policies, regulatory requirements
 */
export const DISCOVER_QUESTIONS: DiscoverQuestion[] = [
  {
    id: 1,
    promptAr: 'عند التعامل مع مسألة قانونية داخل منشأة، أي من المهام التالية يثير اهتمامك أكثر؟',
    promptEn: 'When handling a legal matter inside an organization, which of the following tasks interests you most?',
    options: [
      {
        id: 'q1_lit',
        track: 'litigation',
        textAr: 'تحليل وقائع نزاع قائم وبناء الحجج والدفوع لتمثيل المنشأة أمام الجهات القضائية.',
        textEn: 'Analyzing an active dispute and constructing legal arguments to represent the entity before judicial bodies.'
      },
      {
        id: 'q1_con',
        track: 'contracts',
        textAr: 'صياغة ومراجعة الاتفاقيات وضبط التزامات الأطراف منذ مرحلة التفاوض.',
        textEn: 'Drafting and reviewing agreements and structuring party obligations from the negotiation stage.'
      },
      {
        id: 'q1_leg',
        track: 'legislation',
        textAr: 'رصد الأنظمة واللوائح المستجدة وإعداد السياسات واللوائح الداخلية للمنشأة.',
        textEn: 'Monitoring new laws and regulations and drafting internal organizational policies and bylaws.'
      },
      {
        id: 'q1_gov',
        track: 'governance-compliance',
        textAr: 'التحقق من التزام المنشأة بالمتطلبات الرقابية وتنظيم أعمال مجلس الإدارة ولجانه.',
        textEn: 'Verifying organizational compliance with regulatory requirements and supporting board and committee work.'
      }
    ]
  },
  {
    id: 2,
    promptAr: 'ما نوع المخرجات اليومية التي تفضل التدرب على إعدادها وممارستها؟',
    promptEn: 'Which type of daily legal deliverable would you most like to practice preparing?',
    options: [
      {
        id: 'q2_lit',
        track: 'litigation',
        textAr: 'اللوائح والمذكرات الجوابية وتقارير تقييم مخاطر الدعاوى قبل خوضها.',
        textEn: 'Statements of claim, responsive legal briefs, and pre-litigation dispute risk assessments.'
      },
      {
        id: 'q2_con',
        track: 'contracts',
        textAr: 'مسودات العقود والبنود الحمائية التي تحفظ مركز المنشأة وتمنع نشوء الخلاف.',
        textEn: 'Contract drafts and protective clauses that safeguard the organization’s position and prevent disputes.'
      },
      {
        id: 'q2_leg',
        track: 'legislation',
        textAr: 'اللوائح التنظيمية الداخلية ومذكرات الرأي القانوني للإدارات الأخرى.',
        textEn: 'Internal regulatory bylaws and formal legal opinion memoranda for other departments.'
      },
      {
        id: 'q2_gov',
        track: 'governance-compliance',
        textAr: 'أطر الحوكمة الداخلية، مصفوفات الالتزام، والتقارير الموجهة للجهات الإشرافية.',
        textEn: 'Internal governance frameworks, compliance matrices, and reports for supervisory authorities.'
      }
    ]
  },
  {
    id: 3,
    promptAr: 'كيف تفضل أن تسهم في حماية المنشأة القانونية والوقاية من المخاطر؟',
    promptEn: 'How do you prefer to contribute to safeguarding the organization and mitigating legal risk?',
    options: [
      {
        id: 'q3_lit',
        track: 'litigation',
        textAr: 'إدارة ملف النزاعات بفاعلية والإشراف على أداء مكاتب المحاماة الخارجية.',
        textEn: 'Effectively managing dispute files and overseeing the performance of external law firms.'
      },
      {
        id: 'q3_con',
        track: 'contracts',
        textAr: 'إحكام صياغة العلاقة التعاقدية ومتابعة تنفيذها لتفادي النزاع قبل وقوعه.',
        textEn: 'Tightening contractual drafting and monitoring execution to prevent disputes before they occur.'
      },
      {
        id: 'q3_leg',
        track: 'legislation',
        textAr: 'تحديث السياسات الداخلية باستمرار لتواكب المستجدات النظامية والتشريعية.',
        textEn: 'Continuously updating internal policies to align with evolving legislative developments.'
      },
      {
        id: 'q3_gov',
        track: 'governance-compliance',
        textAr: 'بناء منظومات رقابة داخلية تضمن عدم وقوع مخالفات للمتطلبات النظامية.',
        textEn: 'Building internal compliance controls that prevent breaches of statutory requirements.'
      }
    ]
  },
  {
    id: 4,
    promptAr: 'أي من الأطراف التالية يستهويك التعامل والتنسيق المهني معه بشكل أكبر؟',
    promptEn: 'Which of the following stakeholders appeals most to you for professional coordination?',
    options: [
      {
        id: 'q4_lit',
        track: 'litigation',
        textAr: 'الدوائر القضائية وشبه القضائية والمستشارون في مكاتب المحاماة الخارجية.',
        textEn: 'Judicial and quasi-judicial panels and external litigation counsel.'
      },
      {
        id: 'q4_con',
        track: 'contracts',
        textAr: 'فرق التفاوض وشركاء الأعمال والموردون خلال مراحل إبرام العقود وتنفيذها.',
        textEn: 'Negotiation teams, business partners, and vendors throughout contract formation and execution.'
      },
      {
        id: 'q4_leg',
        track: 'legislation',
        textAr: 'إدارات المنشأة المختلفة التي تطلب الرأي القانوني وتفسير الأنظمة واللوائح.',
        textEn: 'Internal departments seeking legal opinions and interpretation of applicable regulations.'
      },
      {
        id: 'q4_gov',
        track: 'governance-compliance',
        textAr: 'الجهات الإشرافية والرقابية ومجلس الإدارة واللجان المنبثقة عنه.',
        textEn: 'Supervisory and regulatory authorities, the Board of Directors, and board committees.'
      }
    ]
  },
  {
    id: 5,
    promptAr: 'ما المهارة القانونية التي تطمح إلى صقلها بشكل أعمق خلال أيام البرنامج الثلاثة؟',
    promptEn: 'Which legal skill do you aspire to refine most deeply during the three-day program?',
    options: [
      {
        id: 'q5_lit',
        track: 'litigation',
        textAr: 'مهارة الترافع الكتابي وإعداد اللوائح والمذكرات وإدارة الدعاوى.',
        textEn: 'Written advocacy, preparing legal pleadings and briefs, and case management.'
      },
      {
        id: 'q5_con',
        track: 'contracts',
        textAr: 'مهارة الصياغة التعاقدية الدقيقة والتفاوض على البنود الجوهرية.',
        textEn: 'Precise contractual drafting and negotiating critical commercial and legal clauses.'
      },
      {
        id: 'q5_leg',
        track: 'legislation',
        textAr: 'مهارة التحليل التشريعي وصياغة السياسات وإبداء الرأي القانوني الرصين.',
        textEn: 'Legislative analysis, policy drafting, and formulating sound legal opinions.'
      },
      {
        id: 'q5_gov',
        track: 'governance-compliance',
        textAr: 'مهارة تصميم أطر الحوكمة ومتابعة الالتزام المؤسسي بالمتطلبات النظامية.',
        textEn: 'Designing governance frameworks and monitoring institutional regulatory compliance.'
      }
    ]
  }
];

export const DISCOVER_RESULT_REASONS: Record<
  TrackSlug,
  { reasonAr: string; reasonEn: string }
> = {
  litigation: {
    reasonAr:
      'تشير إجاباتك إلى اهتمام واضح بتمثيل المنشأة أمام الجهات القضائية وشبه القضائية، وتحليل النزاعات، وإعداد اللوائح والمذكرات القانونية، وتقييم مخاطر الدعاوى.',
    reasonEn:
      'Your responses indicate a strong interest in representing organizations before judicial and quasi-judicial bodies, analyzing disputes, drafting pleadings and briefs, and assessing litigation risks.'
  },
  contracts: {
    reasonAr:
      'تشير إجاباتك إلى ميل واضح نحو إدارة دورة حياة العقد داخل المنشأة، من التفاوض والصياغة الدقيقة والمراجعة إلى متابعة التنفيذ والوقاية من النزاعات التعاقدية.',
    reasonEn:
      'Your responses point to a clear affinity for managing the internal contract lifecycle—from negotiation, precise drafting, and review to execution monitoring and dispute prevention.'
  },
  legislation: {
    reasonAr:
      'تشير إجاباتك إلى اهتمامك برصد الأنظمة واللوائح ذات الصلة بنشاط المنشأة، وإعداد اللوائح والسياسات الداخلية، وتقديم الرأي القانوني للإدارات المختلفة.',
    reasonEn:
      'Your responses highlight your interest in monitoring sector-relevant laws and regulations, drafting internal policies and bylaws, and providing legal opinions across departments.'
  },
  'governance-compliance': {
    reasonAr:
      'تشير إجاباتك إلى اهتمامك بضمان التزام المنشأة بالمتطلبات النظامية والرقابية، وتنظيم العلاقة مع الجهات الإشرافية، وأعمال مجالس الإدارة ولجانها وبناء أطر الحوكمة.',
    reasonEn:
      'Your responses reflect a strong interest in ensuring statutory and regulatory compliance, managing relations with supervisory authorities, supporting boards and committees, and building governance frameworks.'
  }
};

export function calculateRecommendedTrack(answers: Record<number, TrackSlug>): TrackSlug {
  const counts: Record<TrackSlug, number> = {
    litigation: 0,
    contracts: 0,
    legislation: 0,
    'governance-compliance': 0
  };

  Object.values(answers).forEach((track) => {
    if (counts[track] !== undefined) {
      counts[track] += 1;
    }
  });

  const order: TrackSlug[] = [
    'litigation',
    'contracts',
    'legislation',
    'governance-compliance'
  ];

  let bestTrack: TrackSlug = 'litigation';
  let maxScore = -1;

  for (const track of order) {
    if (counts[track] > maxScore) {
      maxScore = counts[track];
      bestTrack = track;
    }
  }

  return bestTrack;
}
