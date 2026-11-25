-- =====================================================================
-- File: 01_schema.sql
-- EN: Creates the 4 tables of the Book Quiz database.
-- AR: ينشئ الجداول الأربعة لقاعدة بيانات مسابقات الكتب.
--
--   books ──< questions          (one book has many questions)
--     │                          (كتاب واحد له أسئلة كثيرة)
--     └────< attempts >── players (a player attempts a book's quiz many times)
--                                 (اللاعب يحاول مسابقة الكتاب عدة مرات)
-- =====================================================================

-- EN: Drop old tables first so the script can run again from zero.
--     Children first (they depend on parents). CASCADE removes dependents.
-- AR: نحذف الجداول القديمة أولاً حتى يمكن تشغيل الملف من جديد.
--     نحذف الأبناء قبل الآباء. CASCADE يحذف ما يعتمد عليها.
DROP TABLE IF EXISTS attempts, questions, players, books CASCADE;

-- ---------------------------------------------------------------------
-- 1) books — the book catalog (same fields as our Express API)
--    الكتب — قائمة الكتب (نفس حقول الـ API)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 2) players — people who take the quizzes
--    اللاعبون — الأشخاص الذين يشاركون في المسابقات
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3) questions — quiz questions for each book (written by AI)
--    الأسئلة — أسئلة المسابقة لكل كتاب (يكتبها الذكاء الاصطناعي)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4) attempts — one row each time a player takes a book's quiz
--    المحاولات — سجل لكل مرة يشارك فيها لاعب في مسابقة كتاب
-- ---------------------------------------------------------------------
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
