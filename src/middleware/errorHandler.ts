// =====================================================================
// File: src/middleware/errorHandler.ts
// EN: CENTRALIZED error handling: every error in the app ends up here,
//     so all error responses share ONE consistent JSON shape:
//     { "error": { "message": "...", "details": ... } }
// AR: معالجة الأخطاء المركزية: كل خطأ في التطبيق يصل إلى هنا،
//     لذلك كل ردود الأخطاء لها نفس شكل JSON الموحّد:
//     { "error": { "message": "...", "details": ... } }
// =====================================================================

// EN: Types for normal middleware and error middleware.
// AR: أنواع الوسيط العادي ووسيط الأخطاء.
import type { ErrorRequestHandler, RequestHandler } from "express";

// EN: Our custom error class.
// AR: صنف الخطأ المخصص.
import { HttpError } from "../errors/HttpError.js";

// ---------------------------------------------------------------------
// EN: 404 handler: runs when NO route matched the URL (e.g. GET /api/xyz).
// AR: معالج 404: يعمل عندما لا يطابق أي مسار الرابط (مثل GET /api/xyz).
// ---------------------------------------------------------------------
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  // EN: next(error) = skip normal middleware and jump to the error handler.
  // AR: next(error) = تخطَّ الوسطاء العاديين واذهب مباشرة إلى معالج الأخطاء.
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// ---------------------------------------------------------------------
// EN: Error handler: Express recognizes it because it has FOUR parameters.
// AR: معالج الأخطاء: يتعرف عليه Express لأنه يملك أربعة معاملات.
// ---------------------------------------------------------------------
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // EN: Case 1: an error WE created on purpose (400, 404...).
  // AR: الحالة 1: خطأ أنشأناه نحن عن قصد (400، 404...).
  if (err instanceof HttpError) {
    // EN: Send its status and message (and details if present).
    // AR: نرسل رمز الحالة والرسالة (والتفاصيل إن وجدت).
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    // EN: Stop here.
    // AR: نتوقف هنا.
    return;
  }

  // EN: Case 2: the client sent broken JSON (e.g. missing a quote).
  //     express.json() marks this kind of error with type "entity.parse.failed".
  // AR: الحالة 2: العميل أرسل JSON مكسوراً (مثل علامة تنصيص ناقصة).
  //     express.json() يضع على هذا الخطأ النوع "entity.parse.failed".
  if (err?.type === "entity.parse.failed") {
    // EN: That's the client's fault → 400.
    // AR: هذا خطأ العميل → 400.
    res.status(400).json({ error: { message: "Malformed JSON in request body" } });
    return;
  }

  // EN: Case 3: other request-reading errors from express.json(), e.g. an
  //     unsupported charset (415), a wrong Content-Encoding (400) or a body
  //     that is too large (413). They carry a 4xx "status" and expose = true.
  // AR: الحالة 3: أخطاء أخرى من express.json() أثناء قراءة الطلب، مثل ترميز
  //     charset غير مدعوم (415) أو Content-Encoding خاطئ (400) أو جسم كبير جداً (413).
  //     تحمل رمز حالة 4xx في "status" وقيمة expose = true.
  if (err?.expose === true && typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    // EN: Client mistake → send the real status and the safe message.
    // AR: خطأ من العميل → نرسل رمز الحالة الحقيقي والرسالة الآمنة.
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  // EN: Case 4: unexpected bug → log full details for US (developers)...
  // AR: الحالة 4: خطأ غير متوقع → نسجل التفاصيل الكاملة لنا (المطورين)...
  console.error(err);
  // EN: ...but send a generic message to the client (never expose internals).
  // AR: ...لكن نرسل رسالة عامة للعميل (لا نكشف التفاصيل الداخلية أبداً).
  res.status(500).json({ error: { message: "Internal Server Error" } });
};
