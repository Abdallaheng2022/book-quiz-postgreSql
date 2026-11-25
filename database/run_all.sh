#!/usr/bin/env bash
# =====================================================================
# EN: Runs every SQL file in order and saves each output in results/.
#     Usage:  bash run_all.sh            (uses database "book_quiz")
#             DB=mydb bash run_all.sh    (another database name)
# AR: يشغّل كل ملفات SQL بالترتيب ويحفظ نتيجة كل ملف في مجلد results.
#     الاستخدام:  bash run_all.sh         (يستخدم قاعدة "book_quiz")
#                 DB=mydb bash run_all.sh (اسم قاعدة آخر)
# =====================================================================

# EN: Stop if a shell command fails or a variable is missing.
# AR: توقف إذا فشل أمر أو كان متغير غير معرّف.
set -euo pipefail

# EN: Go to the folder of this script, whatever folder we run it from.
# AR: انتقل إلى مجلد هذا الملف، من أي مكان شغّلناه.
cd "$(dirname "$0")"

# EN: Database name (default book_quiz). PGUSER/PGPASSWORD/PGHOST work too.
# AR: اسم القاعدة (الافتراضي book_quiz). يمكن استخدام PGUSER و PGPASSWORD و PGHOST أيضاً.
DB="${DB:-book_quiz}"
mkdir -p results

for file in 0*.sql; do
  echo "▶ $file"
  # EN: -X  ignore personal psql settings      | AR: تجاهل إعدادات psql الشخصية
  #     -e  print each query before its result  | AR: اطبع كل استعلام قبل نتيجته
  #     2>&1 keep error messages in the output  | AR: احتفظ برسائل الأخطاء في الناتج
  #     ON_ERROR_STOP=0: keep going after the EXPECTED errors (03 and 08)
  #     AR: ON_ERROR_STOP=0: أكمل بعد الأخطاء المتوقعة (الملفان 03 و 08)
  psql -X -e -d "$DB" -v ON_ERROR_STOP=0 -f "$file" > "results/${file%.sql}.txt" 2>&1
done

echo "✅ Done. Outputs are in database/results/"
