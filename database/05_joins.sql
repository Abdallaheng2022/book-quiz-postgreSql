-- =====================================================================
-- File: 05_joins.sql
-- EN: JOIN combines rows from several tables using the foreign keys.
-- AR: JOIN يدمج صفوفاً من عدة جداول باستخدام المفاتيح الأجنبية.
-- =====================================================================

-- ---------------------------------------------------------------------
-- EN: 1) INNER JOIN (3 tables): the 5 latest attempts with the player's
--        name, the book title and the score as a percentage.
--        INNER = only rows that match in ALL tables.
-- AR: 1) INNER JOIN (3 جداول): آخر 5 محاولات مع اسم اللاعب وعنوان
--        الكتاب والنتيجة كنسبة مئوية.
--        INNER = الصفوف المتطابقة في كل الجداول فقط.
-- ---------------------------------------------------------------------
SELECT a.attempt_id,
       p.username,
       b.title,
       a.score || '/' || a.total_questions               AS score,
       round(100.0 * a.score / a.total_questions)         AS percent,
       to_char(a.attempted_at AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD HH24:MI') AS attempted_at
FROM attempts a                                    -- EN: "a" is a short alias | AR: "a" اسم مختصر
JOIN players  p ON p.player_id = a.player_id       -- EN: FK attempts → players
JOIN books    b ON b.book_id   = a.book_id         -- EN: FK attempts → books
ORDER BY a.attempted_at DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- EN: 2) LEFT JOIN: EVERY book with its number of questions,
--        including books with 0 questions (Deep Work).
--        LEFT = keep all rows of the left table, even without a match.
-- AR: 2) LEFT JOIN: كل كتاب مع عدد أسئلته، حتى الكتب التي ليس لها
--        أسئلة (Deep Work).
--        LEFT = نحتفظ بكل صفوف الجدول الأيسر حتى لو لم يوجد تطابق.
-- ---------------------------------------------------------------------
SELECT b.book_id,
       b.title,
       count(q.question_id) AS questions     -- EN: counts only real matches | AR: يعدّ التطابقات الحقيقية فقط
FROM books b
LEFT JOIN questions q ON q.book_id = b.book_id
GROUP BY b.book_id, b.title
ORDER BY b.book_id;

-- ---------------------------------------------------------------------
-- EN: 3) LEFT JOIN + IS NULL: players who never played (no attempts).
-- AR: 3) LEFT JOIN مع IS NULL: لاعبون لم يلعبوا أبداً (بدون محاولات).
-- ---------------------------------------------------------------------
SELECT p.player_id, p.username
FROM players p
LEFT JOIN attempts a ON a.player_id = p.player_id
WHERE a.attempt_id IS NULL;
