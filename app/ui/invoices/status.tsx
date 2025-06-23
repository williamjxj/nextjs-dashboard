import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function InvoiceStatus({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs",
        {
          "bg-gray-100 text-gray-500": normalizedStatus === "pending",
          "bg-green-500 text-white": normalizedStatus === "paid",
          "bg-yellow-100 text-yellow-800":
            normalizedStatus === "partially_paid",
          "bg-red-100 text-red-800": normalizedStatus === "overdue",
          "bg-gray-200 text-gray-600": normalizedStatus === "cancelled",
        }
      )}
    >
      {normalizedStatus === "pending" ? (
        <>
          Pending
          <ClockIcon className="ml-1 w-4 text-gray-500" />
        </>
      ) : null}
      {normalizedStatus === "paid" ? (
        <>
          Paid
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      {normalizedStatus === "partially_paid" ? (
        <>
          Partially Paid
          <ClockIcon className="ml-1 w-4 text-yellow-600" />
        </>
      ) : null}
      {normalizedStatus === "overdue" ? (
        <>
          Overdue
          <ExclamationTriangleIcon className="ml-1 w-4 text-red-600" />
        </>
      ) : null}
      {normalizedStatus === "cancelled" ? (
        <>
          Cancelled
          <XMarkIcon className="ml-1 w-4 text-gray-600" />
        </>
      ) : null}
    </span>
  );
}
