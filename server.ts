/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-load Google GenAI to avoid crashing if API key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!aiClient && key && key !== "" && key !== "MY_GEMINI_API_KEY") {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Initialized Google GenAI client successfully.");
    } catch (e) {
      console.error("Failed to initialize Google GenAI client", e);
    }
  }
  return aiClient;
}

// 1. API: Summarize the 7 Spiritual Dimensions
app.post("/api/ai/summarize", async (req, res) => {
  const { dimensions, patientName, gender } = req.body;
  if (!dimensions) {
    return res.status(400).json({ error: "الرجاء توفير الأبعاد السبعة للتقييم الروحي" });
  }

  const client = getAi();
  
  const prompt = `
  أنت المساعد الذكي والخبير البرمجي والروحي لمنصة "لطيف للدعم الروحي الرقمي".
  المطلوب هو قراءة نموذج تقييم الأبعاد الروحية السبعة المتتالي للمريض (${patientName})، الجنس (${gender === 'M' ? 'ذكر' : 'أنثى'}).
  بناءً على الأبعاد السبعة المدخلة تالياً، قم بصياغة ملخص فقهي وروحي وتوصية علاجية مقترحة واقتراح الخطة العلاجية الرقمية الأنسب من بين الخطط الخمسة المتوفرة لدينا:
  - 1PL: خطة السكينة والطمأنينة (لمرضى الأورام والقلق العابر)
  - 2PL: خطة الرضا والتسليم (للحالات الحرجة، الغضب، الحوادث والوضع الحرج)
  - 3PL: خطة الأمل والشفاء (للعمليات الكبرى، وبث الإيجابية والنهوض والنية)
  - 4PL: خطة الصبر والمصابرة (للأعراض المزمنة الطويلة والحالات المتكررة)
  - 5PL: خطة الطهور واليقين (للمغادرين، التعافي والعودة للشكر واليقين)

  الأبعاد السبعة المدخلة للمريض:
  1. التاريخ الروحي: ${dimensions.spiritualHistory || "غير مدخل"}
  2. التقييم الروحي: ${dimensions.spiritualEvaluation || "غير مدخل"}
  3. الاعتلالات الروحية: ${dimensions.spiritualDistress || "غير مدخل"}
  4. المثيرات: ${dimensions.triggers || "غير مدخل"}
  5. الأعراض: ${dimensions.symptoms || "غير مدخل"}
  6. التعزيز الروحي: ${dimensions.spiritualReinforcement || "غير مدخل"}
  7. القوة الروحية: ${dimensions.spiritualStrength || "غير مدخل"}

  اكتب رداً باللغة العربية الفصيحة، رزيناً، مهنياً وطبياً-روحياً. لا تجتهد فقهياً خارج الملف المتعارف بل وجه المريض وصغ التوصية في 3 فقرات قصيرة تشمل التوصية الروحية وتسكين الخطة العلاجية والرمز المقترح مثلاً [1PL إلخ].
  `;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return res.json({ result: response.text, method: "gemini" });
    } catch (err: any) {
      console.error("Gemini API error in summarize, falling back to heuristic generator", err);
      // Fallback is handled below
    }
  }

  // Elegant Rule-based Heuristic fallback if Gemini API is not configured or fails
  const planSuggestion = determineBestPlanCode(dimensions);
  const fallbacksDescription: Record<string, string> = {
    '1PL': 'خطة السكينة والطمأنينة الرقمية. يُوصى بالتركيز على أذكار الاستيداع والتسبيح المتكرر لتخفيف قلق العلاج الكيماوي والأورام.',
    '2PL': 'خطة الرضا والتسليم الإيماني. يُوصى بتهدئة الصدمات والتساؤلات الوجودية حول البلاء وغرس عقيدة القضاء والقدر والرضا التام بلطف الإله.',
    '3PL': 'خطة الأمل والشفاء الفسيح. يُنصح بربط نية الشفاء القريب بالنهوض لخدمة الأهل والمجتمع والبعد عن العجز.',
    '4PL': 'خطة الصبر والمصابرة الدائمة. يُنصح بمرافقة المريض في رحلته الطويلة وتكفير السيئات ورفع الدرجات بالصبر والرباط.',
    '5PL': 'خطة الطهور واليقين بالنعم. التركيز على شكر النعمة بعد المغادرة وبناء فترات نقاهة عامرة بأذكار التعافي الطاهرة.'
  };

  const simulatedResponse = `[محاكاة ذكية للمنصة]
تقييم شامل للمريض ${patientName}:
أولاً - التفسير الروحي: بناءً على الأبعاد السبعة، يعاني المريض من انعكاس روحي يحتاج إلى مرافقة مستمرة وتثبيت لركائز اليقين للتغلب على الأعراض والاعتلالات المسجلة.
ثانياً - التوصية الفقهية والعملية: يُنصح بشدة باعتماد [${planSuggestion}] وهي ${fallbacksDescription[planSuggestion]}.
ثالثاً - التعزيز المقترح: تقوية الجوانب الفذة المستخرجة من قوته الروحية (${dimensions.spiritualStrength || "عقيدة اليقين والدعاء"}) لمكافحة المثيرات الراهنة.`;

  return res.json({ result: simulatedResponse, method: "heuristic" });
});

