// Capture a DocSend (or similar email-gated) deck via Browserless headless Chrome,
// stitch slides into a PDF, upload to the pitch-decks bucket, and attach to the deal.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { PDFDocument } from 'npm:pdf-lib@1.17.1';

const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
const GATE_EMAIL = 'luke.turner@dcaam.com';

// Puppeteer script that runs inside Browserless. Returns { slides: base64[] }.
const browserScript = `
export default async function ({ page, context }) {
  const { url, email } = context;
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Try to fill an email gate if present.
  try {
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 5000 });
    const sel = (await page.$('input[type="email"]')) ? 'input[type="email"]'
      : (await page.$('input[name="email"]')) ? 'input[name="email"]' : '#email';
    await page.type(sel, email, { delay: 20 });
    // Click any visible submit/continue button.
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
      const target = btns.find(b => /continue|submit|view|access|enter/i.test((b.innerText || b.value || '').trim()));
      if (target) { target.click(); return true; }
      return false;
    });
    if (!clicked) {
      await page.keyboard.press('Enter');
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  } catch (_) {}

  // Wait for deck UI.
  await new Promise(r => setTimeout(r, 3000));

  // Find total slides from common DocSend selectors; fall back to 50.
  const total = await page.evaluate(() => {
    const txt = document.body.innerText;
    const m = txt.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
    if (m) return parseInt(m[2], 10);
    return 60;
  });

  const slides = [];
  const seen = new Set();
  for (let i = 0; i < Math.min(total, 80); i++) {
    await new Promise(r => setTimeout(r, 900));
    const shot = await page.screenshot({ type: 'png', fullPage: false, encoding: 'base64' });
    // Dedupe consecutive identical frames (means we reached the end).
    const sig = shot.slice(0, 200) + shot.slice(-200);
    if (seen.has(sig)) break;
    seen.add(sig);
    slides.push(shot);
    // Advance to next slide.
    await page.keyboard.press('ArrowRight');
  }

  return { data: { slides }, type: 'application/json' };
}
`;

async function captureSlides(url: string): Promise<string[]> {
  const endpoint = `https://production-sfo.browserless.io/function?token=${BROWSERLESS_API_KEY}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: browserScript,
      context: { url, email: GATE_EMAIL },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Browserless error ${res.status}: ${txt.slice(0, 500)}`);
  }
  const json = await res.json();
  const slides: string[] = json.slides || json.data?.slides || [];
  if (!slides.length) throw new Error('No slides captured');
  return slides;
}

async function slidesToPdf(slides: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const b64 of slides) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const img = await pdf.embedPng(bytes);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return await pdf.save();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!BROWSERLESS_API_KEY) throw new Error('BROWSERLESS_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const url: string = body.url;
    const dealId: string = body.deal_id;
    if (!url || !dealId) throw new Error('url and deal_id required');

    console.log(`[capture-docsend] starting capture for deal ${dealId} url=${url}`);
    const slides = await captureSlides(url);
    console.log(`[capture-docsend] captured ${slides.length} slides, building PDF`);
    const pdfBytes = await slidesToPdf(slides);
    console.log(`[capture-docsend] PDF built (${pdfBytes.byteLength} bytes), uploading`);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const fileName = `${dealId}_docsend_${Date.now()}.pdf`;
    const { error: upErr } = await admin.storage.from('pitch-decks').upload(fileName, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from('pitch-decks').getPublicUrl(fileName);

    const { data: row, error: insErr } = await admin.from('file_attachments').insert({
      deal_id: dealId,
      file_name: `DocSend capture (${slides.length} slides).pdf`,
      file_url: pub.publicUrl,
      file_type: 'file',
      file_size: pdfBytes.byteLength,
      uploaded_by: userId,
    }).select().single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, attachment: row, slides: slides.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[capture-docsend] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
