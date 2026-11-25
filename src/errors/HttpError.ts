// =====================================================================
// File: src/errors/HttpError.ts
// EN: A custom error that also carries an HTTP status code (404, 400...).
// AR: خطأ مخصص يحمل معه رمز حالة HTTP (مثل 404 أو 400).
// =====================================================================

// EN: "extends Error" = our class is a normal JavaScript Error + extra data.
// AR: "extends Error" = صنفنا هو خطأ JavaScript عادي + بيانات إضافية.
export class HttpError extends Error {
  // EN: The constructor runs when we write: new HttpError(404, "Book not found")
  // AR: الدالة البانية تعمل عندما نكتب: new HttpError(404, "Book not found")
  constructor(
    // EN: "public readonly" = save it as a property that can't be changed later.
    // AR: "public readonly" = نحفظه كخاصية لا يمكن تغييرها لاحقاً.
    public readonly statusCode: number,
    // EN: The human-readable error message.
    // AR: رسالة الخطأ المفهومة للبشر.
    message: string,
    // EN: Optional extra details (e.g. which fields failed validation).
    // AR: تفاصيل إضافية اختيارية (مثل الحقول التي فشل التحقق منها).
    public readonly details?: unknown,
  ) {
    // EN: Pass the message to the parent Error class.
    // AR: نمرر الرسالة إلى صنف Error الأب.
    super(message);
    // EN: Give the error a clear name for logs.
    // AR: نعطي الخطأ اسماً واضحاً يظهر في السجلات.
    this.name = "HttpError";
  }
}
