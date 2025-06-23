import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/app/lib/payment-service";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const capturedOrder = await PaymentService.capturePayPalOrder(orderId);

    // Find the payment record by PayPal order ID
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find((p) => p.paypalOrderId === orderId);

    if (payment) {
      const status = capturedOrder.status === "COMPLETED" ? "SUCCEEDED" : "FAILED";
      
      await PaymentService.updatePaymentStatus(payment.id, status, {
        paypalCaptureId: capturedOrder.id,
        paidAt: status === "SUCCEEDED" ? new Date() : undefined,
        failureReason: status === "FAILED" ? "PayPal capture failed" : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      order: capturedOrder,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: "Failed to capture PayPal payment" },
      { status: 500 }
    );
  }
}
