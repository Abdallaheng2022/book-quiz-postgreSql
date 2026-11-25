# Test Results — Book Quiz Database (PostgreSQL 16)

Real output of `bash run_all.sh` (psql prints each query, then its result).

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Schema — 4 tables created | `CREATE TABLE` × 4 | ✅ |
| 2 | Sample data (AI-generated) | 12 books, 6 players, 21 questions, 20 attempts | ✅ |
| 3 | Constraints — every statement must FAIL | 10 errors (PK, UNIQUE ×2, CHECK ×4, NOT NULL, FK, ON DELETE RESTRICT), then counts unchanged: 12 / 6 / 21 / 20 | ✅ |
| 4 | CRUD on books | Create → Read → Update → Delete, then 0 rows left | ✅ |
| 5 | JOIN | INNER JOIN of 3 tables; LEFT JOIN shows Deep Work with 0 questions; mona_k never played | ✅ |
| 6 | GROUP BY | Leaderboard per player; per-book stats with HAVING; questions per difficulty | ✅ |
| 7 | Pagination | 3 pages of 5 / 5 / 2 books; keyset page 2 = OFFSET page 2 | ✅ |
| 8 | Transaction — COMMIT and ROLLBACK | A: book + 2 questions saved. B: error → ROLLBACK → book NOT saved (0). C: manual ROLLBACK restores 4 attempts | ✅ |
| 9 | Index — EXPLAIN ANALYZE before / after | Before: Seq Scan + Sort. After: Index Scan on idx_attempts_player_time, much faster | ✅ |

---

## 1. Schema — 4 tables created

**Expected:** `CREATE TABLE` × 4

```text
DROP TABLE IF EXISTS attempts, questions, players, books CASCADE;
DROP TABLE
CREATE TABLE books (
    -- EN: PRIMARY KEY: unique id, generated automatically (1, 2, 3...).
    -- AR: المفتاح الأساسي: معرّف فريد يُنشأ تلقائياً (1، 2، 3...).
    book_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- EN: NOT NULL = required. CHECK rejects empty or spaces-only text.
    -- AR: NOT NULL = إجباري. CHECK يرفض النص الفارغ أو المسافات فقط.
    title       VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
    author      VARCHAR(120) NOT NULL CHECK (length(trim(author)) > 0),
    genre       VARCHAR(60)  NOT NULL CHECK (length(trim(genre)) > 0),
    -- EN: DEFAULT: if not given, the book is available.
    -- AR: DEFAULT: إذا لم تُحدد القيمة يكون الكتاب متاحاً.
    available   BOOLEAN      NOT NULL DEFAULT TRUE,
    -- EN: When the row was created (filled automatically).
    -- AR: وقت إنشاء السجل (يُملأ تلقائياً).
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- EN: UNIQUE: the same title by the same author can't be added twice.
    -- AR: UNIQUE: لا يمكن إضافة نفس العنوان لنفس المؤلف مرتين.
    CONSTRAINT books_title_author_unique UNIQUE (title, author)
);
CREATE TABLE
CREATE TABLE players (
    -- EN: PRIMARY KEY.
    -- AR: المفتاح الأساسي.
    player_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- EN: UNIQUE + length between 3 and 30 characters.
    -- AR: فريد + الطول بين 3 و 30 حرفاً.
    username    VARCHAR(30)  NOT NULL UNIQUE CHECK (length(username) BETWEEN 3 AND 30),
    -- EN: UNIQUE email, must look like an email (contains @ and a dot after it).
    -- AR: بريد فريد، ويجب أن يكون بشكل بريد (فيه @ ونقطة بعدها).
    email       VARCHAR(255) NOT NULL UNIQUE CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    -- EN: Registration time.
    -- AR: وقت التسجيل.
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TABLE
CREATE TABLE questions (
    -- EN: PRIMARY KEY.
    -- AR: المفتاح الأساسي.
    question_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- EN: FOREIGN KEY → books. ON DELETE CASCADE: deleting a book
    --     deletes its questions too (questions mean nothing without the book).
    -- AR: مفتاح أجنبي ← books. ON DELETE CASCADE: حذف الكتاب
    --     يحذف أسئلته أيضاً (الأسئلة بلا معنى بدون الكتاب).
    book_id        INTEGER NOT NULL REFERENCES books (book_id) ON DELETE CASCADE,
    -- EN: The question and its correct answer (required, not empty).
    -- AR: نص السؤال وإجابته الصحيحة (إجباريان وغير فارغين).
    question_text  TEXT NOT NULL CHECK (length(trim(question_text)) > 0),
    correct_answer TEXT NOT NULL CHECK (length(trim(correct_answer)) > 0),
    -- EN: Only these 3 values are allowed.
    -- AR: يُسمح بهذه القيم الثلاث فقط.
    difficulty     VARCHAR(10) NOT NULL DEFAULT 'medium'
                   CHECK (difficulty IN ('easy', 'medium', 'hard')),
    -- EN: Who wrote the question: 'ai' or 'human'.
    -- AR: من كتب السؤال: الذكاء الاصطناعي 'ai' أو إنسان 'human'.
    created_by     VARCHAR(10) NOT NULL DEFAULT 'ai'
                   CHECK (created_by IN ('ai', 'human'))
);
CREATE TABLE
CREATE TABLE attempts (
    -- EN: PRIMARY KEY.
    -- AR: المفتاح الأساسي.
    attempt_id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- EN: FOREIGN KEY → players. Deleting a player deletes their attempts.
    -- AR: مفتاح أجنبي ← players. حذف اللاعب يحذف محاولاته.
    player_id       INTEGER NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    -- EN: FOREIGN KEY → books. ON DELETE RESTRICT: you CAN'T delete a book
    --     that players already have scores on (protects the history).
    -- AR: مفتاح أجنبي ← books. ON DELETE RESTRICT: لا يمكن حذف كتاب
    --     لديه نتائج لاعبين (لحماية السجل).
    book_id         INTEGER NOT NULL REFERENCES books (book_id) ON DELETE RESTRICT,
    -- EN: How many questions were asked (at least 1).
    -- AR: عدد الأسئلة المطروحة (واحد على الأقل).
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    -- EN: Correct answers: from 0 up to total_questions.
    -- AR: عدد الإجابات الصحيحة: من 0 حتى عدد الأسئلة.
    score           INTEGER NOT NULL CHECK (score >= 0),
    -- EN: When the attempt happened.
    -- AR: وقت المحاولة.
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- EN: A table-level CHECK can compare two columns.
    -- AR: قيد CHECK على مستوى الجدول يمكنه مقارنة عمودين.
    CONSTRAINT attempts_score_not_above_total CHECK (score <= total_questions)
);
CREATE TABLE
```

