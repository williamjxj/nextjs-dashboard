"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PaymentSecurity } from "./payment-security";
import { PaymentService } from "./payment-service";

// Validation schemas
const PaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL"]),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  receiptEmail: z.string().email().optional(),
});

const RefundSchema = z.object({
  paymentId: z.string(),
  amount: z.coerce.number().positive().optional(),
  reason: z.string().optional(),
});

export type PaymentState = {
  errors?: {
    invoiceId?: string[];
    amount?: string[];
    paymentMethod?: string[];
    currency?: string[];
    description?: string[];
    receiptEmail?: string[];
  };
  message?: string | null;
  success?: boolean;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
  };
  paypalOrder?: {
    id: string;
    status: string;
  };
};

export type RefundState = {
  errors?: {
    paymentId?: string[];
    amount?: string[];
    reason?: string[];
  };
  message?: string | null;
  success?: boolean;
};

// Create Stripe Payment Intent
export async function createStripePayment(
  prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return {
        message: "Authentication required. Please sign in.",
      };
    }

    // Rate limiting
    const rateLimitCheck = PaymentSecurity.checkRateLimit(
      session.user.email || "anonymous",
      "PAYMENT_CREATION"
    );

    if (!rateLimitCheck.allowed) {
      PaymentSecurity.logSecurityEvent(
        "RATE_LIMIT_EXCEEDED",
        { action: "PAYMENT_CREATION", user: session.user.email },
        "medium"
      );
      return {
        message: "Too many payment attempts. Please try again later.",
      };
    }

    const validatedFields = PaymentSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      amount: formData.get("amount"),
      paymentMethod: "STRIPE",
      currency: formData.get("currency") || "USD",
      description: formData.get("description"),
      receiptEmail: formData.get("receiptEmail"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Missing or invalid fields. Failed to create payment.",
      };
    }

    const { invoiceId, amount, currency, description, receiptEmail } =
      validatedFields.data;

    // Additional security validation
    PaymentSecurity.validateAmount(amount);

    // Validate invoice access
    await PaymentSecurity.validateInvoiceAccess(invoiceId, session.user.id);

    // Sanitize inputs
    const sanitizedDescription = description
      ? PaymentSecurity.sanitizeString(description)
      : undefined;

    // Create Stripe Payment Intent
    const paymentIntent = await PaymentService.createStripePaymentIntent(
      amount,
      currency.toLowerCase(),
      {
        invoiceId,
        description: sanitizedDescription || `Payment for invoice ${invoiceId}`,
      }
    );

    // Create payment record in database
    const payment = await PaymentService.createPaymentRecord({
      invoiceId,
      amount,
      currency,
      paymentMethod: "STRIPE",
      stripePaymentIntentId: paymentIntent.id,
      description: sanitizedDescription,
      receiptEmail,
    });

    // Log successful payment creation
    PaymentSecurity.logSecurityEvent(
      "PAYMENT_CREATED",
      {
        paymentId: payment.id,
        invoiceId,
        amount,
        method: "STRIPE",
        user: session.user.email,
      },
      "low"
    );

    return {
      success: true,
      message: "Payment intent created successfully",
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    console.error("Stripe payment creation failed:", error);

    // Get session for error logging
    let userEmail: string | undefined;
    try {
      const session = await auth();
      userEmail = session?.user?.email;
    } catch {
      userEmail = undefined;
    }

    // Log security event for failed payment
    PaymentSecurity.logSecurityEvent(
      "PAYMENT_CREATION_FAILED",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        invoiceId: formData.get("invoiceId"),
        user: userEmail,
      },
      "medium"
    );

    return {
      message: "Failed to create payment. Please try again.",
    };
  }
}

