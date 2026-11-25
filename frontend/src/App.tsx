// =====================================================================
// File: src/App.tsx
// EN: The main component. It OWNS the data (books, errors) and talks to
//     the API. Child components only display and report clicks.
// AR: المكوّن الرئيسي. يملك البيانات (الكتب والأخطاء) ويتصل بالـ API.
//     المكوّنات الأبناء تعرض فقط وتُبلغ عن الضغطات.
// =====================================================================

// EN: useEffect = run code after the component appears (e.g. load data).
// AR: useEffect = تشغيل كود بعد ظهور المكوّن (مثل تحميل البيانات).
import { useEffect, useState } from "react";
import * as api from "./api/books";
import type { Book, NewBook } from "./types/book";
import { BookForm } from "./components/BookForm";
import { BookList } from "./components/BookList";

export default function App() {
  // EN: The list of books shown on screen.
  // AR: قائمة الكتب المعروضة على الشاشة.
  const [books, setBooks] = useState<Book[]>([]);
  // EN: true until the first load finishes.
  // AR: true حتى ينتهي التحميل الأول.
  const [loading, setLoading] = useState(true);
  // EN: Last error message from the API (null = no error).
  // AR: آخر رسالة خطأ من الـ API ‏(null = لا يوجد خطأ).
  const [error, setError] = useState<string | null>(null);

  // EN: Load books once when the page opens ([] = run only one time).
  // AR: تحميل الكتب مرة واحدة عند فتح الصفحة ([] = تعمل مرة واحدة فقط).
  useEffect(() => {
    api
      .getBooks()
      .then(setBooks)
      .catch((e: Error) => setError(`${e.message} — is the API running on port 3000?`))
      .finally(() => setLoading(false));
  }, []);

  // EN: Wrapper: clear old error, run the action, show any new error.
  // AR: دالة مغلّفة: تمسح الخطأ القديم، تنفذ الفعل، وتعرض أي خطأ جديد.
  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
      // EN: Re-throw so the form knows it failed (and keeps the typed text).
      // AR: نعيد رمي الخطأ حتى يعرف النموذج أنه فشل (ويحتفظ بالنص المكتوب).
      throw e;
    }
  }

  // EN: Add → API returns the new book → append it to the list.
  // AR: إضافة → الـ API يُرجع الكتاب الجديد → نضيفه للقائمة.
  const handleAdd = (data: NewBook) =>
    run(async () => {
      const created = await api.createBook(data);
      setBooks((prev) => [...prev, created]);
    });

  // EN: Toggle → PATCH only the "available" field → replace that book.
  // AR: تبديل → PATCH لحقل "available" فقط → نستبدل ذلك الكتاب.
  const handleToggle = (book: Book) =>
    run(async () => {
      const updated = await api.updateBook(book.id, { available: !book.available });
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    }).catch(() => {});

  // EN: Delete → ask first → remove it from the list.
  // AR: حذف → نسأل أولاً → نحذفه من القائمة.
  const handleDelete = (book: Book) => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    run(async () => {
      await api.deleteBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    }).catch(() => {});
  };

  return (
    <main>
      <header>
        <h1>📚 Book Quiz</h1>
        <p className="muted">Step 1 — the book library. AI quizzes come next.</p>
      </header>

      {/* EN: Show the error box only when there is an error.
          AR: نعرض صندوق الخطأ فقط عند وجود خطأ. */}
      {error && <p className="error">⚠ {error}</p>}

      <BookForm onAdd={handleAdd} />

      {loading ? (
        <p className="card muted">Loading books…</p>
      ) : (
        <BookList books={books} onToggle={handleToggle} onDelete={handleDelete} />
      )}
    </main>
  );
}
