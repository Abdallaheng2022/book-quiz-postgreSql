// =====================================================================
// File: src/controllers/books.controller.ts
// EN: CONTROLLER layer = handles HTTP: reads the request (req),
//     validates it, calls the Service, and sends the response (res)
//     with the correct STATUS CODE. No data logic here.
// AR: طبقة المتحكم (Controller) = تتعامل مع HTTP: تقرأ الطلب (req)،
//     تتحقق منه، تستدعي الخدمة (Service)، وترسل الرد (res)
//     مع رمز الحالة الصحيح. لا يوجد منطق بيانات هنا.
// =====================================================================

// EN: Express types for request and response objects.
// AR: أنواع Express الخاصة بكائنات الطلب والرد.
import type { Request, Response } from "express";

// EN: Import the 5 service functions under one name: booksService.
// AR: نستورد دوال الخدمة الخمس تحت اسم واحد: booksService.
import * as booksService from "../services/books.service.js";

// EN: Import the validation rules.
// AR: نستورد قواعد التحقق.
import { createBookSchema, updateBookSchema } from "../schemas/book.schema.js";

// EN: Import our custom error class.
// AR: نستورد صنف الخطأ المخصص.
import { HttpError } from "../errors/HttpError.js";

// EN: Type for routes that have ":id" in the URL, e.g. /api/books/:id
// AR: نوع للمسارات التي تحتوي ":id" في الرابط، مثل /api/books/:id
type IdParams = { id: string };

// ---------------------------------------------------------------------
// EN: Helper: make sure the client actually sent a JSON object.
//     If Postman's body is "Text", "form-data" or empty, express.json()
//     skips it and req.body is undefined. We explain how to fix it.
// AR: دالة مساعدة: نتأكد أن العميل أرسل كائن JSON فعلاً.
//     إذا كان الـ Body في Postman من نوع "Text" أو "form-data" أو فارغاً،
//     يتجاهله express.json() ويصبح req.body غير معرّف. نشرح طريقة الإصلاح.
// ---------------------------------------------------------------------
function requireJsonObject(req: Request): void {
  // EN: Content-Type must be application/json.
  // AR: يجب أن يكون Content-Type هو application/json.
  if (!req.is("application/json")) {
    throw new HttpError(400, 'Body must be JSON. In Postman: Body → raw → JSON (Content-Type: application/json)');
  }
  // EN: The JSON must be an object { ... }, not an array or a plain value.
  // AR: يجب أن يكون JSON كائناً { ... }، وليس مصفوفة أو قيمة مفردة.
  if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
    throw new HttpError(400, "Body must be a JSON object, e.g. { \"title\": \"...\" }");
  }
}

// ---------------------------------------------------------------------
// GET /api/books  → 200 OK + list of books
// ---------------------------------------------------------------------
export function getBooks(_req: Request, res: Response) {
  // EN: "_req" starts with _ to show we don't use it.
  // AR: "_req" يبدأ بشرطة سفلية لنوضح أننا لا نستخدمه.
  // EN: Ask the service for data, then send it as JSON (status 200 by default).
  // AR: نطلب البيانات من الخدمة ثم نرسلها بصيغة JSON (الحالة 200 افتراضياً).
  res.json(booksService.listBooks());
}

// ---------------------------------------------------------------------
// GET /api/books/:id  → 200 OK, or 404 Not Found
// ---------------------------------------------------------------------
export function getBook(req: Request<IdParams>, res: Response) {
  // EN: req.params.id = the value in the URL after /api/books/
  // AR: req.params.id = القيمة الموجودة في الرابط بعد /api/books/
  const book = booksService.getBookById(req.params.id);
  // EN: If not found, THROW an error → Express sends it to the error handler.
  // AR: إذا لم يوجد نرمي خطأ → Express يرسله إلى معالج الأخطاء المركزي.
  if (!book) throw new HttpError(404, "Book not found");
  // EN: Found → send it.
  // AR: موجود → نرسله.
  res.json(book);
}

// ---------------------------------------------------------------------
// POST /api/books  → 201 Created, or 400 Bad Request
// ---------------------------------------------------------------------
export function createBook(req: Request, res: Response) {
  // EN: First, make sure a JSON object was sent.
  // AR: أولاً نتأكد أن كائن JSON قد أُرسل.
  requireJsonObject(req);
  // EN: safeParse checks req.body against the rules WITHOUT throwing.
  // AR: safeParse يفحص req.body مقابل القواعد بدون رمي خطأ.
  const result = createBookSchema.safeParse(req.body);
  // EN: Invalid data → 400 with the list of problems.
  // AR: بيانات غير صحيحة → 400 مع قائمة المشاكل.
  if (!result.success) {
    throw new HttpError(400, "Invalid book data", result.error.issues);
  }
  // EN: ✅ Use result.data (clean, validated) — NOT req.body (untrusted).
  // AR: ✅ نستخدم result.data (نظيفة ومُتحقق منها) — وليس req.body (غير موثوقة).
  const book = booksService.createBook(result.data);
  // EN: 201 = "Created": the standard status for a successful POST.
  // AR: 201 = "تم الإنشاء": الرمز القياسي لنجاح طلب POST.
  res.status(201).json(book);
}

// ---------------------------------------------------------------------
// PATCH /api/books/:id  → 200 OK, 400 Bad Request, or 404 Not Found
// ---------------------------------------------------------------------
export function updateBook(req: Request<IdParams>, res: Response) {
  // EN: First, make sure a JSON object was sent.
  // AR: أولاً نتأكد أن كائن JSON قد أُرسل.
  requireJsonObject(req);
  // EN: Validate the partial update data.
  // AR: نتحقق من بيانات التحديث الجزئي.
  const result = updateBookSchema.safeParse(req.body);
  // EN: Invalid → 400.
  // AR: غير صحيحة → 400.
  if (!result.success) {
    throw new HttpError(400, "Invalid book data", result.error.issues);
  }
  // EN: Empty object {} → nothing to update → 400.
  // AR: كائن فارغ {} → لا يوجد شيء لتحديثه → 400.
  if (Object.keys(result.data).length === 0) {
    throw new HttpError(400, "Send at least one field to update");
  }
  // EN: Ask the service to update.
  // AR: نطلب من الخدمة تنفيذ التحديث.
  const book = booksService.updateBook(req.params.id, result.data);
  // EN: Service returned undefined → the book doesn't exist → 404.
  // AR: الخدمة أرجعت undefined → الكتاب غير موجود → 404.
  if (!book) throw new HttpError(404, "Book not found");
  // EN: Send the updated book.
  // AR: نرسل الكتاب بعد التحديث.
  res.json(book);
}

// ---------------------------------------------------------------------
// DELETE /api/books/:id  → 204 No Content, or 404 Not Found
// ---------------------------------------------------------------------
export function deleteBook(req: Request<IdParams>, res: Response) {
  // EN: Try to delete; the service tells us if it worked.
  // AR: نحاول الحذف؛ والخدمة تخبرنا هل نجح أم لا.
  const deleted = booksService.deleteBook(req.params.id);
  // EN: Nothing deleted → 404.
  // AR: لم يُحذف شيء → 404.
  if (!deleted) throw new HttpError(404, "Book not found");
  // EN: 204 = success with an empty body; .end() finishes the response.
  // AR: 204 = نجاح بدون محتوى؛ و ‎.end()‎ يُنهي الرد.
  res.status(204).end();
}
