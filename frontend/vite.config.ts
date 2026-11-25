// =====================================================================
// File: vite.config.ts
// EN: Settings for Vite, the tool that runs and builds the React app.
// AR: إعدادات Vite، الأداة التي تشغّل تطبيق React وتبنيه.
// =====================================================================

// EN: Helper that gives TypeScript hints for the config object.
// AR: دالة مساعدة تعطي TypeScript تلميحات لكائن الإعدادات.
import { defineConfig } from "vite";

// EN: Plugin that lets Vite understand React (JSX, fast refresh).
// AR: إضافة تجعل Vite يفهم React (JSX والتحديث السريع).
import react from "@vitejs/plugin-react";

export default defineConfig({
  // EN: Enable the React plugin.
  // AR: تفعيل إضافة React.
  plugins: [react()],
  server: {
    // EN: The frontend runs on port 5173.
    // AR: الواجهة تعمل على المنفذ 5173.
    port: 5173,
    // EN: PROXY: any request starting with /api is forwarded to the Express
    //     server on port 3000. The browser thinks it's the same address,
    //     so we don't need CORS on the backend.
    // AR: الوكيل (Proxy): أي طلب يبدأ بـ ‎/api‎ يُحوَّل إلى سيرفر Express على
    //     المنفذ 3000. المتصفح يظن أنه نفس العنوان، فلا نحتاج CORS في السيرفر.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
