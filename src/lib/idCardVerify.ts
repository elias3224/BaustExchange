import Tesseract from 'tesseract.js';

export type IdCardRole = 'student' | 'teacher';

export type IdCardCheck = {
  verified: boolean;
  confidence: number;
  message: string;
  matched?: string[];
};

/**
 * Strict BAUST ID card verification.
 *
 * A photo only passes when OCR actually finds BAUST identity text:
 *  - "baust" itself, OR at least 2 BAUST header keywords, AND
 *  - at least one ID-card field keyword (student/teacher/dept/blood...).
 *
 * No size-based or error-based fallback: any random photo (of anything)
 * that does not contain ID card text is rejected.
 */
const BAUST_KEYWORDS = [
  'baust',
  'bangladesh',
  'army',
  'university',
  'science',
  'technology',
] as const;

const ID_FIELD_KEYWORDS = [
  'student',
  'teacher',
  'faculty',
  'employee',
  'dept',
  'department',
  'blood',
  'valid',
  'id no',
  'card no',
  'reg no',
] as const;

/**
 * Pure text analysis — shared by the browser OCR helper and the
 * server-side verification route so both apply identical rules.
 */
export function analyzeIdCardText(rawText: string) {
  const normalized = rawText.toLowerCase().replace(/\s+/g, ' ');

  // OCR may merge "BAUST" letters; also allow the spaced variant "b a u s t".
  const collapsed = normalized.replace(/[^a-z0-9]/g, '');
  const matchedBaust = BAUST_KEYWORDS.filter(
    (k) => normalized.includes(k) || collapsed.includes(k)
  );
  const matchedFields = ID_FIELD_KEYWORDS.filter((k) => normalized.includes(k));

  const hasBaustIdentity =
    normalized.includes('baust') ||
    collapsed.includes('baust') ||
    matchedBaust.length >= 2;
  const hasField = matchedFields.length >= 1;

  const reason =
    !hasBaustIdentity && !hasField
      ? 'No BAUST branding or ID fields were detected.'
      : !hasBaustIdentity
        ? 'BAUST header text was not found on the card.'
        : 'No ID card fields (Student/Teacher, Dept, Blood Group etc.) were found.';

  const detectedInfo = [...new Set([...matchedBaust, ...matchedFields])];

  return { hasBaustIdentity, hasField, matchedBaust, matchedFields, reason, detectedInfo };
}

/** Build the user-facing check result from OCR text. Works in browser AND Node. */
export function idCardCheckFromText(rawText: string, role: IdCardRole): IdCardCheck {
  const { hasBaustIdentity, hasField, matchedBaust, matchedFields, reason, detectedInfo } =
    analyzeIdCardText(rawText);

  if (hasBaustIdentity && hasField) {
    const info = detectedInfo.slice(0, 5).join(', ');
    const confidence = Math.min(
      99,
      78 + (matchedBaust.length + matchedFields.length) * 4
    );
    return {
      verified: true,
      confidence,
      matched: detectedInfo.slice(0, 5),
      message:
        role === 'teacher'
          ? `BAUST Teacher / Faculty ID Card Verified!${info ? ` (Text Match: ${info})` : ''}`
          : `BAUST Student ID Card Verified!${info ? ` (Text Match: ${info})` : ''}`,
    };
  }

  return {
    verified: false,
    confidence: 25,
    matched: detectedInfo.slice(0, 5),
    message:
      role === 'teacher'
        ? `Access Denied — this photo does not appear to be a BAUST Teacher / Faculty ID Card. ${reason}`
        : `Access Denied — this photo does not appear to be a BAUST Student ID Card. ${reason}`,
  };
}

export async function verifyIdCardImage(
  file: File,
  role: IdCardRole
): Promise<IdCardCheck> {
  // Basic sanity: must be an image and not a tiny/blank file.
  if (!file.type.startsWith('image/') || file.size <= 5000) {
    return {
      verified: false,
      confidence: 20,
      message:
        'Unclear or invalid image. Please upload a clear photo of your BAUST ID Card.',
    };
  }

  let text = '';
  try {
    const {
      data: { text: ocrText },
    } = await Tesseract.recognize(file, 'eng');
    text = ocrText;
  } catch (err) {
    console.warn('OCR failed during ID verification:', err);
    // OCR failure must NOT grant access.
    return {
      verified: false,
      confidence: 30,
      message:
        'Could not read the image. Please upload a brighter, sharper photo of your BAUST ID Card.',
    };
  }

  return idCardCheckFromText(text, role);
}