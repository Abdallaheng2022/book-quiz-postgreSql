# 🗄️ Book Quiz Database — Session 5 (PostgreSQL)

Players answer AI-written quiz questions about books, and each attempt saves their score.
Tested on PostgreSQL 16. Full output: [`TEST_RESULTS.md`](TEST_RESULTS.md).

## Tables

```
books ──< questions             one book has many questions
  └────< attempts >── players   players play many books; attempts links them
```

| Table | Key columns | Constraints |
|---|---|---|
| `books` | `book_id` PK | title/author/genre `NOT NULL`, not blank; `UNIQUE (title, author)` |
| `players` | `player_id` PK | `UNIQUE` username and email; email format `CHECK` |
| `questions` | `question_id` PK, `book_id` FK | `difficulty IN ('easy','medium','hard')`; deleting a book deletes its questions (`CASCADE`) |
| `attempts` | `attempt_id` PK, `player_id` FK, `book_id` FK | `0 ≤ score ≤ total_questions`; a book with attempts can't be deleted (`RESTRICT`) |

## Run

```bash
createdb book_quiz
cd database
bash run_all.sh          # runs 01–09, saves output to results/
```

Or one file at a time: `psql -d book_quiz -f 01_schema.sql` (always run `01` and `02` first).
On Linux, if you get `Peer authentication failed`, run `sudo -u postgres createuser --superuser $USER` once.

## Examples

**Constraints** (`03`): bad data is rejected.
```sql
INSERT INTO attempts (player_id, book_id, total_questions, score) VALUES (1, 1, 2, 5);
-- ERROR: violates check constraint "attempts_score_not_above_total"
```
All 10 invalid inserts/deletes fail, and the row counts stay the same.

**CRUD** (`04`): `RETURNING` shows the changed row without an extra `SELECT`.
```sql
UPDATE books SET available = FALSE WHERE title = 'The Alchemist'
RETURNING book_id, title, available;
```

**JOIN** (`05`): `LEFT JOIN` keeps books even when they have no questions.
```sql
SELECT b.title, count(q.question_id) AS questions
FROM books b LEFT JOIN questions q ON q.book_id = b.book_id
GROUP BY b.title;
-- "Deep Work" appears with 0 (an INNER JOIN would hide it)
```

**GROUP BY** (`06`): one row per player, as a leaderboard.
```sql
SELECT p.username, round(100.0 * sum(a.score) / sum(a.total_questions), 1) AS accuracy
FROM attempts a JOIN players p USING (player_id)
GROUP BY p.username ORDER BY accuracy DESC;
-- ahmed_reader is first at 80.0
```

**Pagination** (`07`): page 2 with 5 books per page.
```sql
SELECT book_id, title FROM books ORDER BY book_id LIMIT 5 OFFSET 5;   -- skip page 1
SELECT book_id, title FROM books WHERE book_id > 5 ORDER BY book_id LIMIT 5;  -- keyset: faster on big tables
```

**Transaction** (`08`): a book and its questions are saved together, or not at all.
```sql
BEGIN;
INSERT INTO books (title, author, genre) VALUES ('Fahrenheit 451', 'Ray Bradbury', 'Novel');
INSERT INTO questions (...) VALUES (..., 'super-hard');   -- ERROR: invalid difficulty
ROLLBACK;
-- the book was not saved either (0 rows)
```
The `COMMIT` case saves a book with its 2 questions.

## Index evaluation (`09`)

Query: a player's 10 latest attempts, tested on 200,000 rows. PostgreSQL doesn't index foreign keys automatically.

```sql
CREATE INDEX idx_attempts_player_time ON attempts (player_id, attempted_at DESC);
```

| `EXPLAIN ANALYZE` | Before | After |
|---|---|---|
| Plan | Seq Scan + Sort | Index Scan |
| Rows read | ~200,000 | 10 |
| Time | 9.23 ms | 0.025 ms |

`player_id` finds the player's rows, and `attempted_at DESC` keeps them newest-first, so there's no Sort and it stops after 10 rows.
Cost: the index takes 6 MB and slightly slows down inserts. That's worth it, because player history is read far more often than attempts are written.

## AI usage

Built with **Claude (Anthropic)**: table design, schema, sample data and all queries. Every file was run on PostgreSQL 16 and the output checked (`TEST_RESULTS.md`).
Fixed after review: the first "before" timing (401 ms) was mostly one-time warm-up, so each `EXPLAIN ANALYZE` now runs after an unmeasured warm-up query. `09_index.sql` was also made safe to re-run.

