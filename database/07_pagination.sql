-- =====================================================================
-- File: 07_pagination.sql
-- EN: Pagination = return a big list one "page" at a time.
--     Always use ORDER BY, otherwise pages may repeat or skip rows.
-- AR: التقسيم إلى صفحات = إرجاع قائمة كبيرة صفحةً بعد صفحة.
--     استخدم ORDER BY دائماً، وإلا قد تتكرر الصفوف أو تُفقد بين الصفحات.
-- =====================================================================

-- EN: How many pages? 12 books / 5 per page = 3 pages (ceil rounds up).
-- AR: كم صفحة؟ 12 كتاباً ÷ 5 لكل صفحة = 3 صفحات (ceil يقرّب للأعلى).
SELECT count(*) AS total_books,
       ceil(count(*) / 5.0) AS total_pages
FROM books;

-- ---------------------------------------------------------------------
-- EN: Method 1: LIMIT / OFFSET. OFFSET = (page - 1) * page_size.
-- AR: الطريقة 1: LIMIT / OFFSET. قيمة OFFSET = (رقم الصفحة - 1) × حجم الصفحة.
-- ---------------------------------------------------------------------

-- EN: Page 1 → skip 0.  | AR: الصفحة 1 ← نتخطى 0.
SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 0;

-- EN: Page 2 → skip 5.  | AR: الصفحة 2 ← نتخطى 5.
SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 5;

-- EN: Page 3 → skip 10 (only 2 books left). | AR: الصفحة 3 ← نتخطى 10 (بقي كتابان فقط).
SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 10;

-- ---------------------------------------------------------------------
-- EN: Method 2: KEYSET ("cursor") pagination. Start after the last id
--     of the previous page. Faster on big tables: the database jumps
--     straight there using the primary-key index instead of counting
--     and skipping OFFSET rows.
-- AR: الطريقة 2: التقسيم بالمفتاح (Keyset أو Cursor). نبدأ بعد آخر
--     معرّف في الصفحة السابقة. أسرع في الجداول الكبيرة: القاعدة تقفز
--     مباشرة بفهرس المفتاح الأساسي بدلاً من عدّ صفوف OFFSET وتخطيها.
-- ---------------------------------------------------------------------

-- EN: Page 2 = books after id 5 (the last id on page 1).
-- AR: الصفحة 2 = الكتب بعد المعرّف 5 (آخر معرّف في الصفحة 1).
SELECT book_id, title FROM books WHERE book_id > 5 ORDER BY book_id LIMIT 5;
