// =====================================================================
// File: src/schemas/book.schema.ts
// EN: Zod rules that check data coming from the client (Postman, app...)
//     TypeScript checks OUR code; Zod checks THEIR data at runtime.
// AR: قواعد Zod التي تفحص البيانات القادمة من العميل (Postman، تطبيق...)
//     TypeScript يفحص كودنا نحن؛ Zod يفحص بياناتهم أثناء التشغيل.
// =====================================================================

// EN: Import the Zod library.
// AR: نستورد مكتبة Zod.
import { z } from "zod";

// ---------------------------------------------------------------------
// EN: Rules for POST (create a new book) - title/author/genre REQUIRED.
// AR: قواعد POST (إنشاء كتاب جديد) - العنوان/المؤلف/التصنيف إجبارية.
// ---------------------------------------------------------------------
export const createBookSchema = z.object({
  // EN: Must be text; trim() removes spaces at the edges; min(1) rejects "".
  // AR: يجب أن يكون نصاً؛ trim() يحذف المسافات من الأطراف؛ min(1) يرفض النص الفارغ.
  title: z.string().trim().min(1, "Title is required"),

  // EN: Same rules for the author.
  // AR: نفس القواعد لاسم المؤلف.
  author: z.string().trim().min(1, "Author is required"),

  // EN: Same rules for the genre.
  // AR: نفس القواعد للتصنيف.
  genre: z.string().trim().min(1, "Genre is required"),

  // EN: Must be true/false; if the client omits it, use true.
  // AR: يجب أن تكون true أو false؛ إذا لم يرسلها العميل نستخدم true.
  available: z.boolean().default(true),
})
  // EN: strict() rejects unknown fields (e.g. "id" — the server creates the id).
  // AR: strict() يرفض الحقول غير المعروفة (مثل "id" — السيرفر هو من يُنشئ المعرّف).
  .strict();

// ---------------------------------------------------------------------
// EN: Rules for PATCH (partial update) - every field is OPTIONAL,
//     but any field that IS sent must still be valid.
// AR: قواعد PATCH (تحديث جزئي) - كل الحقول اختيارية،
//     لكن أي حقل يُرسل يجب أن يكون صحيحاً.
// ---------------------------------------------------------------------
export const updateBookSchema = z
  .object({
    // EN: Optional title; if sent, it can't be empty.
    // AR: عنوان اختياري؛ إذا أُرسل لا يجوز أن يكون فارغاً.
    title: z.string().trim().min(1).optional(),

    // EN: Optional author.
    // AR: مؤلف اختياري.
    author: z.string().trim().min(1).optional(),

    // EN: Optional genre.
    // AR: تصنيف اختياري.
    genre: z.string().trim().min(1).optional(),

    // EN: Optional availability (no default here - we don't want to overwrite).
    // AR: الإتاحة اختيارية (بدون قيمة افتراضية هنا حتى لا نغيّر القيمة الحالية بالخطأ).
    available: z.boolean().optional(),
  })
  // EN: strict() rejects unknown fields, e.g. { "id": "hack" } or typos like "titel".
  // AR: strict() يرفض الحقول غير المعروفة، مثل { "id": "hack" } أو أخطاء إملائية مثل "titel".
  .strict();
// EN: Note: the rule "send at least one field" is checked in the controller,
//     so a typo like "titel" shows ONE clear error instead of two.
// AR: ملاحظة: قاعدة "أرسل حقلاً واحداً على الأقل" تُفحص في الـ Controller،
//     حتى يظهر خطأ واحد واضح عند كتابة "titel" بدلاً من خطأين.

// EN: z.infer creates TypeScript types FROM the schemas (no duplicate typing).
// AR: z.infer يُنشئ أنواع TypeScript من المخططات مباشرةً (بدون تكرار الكتابة).
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
