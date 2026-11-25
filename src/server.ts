// =====================================================================
// File: src/server.ts
// EN: Entry point: the file we run. It only STARTS the server.
//     (Keeping app.ts separate makes automated testing easy later.)
// AR: نقطة البداية: الملف الذي نشغّله. وظيفته فقط تشغيل السيرفر.
//     (فصل app.ts عنه يجعل الاختبار الآلي سهلاً لاحقاً.)
// =====================================================================

// EN: Validated settings (loading this file checks .env first).
// AR: الإعدادات المُتحقق منها (استيراد هذا الملف يفحص .env أولاً).
import { env } from "./config/env.js";

// EN: The configured Express app.
// AR: تطبيق Express الجاهز.
import { app } from "./app.js";

// EN: Start listening for HTTP requests on the chosen port.
// AR: نبدأ الاستماع لطلبات HTTP على المنفذ المحدد.
app.listen(env.PORT, () => {
  // EN: This callback runs once the server is ready.
  // AR: هذه الدالة تعمل مرة واحدة عندما يصبح السيرفر جاهزاً.
  console.log(`📚 Book API running at http://localhost:${env.PORT}`);
});
