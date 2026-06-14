import { SalesmartlyChat } from "@/app/_components/SalesmartlyChat";

export default function MyApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SalesmartlyChat />
    </>
  );
}
