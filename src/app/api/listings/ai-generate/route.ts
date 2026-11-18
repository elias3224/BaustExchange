import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { checkProEntitlement } from '@/lib/pro';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ip = clientIp(req);
  if (!rateLimit(`ai:generate:${user.id || ip}`, { max: 15, window: 60 })) {
    return NextResponse.json({ error: 'Too many AI requests. Please wait a minute.' }, { status: 429 });
  }

  // Enforce PRO entitlement
  const entitlement = await checkProEntitlement(user.id, 'ai_listing');
  if (!entitlement.allowed) {
    return NextResponse.json(
      {
        error: 'AI Auto-Fill with Photo is an exclusive Campus PRO feature. Upgrade to Campus PRO for instant smart listings!',
        isProRequired: true,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { imageUrl, titleHint, imageBase64 } = body;

    if (!imageUrl && !imageBase64 && !titleHint) {
      return NextResponse.json(
        { error: 'Please upload an image or provide a title hint for AI analysis.' },
        { status: 400 }
      );
    }

    // Fetch existing categories from DB
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });

    const categoryNames = categories.map((c) => c.name).join(', ');

    // Check for Google Gemini API key
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let aiResult: any = null;

    if (geminiKey) {
      try {
        const parts: any[] = [];
        const promptText = `You are an AI assistant for "BAUST Exchange", a university student campus marketplace at Bangladesh Army University of Science and Technology (BAUST).
Analyze this product image and/or hint: "${titleHint || 'campus student item'}".
Available marketplace categories: [${categoryNames}].
Available conditions: ["new", "like_new", "good", "fair"].

Output a JSON object ONLY with the following exact keys:
{
  "title": "Concise student marketplace title (e.g. 'Engineering Mathematics 2 by H.K. Dass' or 'Scientific Calculator fx-991EX')",
  "description": "Engaging 2-3 sentence description suitable for university students highlighting key specs, condition, and usefulness for coursework.",
  "categoryName": "The closest matching category from the available list",
  "condition": "The most appropriate condition from [new, like_new, good, fair]",
  "suggestedPrice": 350
}
Strictly return ONLY the raw JSON object, without markdown formatting or code fences.`;

        parts.push({ text: promptText });

        if (imageBase64) {
          const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (res.ok) {
          const geminiData = await res.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            aiResult = JSON.parse(rawText.trim());
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using intelligent campus fallback:', geminiErr);
      }
    }

    // Fallback heuristic analyzer if no API key or call returned null
    if (!aiResult) {
      const hint = (titleHint || imageUrl || 'item').toLowerCase();
      let detectedCat = 'Others';
      let title = titleHint ? `${titleHint}` : 'Campus Student Item';
      let desc = 'Good quality item maintained carefully, suitable for BAUST students. Ready for immediate pickup on campus.';
      let price = 250;
      let condition = 'good';

      if (hint.match(/book|math|physics|cse|eee|civil|edition|author|volume|calculus|algorithm|circuit/)) {
        detectedCat = 'Books';
        title = titleHint || 'Academic Textbook / Reference Book';
        desc = 'Essential textbook for BAUST engineering semesters. Clean pages, no missing sheets, well-preserved.';
        price = 300;
        condition = 'good';
      } else if (hint.match(/calc|calculator|casio|991|laptop|mouse|keyboard|monitor|charger|headphone|earbud|fan|router/)) {
        detectedCat = 'Electronics';
        title = titleHint || 'Campus Tech / Electronics Device';
        desc = '100% fully functional electronic device. Tested and working without issues, ideal for daily campus and lab use.';
        price = 650;
        condition = 'like_new';
      } else if (hint.match(/chair|table|desk|bed|mattress|shelf|rack/)) {
        detectedCat = 'Furniture';
        title = titleHint || 'Hostel / Mess Furniture Item';
        desc = 'Sturdy furniture item suitable for student hostel or mess room. Saves cost compared to new furniture.';
        price = 800;
        condition = 'good';
      } else if (hint.match(/pen|drafting|t-scale|scale|set-square|folder|file|sheet|notebook|apron/)) {
        detectedCat = 'Academic Materials';
        title = titleHint || 'Engineering Drawing & Lab Material';
        desc = 'Required engineering lab equipment/materials for BAUST students. Gently used in prior semesters.';
        price = 200;
        condition = 'good';
      } else if (hint.match(/jersey|shirt|hoodie|jacket|shoes|pants|coat/)) {
        detectedCat = 'Clothing';
        title = titleHint || 'Campus Apparel / Clothing';
        desc = 'Comfortable campus wear, cleaned and neatly kept. Perfect fit and good condition.';
        price = 350;
        condition = 'like_new';
      } else if (hint.match(/bat|ball|racket|cricket|football|badminton/)) {
        detectedCat = 'Sports';
        title = titleHint || 'Sports Equipment';
        desc = 'Great sports gear for BAUST sports tournaments and evening campus games.';
        price = 400;
        condition = 'good';
      }

      aiResult = {
        title,
        description: desc,
        categoryName: detectedCat,
        condition,
        suggestedPrice: price,
      };
    }

    // Match category ID
    const matchedCategory = categories.find(
      (c) =>
        c.name.toLowerCase() === (aiResult.categoryName || '').toLowerCase() ||
        c.slug.toLowerCase() === (aiResult.categoryName || '').toLowerCase()
    ) || categories[0];

    return NextResponse.json({
      success: true,
      suggestion: {
        title: aiResult.title || titleHint || 'Campus Item',
        description: aiResult.description || 'Quality pre-owned item for campus use.',
        categoryId: matchedCategory?.id || '',
        condition: ['new', 'like_new', 'good', 'fair'].includes(aiResult.condition)
          ? aiResult.condition
          : 'good',
        price: Number(aiResult.suggestedPrice) || 200,
        transactionType: 'sell',
      },
    });
  } catch (err: any) {
    console.error('POST /api/listings/ai-generate error:', err);
    return NextResponse.json(
      { error: 'Failed to process AI auto-fill. Please enter details manually.' },
      { status: 500 }
    );
  }
}
