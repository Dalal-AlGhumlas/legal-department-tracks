import { ParticipantProfile, TrackSlug } from '../types';

const CERTIFICATE_TEMPLATES: Record<TrackSlug, string> = {
  litigation: '/certificates/litigation.png',
  contracts: '/certificates/contracts.png',
  legislation: '/certificates/legislation.png',
  'governance-compliance':
    '/certificates/governance-compliance.png'
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('CERTIFICATE_TEMPLATE_LOAD_FAILED'));

    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error('CERTIFICATE_GENERATION_FAILED')
          );
        }
      },
      'image/png',
      1
    );
  });
}

function getNameFontSize(
  ctx: CanvasRenderingContext2D,
  name: string
): number {
  let fontSize = 78;

  while (fontSize >= 48) {
    ctx.font = `700 ${fontSize}px "Amiri", serif`;

    if (ctx.measureText(name).width <= 1050) {
      return fontSize;
    }

    fontSize -= 2;
  }

  return 48;
}

export async function buildOfficialCertificateFile(
  participant: ParticipantProfile,
  _issuedDateIso: string
): Promise<File> {
  const templatePath =
    CERTIFICATE_TEMPLATES[
      participant.selected_track_id
    ];

  if (!templatePath) {
    throw new Error(
      'CERTIFICATE_TEMPLATE_NOT_FOUND'
    );
  }

  const response = await fetch(templatePath);

  if (!response.ok) {
    throw new Error(
      'CERTIFICATE_TEMPLATE_LOAD_FAILED'
    );
  }

  const templateBlob = await response.blob();
  const templateUrl =
    URL.createObjectURL(templateBlob);

  try {
    const image = await loadImage(templateUrl);

    const canvas =
      document.createElement('canvas');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(
        'CERTIFICATE_GENERATION_FAILED'
      );
    }

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );


    // التأكد من تحميل خط Amiri قبل كتابة الاسم
    if (document.fonts?.load) {
      await document.fonts.load(
        '700 78px "IBM Plex Sans Arabic"'
      );
    }

    const fontSize = getNameFontSize(
      ctx,
      participant.full_name
    );

    ctx.font =
      `700 ${fontSize}px "Amiri", serif`;

    ctx.fillStyle = '#3C4620';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    ctx.fillText(
      participant.full_name,
      canvas.width / 2,
      595
    );

    const certificateBlob =
      await canvasToBlob(canvas);

    const safeFileName =
      `certificate-${participant.selected_track_id}-${participant.university_id}.png`;

    return new File(
      [certificateBlob],
      safeFileName,
      {
        type: 'image/png'
      }
    );
  } finally {
    URL.revokeObjectURL(templateUrl);
  }
}
