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
            className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Apply for Wallet agent
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Login
          </Link>
        </>
      }
    />
  );
}
