// =====================================================================
// File: src/routes/books.routes.ts
// EN: ROUTES layer = the "map" of the API. Each line connects
//     an HTTP METHOD + PATH to a controller function. Nothing else.
// AR: طبقة المسارات (Routes) = "خريطة" الـ API. كل سطر يربط
//     طريقة HTTP + مسار بدالة في الـ Controller. لا شيء غير ذلك.
// =====================================================================

// EN: Router = a mini-app that groups related endpoints together.
// AR: Router = تطبيق مصغّر يجمع نقاط النهاية المرتبطة ببعضها.
import { Router } from "express";

// EN: Import the 5 controller functions.
// AR: نستورد دوال الـ Controller الخمس.
import { getBooks, getBook, createBook, updateBook, deleteBook } from "../controllers/books.controller.js";

// EN: Create a new router.
// AR: ننشئ موجّهاً (Router) جديداً.
export const booksRouter = Router();

// EN: Paths here are RELATIVE: "/" becomes "/api/books" (prefix is set in app.ts).
// AR: المسارات هنا نسبية: "/" تصبح "/api/books" (البادئة تُحدد في app.ts).

// EN: Read all books.          | AR: قراءة جميع الكتب.
booksRouter.get("/", getBooks);

// EN: Read one book by id.     | AR: قراءة كتاب واحد بالمعرّف.
booksRouter.get("/:id", getBook);

// EN: Create a book.           | AR: إنشاء كتاب.
booksRouter.post("/", createBook);

// EN: Partially update a book. | AR: تحديث جزئي لكتاب.
booksRouter.patch("/:id", updateBook);

// EN: Delete a book.           | AR: حذف كتاب.
booksRouter.delete("/:id", deleteBook);