---

## 2. Sample data (AI-generated)

**Expected:** 12 books, 6 players, 21 questions, 20 attempts

```text
INSERT INTO books (title, author, genre, available) VALUES
  ('Clean Code',                            'Robert C. Martin',             'Programming', TRUE),   -- 1
  ('The Pragmatic Programmer',              'Andrew Hunt & David Thomas',   'Programming', TRUE),   -- 2
  ('مقدمة ابن خلدون',                        'ابن خلدون',                     'History',     TRUE),   -- 3
  ('Atomic Habits',                         'James Clear',                  'Self-help',   TRUE),   -- 4
  ('Dune',                                  'Frank Herbert',                'Novel',       TRUE),   -- 5
  ('1984',                                  'George Orwell',                'Novel',       TRUE),   -- 6
  ('الأيام',                                 'طه حسين',                       'Biography',   TRUE),   -- 7
  ('Sapiens',                               'Yuval Noah Harari',            'History',     TRUE),   -- 8
  ('Rich Dad Poor Dad',                     'Robert Kiyosaki',              'Finance',     TRUE),   -- 9
  ('Designing Data-Intensive Applications', 'Martin Kleppmann',             'Programming', FALSE),  -- 10
  ('رجال في الشمس',                          'غسان كنفاني',                   'Novel',       TRUE),   -- 11
  ('Deep Work',                             'Cal Newport',                  'Self-help',   TRUE);
INSERT 0 12
INSERT INTO players (username, email) VALUES
  ('ahmed_reader', 'ahmed@example.com'),   -- 1
  ('sara_books',   'sara@example.com'),    -- 2
  ('omar_dev',     'omar@example.com'),    -- 3
  ('layla_quiz',   'layla@example.com'),   -- 4
  ('yusuf99',      'yusuf@example.com'),   -- 5
  ('mona_k',       'mona@example.com');
INSERT 0 6
INSERT INTO questions (book_id, question_text, correct_answer, difficulty) VALUES
  (1,  'According to Clean Code, how many things should a function do?', 'One thing', 'easy'),
  (1,  'What does the "Boy Scout Rule" say?', 'Leave the code cleaner than you found it', 'medium'),
  (2,  'What does DRY stand for?', 'Don''t Repeat Yourself', 'easy'),
  (2,  'What is "rubber duck debugging"?', 'Explaining your code out loud to find the bug', 'medium'),
  (3,  'ما المفهوم الذي يفسّر به ابن خلدون قيام الدول وسقوطها؟', 'العصبية', 'medium'),
  (3,  'في أي قرن ميلادي كُتبت المقدمة؟', 'القرن الرابع عشر', 'hard'),
  (4,  'What are the four laws of behavior change?', 'Make it obvious, attractive, easy and satisfying', 'medium'),
  (4,  'How much better does the book suggest getting each day?', '1%', 'easy'),
  (5,  'What is the name of the desert planet?', 'Arrakis', 'easy'),
  (5,  'What is the most valuable substance on the planet called?', 'The spice (melange)', 'easy'),
  (5,  'What are the native people of the desert planet called?', 'Fremen', 'medium'),
  (6,  'Who is the leader of the Party?', 'Big Brother', 'easy'),
  (6,  'What is the name of the Party''s official language?', 'Newspeak', 'medium'),
  (6,  'Who is the main character?', 'Winston Smith', 'easy'),
  (7,  'ما الذي فقده طه حسين في طفولته؟', 'البصر', 'easy'),
  (7,  'في أي بلد أوروبي أكمل طه حسين دراسته؟', 'فرنسا', 'medium'),
  (8,  'Which revolution, about 70,000 years ago, starts the story?', 'The Cognitive Revolution', 'medium'),
  (9,  'According to the book, what does an asset do?', 'Puts money in your pocket', 'easy'),
  (10, 'What are the three main concerns in chapter 1?', 'Reliability, scalability and maintainability', 'hard'),
  (11, 'أين اختبأ الرجال لعبور الحدود؟', 'داخل خزان شاحنة مياه', 'medium'),
  (11, 'إلى أي بلد كان الرجال يحاولون الوصول؟', 'الكويت', 'medium');
INSERT 0 21
INSERT INTO attempts (player_id, book_id, total_questions, score, attempted_at) VALUES
  (1, 1,  2, 2, '2026-11-01 10:00+03'),
  (1, 3,  2, 1, '2026-11-02 11:00+03'),
  (1, 5,  3, 3, '2026-11-05 20:00+03'),
  (1, 6,  3, 2, '2026-11-09 21:00+03'),
  (2, 4,  2, 2, '2026-11-01 09:30+03'),
  (2, 5,  3, 2, '2026-11-03 18:00+03'),
  (2, 7,  2, 2, '2026-11-06 19:00+03'),
  (2, 11, 2, 1, '2026-11-12 22:00+03'),
  (3, 1,  2, 1, '2026-11-02 08:00+03'),
  (3, 1,  2, 2, '2026-11-04 08:30+03'),   -- omar retried Clean Code | عمر أعاد المحاولة
  (3, 2,  2, 2, '2026-11-07 13:00+03'),
  (3, 10, 1, 0, '2026-11-10 14:00+03'),
  (4, 5,  3, 1, '2026-11-03 16:00+03'),
  (4, 6,  3, 3, '2026-11-08 17:00+03'),
  (4, 8,  1, 1, '2026-11-11 12:00+03'),
  (4, 9,  1, 1, '2026-11-13 12:30+03'),
  (5, 3,  2, 2, '2026-11-04 15:00+03'),
  (5, 7,  2, 1, '2026-11-09 10:00+03'),
  (5, 11, 2, 2, '2026-11-14 11:00+03'),
  (5, 5,  3, 2, '2026-11-15 20:30+03');
INSERT 0 20
```

