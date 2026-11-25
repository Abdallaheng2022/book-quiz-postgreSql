-- =====================================================================
-- File: 08_transaction.sql
-- EN: A TRANSACTION groups several statements into ONE unit:
--     either ALL succeed (COMMIT) or NONE are saved (ROLLBACK).
--     Real case: a new book must be added TOGETHER with its AI questions.
--     A book without questions can't be used in a quiz.
-- AR: المعاملة (Transaction) تجمع عدة أوامر في وحدة واحدة:
--     إما تنجح كلها (COMMIT) أو لا يُحفظ أي منها (ROLLBACK).
--     حالة حقيقية: الكتاب الجديد يجب أن يُضاف مع أسئلته معاً،
--     فالكتاب بدون أسئلة لا يصلح للمسابقة.
-- =====================================================================

-- =====================================================================
-- EN: Scenario A — COMMIT: everything is valid → saved permanently.
-- AR: السيناريو أ — COMMIT: كل شيء صحيح ← يُحفظ نهائياً.
-- =====================================================================
BEGIN;  -- EN: start the transaction | AR: بداية المعاملة

INSERT INTO books (title, author, genre)
VALUES ('Brave New World', 'Aldous Huxley', 'Novel');

-- EN: Find the new book's id with a subquery (by its unique title+author).
-- AR: نجد معرّف الكتاب الجديد باستعلام فرعي (بالعنوان والمؤلف الفريدين).
INSERT INTO questions (book_id, question_text, correct_answer, difficulty)
SELECT book_id, q.text, q.answer, q.level
FROM books,
     (VALUES ('What drug keeps citizens happy?', 'Soma', 'easy'),
             ('What is the name of the "Savage"?', 'John', 'medium')) AS q(text, answer, level)
WHERE title = 'Brave New World' AND author = 'Aldous Huxley';

COMMIT; -- EN: save both inserts together | AR: نحفظ الإضافتين معاً

-- EN: Verify: the book exists WITH its 2 questions.
-- AR: تحقق: الكتاب موجود مع سؤاليه.
SELECT b.title, count(q.question_id) AS questions
FROM books b JOIN questions q ON q.book_id = b.book_id
WHERE b.title = 'Brave New World'
GROUP BY b.title;

-- =====================================================================
-- EN: Scenario B — ROLLBACK after an ERROR: the 2nd statement fails,
--     so the 1st (the book) must NOT be saved either.
-- AR: السيناريو ب — ROLLBACK بعد خطأ: الأمر الثاني يفشل،
--     لذلك يجب ألا يُحفظ الأول (الكتاب) أيضاً.
-- =====================================================================
BEGIN;

-- EN: Step 1 works on its own...
-- AR: الخطوة 1 تنجح وحدها...
INSERT INTO books (title, author, genre)
VALUES ('Fahrenheit 451', 'Ray Bradbury', 'Novel');

-- EN: Step 2 FAILS: 'super-hard' breaks the difficulty CHECK.
--     After an error PostgreSQL ignores every command until ROLLBACK.
-- AR: الخطوة 2 تفشل: 'super-hard' تخالف قيد CHECK للصعوبة.
--     بعد الخطأ يتجاهل PostgreSQL كل الأوامر حتى ROLLBACK.
INSERT INTO questions (book_id, question_text, correct_answer, difficulty)
SELECT book_id, 'At what temperature does paper burn?', '451 °F', 'super-hard'
FROM books WHERE title = 'Fahrenheit 451';

ROLLBACK; -- EN: undo everything since BEGIN | AR: نلغي كل شيء منذ BEGIN

-- EN: Verify: the book was NOT saved (0 rows) — no half-finished data.
-- AR: تحقق: الكتاب لم يُحفظ (0 صفوف) — لا توجد بيانات ناقصة.
SELECT count(*) AS fahrenheit_rows FROM books WHERE title = 'Fahrenheit 451';

-- =====================================================================
-- EN: Scenario C — manual ROLLBACK: we change our mind (no error).
-- AR: السيناريو ج — ROLLBACK يدوي: غيّرنا رأينا (بدون خطأ).
-- =====================================================================
SELECT count(*) AS ahmed_attempts_before FROM attempts WHERE player_id = 1;

BEGIN;
DELETE FROM attempts WHERE player_id = 1;
-- EN: Inside the transaction the rows look deleted...
-- AR: داخل المعاملة تبدو الصفوف محذوفة...
SELECT count(*) AS ahmed_attempts_inside FROM attempts WHERE player_id = 1;
ROLLBACK;

-- EN: ...but after ROLLBACK they are all back.
-- AR: ...لكن بعد ROLLBACK عادت كلها.
SELECT count(*) AS ahmed_attempts_after FROM attempts WHERE player_id = 1;
