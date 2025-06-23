import { PaymentService } from "@/app/lib/payment-service";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  // Rate limiting for webhooks
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimitCheck = PaymentSecurity.checkRateLimit(
    clientIP,
    "WEBHOOK_PROCESSING"
  );

  if (!rateLimitCheck.allowed) {
    PaymentSecurity.logSecurityEvent(
      "WEBHOOK_RATE_LIMIT_EXCEEDED",
      { ip: clientIP },
      "high"
    );
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature using our security module
    if (
      !PaymentSecurity.verifyStripeWebhookSignature(body, sig, endpointSecret)
    ) {
      PaymentSecurity.logSecurityEvent(
        "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
        { ip: clientIP },
        "high"
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

    // Validate webhook data structure
    PaymentSecurity.validateWebhookData(event);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    PaymentSecurity.logSecurityEvent(
      "WEBHOOK_PROCESSING_ERROR",
      { error: err.message, ip: clientIP },
      "medium"
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case "payment_intent.requires_action":
        const actionRequired = event.data.object as Stripe.PaymentIntent;
        await handlePaymentRequiresAction(actionRequired);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find the payment record by Stripe payment intent ID
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find(
      (p) => p.stripePaymentIntentId === paymentIntent.id
    );

    if (payment) {
      await PaymentService.updatePaymentStatus(payment.id, "SUCCEEDED", {
        stripeChargeId: paymentIntent.latest_charge as string,
        receiptUrl: paymentIntent.receipt_email
          ? `https://dashboard.stripe.com/receipts/${paymentIntent.latest_charge}`
          : undefined,
        paidAt: new Date(),
      });

      console.log(`Payment ${payment.id} marked as succeeded`);
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find(
      (p) => p.stripePaymentIntentId === paymentIntent.id
    );

    if (payment) {
      await PaymentService.updatePaymentStatus(payment.id, "FAILED", {
        failureReason:
          paymentIntent.last_payment_error?.message || "Payment failed",
      });

      console.log(`Payment ${payment.id} marked as failed`);
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handlePaymentRequiresAction(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find(
      (p) => p.stripePaymentIntentId === paymentIntent.id
    );

    if (payment) {
      await PaymentService.updatePaymentStatus(payment.id, "REQUIRES_ACTION");
      console.log(`Payment ${payment.id} requires action`);
    }
  } catch (error) {
    console.error("Error handling payment requires action:", error);
  }
}
