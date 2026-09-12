// scripts/test-idcard-ocr.ts
// Smoke test for the server-side ID card OCR pipeline.
// Usage: npx tsx scripts/test-idcard-ocr.ts <image-path>
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createWorker } from 'tesseract.js';
import { idCardCheckFromText } from '../src/lib/idCardVerify';

async function main() {
  const imgPath = process.argv[2] || join(process.cwd(), 'public', 'images', 'sample-id-card.jpg');
  const buffer = await readFile(imgPath);

  console.log(`Running server-side OCR on: ${imgPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  const worker = await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize(buffer);
  await worker.terminate();

  console.log('--- OCR TEXT (first 400 chars) ---');
  console.log(text.slice(0, 400));
  console.log('--- VERDICT ---');
  const check = idCardCheckFromText(text, 'student');
  console.log(JSON.stringify(check, null, 2));

  // Negative control: random text must be rejected.
  const negative = idCardCheckFromText('hello world this is my random photo of a cat and some notes', 'student');
  console.log('Negative control verified:', negative.verified, '(expected: false)');
}

main().catch((err) => {
  console.error('OCR smoke test failed:', err);
  process.exit(1);
});