export type ApplicationDetail = {
  id: string;
  type: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  country: string | null;
  whatsappNumber: string | null;
  mobileNumber: string | null;
  telegramId: string | null;
  documentUrl: string | null;
  profilePicUrl: string | null;
  createdAt: string;
  updatedAt: string;
  bankDetails: {
    accountNumber: string | null;
    ifscCode: string | null;
    bankName: string | null;
    holderName: string | null;
    branchName: string | null;
  } | null;
  walletDetails: { provider: string | null; walletId: string | null } | null;
  platformDetails: {
    platformName: string | null;
    platformLink: string | null;
    usersRange: string | null;
    turnoverRange: string | null;
  } | null;
  brandRelation: {
    usernameInPlatform: string | null;
    hadPreviousTransaction: boolean | null;
    transactionId: string | null;
  } | null;
};

export type ApiResponse = {
  user?: { id: string; mobile: string };
  application?: ApplicationDetail | null;
  error?: string;
};

export type TransactionRow = {
  id: string;
  type: "ADMIN_DEPOSIT" | "USER_DEPOSIT";
  status: "PENDING" | "APPROVED" | "DECLINED";
  amount: number | null;
  method: string | null;
  bankName: string | null;
  walletProvider: string | null;
  walletId: string | null;
  transactionNo: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
  adminId: string | null;
};

export type DashboardTab = "depositRequest" | "payRecord" | "statement" | "profile";