---

## 3. Constraints — every statement must FAIL

**Expected:** 10 errors (PK, UNIQUE ×2, CHECK ×4, NOT NULL, FK, ON DELETE RESTRICT), then counts unchanged: 12 / 6 / 21 / 20

```text
INSERT INTO books (book_id, title, author, genre) VALUES (1, 'Copy', 'X', 'Y');
psql:03_constraints_test.sql:11: ERROR:  cannot insert a non-DEFAULT value into column "book_id"
DETAIL:  Column "book_id" is an identity column defined as GENERATED ALWAYS.
HINT:  Use OVERRIDING SYSTEM VALUE to override.
INSERT INTO books (title, author, genre) VALUES ('Dune', 'Frank Herbert', 'Novel');
psql:03_constraints_test.sql:15: ERROR:  duplicate key value violates unique constraint "books_title_author_unique"
DETAIL:  Key (title, author)=(Dune, Frank Herbert) already exists.
INSERT INTO books (title, author, genre) VALUES ('   ', 'X', 'Y');
psql:03_constraints_test.sql:19: ERROR:  new row for relation "books" violates check constraint "books_title_check"
DETAIL:  Failing row contains (14,    , X, Y, t, 2026-11-25 13:06:45.045809+00).
INSERT INTO books (title, genre) VALUES ('No Author', 'Y');
psql:03_constraints_test.sql:23: ERROR:  null value in column "author" of relation "books" violates not-null constraint
DETAIL:  Failing row contains (15, No Author, null, Y, t, 2026-11-25 13:06:45.046083+00).
INSERT INTO players (username, email) VALUES ('sara_books', 'other@example.com');
psql:03_constraints_test.sql:27: ERROR:  duplicate key value violates unique constraint "players_username_key"
DETAIL:  Key (username)=(sara_books) already exists.
INSERT INTO players (username, email) VALUES ('new_player', 'not-an-email');
psql:03_constraints_test.sql:31: ERROR:  new row for relation "players" violates check constraint "players_email_check"
DETAIL:  Failing row contains (8, new_player, not-an-email, 2026-11-25 13:06:45.046694+00).
INSERT INTO questions (book_id, question_text, correct_answer) VALUES (999, 'Q?', 'A');
psql:03_constraints_test.sql:35: ERROR:  insert or update on table "questions" violates foreign key constraint "questions_book_id_fkey"
DETAIL:  Key (book_id)=(999) is not present in table "books".
INSERT INTO questions (book_id, question_text, correct_answer, difficulty) VALUES (1, 'Q?', 'A', 'super-hard');
psql:03_constraints_test.sql:39: ERROR:  new row for relation "questions" violates check constraint "questions_difficulty_check"
DETAIL:  Failing row contains (23, 1, Q?, A, super-hard, ai).
INSERT INTO attempts (player_id, book_id, total_questions, score) VALUES (1, 1, 2, 5);
psql:03_constraints_test.sql:43: ERROR:  new row for relation "attempts" violates check constraint "attempts_score_not_above_total"
DETAIL:  Failing row contains (21, 1, 1, 2, 5, 2026-11-25 13:06:45.047766+00).
DELETE FROM books WHERE book_id = 5;
psql:03_constraints_test.sql:47: ERROR:  update or delete on table "books" violates foreign key constraint "attempts_book_id_fkey" on table "attempts"
DETAIL:  Key (book_id)=(5) is still referenced from table "attempts".
SELECT (SELECT count(*) FROM books)     AS books,
       (SELECT count(*) FROM players)   AS players,
       (SELECT count(*) FROM questions) AS questions,
       (SELECT count(*) FROM attempts)  AS attempts;
 books | players | questions | attempts 
-------+---------+-----------+----------
    12 |       6 |        21 |       20
(1 row)
```

