// =====================================================================
// File: src/types/book.ts
// EN: The same Book shape the Express API returns.
// AR: نفس شكل الكتاب الذي يُرجعه الـ API.
// =====================================================================

export interface Book {
  // EN: Unique id created by the server.
  // AR: معرّف فريد يُنشئه السيرفر.
  id: string;
  title: string;
  author: string;
  genre: string;
  // EN: true = ready for quizzes.
  // AR: true = جاهز للمسابقات.
  available: boolean;
}

// EN: Data needed to create a book: everything except "id" (Omit removes it).
// AR: البيانات اللازمة لإنشاء كتاب: كل شيء ما عدا "id" (‏Omit يحذفه).
export type NewBook = Omit<Book, "id">;
