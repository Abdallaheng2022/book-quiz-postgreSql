// =====================================================================
// File: src/config/env.ts
// EN: Loads settings from the ".env" file and VALIDATES them before the
//     server starts ("fail early" = stop immediately if config is wrong).
// AR: يقرأ الإعدادات من ملف ".env" ويتحقق من صحتها قبل تشغيل السيرفر
//     ("الفشل المبكر" = نوقف التشغيل فوراً إذا كانت الإعدادات خاطئة).
// =====================================================================

// EN: Reads the ".env" file and puts its values into process.env.
// AR: يقرأ ملف ".env" ويضع قيمه داخل process.env.
import "dotenv/config";

// EN: Import Zod, the library we use to validate data at runtime.
// AR: نستورد مكتبة Zod التي نستخدمها للتحقق من البيانات أثناء التشغيل.
import { z } from "zod";

// EN: A schema = a set of rules describing what valid settings look like.
// AR: المخطط (Schema) = مجموعة قواعد تصف شكل الإعدادات الصحيحة.
const envSchema = z.object({
  // EN: PORT: convert text to number, must be an integer 1-65535, default 3000.
  // AR: PORT: نحوّل النص إلى رقم، ويجب أن يكون عدداً صحيحاً بين 1 و 65535، والافتراضي 3000.
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

// EN: Check process.env against the rules without throwing an exception.
// AR: نفحص process.env مقابل القواعد بدون رمي استثناء (خطأ).
const result = envSchema.safeParse(process.env);

// EN: If the settings are invalid...
// AR: إذا كانت الإعدادات غير صحيحة...
if (!result.success) {
  // EN: ...print a clear message explaining what is wrong...
  // AR: ...نطبع رسالة واضحة تشرح الخطأ...
  // EN: z.prettifyError turns Zod errors into readable text.
  // AR: z.prettifyError يحوّل أخطاء Zod إلى نص سهل القراءة.
  console.error("❌ Invalid environment configuration:\n" + z.prettifyError(result.error));
  // EN: ...and stop the program (exit code 1 = failure).
  // AR: ...ونوقف البرنامج (رمز الخروج 1 = فشل).
  process.exit(1);
}

// EN: Export the validated, correctly-typed settings for other files.
// AR: نصدّر الإعدادات الصحيحة (بأنواعها الصحيحة) لتستخدمها الملفات الأخرى.
export const env = result.data;