---

## 4. CRUD on books

**Expected:** Create → Read → Update → Delete, then 0 rows left

```text
INSERT INTO books (title, author, genre)
VALUES ('The Alchemist', 'Paulo Coelho', 'Novel')
RETURNING book_id, title, author, genre, available;
 book_id |     title     |    author    | genre | available 
---------+---------------+--------------+-------+-----------
      16 | The Alchemist | Paulo Coelho | Novel | t
(1 row)

INSERT 0 1
SELECT book_id, title, author
FROM books
WHERE genre = 'Novel'
ORDER BY title;
 book_id |     title     |    author     
---------+---------------+---------------
       6 | 1984          | George Orwell
       5 | Dune          | Frank Herbert
      16 | The Alchemist | Paulo Coelho
      11 | رجال في الشمس | غسان كنفاني
(4 rows)

SELECT book_id, title, author, genre, available
FROM books
WHERE title = 'The Alchemist';
 book_id |     title     |    author    | genre | available 
---------+---------------+--------------+-------+-----------
      16 | The Alchemist | Paulo Coelho | Novel | t
(1 row)

UPDATE books
SET genre = 'Fiction', available = FALSE
WHERE title = 'The Alchemist'
RETURNING book_id, title, genre, available;
 book_id |     title     |  genre  | available 
---------+---------------+---------+-----------
      16 | The Alchemist | Fiction | f
(1 row)

UPDATE 1
DELETE FROM books
WHERE title = 'The Alchemist'
RETURNING book_id, title;
 book_id |     title     
---------+---------------
      16 | The Alchemist
(1 row)

DELETE 1
SELECT count(*) AS alchemist_rows FROM books WHERE title = 'The Alchemist';
 alchemist_rows 
----------------
              0
(1 row)
```

