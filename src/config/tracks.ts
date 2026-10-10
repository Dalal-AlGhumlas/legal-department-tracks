import { TrackConfig, TrackSlug } from '../types';

export const TRACKS: TrackConfig[] = [
  {
    id: 'litigation',
    slug: 'litigation',
    numberAr: 'المسار الأول',
    numberEn: 'Track 01',
    nameAr: 'التقاضي',
    nameEn: 'Litigation',
    descriptionAr:
      'يمثل دور القسم في تمثيل المنشأة أمام الجهات القضائية وشبه القضائية، ومتابعة الدعاوى والمذكرات، وإدارة التعامل مع مكاتب المحاماة الخارجية.',
    descriptionEn:
      'Represents the department’s role in representing the organization before judicial and quasi-judicial bodies, following up on lawsuits and legal briefs, and managing engagements with external law firms.',
    extendedDescriptionAr:
      'يتناول هذا المسار دور قسم التقاضي في تمثيل المنشأة أمام الجهات القضائية وشبه القضائية، ومتابعة الدعاوى المقامة منها وعليها، وإعداد اللوائح والمذكرات، وإدارة التعامل مع مكاتب المحاماة الخارجية وتقييم أدائها، وتقدير المخاطر المحتملة للنزاعات قبل خوضها.',
    extendedDescriptionEn:
      'This track covers the role of the litigation department in representing the organization before judicial and quasi-judicial bodies, managing claims brought by or against the entity, drafting statements of claim and defense memoranda, overseeing and evaluating external law firms, and assessing potential dispute risks prior to litigation.',
    corePillarsAr: [
      'تمثيل المنشأة أمام الجهات القضائية وشبه القضائية ومتابعة الدعاوى المقامة منها وعليها.',
      'إعداد اللوائح والمذكرات القانونية وبناء الدفوع الموضوعية والشكلية.',
      'إدارة التعامل مع مكاتب المحاماة الخارجية وتقييم أدائها ومخرجاتها.',
      'تقدير المخاطر القانونية والمالية المحتملة للنزاعات قبل خوضها.'
    ],
    corePillarsEn: [
      'Representing the organization before judicial and quasi-judicial bodies and tracking active claims.',
      'Drafting legal pleadings, memoranda, and structuring substantive and procedural defenses.',
      'Managing relationships with external law firms and evaluating their performance and deliverables.',
      'Assessing potential legal and financial risks of disputes before initiating or entering litigation.'
    ],
    practicalExerciseAr:
      'يُختتم المسار بتمرين تطبيقي يحاكي مهمة يومية فعلية داخل قسم التقاضي بإشراف الجهة المستضيفة للمسار مع تلقي التغذية الراجعة المباشرة.',
    practicalExerciseEn:
      'The track concludes with a hands-on practical exercise simulating an actual daily task within a litigation department, supervised directly by the hosting legal entity with immediate feedback.',
    image: '/images/tracks/litigation.png',
    route: '/tracks/litigation'
  },
  {
    id: 'contracts',
    slug: 'contracts',
    numberAr: 'المسار الثاني',
    numberEn: 'Track 02',
    nameAr: 'العقود',
    nameEn: 'Contracts',
    descriptionAr:
      'يتناول دورة حياة العقد داخل المنشأة من التفاوض، الصياغة، المراجعة، والتوقيع إلى متابعة التنفيذ وتفادي النزاعات.',
    descriptionEn:
      'Covers the contract lifecycle within the organization from negotiation, drafting, review, and execution to implementation follow-up and dispute prevention.',
    extendedDescriptionAr:
      'يتناول هذا المسار دورة حياة العقد داخل المنشأة، من التفاوض والصياغة والمراجعة إلى التوقيع ومتابعة التنفيذ، مع الوقوف على أبرز البنود التي تحمي مركز المنشأة، وأثر الصياغة الدقيقة في تفادي النزاع قبل نشوئه.',
    extendedDescriptionEn:
      'This track examines the complete lifecycle of contracts within an organization—from negotiation, drafting, and legal review to signing and execution monitoring—highlighting key clauses that safeguard the organization’s position and the impact of precise drafting in preventing disputes before they arise.',
    corePillarsAr: [
      'إدارة دورة حياة العقد داخل المنشأة بدءًا من التفاوض والصياغة حتى التوقيع ومتابعة التنفيذ.',
      'مراجعة العقود والاتفاقيات والتحقق من توافقها مع مصالح المنشأة والأنظمة المرعية.',
      'الوقوف على أبرز البنود الجوهرية التي تحمي المركز القانوني والمالي للمنشأة.',
      'إدراك أثر الصياغة القانونية الدقيقة في تفادي النزاعات التعاقدية قبل نشوئها.'
    ],
    corePillarsEn: [
      'Managing the internal contract lifecycle from initial negotiation and drafting through signing and execution follow-up.',
      'Reviewing agreements to ensure alignment with organizational interests and applicable laws.',
      'Identifying critical contractual clauses that protect the legal and commercial standing of the entity.',
      'Understanding how precise legal drafting prevents contractual disputes before they emerge.'
    ],
    practicalExerciseAr:
      'يُختتم المسار بتمرين تطبيقي يحاكي مهمة يومية فعلية في صياغة ومراجعة العقود داخل الإدارة القانونية مع تلقي التغذية الراجعة المباشرة.',
    practicalExerciseEn:
      'The track concludes with a practical workshop exercise simulating a daily contract drafting and review task within a legal department, accompanied by direct practitioner feedback.',
    image: '/images/tracks/contracts.png',
    route: '/tracks/contracts'
  },
  {
    id: 'legislation',
    slug: 'legislation',
    numberAr: 'المسار الثالث',
    numberEn: 'Track 03',
    nameAr: 'التشريعات',
    nameEn: 'Legislation',
    descriptionAr:
      'يتناول متابعة الأنظمة واللوائح ذات الصلة بنشاط المنشأة، رصد المستجدات، وإعداد الأنظمة واللوائح والسياسات الداخلية.',
    descriptionEn:
      'Focuses on monitoring laws and regulations relevant to the organization’s operations, tracking regulatory updates, and drafting internal regulations, bylaws, and policies.',
    extendedDescriptionAr:
      'يتناول هذا المسار متابعة الأنظمة واللوائح ذات الصلة بنشاط المنشأة ورصد ما يستجد منها، وإعداد الأنظمة واللوائح والسياسات الداخلية، وإبداء الرأي القانوني في المسائل المعروضة على الإدارات الأخرى.',
    extendedDescriptionEn:
      'This track explores monitoring laws and regulations relevant to the entity’s sector, tracking legislative updates, preparing internal bylaws, regulations, and policies, and providing formal legal opinions on matters referred by other internal departments.',
    corePillarsAr: [
      'متابعة الأنظمة واللوائح ذات الصلة بنشاط المنشأة ورصد ما يستجد منها.',
      'إعداد وصياغة الأنظمة واللوائح والسياسات الداخلية المنظمة لعمل المنشأة.',
      'دراسة الأثر التنظيمي للتشريعات المستجدة على أعمال المنشأة وممارساتها.',
      'إبداء الرأي القانوني في المسائل والاستفسارات المعروضة من الإدارات الأخرى.'
    ],
    corePillarsEn: [
      'Monitoring laws and regulations tied to the organization’s activities and tracking new legislative developments.',
      'Preparing and drafting internal regulations, bylaws, and organizational policies.',
      'Analyzing the regulatory impact of new legislation on the entity’s operations.',
      'Providing reasoned legal opinions on inquiries and matters submitted by other departments.'
    ],
    practicalExerciseAr:
      'يُختتم المسار بتمرين تطبيقي يحاكي مهمة يومية فعلية في إعداد السياسات واللوائح وإبداء الرأي القانوني بإشراف الممارسين.',
    practicalExerciseEn:
      'The track concludes with a hands-on exercise simulating a real-world legislative analysis, policy drafting, and legal opinion task guided by practicing specialists.',
    image: '/images/tracks/legislation.png',
    route: '/tracks/legislation'
  },
  {
    id: 'governance-compliance',
    slug: 'governance-compliance',
    numberAr: 'المسار الرابع',
    numberEn: 'Track 04',
    nameAr: 'الحوكمة والامتثال',
    nameEn: 'Governance & Compliance',
    descriptionAr:
      'يتناول ضمان التزام المنشأة بالمتطلبات النظامية والرقابية، ومتابعة العلاقة مع الجهات الإشرافية، وأعمال مجالس الإدارة ولجانها.',
    descriptionEn:
      'Covers ensuring organizational compliance with statutory and regulatory requirements, managing relationships with supervisory authorities, and supporting board and committee operations.',
    extendedDescriptionAr:
      'يتناول هذا المسار دور القسم في ضمان التزام المنشأة بالمتطلبات النظامية والرقابية، ومتابعة العلاقة مع الجهات الإشرافية، وأعمال مجالس الإدارة ولجانها، وبناء أطر الحوكمة الداخلية ومنظومات الالتزام.',
    extendedDescriptionEn:
      'This track examines the department’s role in ensuring the organization’s adherence to statutory and regulatory obligations, managing communications with supervisory bodies, supporting boards of directors and their committees, and building internal governance frameworks and compliance systems.',
    corePillarsAr: [
      'ضمان التزام المنشأة بالمتطلبات النظامية والرقابية ذات الصلة بنشاطها.',
      'متابعة وتنظيم العلاقة مع الجهات الإشرافية والرقابية.',
      'تنظيم ومتابعة أعمال مجالس الإدارة ولجانها المنبثقة.',
      'بناء أطر الحوكمة الداخلية وتطوير منظومات الالتزام المؤسسي.'
    ],
    corePillarsEn: [
      'Ensuring organizational adherence to statutory and regulatory requirements governing its sector.',
      'Managing and coordinating institutional relations with supervisory and regulatory authorities.',
      'Supporting and organizing the work of Boards of Directors and their specialized committees.',
      'Building internal governance frameworks and developing institutional compliance systems.'
    ],
    practicalExerciseAr:
      'يُختتم المسار بتمرين تطبيقي يحاكي مهمة يومية فعلية في أعمال الحوكمة ومراقبة الامتثال بإشراف فريق الجهة المستضيفة.',
    practicalExerciseEn:
      'The track concludes with a practical exercise simulating an authentic daily governance and regulatory compliance task with direct feedback from the hosting team.',
    image: '/images/tracks/governance-compliance.png',
    route: '/tracks/governance-compliance'
  }
];

export const TRACKS_BY_SLUG: Record<TrackSlug, TrackConfig> = {
  litigation: TRACKS[0],
  contracts: TRACKS[1],
  legislation: TRACKS[2],
  'governance-compliance': TRACKS[3]
};

export function getTrackBySlug(slug: string | null | undefined): TrackConfig | undefined {
  if (!slug) return undefined;
  return TRACKS.find((t) => t.slug === slug);
}
