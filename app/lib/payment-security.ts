import crypto from "crypto";
import { z } from "zod";

// Validation schemas for payment data
export const PaymentValidationSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required").max(100),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  currency: z.string().length(3, "Currency must be 3 characters").toUpperCase(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL"], {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  description: z.string().max(500, "Description too long").optional(),
  receiptEmail: z.string().email("Invalid email format").optional(),
});

export const RefundValidationSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required").max(100),
  amount: z.number().positive("Amount must be positive").optional(),
  reason: z.string().max(500, "Reason too long").optional(),
});

export const WebhookValidationSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
  created: z.number(),
});

// Rate limiting configuration
const RATE_LIMITS = {
  PAYMENT_CREATION: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
  REFUND_CREATION: { requests: 5, window: 60 * 1000 }, // 5 requests per minute
  WEBHOOK_PROCESSING: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class PaymentSecurity {
  /**
   * Validate payment data with comprehensive checks
   */
  static validatePaymentData(data: unknown) {
    try {
      return PaymentValidationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw new Error("Invalid payment data");
    }
  }

  /**
   * Validate refund data
   */
  static validateRefundData(data: unknown) {
    try {
      return RefundValidationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw new Error("Invalid refund data");
    }
  }

  /**
   * Validate webhook data
   */
  static validateWebhookData(data: unknown) {
    try {
      return WebhookValidationSchema.parse(data);
    } catch {
      throw new Error("Invalid webhook data");
    }
  }

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/['"]/g, "") // Remove quotes
      .replace(/[&]/g, "&amp;") // Escape ampersands
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate amount to prevent manipulation
   */
  static validateAmount(
    amount: number,
    minAmount = 0.5,
    maxAmount = 100000
  ): boolean {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("Amount must be a valid number");
    }

    if (amount < minAmount) {
      throw new Error(`Amount must be at least $${minAmount}`);
    }

    if (amount > maxAmount) {
      throw new Error(`Amount cannot exceed $${maxAmount}`);
    }

    // Check for reasonable decimal places (max 2)
    const decimalPlaces = (amount.toString().split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      throw new Error("Amount cannot have more than 2 decimal places");
    }

    return true;
  }

  /**
   * Rate limiting implementation
   */
  static checkRateLimit(
    identifier: string,
    action: keyof typeof RATE_LIMITS
  ): { allowed: boolean; resetTime?: number } {
    const limit = RATE_LIMITS[action];
    const key = `${action}:${identifier}`;
    const now = Date.now();

    const existing = rateLimitStore.get(key);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + limit.window,
      });
      return { allowed: true };
    }

    if (existing.count >= limit.requests) {
      return {
        allowed: false,
        resetTime: existing.resetTime,
      };
    }

    // Increment count
    existing.count++;
    rateLimitStore.set(key, existing);
    return { allowed: true };
  }

  /**
   * Generate secure payment reference
   */
  static generatePaymentReference(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString("hex");
    return `pay_${timestamp}_${randomBytes}`;
  }

  /**
   * Verify webhook signature (Stripe)
   */
  static verifyStripeWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const elements = signature.split(",");
      const signatureElements = elements.reduce((acc, element) => {
        const [key, value] = element.split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const timestamp = signatureElements.t;
      const signatures = [signatureElements.v1];

      if (!timestamp || !signatures[0]) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const timestampNumber = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes

      if (Math.abs(now - timestampNumber) > tolerance) {
        return false;
      }

      // Verify signature
      const payloadForSignature = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payloadForSignature)
        .digest("hex");

      return signatures.some((sig) =>
        crypto.timingSafeEqual(
          Buffer.from(sig, "hex"),
          Buffer.from(expectedSignature, "hex")
        )
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Validate invoice ownership (ensure user can only pay their own invoices)
   */
  static async validateInvoiceAccess(invoiceId: string): Promise<boolean> {
    // In a real application, you would check if the user has access to this invoice
    // For now, we'll implement basic validation
    if (!invoiceId || typeof invoiceId !== "string") {
      throw new Error("Invalid invoice ID");
    }

    // Add your invoice ownership validation logic here
    // Example: Check if invoice belongs to user or is public
    return true;
  }

  /**
   * Log security events for monitoring
   */
  static logSecurityEvent(
    event: string,
    details: Record<string, unknown>,
    severity: "low" | "medium" | "high" = "medium"
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: {
        ...details,
        // Remove sensitive data
        ...Object.keys(details).reduce((acc, key) => {
          if (
            key.toLowerCase().includes("secret") ||
            key.toLowerCase().includes("password") ||
            key.toLowerCase().includes("token")
          ) {
            acc[key] = "[REDACTED]";
          } else {
            acc[key] = details[key];
          }
          return acc;
        }, {} as Record<string, unknown>),
      },
    };

    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);

    // In production, send to monitoring service
    // Example: send to DataDog, Sentry, etc.
  }

  /**
   * Validate payment method data
   */
  static validatePaymentMethodData(data: {
    type: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
  }): boolean {
    if (
      !["CARD", "BANK_ACCOUNT", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY"].includes(
        data.type
      )
    ) {
      throw new Error("Invalid payment method type");
    }

    if (data.type === "CARD") {
      if (data.cardLast4 && !/^\d{4}$/.test(data.cardLast4)) {
        throw new Error("Invalid card last 4 digits");
      }

      if (
        data.cardExpMonth &&
        (data.cardExpMonth < 1 || data.cardExpMonth > 12)
      ) {
        throw new Error("Invalid card expiration month");
      }

      if (data.cardExpYear && data.cardExpYear < new Date().getFullYear()) {
        throw new Error("Card has expired");
      }
    }

    return true;
  }

  /**
   * Clean up rate limit store (call periodically)
   */
  static cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Cleanup rate limit store every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    PaymentSecurity.cleanupRateLimitStore();
  }, 5 * 60 * 1000);
}