---

## 5. JOIN

**Expected:** INNER JOIN of 3 tables; LEFT JOIN shows Deep Work with 0 questions; mona_k never played

```text
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
 attempt_id |  username  |       title       | score | percent |   attempted_at   
------------+------------+-------------------+-------+---------+------------------
         20 | yusuf99    | Dune              | 2/3   |      67 | 2026-11-15 20:30
         19 | yusuf99    | رجال في الشمس     | 2/2   |     100 | 2026-11-14 11:00
         16 | layla_quiz | Rich Dad Poor Dad | 1/1   |     100 | 2026-11-13 12:30
          8 | sara_books | رجال في الشمس     | 1/2   |      50 | 2026-11-12 22:00
         15 | layla_quiz | Sapiens           | 1/1   |     100 | 2026-11-11 12:00
(5 rows)

SELECT b.book_id,
       b.title,
       count(q.question_id) AS questions     -- EN: counts only real matches | AR: يعدّ التطابقات الحقيقية فقط
FROM books b
LEFT JOIN questions q ON q.book_id = b.book_id
GROUP BY b.book_id, b.title
ORDER BY b.book_id;
 book_id |                 title                 | questions 
---------+---------------------------------------+-----------
       1 | Clean Code                            |         2
       2 | The Pragmatic Programmer              |         2
       3 | مقدمة ابن خلدون                       |         2
       4 | Atomic Habits                         |         2
       5 | Dune                                  |         3
       6 | 1984                                  |         3
       7 | الأيام                                |         2
       8 | Sapiens                               |         1
       9 | Rich Dad Poor Dad                     |         1
      10 | Designing Data-Intensive Applications |         1
      11 | رجال في الشمس                         |         2
      12 | Deep Work                             |         0
(12 rows)

SELECT p.player_id, p.username
FROM players p
LEFT JOIN attempts a ON a.player_id = p.player_id
WHERE a.attempt_id IS NULL;
 player_id | username 
-----------+----------
         6 | mona_k
(1 row)
```

---

## 6. GROUP BY

**Expected:** Leaderboard per player; per-book stats with HAVING; questions per difficulty

```text
SELECT p.username,
       count(*)                                               AS attempts,
       sum(a.score)                                           AS correct_answers,
       sum(a.total_questions)                                 AS questions_asked,
       round(100.0 * sum(a.score) / sum(a.total_questions), 1) AS accuracy_percent
FROM attempts a
JOIN players p ON p.player_id = a.player_id
GROUP BY p.username
ORDER BY accuracy_percent DESC, correct_answers DESC;
   username   | attempts | correct_answers | questions_asked | accuracy_percent 
--------------+----------+-----------------+-----------------+------------------
 ahmed_reader |        4 |               8 |              10 |             80.0
 yusuf99      |        4 |               7 |               9 |             77.8
 sara_books   |        4 |               7 |               9 |             77.8
 layla_quiz   |        4 |               6 |               8 |             75.0
 omar_dev     |        4 |               5 |               7 |             71.4
(5 rows)

SELECT b.title,
       count(*)                                               AS attempts,
       count(DISTINCT a.player_id)                            AS players,
       round(100.0 * sum(a.score) / sum(a.total_questions), 1) AS avg_percent
FROM attempts a
JOIN books b ON b.book_id = a.book_id
GROUP BY b.title
HAVING count(*) >= 2
ORDER BY attempts DESC, avg_percent DESC;
      title      | attempts | players | avg_percent 
-----------------+----------+---------+-------------
 Dune            |        4 |       4 |        66.7
 Clean Code      |        3 |       2 |        83.3
 1984            |        2 |       2 |        83.3
 الأيام          |        2 |       2 |        75.0
 رجال في الشمس   |        2 |       2 |        75.0
 مقدمة ابن خلدون |        2 |       2 |        75.0
(6 rows)

SELECT difficulty, count(*) AS questions
FROM questions
GROUP BY difficulty
ORDER BY questions DESC;
 difficulty | questions 
------------+-----------
 medium     |        10
 easy       |         9
 hard       |         2
(3 rows)
```

