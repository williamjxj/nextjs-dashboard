"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
// Authentication is now handled in auth-actions.ts
// This file is kept for other dashboard-related actions

const prisma = new PrismaClient();

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["PENDING", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;

  try {
    await prisma.invoice.create({
      data: {
        customerId,
        amount: amountInCents,
        status,
        date: new Date(),
      },
    });

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw new Error("Failed to create invoice");
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await prisma.invoice.update({
      where: { id },
      data: {
        customerId,
        amount: amountInCents,
        status,
      },
    });

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw new Error("Failed to update invoice");
  }
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw new Error("Failed to delete invoice");
  }
}

export async function getInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    return invoice;
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    throw new Error("Failed to fetch invoice");
  }
}

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { date: "desc" },
    });
    return invoices;
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    throw new Error("Failed to fetch invoices");
  }
}
