import Link from "next/link";
import { ApplicationWizard } from "./_components/ApplicationWizard";

export default function Home() {
  return (
    <ApplicationWizard
      headerHighlightText="Wallet-Bank"
      headerSuffixText="Agent"
      headerActions={
        <>
          <Link
            href="/application-for-agent"
            className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Application for Agent
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Login
          </Link>
        </>
      }
    />
  );
}