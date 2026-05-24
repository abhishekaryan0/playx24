"use client";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type RunDeleteUserFlowParams = {
  applicationId: string;
  mobile?: string | null;
};

async function deleteUserForApplication(applicationId: string): Promise<void> {
  const res = await fetch(`/api/admin/applications/${applicationId}/user`, {
    method: "DELETE",
  });
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(json?.error || "Delete failed");
  }
}

/** SweetAlert confirm → delete login account for an application. Returns true if deleted. */
export async function runDeleteUserFlow({
  applicationId,
  mobile,
}: RunDeleteUserFlowParams): Promise<boolean> {
  const mobileLabel = mobile?.trim() || null;
  const confirmHtml = mobileLabel
    ? `Remove login for <strong class="font-mono">${mobileLabel}</strong>?`
    : "Remove the login account linked to this application?";

  const confirmed = await Swal.fire({
    title: "Delete user account?",
    html: `
      <p class="text-sm text-zinc-600">${confirmHtml}</p>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-left text-sm text-zinc-600">
        <li>User can no longer sign in.</li>
        <li>All deposits, withdrawals, and notifications are deleted.</li>
        <li>The application record is kept.</li>
      </ul>
      <p class="mt-3 text-sm font-medium text-red-600">This cannot be undone.</p>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
    focusCancel: true,
  });

  if (!confirmed.isConfirmed) return false;

  try {
    Swal.fire({
      title: "Deleting…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await deleteUserForApplication(applicationId);

    await Swal.fire({
      title: "User deleted",
      text: "The login account was removed. The application is unchanged.",
      icon: "success",
      confirmButtonColor: "#1b4332",
    });
    return true;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Delete failed";
    await Swal.fire({
      title: "Delete failed",
      text: message,
      icon: "error",
      confirmButtonColor: "#1b4332",
    });
    return false;
  }
}
