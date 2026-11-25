-- =====================================================================
-- File: 03_constraints_test.sql
-- EN: Every statement here SHOULD FAIL. Each error proves one
--     constraint (PK, FK, UNIQUE, CHECK, NOT NULL) protects the data.
-- AR: كل أمر هنا يجب أن يفشل. كل خطأ يثبت أن قيداً واحداً
--     (PK أو FK أو UNIQUE أو CHECK أو NOT NULL) يحمي البيانات.
-- =====================================================================

-- EN: 1) PRIMARY KEY is generated: we can't choose the id ourselves.
-- AR: 1) المفتاح الأساسي يُولَّد تلقائياً: لا يمكننا اختيار المعرّف بأنفسنا.
INSERT INTO books (book_id, title, author, genre) VALUES (1, 'Copy', 'X', 'Y');

-- EN: 2) UNIQUE (title, author): the same book can't be added twice.
-- AR: 2) UNIQUE (العنوان، المؤلف): لا يمكن إضافة نفس الكتاب مرتين.
INSERT INTO books (title, author, genre) VALUES ('Dune', 'Frank Herbert', 'Novel');

-- EN: 3) CHECK: a title made of spaces only is rejected.
-- AR: 3) CHECK: العنوان المكوّن من مسافات فقط مرفوض.
INSERT INTO books (title, author, genre) VALUES ('   ', 'X', 'Y');

-- EN: 4) NOT NULL: author is required.
-- AR: 4) NOT NULL: المؤلف إجباري.
INSERT INTO books (title, genre) VALUES ('No Author', 'Y');

-- EN: 5) UNIQUE username.
-- AR: 5) اسم المستخدم فريد.
INSERT INTO players (username, email) VALUES ('sara_books', 'other@example.com');

-- EN: 6) CHECK email format.
-- AR: 6) CHECK على شكل البريد.
INSERT INTO players (username, email) VALUES ('new_player', 'not-an-email');

-- EN: 7) FOREIGN KEY: a question for a book that doesn't exist (book 999).
-- AR: 7) مفتاح أجنبي: سؤال لكتاب غير موجود (الكتاب 999).
INSERT INTO questions (book_id, question_text, correct_answer) VALUES (999, 'Q?', 'A');

-- EN: 8) CHECK: difficulty must be easy / medium / hard.
-- AR: 8) CHECK: الصعوبة يجب أن تكون easy أو medium أو hard.
INSERT INTO questions (book_id, question_text, correct_answer, difficulty) VALUES (1, 'Q?', 'A', 'super-hard');

-- EN: 9) Table CHECK: score can't be higher than total_questions.
-- AR: 9) CHECK على الجدول: النتيجة لا تتجاوز عدد الأسئلة.
INSERT INTO attempts (player_id, book_id, total_questions, score) VALUES (1, 1, 2, 5);

-- EN: 10) ON DELETE RESTRICT: can't delete a book that has attempts.
-- AR: 10) ON DELETE RESTRICT: لا يمكن حذف كتاب لديه محاولات.
DELETE FROM books WHERE book_id = 5;

-- EN: Proof that nothing above changed the data:
-- AR: دليل أن لا شيء مما سبق غيّر البيانات:
SELECT (SELECT count(*) FROM books)     AS books,
       (SELECT count(*) FROM players)   AS players,
       (SELECT count(*) FROM questions) AS questions,
       (SELECT count(*) FROM attempts)  AS attempts;
