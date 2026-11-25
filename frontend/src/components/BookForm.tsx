// =====================================================================
// File: src/components/BookForm.tsx
// EN: A form to add a new book. It doesn't call the API itself:
//     it gives the data to its parent through the onAdd "prop".
// AR: نموذج لإضافة كتاب جديد. لا يتصل بالـ API بنفسه:
//     يعطي البيانات للمكوّن الأب عبر الخاصية (prop) المسماة onAdd.
// =====================================================================

// EN: useState = a "memory box" that re-draws the component when it changes.
// AR: useState = "صندوق ذاكرة" يعيد رسم المكوّن عندما تتغير قيمته.
import { useState, type FormEvent } from "react";
import type { NewBook } from "../types/book";

// EN: Props = inputs a parent passes to this component.
// AR: الخصائص (Props) = مدخلات يمررها المكوّن الأب لهذا المكوّن.
interface Props {
  onAdd: (book: NewBook) => Promise<void>;
}

// EN: Empty form values (used at start and after a successful add).
// AR: قيم النموذج الفارغة (عند البداية وبعد الإضافة الناجحة).
const EMPTY: NewBook = { title: "", author: "", genre: "", available: true };

export function BookForm({ onAdd }: Props) {
  // EN: Current values typed in the form.
  // AR: القيم الحالية المكتوبة في النموذج.
  const [form, setForm] = useState<NewBook>(EMPTY);
  // EN: true while waiting for the server (disables the button).
  // AR: true أثناء انتظار السيرفر (يعطّل الزر).
  const [saving, setSaving] = useState(false);

  // EN: Runs when the form is submitted.
  // AR: تعمل عند إرسال النموذج.
  async function handleSubmit(e: FormEvent) {
    // EN: Stop the browser from reloading the page (its default behavior).
    // AR: نمنع المتصفح من إعادة تحميل الصفحة (سلوكه الافتراضي).
    e.preventDefault();
    setSaving(true);
    try {
      // EN: Let the parent call the API.
      // AR: نترك المكوّن الأب يتصل بالـ API.
      await onAdd(form);
      // EN: Success → clear the form.
      // AR: نجاح → نفرّغ النموذج.
      setForm(EMPTY);
    } catch {
      // EN: Failed → keep the typed text so the user can fix it.
      //     (App already shows the error message.)
      // AR: فشل → نحتفظ بالنص المكتوب حتى يصلحه المستخدم.
      //     (المكوّن App يعرض رسالة الخطأ بالفعل.)
    } finally {
      // EN: Always re-enable the button, success or error.
      // AR: نعيد تفعيل الزر دائماً، سواء نجح أو فشل.
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Add a book</h2>
      {/* EN: Each input shows form.x and updates it on every key press.
          AR: كل حقل يعرض form.x ويحدّثه مع كل ضغطة مفتاح. */}
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        placeholder="Author"
        value={form.author}
        onChange={(e) => setForm({ ...form, author: e.target.value })}
      />
      <input
        placeholder="Genre"
        value={form.genre}
        onChange={(e) => setForm({ ...form, genre: e.target.value })}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(e) => setForm({ ...form, available: e.target.checked })}
        />
        Available for quizzes
      </label>
      {/* EN: type="submit" triggers onSubmit of the form.
          AR: type="submit" يشغّل onSubmit الخاص بالنموذج. */}
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Add book"}
      </button>
    </form>
  );
}
