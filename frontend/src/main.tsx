// =====================================================================
// File: src/main.tsx
// EN: Entry point: puts the <App /> component inside <div id="root">.
// AR: نقطة البداية: يضع المكوّن <App /> داخل ‎<div id="root">‎.
// =====================================================================

// EN: StrictMode shows extra warnings during development only.
// AR: StrictMode يعرض تحذيرات إضافية أثناء التطوير فقط.
import { StrictMode } from "react";
// EN: createRoot connects React to a real HTML element.
// AR: createRoot يربط React بعنصر HTML حقيقي.
import { createRoot } from "react-dom/client";
import App from "./App";
// EN: Global styles for the whole page.
// AR: التنسيقات العامة للصفحة كلها.
import "./styles.css";

// EN: "!" tells TypeScript: trust me, #root exists in index.html.
// AR: علامة "!" تخبر TypeScript: العنصر ‎#root‎ موجود في index.html.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
