// =====================================================================
// File: src/components/BookList.tsx
// EN: Shows the books in a table with "toggle" and "delete" buttons.
//     It only DISPLAYS data; actions are sent up to the parent.
// AR: يعرض الكتب في جدول مع زري "تبديل الإتاحة" و "حذف".
//     يعرض البيانات فقط؛ والأفعال تُرسل إلى المكوّن الأب.
// =====================================================================

import type { Book } from "../types/book";

interface Props {
  books: Book[];
  onToggle: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BookList({ books, onToggle, onDelete }: Props) {
  // EN: Nothing to show → a friendly message instead of an empty table.
  // AR: لا يوجد شيء للعرض → رسالة لطيفة بدلاً من جدول فارغ.
  if (books.length === 0) return <p className="card muted">No books yet. Add the first one.</p>;

  return (
    <div className="card">
      <h2>Books ({books.length})</h2>
      {/* EN: On small screens the table scrolls sideways inside this box.
          AR: على الشاشات الصغيرة يتحرك الجدول أفقياً داخل هذا الصندوق. */}
      <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* EN: map() turns each book into a table row.
                  "key" helps React know which row is which.
              AR: map() تحوّل كل كتاب إلى صف في الجدول.
                  "key" يساعد React على تمييز كل صف. */}
          {books.map((book) => (
            <tr key={book.id}>
              {/* EN: dir="auto" shows Arabic titles right-to-left.
                  AR: dir="auto" يعرض العناوين العربية من اليمين لليسار. */}
              <td dir="auto">{book.title}</td>
              <td dir="auto">{book.author}</td>
              <td dir="auto">{book.genre}</td>
              <td>
                {/* EN: Click the badge to switch available ↔ unavailable.
                    AR: اضغط على الشارة للتبديل بين متاح وغير متاح. */}
                <button
                  className={book.available ? "badge on" : "badge off"}
                  onClick={() => onToggle(book)}
                  title="Click to change"
                >
                  {book.available ? "Available" : "Unavailable"}
                </button>
              </td>
              <td>
                <button className="danger" onClick={() => onDelete(book)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
