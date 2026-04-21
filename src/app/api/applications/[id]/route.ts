import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type ApplicationPatch = {
  status?: string;
  primaryInfo?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    country?: string;
    whatsappNumber?: string;
    mobileNumber?: string;
    telegramId?: string;
    documentUrl?: string;
    profilePicUrl?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
    branchName?: string;
  };
  walletDetails?: {
    provider?: string;
    walletId?: string;
  };
  platformDetails?: {
    platformName?: string;
    platformLink?: string;
    usersRange?: string;
    turnoverRange?: string;
  };
  brandRelation?: {
    usernameInPlatform?: string;
    hadPreviousTransaction?: boolean;
    transactionId?: string;
  };
};

function generateEasyPassword(): string {
  // Easy to remember + type (requested). Example: P24-48231
  const digits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `P24-${digits}`;
}

function normalizeMobile(value: string): string {
  return value.replace(/\s+/g, "").replace(/^\+/, "");
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as ApplicationPatch | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isSubmitting = body.status === "PENDING";
  const data: Prisma.ApplicationUpdateInput = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.primaryInfo) {
    const fieldErrors: Record<string, string> = {};
    const pi = body.primaryInfo;
    const firstName = pi.firstName?.trim() ?? "";
    const lastName = pi.lastName?.trim() ?? "";
    const address = pi.address?.trim() ?? "";
    const country = pi.country?.trim() ?? "";
    const whatsappNumber = pi.whatsappNumber?.trim() ?? "";
    const mobileNumber = pi.mobileNumber?.trim() ?? "";
    const telegramId = pi.telegramId?.trim() ?? "";
    const documentUrl = pi.documentUrl?.trim() ?? "";
    const profilePicUrl = pi.profilePicUrl?.trim() ?? "";

    if (!firstName) fieldErrors.firstName = "First name is required";
    if (!lastName) fieldErrors.lastName = "Last name is required";
    if (!address) fieldErrors.address = "Address is required";
    if (!country) fieldErrors.country = "Country is required";
    if (!whatsappNumber) fieldErrors.whatsappNumber = "Whatsapp number is required";
    if (!mobileNumber) fieldErrors.mobileNumber = "Mobile number is required";
    if (!telegramId) fieldErrors.telegramId = "Telegram ID is required";
    if (!documentUrl) fieldErrors.documentUrl = "Document upload is required";
    if (!profilePicUrl) fieldErrors.profilePicUrl = "Profile picture upload is required";

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", fieldErrors },
        { status: 400 },
      );
    }

    Object.assign(data, body.primaryInfo);

    // Ensure a User exists for this mobile and link application -> user.
    const mobile = normalizeMobile(mobileNumber);

    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: { mobile, password: "" },
        select: { id: true },
      });
      data.user = { connect: { id: created.id } };
    } else {
      data.user = { connect: { id: existing.id } };
    }
  }

  if (body.bankDetails) {
    data.bankDetails = {
      upsert: {
        create: body.bankDetails,
        update: body.bankDetails,
      },
    };
  }

  if (body.walletDetails) {
    data.walletDetails = {
      upsert: {
        create: body.walletDetails,
        update: body.walletDetails,
      },
    };
  }

  if (body.platformDetails) {
    data.platformDetails = {
      upsert: {
        create: body.platformDetails,
        update: body.platformDetails,
      },
    };
  }

  if (body.brandRelation) {
    const fieldErrors: Record<string, string> = {};
    const br = body.brandRelation;
    const usernameInPlatform = br.usernameInPlatform?.trim() ?? "";
    const transactionId = br.transactionId?.trim() ?? "";

    if (!usernameInPlatform) {
      fieldErrors.usernameInPlatform = "Username in platform is required";
    }
    if (typeof br.hadPreviousTransaction !== "boolean") {
      fieldErrors.hadPreviousTransaction =
        "Please indicate if you had a previous transaction";
    }
    if (!transactionId) {
      fieldErrors.transactionId = "Transaction ID is required";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", fieldErrors },
        { status: 400 },
      );
    }

    data.brandRelation = {
      upsert: {
        create: body.brandRelation,
        update: body.brandRelation,
      },
    };
  }

  try {
    // If this is the final submission, generate a password and return it once
    // so the user can log in with (mobile + password).
    if (isSubmitting) {
      const result = await prisma.$transaction(async (tx) => {
        const application = await tx.application.findUnique({
          where: { id },
          select: { id: true, userId: true, user: { select: { mobile: true } } },
        });

        if (!application) {
          return { kind: "error" as const, status: 404, payload: { error: "Not found" } };
        }
        if (!application.userId || !application.user?.mobile) {
          return {
            kind: "error" as const,
            status: 400,
            payload: { error: "Missing mobile number. Please complete Step 1." },
          };
        }

        const password = generateEasyPassword();
        await tx.user.update({
          where: { id: application.userId },
          data: { password },
          select: { id: true },
        });

        const updated = await tx.application.update({
          where: { id },
          data,
          select: { id: true },
        });

        return {
          kind: "success" as const,
          status: 200,
          payload: {
            ...updated,
            credentials: { mobile: application.user.mobile, password },
          },
        };
      });

      if (result.kind === "error") {
        return NextResponse.json(result.payload, { status: result.status });
      }
      return NextResponse.json(result.payload, { status: result.status });
    }

    const updated = await prisma.application.update({
      where: { id },
      data,
      select: { id: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

