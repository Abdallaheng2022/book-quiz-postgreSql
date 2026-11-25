// =====================================================================
// File: src/models/book.model.ts
// EN: The MODEL describes the shape of one Book in our system.
// AR: النموذج (Model) يصف شكل الكتاب الواحد في نظامنا.
// =====================================================================

// EN: "interface" is a TypeScript type: it only exists while coding,
//     to help the editor catch mistakes. It does not run.
// AR: "interface" هي نوع في TypeScript: موجودة فقط أثناء كتابة الكود
//     لمساعدة المحرر على اكتشاف الأخطاء، ولا تعمل وقت التشغيل.
export interface Book {
  // EN: Unique identifier, generated automatically (a UUID string).
  // AR: معرّف فريد يُنشأ تلقائياً (نص بصيغة UUID).
  id: string;

  // EN: The book title, e.g. "Clean Code".
  // AR: عنوان الكتاب، مثل "Clean Code".
  title: string;

  // EN: The author's name.
  // AR: اسم المؤلف.
  author: string;

  // EN: The category of the book, e.g. "Programming", "Novel".
  // AR: تصنيف الكتاب، مثل "برمجة" أو "رواية".
  genre: string;

  // EN: true = the book can be used in a quiz / borrowed; false = not now.
  // AR: true = الكتاب متاح للاستخدام في مسابقة/للإعارة، false = غير متاح حالياً.
  available: boolean;
}
