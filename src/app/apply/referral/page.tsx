import Link from "next/link";
import { ApplicationWizard } from "@/app/_components/ApplicationWizard";

export default function ApplyReferralAgentPage() {
  return (
    <ApplicationWizard
      headerHighlightText="Agent"
      headerSuffixText=""
      variant="agent"
      headerActions={
        <>
          <Link
            href="/apply/wallet"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-50 sm:min-h-10 sm:w-auto active:scale-[0.99]"
          >
            Apply for Wallet agent
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 sm:min-h-10 sm:w-auto active:scale-[0.99]"
          >
            Login
          </Link>
        </>
      }
    />
  );
}
