import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as ApplicationPatch | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: any = {};

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
    // Password auth disabled for applicants for now (empty password; login is mobile-only).
    const normalizeMobile = (value: string) =>
      value.replace(/\s+/g, "").replace(/^\+/, "");

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
      data.userId = created.id;
    } else {
      data.userId = existing.id;
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
    const updated = await prisma.application.update({
      where: { id },
      data,
      select: { id: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