// Helper heuristic for Plan Selection
function determineBestPlanCode(dims: any): string {
  const text = JSON.stringify(dims || {}).toLowerCase();
  if (text.includes('ورم') || text.includes('أورام') || text.includes('سرطان') || text.includes('قلق') || text.includes('خوف')) {
    return '1PL';
  } else if (text.includes('حرج') || text.includes('عناية') || text.includes('غضب') || text.includes('صدمة') || text.includes('لماذا أنا')) {
    return '2PL';
  } else if (text.includes('عملية') || text.includes('إعادة تأهيل') || text.includes('النهوض') || text.includes('إرادة')) {
    return '3PL';
  } else if (text.includes('مزمن') || text.includes('طويل') || text.includes('سنوات') || text.includes('فشل كلوي')) {
    return '4PL';
  } else {
    return '5PL';
  }
}

// 2. Chatbot response based on WhatsApp messages from patients vs Approved Jurisprudential File
app.post("/api/ai/chat", async (req, res) => {
  const { message, jurisprudentialFile } = req.body;
  if (!message) {
    return res.status(400).json({ error: "الرجاء إدخال نص الرسالة" });
  }

  // Detect query complexity to dispatch to jurist
  const isComplex = detectJurisprudentialComplexity(message);
  if (isComplex) {
    return res.json({ 
      escalate: true, 
      answer: "هذه المسألة دقيقة ومعقدة ولها تفاصيل تنظيمية أو أسرية خاصة. سأقوم بإرسالها فوراً لفضيلة الشيخ د. صالح اليوسف (فقيه المنصة) والباحثين المتخصصين للرد المباشر عليك، وستصلك إجابته الشرعية الموثقة هنا خلال دقائق معدودة. طهور إن شاء الله وصحتك تهمنا."
    });
  }

  const client = getAi();
  const prompt = `
  أنت المجيب الآلي المعتمد واللطيف في منصة "لطيف للدعم الروحي الرقمي".
  المرضى يتواصلون معك عبر واتساب. يجب أن تجيب بدقة، حكمة، طمأنينة ورأفة بالغة باللغة العربية الفصيحة.
  
  القانون الصارم: يجب أن تجيب فقط وحصرياً وبصرامة دون أي اجتهاد إضافي خارج نصوص "الملف الفقهي المعتمد" المرفق تالياً:
  
  --- الملف الفقهي المعتمد ---
  ${jurisprudentialFile || "لا يوجد ملف فقهي معتمد"}
  ---------------------------

  رسالة المريض الحالية: "${message}"

  إذا كانت الإجابة موجودة في الملف الفقهي، صغها بأسلوب رفيق وميسر للمريض.
  إذا كان السؤال معقداً أو يسأل عن مواضيع خارج هذا الملف تماماً (مثل الطلاق أو الميراث أو المعاملات البنكية العميقة) أو تفوق قدرة الإجابة، قل برفق أنك ستحول هذا السؤال على الفور للشيخ اليوسف (الفقيه) أو الخبير المختص للإجابة المباشرة الموثقة عبر واتساب.
  `;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return res.json({ answer: response.text, method: "gemini" });
    } catch (err: any) {
      console.error("Gemini API error in chat, falling back to static lookup", err);
    }
  }

  // Static Local Search Matcher
  const responseMatcher = lookupLocalJurisprudence(message, jurisprudentialFile);
  return res.json({ answer: responseMatcher, method: "static" });
});

