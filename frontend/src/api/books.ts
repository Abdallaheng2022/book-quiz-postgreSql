// =====================================================================
// File: src/api/books.ts
// EN: All calls to the Express API live here, so components never
//     write fetch() themselves. (Same idea as the backend "Service".)
// AR: كل الاتصالات بالـ API موجودة هنا، حتى لا تكتب المكوّنات
//     fetch() بنفسها. (نفس فكرة الـ Service في السيرفر.)
// =====================================================================

import type { Book, NewBook } from "../types/book";

// EN: Relative URL: Vite's proxy forwards it to http://localhost:3000
// AR: رابط نسبي: وكيل Vite يحوّله إلى http://localhost:3000
const BASE_URL = "/api/books";

// ---------------------------------------------------------------------
// EN: Shared helper: sends a request and returns the JSON, or throws an
//     Error with the API's message ({ error: { message } }).
// AR: دالة مشتركة: ترسل الطلب وتُرجع JSON، أو ترمي خطأ يحمل رسالة
//     الـ API ‏({ error: { message } }).
// ---------------------------------------------------------------------
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  // EN: fetch() sends the HTTP request; await waits for the answer.
  // AR: fetch() يرسل طلب HTTP؛ و await ينتظر الرد.
  const res = await fetch(url, {
    ...options,
    // EN: Tell the server we send JSON (avoids the "Body must be JSON" error).
    // AR: نخبر السيرفر أننا نرسل JSON (لتجنب خطأ "Body must be JSON").
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  // EN: 204 No Content (after DELETE) has no body to read.
  // AR: الرد 204 (بعد الحذف) ليس له محتوى لقراءته.
  if (res.status === 204) return undefined as T;

  // EN: Read the body as JSON. If it isn't JSON (e.g. the API is off and the
  //     proxy returns an empty 500), data stays null instead of crashing.
  // AR: نقرأ المحتوى بصيغة JSON. إذا لم يكن JSON (مثلاً الـ API متوقف والوكيل
  //     يُرجع 500 فارغاً)، تبقى data فارغة (null) بدلاً من أن يتعطل الكود.
  const data = await res.json().catch(() => null);
  if (data === null && !res.ok) throw new Error(`Cannot reach the API (status ${res.status})`);

  // EN: res.ok is true for 200–299. Otherwise use the API's error message.
  // AR: res.ok تكون true للرموز 200–299. غير ذلك نستخدم رسالة خطأ الـ API.
  if (!res.ok) {
    // EN: Main message, e.g. "Invalid book data".
    // AR: الرسالة الرئيسية، مثل "Invalid book data".
    const message: string = data?.error?.message ?? `Request failed (${res.status})`;
    // EN: Zod details (if any), e.g. ["Title is required"], joined by ", ".
    // AR: تفاصيل Zod (إن وجدت)، مثل ["Title is required"]، نجمعها بفاصلة.
    const details: string[] = Array.isArray(data?.error?.details)
      ? data.error.details.map((d: { message: string }) => d.message)
      : [];
    throw new Error(details.length ? `${message}: ${details.join(", ")}` : message);
  }

  return data as T;
}

// EN: GET /api/books → list.          | AR: جلب كل الكتب.
export const getBooks = () => request<Book[]>(BASE_URL);

// EN: POST /api/books → create.       | AR: إنشاء كتاب.
export const createBook = (book: NewBook) =>
  request<Book>(BASE_URL, { method: "POST", body: JSON.stringify(book) });

// EN: PATCH /api/books/:id → update.  | AR: تحديث كتاب.
export const updateBook = (id: string, changes: Partial<NewBook>) =>
  request<Book>(`${BASE_URL}/${id}`, { method: "PATCH", body: JSON.stringify(changes) });

// EN: DELETE /api/books/:id → remove. | AR: حذف كتاب.
export const deleteBook = (id: string) =>
  request<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
