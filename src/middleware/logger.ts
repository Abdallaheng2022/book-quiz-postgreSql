// =====================================================================
// File: src/middleware/logger.ts
// EN: MIDDLEWARE = a function that runs BEFORE the route handler.
//     This one prints every request to the terminal.
// AR: الوسيط (Middleware) = دالة تعمل قبل معالج المسار.
//     هذا الوسيط يطبع كل طلب في الطرفية (Terminal).
// =====================================================================

// EN: RequestHandler = the type of a normal middleware (req, res, next).
// AR: RequestHandler = نوع الوسيط العادي (req, res, next).
import type { RequestHandler } from "express";

// EN: Our logging middleware.
// AR: وسيط تسجيل الطلبات.
export const logger: RequestHandler = (req, _res, next) => {
  // EN: Print time, method and URL, e.g. "2026-11-23T08:00:00Z GET /api/books"
  // AR: نطبع الوقت والطريقة والرابط، مثل "2026-11-23T08:00:00Z GET /api/books"
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  // EN: next() = "continue to the next step". Without it the request hangs!
  // AR: next() = "انتقل للخطوة التالية". بدونها يبقى الطلب معلّقاً!
  next();
};
