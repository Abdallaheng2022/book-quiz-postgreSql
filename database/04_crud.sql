-- =====================================================================
-- File: 04_crud.sql
-- EN: Create, Read, Update, Delete on the books table.
--     RETURNING shows the affected row right away (no extra SELECT).
-- AR: الإنشاء والقراءة والتحديث والحذف على جدول الكتب.
--     RETURNING يعرض السجل المتأثر مباشرةً (بدون SELECT إضافي).
-- =====================================================================

-- EN: CREATE — add a new book. book_id, available, created_at are automatic.
-- AR: إنشاء — إضافة كتاب جديد. book_id و available و created_at تلقائية.
INSERT INTO books (title, author, genre)
VALUES ('The Alchemist', 'Paulo Coelho', 'Novel')
RETURNING book_id, title, author, genre, available;

-- EN: READ — all novels, sorted by title.
-- AR: قراءة — كل الروايات مرتبة حسب العنوان.
SELECT book_id, title, author
FROM books
WHERE genre = 'Novel'
ORDER BY title;

-- EN: READ — one book by its primary key.
-- AR: قراءة — كتاب واحد بمفتاحه الأساسي.
SELECT book_id, title, author, genre, available
FROM books
WHERE title = 'The Alchemist';

-- EN: UPDATE — change only the fields we want (like PATCH in the API).
-- AR: تحديث — نغيّر الحقول المطلوبة فقط (مثل PATCH في الـ API).
UPDATE books
SET genre = 'Fiction', available = FALSE
WHERE title = 'The Alchemist'
RETURNING book_id, title, genre, available;

-- EN: DELETE — remove the book (allowed: it has no attempts).
-- AR: حذف — نحذف الكتاب (مسموح: ليس له محاولات).
DELETE FROM books
WHERE title = 'The Alchemist'
RETURNING book_id, title;

-- EN: Verify: the book is gone (0 rows).
-- AR: تحقق: الكتاب لم يعد موجوداً (0 صفوف).
SELECT count(*) AS alchemist_rows FROM books WHERE title = 'The Alchemist';
