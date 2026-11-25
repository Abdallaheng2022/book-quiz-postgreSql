-- =====================================================================
-- File: 06_group_by.sql
-- EN: GROUP BY puts rows into groups, then aggregate functions
--     (count, sum, avg, max) calculate one value per group.
-- AR: GROUP BY يجمع الصفوف في مجموعات، ثم دوال التجميع
--     (count و sum و avg و max) تحسب قيمة واحدة لكل مجموعة.
-- =====================================================================

-- ---------------------------------------------------------------------
-- EN: 1) Leaderboard: one row per player, best average first.
-- AR: 1) لوحة المتصدرين: صف لكل لاعب، الأعلى متوسطاً أولاً.
-- ---------------------------------------------------------------------
SELECT p.username,
       count(*)                                               AS attempts,
       sum(a.score)                                           AS correct_answers,
       sum(a.total_questions)                                 AS questions_asked,
       round(100.0 * sum(a.score) / sum(a.total_questions), 1) AS accuracy_percent
FROM attempts a
JOIN players p ON p.player_id = a.player_id
GROUP BY p.username
ORDER BY accuracy_percent DESC, correct_answers DESC;

-- ---------------------------------------------------------------------
-- EN: 2) Per book: how popular and how hard?
--        HAVING filters GROUPS (WHERE filters rows before grouping).
--        Here: only books played at least 2 times.
-- AR: 2) لكل كتاب: كم هو مشهور وكم هو صعب؟
--        HAVING يُرشّح المجموعات (WHERE يُرشّح الصفوف قبل التجميع).
--        هنا: الكتب التي لُعبت مرتين على الأقل فقط.
-- ---------------------------------------------------------------------
SELECT b.title,
       count(*)                                               AS attempts,
       count(DISTINCT a.player_id)                            AS players,
       round(100.0 * sum(a.score) / sum(a.total_questions), 1) AS avg_percent
FROM attempts a
JOIN books b ON b.book_id = a.book_id
GROUP BY b.title
HAVING count(*) >= 2
ORDER BY attempts DESC, avg_percent DESC;

-- ---------------------------------------------------------------------
-- EN: 3) Questions by difficulty.
-- AR: 3) عدد الأسئلة حسب الصعوبة.
-- ---------------------------------------------------------------------
SELECT difficulty, count(*) AS questions
FROM questions
GROUP BY difficulty
ORDER BY questions DESC;
