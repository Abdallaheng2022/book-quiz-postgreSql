// =====================================================================
// File: src/services/books.service.ts
// EN: SERVICE layer = business logic + data operations.
//     It knows NOTHING about HTTP (no req, no res). It just works with data.
//     Later we will replace the array with a database (PostgreSQL/Prisma)
//     and only THIS file will change.
// AR: طبقة الخدمة (Service) = منطق العمل + عمليات البيانات.
//     لا تعرف شيئاً عن HTTP (لا req ولا res). تتعامل مع البيانات فقط.
//     لاحقاً سنستبدل المصفوفة بقاعدة بيانات (PostgreSQL/Prisma)
//     وسيتغير هذا الملف فقط.
// =====================================================================

// EN: Built-in Node.js function that generates a unique random ID.
// AR: دالة مدمجة في Node.js تُنشئ معرّفاً عشوائياً فريداً.
import { randomUUID } from "node:crypto";

// EN: "import type" imports only types (removed after compiling).
// AR: "import type" يستورد الأنواع فقط (تُحذف بعد الترجمة).
import type { Book } from "../models/book.model.js";
import type { CreateBookInput, UpdateBookInput } from "../schemas/book.schema.js";

// EN: IN-MEMORY storage: a simple array in RAM.
//     ⚠ Data is lost every time the server restarts.
// AR: تخزين في الذاكرة: مصفوفة بسيطة داخل الذاكرة العشوائية RAM.
//     ⚠ تضيع البيانات عند كل إعادة تشغيل للسيرفر.
const books: Book[] = [
  // EN: Two sample books so GET returns something on first run.
  // AR: كتابان كمثال حتى يُرجع GET بيانات من أول تشغيل.
  { id: randomUUID(), title: "Clean Code", author: "Robert C. Martin", genre: "Programming", available: true },
  { id: randomUUID(), title: "مقدمة ابن خلدون", author: "ابن خلدون", genre: "History", available: true },
];

// EN: Return all books.
// AR: إرجاع جميع الكتب.
export function listBooks(): Book[] {
  // EN: Return the array as-is.
  // AR: نُرجع المصفوفة كما هي.
  return books;
}

// EN: Find one book by id. Returns the Book, or undefined if not found.
// AR: البحث عن كتاب واحد بالمعرّف. يُرجع الكتاب، أو undefined إذا لم يوجد.
export function getBookById(id: string): Book | undefined {
  // EN: find() returns the first element where the condition is true.
  // AR: find() تُرجع أول عنصر يحقق الشرط.
  return books.find((book) => book.id === id);
}

// EN: Create a new book from already-validated data.
// AR: إنشاء كتاب جديد من بيانات تم التحقق منها مسبقاً.
export function createBook(data: CreateBookInput): Book {
  // EN: "..." (spread) copies all fields from data; we add a new id.
  // AR: "..." (النشر) ينسخ كل الحقول من data؛ ونضيف معرّفاً جديداً.
  const newBook: Book = { id: randomUUID(), ...data };
  // EN: Add it to the end of the array.
  // AR: نضيفه إلى نهاية المصفوفة.
  books.push(newBook);
  // EN: Return the created book (with its id) to the caller.
  // AR: نُرجع الكتاب الجديد (مع معرّفه) لمن استدعى الدالة.
  return newBook;
}

// EN: Update some fields of a book. Returns the updated book or undefined.
// AR: تحديث بعض حقول الكتاب. يُرجع الكتاب المحدّث أو undefined.
export function updateBook(id: string, data: UpdateBookInput): Book | undefined {
  // EN: First, find the book.
  // AR: أولاً نبحث عن الكتاب.
  const book = getBookById(id);
  // EN: If it doesn't exist, tell the caller (controller decides 404).
  // AR: إذا لم يوجد نُخبر المستدعي (والـ Controller يقرر إرجاع 404).
  if (!book) return undefined;
  // EN: Object.assign copies the new values onto the existing book.
  // AR: Object.assign ينسخ القيم الجديدة فوق الكتاب الموجود.
  Object.assign(book, data);
  // EN: Return the updated book.
  // AR: نُرجع الكتاب بعد التحديث.
  return book;
}

// EN: Delete a book. Returns true if deleted, false if it didn't exist.
// AR: حذف كتاب. يُرجع true إذا تم الحذف، و false إذا لم يكن موجوداً.
export function deleteBook(id: string): boolean {
  // EN: findIndex() gives the position in the array, or -1 if not found.
  // AR: findIndex() تعطي موقع العنصر في المصفوفة، أو -1 إذا لم يوجد.
  const index = books.findIndex((book) => book.id === id);
  // EN: Not found → nothing to delete.
  // AR: غير موجود → لا يوجد شيء لحذفه.
  if (index === -1) return false;
  // EN: splice(index, 1) removes exactly one element at that position.
  // AR: splice(index, 1) يحذف عنصراً واحداً بالضبط من ذلك الموقع.
  books.splice(index, 1);
  // EN: Deleted successfully.
  // AR: تم الحذف بنجاح.
  return true;
}
