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
  let generatedPassword: string | null = null;

  if (body.status !== undefined) data.status = body.status;
  if (body.primaryInfo) {
    const fieldErrors: Record<string, string> = {};
    const firstName = body.primaryInfo.firstName?.trim() ?? "";
    const mobileNumber = body.primaryInfo.mobileNumber?.trim() ?? "";

    // Primary Info required fields
    if (!firstName) fieldErrors.firstName = "First name is required";
    if (!mobileNumber) fieldErrors.mobileNumber = "Mobile number is required";

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", fieldErrors },
        { status: 400 },
      );
    }

    Object.assign(data, body.primaryInfo);

    // Ensure a User exists for this mobile and link application -> user.
    // Password is a random 5-digit string for new users.
    const normalizeMobile = (value: string) =>
      value.replace(/\s+/g, "").replace(/^\+/, "");

    const mobile = normalizeMobile(mobileNumber);

    const random5 = () =>
      Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");

    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });

    if (!existing) {
      generatedPassword = random5();
      const created = await prisma.user.create({
        data: { mobile, password: generatedPassword },
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
    return NextResponse.json({
      ...updated,
      generatedPassword: generatedPassword ?? undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