---

## 7. Pagination

**Expected:** 3 pages of 5 / 5 / 2 books; keyset page 2 = OFFSET page 2

```text
SELECT count(*) AS total_books,
       ceil(count(*) / 5.0) AS total_pages
FROM books;
 total_books | total_pages 
-------------+-------------
          12 |           3
(1 row)

SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 0;
 book_id |          title           
---------+--------------------------
       1 | Clean Code
       2 | The Pragmatic Programmer
       3 | مقدمة ابن خلدون
       4 | Atomic Habits
       5 | Dune
(5 rows)

SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 5;
 book_id |                 title                 
---------+---------------------------------------
       6 | 1984
       7 | الأيام
       8 | Sapiens
       9 | Rich Dad Poor Dad
      10 | Designing Data-Intensive Applications
(5 rows)

SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 10;
 book_id |     title     
---------+---------------
      11 | رجال في الشمس
      12 | Deep Work
(2 rows)

SELECT book_id, title FROM books WHERE book_id > 5 ORDER BY book_id LIMIT 5;
 book_id |                 title                 
---------+---------------------------------------
       6 | 1984
       7 | الأيام
       8 | Sapiens
       9 | Rich Dad Poor Dad
      10 | Designing Data-Intensive Applications
(5 rows)
```

---

## 8. Transaction — COMMIT and ROLLBACK

**Expected:** A: book + 2 questions saved. B: error → ROLLBACK → book NOT saved (0). C: manual ROLLBACK restores 4 attempts

```text
BEGIN;
BEGIN
INSERT INTO books (title, author, genre)
VALUES ('Brave New World', 'Aldous Huxley', 'Novel');
INSERT 0 1
INSERT INTO questions (book_id, question_text, correct_answer, difficulty)
SELECT book_id, q.text, q.answer, q.level
FROM books,
     (VALUES ('What drug keeps citizens happy?', 'Soma', 'easy'),
             ('What is the name of the "Savage"?', 'John', 'medium')) AS q(text, answer, level)
WHERE title = 'Brave New World' AND author = 'Aldous Huxley';
INSERT 0 2
COMMIT;
COMMIT
SELECT b.title, count(q.question_id) AS questions
FROM books b JOIN questions q ON q.book_id = b.book_id
WHERE b.title = 'Brave New World'
GROUP BY b.title;
      title      | questions 
-----------------+-----------
 Brave New World |         2
(1 row)

BEGIN;
BEGIN
INSERT INTO books (title, author, genre)
VALUES ('Fahrenheit 451', 'Ray Bradbury', 'Novel');
INSERT 0 1
INSERT INTO questions (book_id, question_text, correct_answer, difficulty)
SELECT book_id, 'At what temperature does paper burn?', '451 °F', 'super-hard'
FROM books WHERE title = 'Fahrenheit 451';
psql:08_transaction.sql:59: ERROR:  new row for relation "questions" violates check constraint "questions_difficulty_check"
DETAIL:  Failing row contains (26, 18, At what temperature does paper burn?, 451 °F, super-hard, ai).
ROLLBACK;
ROLLBACK
SELECT count(*) AS fahrenheit_rows FROM books WHERE title = 'Fahrenheit 451';
 fahrenheit_rows 
-----------------
               0
(1 row)

SELECT count(*) AS ahmed_attempts_before FROM attempts WHERE player_id = 1;
 ahmed_attempts_before 
-----------------------
                     4
(1 row)

BEGIN;
BEGIN
DELETE FROM attempts WHERE player_id = 1;
DELETE 4
SELECT count(*) AS ahmed_attempts_inside FROM attempts WHERE player_id = 1;
 ahmed_attempts_inside 
-----------------------
                     0
(1 row)

ROLLBACK;
ROLLBACK
SELECT count(*) AS ahmed_attempts_after FROM attempts WHERE player_id = 1;
 ahmed_attempts_after 
----------------------
                    4
(1 row)
```