// Create PayPal Order
export async function createPayPalPayment(
  prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return {
        message: "Authentication required. Please sign in.",
      };
    }

    const validatedFields = PaymentSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      amount: formData.get("amount"),
      paymentMethod: "PAYPAL",
      currency: formData.get("currency") || "USD",
      description: formData.get("description"),
      receiptEmail: formData.get("receiptEmail"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Missing or invalid fields. Failed to create payment.",
      };
    }

    const { invoiceId, amount, currency, description, receiptEmail } =
      validatedFields.data;
    // Create PayPal Order
    const paypalOrder = await PaymentService.createPayPalOrder(
      amount,
      currency,
      description || `Payment for invoice ${invoiceId}`
    );

    // Create payment record in database
    const payment = await PaymentService.createPaymentRecord({
      invoiceId,
      amount,
      currency,
      paymentMethod: "PAYPAL",
      paypalOrderId: paypalOrder.id,
      description,
      receiptEmail,
    });

    return {
      success: true,
      message: "PayPal order created successfully",
      paypalOrder: {
        id: paypalOrder.id,
        status: paypalOrder.status,
      },
    };
  } catch (error) {
    console.error("PayPal payment creation failed:", error);

    // Get session for error logging
    let userEmail: string | undefined;
    try {
      const session = await auth();
      userEmail = session?.user?.email;
    } catch {
      userEmail = undefined;
    }

    // Log security event for failed payment
    PaymentSecurity.logSecurityEvent(
      "PAYMENT_CREATION_FAILED",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        invoiceId: formData.get("invoiceId"),
        user: userEmail,
        method: "PAYPAL",
      },
      "medium"
    );

    return {
      message: "Failed to create PayPal payment. Please try again.",
    };
  }
}

// Confirm Stripe Payment
export async function confirmStripePayment(paymentIntentId: string) {
  try {
    const paymentIntent = await PaymentService.retrieveStripePayment(
      paymentIntentId
    );

    // Update payment status in database
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find(
      (p) => p.stripePaymentIntentId === paymentIntentId
    );

    if (payment) {
      await PaymentService.updatePaymentStatus(
        payment.id,
        paymentIntent.status === "succeeded" ? "SUCCEEDED" : "FAILED",
        {
          paidAt: paymentIntent.status === "succeeded" ? new Date() : undefined,
          failureReason:
            paymentIntent.status === "failed" ? "Payment failed" : undefined,
        }
      );
    }

    revalidatePath("/dashboard/invoices");
    return { success: true, status: paymentIntent.status };
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    return { success: false, error: "Failed to confirm payment" };
  }
}

// Capture PayPal Payment
export async function capturePayPalPayment(orderId: string) {
  try {
    const order = await PaymentService.capturePayPalOrder(orderId);

    // Update payment status in database
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find((p) => p.paypalOrderId === orderId);

    if (payment) {
      await PaymentService.updatePaymentStatus(
        payment.id,
        order.status === "COMPLETED" ? "SUCCEEDED" : "FAILED",
        {
          paypalCaptureId: order.id,
          paidAt: order.status === "COMPLETED" ? new Date() : undefined,
          failureReason:
            order.status !== "COMPLETED" ? "PayPal capture failed" : undefined,
        }
      );
    }

    revalidatePath("/dashboard/invoices");
    return { success: true, status: order.status };
  } catch (error) {
    console.error("PayPal capture failed:", error);
    return { success: false, error: "Failed to capture PayPal payment" };
  }
}

// Create Refund
export async function createRefund(
  prevState: RefundState,
  formData: FormData
): Promise<RefundState> {
  const validatedFields = RefundSchema.safeParse({
    paymentId: formData.get("paymentId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create refund.",
    };
  }

  const { paymentId, amount, reason } = validatedFields.data;

  try {
    // Get payment details
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find((p) => p.id === paymentId);

    if (!payment) {
      return {
        message: "Payment not found.",
      };
    }

    let refundResult;

    if (payment.paymentMethod === "STRIPE" && payment.stripePaymentIntentId) {
      // Create Stripe refund
      refundResult = await PaymentService.createStripeRefund(
        payment.stripePaymentIntentId,
        amount,
        reason
      );

      // Create refund record
      await PaymentService.createRefundRecord({
        paymentId,
        amount: amount || payment.amount / 100,
        currency: payment.currency,
        reason,
        stripeRefundId: refundResult.id,
      });
    } else if (payment.paymentMethod === "PAYPAL") {
      // For PayPal, we would implement refund logic here
      // This is a simplified version
      await PaymentService.createRefundRecord({
        paymentId,
        amount: amount || payment.amount / 100,
        currency: payment.currency,
        reason,
      });
    }

    revalidatePath("/dashboard/invoices");
    return {
      success: true,
      message: "Refund created successfully",
    };
  } catch (error) {
    console.error("Refund creation failed:", error);
    return {
      message: "Failed to create refund. Please try again.",
    };
  }
}