// Heuristic to detect questions going straight to specialists
function detectJurisprudentialComplexity(message: string): boolean {
  const msg = message.toLowerCase();
  // Keywords indicating complex non-standard or wills transactions
  const complexKeywords = [
    'ورث', 'ميراث', 'تقسيم تركة', 'طلاق', 'خلع', 'عدلية', 'وصية', 'وقف',
    'أسهم', 'شركات', 'دين', 'ديون', 'محكمة', 'قاضي', 'حقوق', 'قانون'
  ];
  return complexKeywords.some(keyword => msg.includes(keyword));
}

// Local mock matcher if Gemini fails or is offline
function lookupLocalJurisprudence(message: string, fileContent: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('وضوء') || msg.includes('تيمم') || msg.includes('تراب') || msg.includes('ماء')) {
    return "يا أخي الحبيب، يسر الإسلام في المرض يتيح لك التيمم بالتراب أو الصخر الطاهر إذا عجزت عن استخدام المياه أو خفت فوت العافية، طهور وعافية إن شاء الله ونحن بخدمتك دائماً.";
  }
  if (msg.includes('جبيرة') || msg.includes('لاصق') || msg.includes('جبس') || msg.includes('مسح')) {
    return "أهلاً بك يا غالي. يشرع لك المسح على موضع الجبيرة أو اللصوق الطبي المانع لوصول الماء طيلة فترة العلاج المقررة طبياً، ولا حرج في طهارتك فهي تامة ومجملة بفضل الله تبارك وتعالى.";
  }
  if (msg.includes('جمع') || msg.includes('قصر') || msg.includes('صلاة') || msg.includes('سفر')) {
    return "يجوز للمريض في المستشفى جمع الصلوات المشتركة الأوقات (الظهر مع العصر، والمغرب مع العشاء) جمع تقديم أو تأخير لرفع الحرج والمشقة عنك في فترات جرعات العلاج أو ثقل عجز الحركة. تقبل الله منكم صالح الأعمال.";
  }
  if (msg.includes('عجز') || msg.includes('كيف أصلي') || msg.includes('قاعد')) {
    return "تصلي يا عزيزي على حسب حالتك ومقدرتك الجسدية: قائماً، فإن عجزت فقاعداً تومئ إيماءً بالركوع والسجود، أو على جنبك الأيمن بوجهك للقبلة برحمة الله وتيسيره الواسع.";
  }
  return "أهلاً بك يا أخي الكريم في منصة لطيف. سؤالك محل اهتمام، وسأقوم برفع استفسارك الحالي على وجه السرعة للجنة الاستشارات الشرعية والفقهية بالمنصة ليصلك الجواب الواضح الشافي فقهياً عبر رسائل وتطبيقات المتابعة في غضون دقائق معدودة بإذن الله.";
}

// Boot server & bundle client
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`لطيف للدعم الروحي الرقمي: Server running on http://localhost:${PORT}`);
  });
}

startServer();
