// =====================================================================
// File: src/app.ts
// EN: Builds the Express application: registers middleware and routes
//     IN ORDER. (Order matters! Express runs them top to bottom.)
// AR: يبني تطبيق Express: يسجّل الوسطاء والمسارات بالترتيب.
//     (الترتيب مهم! Express ينفذها من الأعلى إلى الأسفل.)
// =====================================================================

// EN: Import Express itself.
// AR: نستورد Express نفسه.
import express from "express";

// EN: Import our middleware and router.
// AR: نستورد الوسطاء والموجّه الخاص بنا.
import { logger } from "./middleware/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { booksRouter } from "./routes/books.routes.js";

// EN: Create the app object.
// AR: ننشئ كائن التطبيق.
export const app = express();

// EN: 1) Log every request FIRST (before routes, or it won't run for them).
// AR: 1) تسجيل كل طلب أولاً (قبل المسارات، وإلا لن يعمل لها).
app.use(logger);

// EN: 2) Built-in middleware: turns a JSON request body into req.body object.
// AR: 2) وسيط مدمج: يحوّل جسم الطلب بصيغة JSON إلى كائن req.body.
app.use(express.json());

// EN: 3) Simple health check: is the server alive?
// AR: 3) فحص صحة بسيط: هل السيرفر يعمل؟
app.get("/health", (_req, res) => {
  // EN: Reply with a small JSON object.
  // AR: نرد بكائن JSON صغير.
  res.json({ status: "ok" });
});

// EN: 4) Mount the books router under the "/api/books" prefix.
// AR: 4) نركّب موجّه الكتب تحت البادئة "/api/books".
app.use("/api/books", booksRouter);

// EN: 5) No route matched → 404 (must be AFTER all routes).
// AR: 5) لم يطابق أي مسار → 404 (يجب أن يكون بعد كل المسارات).
app.use(notFoundHandler);

// EN: 6) Central error handler — ALWAYS registered LAST.
// AR: 6) معالج الأخطاء المركزي — يُسجل دائماً في النهاية.
app.use(errorHandler);
