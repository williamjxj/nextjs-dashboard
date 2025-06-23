import { deleteInvoice } from "@/app/lib/actions";
import {
  CreditCardIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export function CreateInvoice() {
  return (
    <Link
      href="/dashboard/invoices/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Invoice</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteInvoice({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);

  return (
    <form action={deleteInvoiceWithId}>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}

export function ViewInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}`}
      className="rounded-md border p-2 hover:bg-gray-100"
      title="View Invoice"
    >
      <EyeIcon className="w-5" />
    </Link>
  );
}

export function PayInvoice({ id, status }: { id: string; status: string }) {
  // Only show pay button for unpaid invoices
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "paid" || normalizedStatus === "cancelled") {
    return null;
  }

  return (
    <Link
      href={`/dashboard/invoices/${id}/pay`}
      className="rounded-md border p-2 hover:bg-gray-100 text-green-600 hover:text-green-700"
      title="Pay Invoice"
    >
      <CreditCardIcon className="w-5" />
    </Link>
  );
}