---

## 9. Index — EXPLAIN ANALYZE before / after

**Expected:** Before: Seq Scan + Sort. After: Index Scan on idx_attempts_player_time, much faster

```text
SELECT setseed(0.42);
 setseed 
---------
 
(1 row)

INSERT INTO players (username, email)
SELECT 'bulk_' || g, 'bulk' || g || '@example.com'
FROM generate_series(1, 2000) AS g;
INSERT 0 2000
INSERT INTO attempts (player_id, book_id, total_questions, score, attempted_at)
SELECT p.player_id,
       1 + floor(random() * 12)::int,                         -- EN: book 1–12
       3,
       floor(random() * 4)::int,                              -- EN: score 0–3
       timestamptz '2026-01-01' + random() * interval '320 days'
FROM generate_series(1, 200000) AS g
JOIN LATERAL (
  SELECT player_id FROM players
  WHERE username = 'bulk_' || (1 + (g % 2000))
) p ON TRUE;
INSERT 0 200000
ANALYZE attempts;
ANALYZE
SELECT count(*) AS total_attempts FROM attempts;
 total_attempts 
----------------
         200020
(1 row)

SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
EXPLAIN ANALYZE
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
                                                              QUERY PLAN                                                              
--------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=3951.31..3952.46 rows=10 width=20) (actual time=6.426..8.326 rows=10 loops=1)
   InitPlan 1 (returns $0)
     ->  Index Scan using players_username_key on players  (cost=0.27..8.29 rows=1 width=4) (actual time=0.017..0.018 rows=1 loops=1)
           Index Cond: ((username)::text = 'bulk_1000'::text)
   ->  Gather Merge  (cost=3943.02..3949.81 rows=59 width=20) (actual time=6.425..8.321 rows=10 loops=1)
         Workers Planned: 1
         Params Evaluated: $0
         Workers Launched: 1
         ->  Sort  (cost=2943.01..2943.16 rows=59 width=20) (actual time=4.798..4.799 rows=8 loops=2)
               Sort Key: attempts.attempted_at DESC
               Sort Method: top-N heapsort  Memory: 26kB
               Worker 0:  Sort Method: top-N heapsort  Memory: 26kB
               ->  Parallel Seq Scan on attempts  (cost=0.00..2941.74 rows=59 width=20) (actual time=0.035..4.768 rows=50 loops=2)
                     Filter: (player_id = $0)
                     Rows Removed by Filter: 99960
 Planning Time: 0.167 ms
 Execution Time: 8.350 ms
(17 rows)

CREATE INDEX idx_attempts_player_time ON attempts (player_id, attempted_at DESC);
CREATE INDEX
ANALYZE attempts;
ANALYZE
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
EXPLAIN ANALYZE
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
                                                                  QUERY PLAN                                                                   
-----------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=8.71..48.08 rows=10 width=20) (actual time=0.012..0.017 rows=10 loops=1)
   InitPlan 1 (returns $0)
     ->  Index Scan using players_username_key on players  (cost=0.27..8.29 rows=1 width=4) (actual time=0.006..0.006 rows=1 loops=1)
           Index Cond: ((username)::text = 'bulk_1000'::text)
   ->  Index Scan using idx_attempts_player_time on attempts  (cost=0.42..394.13 rows=100 width=20) (actual time=0.012..0.015 rows=10 loops=1)
         Index Cond: (player_id = $0)
 Planning Time: 0.051 ms
 Execution Time: 0.026 ms
(8 rows)

SELECT pg_size_pretty(pg_relation_size('idx_attempts_player_time')) AS index_size,
       pg_size_pretty(pg_relation_size('attempts'))                 AS table_size;
 index_size | table_size 
------------+------------
 6184 kB    | 11 MB
(1 row)

DELETE FROM players WHERE username LIKE 'bulk\_%';
DELETE 2000
SELECT count(*) AS attempts_after_cleanup FROM attempts;
 attempts_after_cleanup 
------------------------
                     20
(1 row)
```

