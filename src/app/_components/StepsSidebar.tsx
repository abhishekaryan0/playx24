"use client";

export type WizardStep = 1 | 2 | 3;

export function StepsSidebar({
  step,
  onStepChange,
  labels,
}: {
  step: WizardStep;
  onStepChange: (step: WizardStep) => void;
  labels?: {
    step1: string;
    step2: string;
    step3: string;
  };
}) {
  const resolvedLabels = labels ?? {
    step1: "Primary Info",
    step2: "Bank and wallet details",
    step3: "Brand relation",
  };

  return (
    <aside className="space-y-5">
      <StepPill
        number={1}
        label={resolvedLabels.step1}
        active={step === 1}
        onClick={() => onStepChange(1)}
      />
      <StepPill
        number={2}
        label={resolvedLabels.step2}
        active={step === 2}
        onClick={() => onStepChange(2)}
      />
      <StepPill
        number={3}
        label={resolvedLabels.step3}
        active={step === 3}
        onClick={() => onStepChange(3)}
      />
    </aside>
  );
}

function StepPill({
  number,
  label,
  active,
  onClick,
}: {
  number: number;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "step" : undefined}
      className={[
        "flex w-full items-center gap-3 rounded-full border px-4 py-3 text-left transition-colors",
        active
          ? "border-emerald-200 bg-emerald-50"
          : "border-zinc-200 bg-white hover:bg-zinc-50",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
          active ? "bg-emerald-600 text-white" : "bg-white text-zinc-700",
          active ? "" : "border border-zinc-200",
        ].join(" ")}
      >
        {number}
      </div>
      <div className={active ? "text-sm font-medium text-emerald-700" : "text-sm text-zinc-500"}>
        {label}
      </div>
    </button>
  );
}

