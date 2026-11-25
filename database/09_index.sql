-- =====================================================================
-- File: 09_index.sql
-- EN: Evaluate ONE index with EXPLAIN ANALYZE.
--     Question: "show a player's 10 latest attempts" (profile page).
--     PostgreSQL does NOT index foreign keys automatically, so
--     attempts.player_id has no index yet.
-- AR: تقييم فهرس واحد باستخدام EXPLAIN ANALYZE.
--     الاستعلام: "اعرض آخر 10 محاولات للاعب" (صفحة الملف الشخصي).
--     PostgreSQL لا يفهرس المفاتيح الأجنبية تلقائياً،
--     لذلك العمود attempts.player_id ليس له فهرس بعد.
-- =====================================================================

-- ---------------------------------------------------------------------
-- EN: Step 1: add realistic volume (an index means nothing on 20 rows).
--     2,000 test players and 200,000 attempts. setseed() makes
--     random() give the same numbers on every run.
-- AR: الخطوة 1: نضيف حجماً واقعياً (الفهرس بلا معنى على 20 صفاً).
--     2000 لاعب تجريبي و 200,000 محاولة. setseed() يجعل random()
--     يعطي نفس الأرقام في كل تشغيل.
-- ---------------------------------------------------------------------
SELECT setseed(0.42);

INSERT INTO players (username, email)
SELECT 'bulk_' || g, 'bulk' || g || '@example.com'
FROM generate_series(1, 2000) AS g;

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

-- EN: ANALYZE updates the statistics the query planner uses.
-- AR: ANALYZE يحدّث الإحصائيات التي يستخدمها مخطِّط الاستعلامات.
ANALYZE attempts;

SELECT count(*) AS total_attempts FROM attempts;

-- ---------------------------------------------------------------------
-- EN: Step 2: BEFORE the index. Expect "Seq Scan" = read all 200k rows.
-- AR: الخطوة 2: قبل الفهرس. نتوقع "Seq Scan" = قراءة كل الـ 200 ألف صف.
-- ---------------------------------------------------------------------
-- EN: Warm-up run (not measured): the first run pays one-time costs
--     (loading data into memory), which would make the test unfair.
-- AR: تشغيل تمهيدي (لا نقيسه): أول تشغيل يدفع تكاليف لمرة واحدة
--     (تحميل البيانات إلى الذاكرة)، وهذا يجعل المقارنة غير عادلة.
\o /dev/null
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
\o

EXPLAIN ANALYZE
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- EN: Step 3: create a COMPOSITE index: first player_id (to find the
--     player's rows), then attempted_at DESC (already sorted newest first,
--     so no Sort step is needed).
-- AR: الخطوة 3: ننشئ فهرساً مركّباً: أولاً player_id (لإيجاد صفوف
--     اللاعب)، ثم attempted_at تنازلياً (مرتبة مسبقاً من الأحدث،
--     فلا نحتاج خطوة ترتيب).
-- ---------------------------------------------------------------------
CREATE INDEX idx_attempts_player_time ON attempts (player_id, attempted_at DESC);
ANALYZE attempts;

-- ---------------------------------------------------------------------
-- EN: Step 4: AFTER the index — same query. Expect "Index Scan".
-- AR: الخطوة 4: بعد الفهرس — نفس الاستعلام. نتوقع "Index Scan".
-- ---------------------------------------------------------------------
-- EN: Warm-up run (not measured): the first run pays one-time costs
--     (loading data into memory), which would make the test unfair.
-- AR: تشغيل تمهيدي (لا نقيسه): أول تشغيل يدفع تكاليف لمرة واحدة
--     (تحميل البيانات إلى الذاكرة)، وهذا يجعل المقارنة غير عادلة.
\o /dev/null
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;
\o

EXPLAIN ANALYZE
SELECT attempt_id, book_id, score, attempted_at
FROM attempts
WHERE player_id = (SELECT player_id FROM players WHERE username = 'bulk_1000')
ORDER BY attempted_at DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- EN: Index size on disk (indexes cost space and slow down writes a bit).
-- AR: حجم الفهرس على القرص (الفهارس تأخذ مساحة وتبطئ الكتابة قليلاً).
-- ---------------------------------------------------------------------
SELECT pg_size_pretty(pg_relation_size('idx_attempts_player_time')) AS index_size,
       pg_size_pretty(pg_relation_size('attempts'))                 AS table_size;

-- ---------------------------------------------------------------------
-- EN: Step 5: clean up the test data (CASCADE deletes their attempts).
--     The index stays: it's a good permanent part of the schema.
-- AR: الخطوة 5: نحذف البيانات التجريبية (CASCADE يحذف محاولاتهم).
--     الفهرس يبقى: هو جزء دائم ومفيد من قاعدة البيانات.
-- ---------------------------------------------------------------------
DELETE FROM players WHERE username LIKE 'bulk\_%';
SELECT count(*) AS attempts_after_cleanup FROM attempts;
