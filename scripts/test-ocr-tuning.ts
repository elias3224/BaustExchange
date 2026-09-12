// scripts/test-ocr-tuning.ts
// Tries OCR preprocessing / PSM combos against the sample card.
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import { analyzeIdCardText } from '../src/lib/idCardVerify';

async function ocr(buffer: Buffer, psm: PSM) {
  const worker = await createWorker('eng');
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const {
    data: { text },
  } = await worker.recognize(buffer);
  await worker.terminate();
  return text;
}

const syntheticSvg = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="400" fill="white"/>
  <text x="40" y="120" font-family="Arial" font-size="42" fill="black">BANGLADESH ARMY UNIVERSITY</text>
  <text x="40" y="190" font-family="Arial" font-size="38" fill="black">OF SCIENCE AND TECHNOLOGY (BAUST)</text>
  <text x="40" y="270" font-family="Arial" font-size="34" fill="black">Name : Test Student</text>
  <text x="40" y="330" font-family="Arial" font-size="34" fill="black">Dept : CSE</text>
  <text x="40" y="380" font-family="Arial" font-size="30" fill="black">Blood Group : A+</text>
</svg>`;

async function main() {
  const imgPath = process.argv[2] || join(process.cwd(), 'public', 'images', 'sample-id-card.jpg');
  const raw = await readFile(imgPath);

  // 0. Synthetic sanity check of the OCR engine itself.
  const synth = await sharp(Buffer.from(syntheticSvg)).png().toBuffer();
  const synthText = await ocr(synth, PSM.AUTO);
  const synthA = analyzeIdCardText(synthText);
  console.log(`SYNTHETIC -> verified=${synthA.hasBaustIdentity && synthA.hasField}`);
  console.log('   TEXT:', synthText.replace(/\s+/g, ' ').trim().slice(0, 260));
  console.log('');

  const variants: Array<[string, Promise<Buffer>]> = [
    ['raw', Promise.resolve(raw)],
    ['gray2x', sharp(raw).grayscale().resize({ width: 1600 }).normalise().toBuffer()],
    ['gray2x-th160', sharp(raw).grayscale().resize({ width: 1600 }).normalise().threshold(160).toBuffer()],
    ['gray2x-th120', sharp(raw).grayscale().resize({ width: 1600 }).normalise().threshold(120).toBuffer()],
    ['gray2x-sharp', sharp(raw).grayscale().resize({ width: 1600 }).normalise().sharpen().toBuffer()],
    ['rot-6', sharp(raw).grayscale().resize({ width: 1600 }).rotate(-6).normalise().toBuffer()],
    ['rot+6', sharp(raw).grayscale().resize({ width: 1600 }).rotate(6).normalise().toBuffer()],
    ['rot-10', sharp(raw).grayscale().resize({ width: 1600 }).rotate(-10).normalise().toBuffer()],
  ];

  for (const [label, bufP] of variants) {
    const buf = await bufP;
    try {
      const text = await ocr(buf, PSM.SINGLE_BLOCK);
      const clean = text.replace(/\s+/g, ' ').trim();
      const a = analyzeIdCardText(text);
      console.log(`${label.padEnd(14)} -> verified=${a.hasBaustIdentity && a.hasField} baust=${a.hasBaustIdentity} field=${a.hasField} chars=${clean.length}`);
      if (clean.length > 0) console.log('   TEXT:', clean.slice(0, 260));
    } catch (e: any) {
      console.log(`${label} -> ERROR ${e.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});