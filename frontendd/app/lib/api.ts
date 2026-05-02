const BASE_URL = 'http://localhost:8080/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Xəta baş verdi');
  return data;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ── AUTH ─────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    post<ApiResp<LoginResponse>>('/auth/login', { username, password }),
  signup: (data: SignupRequest) =>
    post<ApiResp<null>>('/auth/signup', data),
  verifyOtp: (email: string, code: string) =>
    post<ApiResp<null>>('/auth/verify-otp', { email, code }),
  refresh: (refreshToken: string) =>
    post<ApiResp<{ accessToken: string }>>('/auth/refresh', { refreshToken }),
  forgotPassword: (username: string) =>
    post<ApiResp<null>>('/auth/forgot-password', { username }),
  resetPassword: (data: any) =>
    post<ApiResp<null>>('/auth/reset-password', data),
};

// ── REPORTS ──────────────────────────────────────
export const reportApi = {
  summary: () => get<ApiResp<DashboardSummary>>('/reports/dashboard-summary'),
  trends: () => get<ApiResp<TrendData>>('/reports/portfolio-trends'),
};

// ── CUSTOMERS ────────────────────────────────────
export const customerApi = {
  getAll: (q?: string) => get<ApiResp<Customer[]>>(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getById: (id: number) => get<ApiResp<Customer>>(`/customers/${id}`),
  getByFin: (fin: string) => get<ApiResp<Customer>>(`/customers/fin/${fin}`),
  getMine: () => get<ApiResp<Customer>>('/customers/me'),
  create: (data: CustomerCreateRequest) => post<ApiResp<Customer>>('/customers', data),
  updateMe: (data: any) => put<ApiResp<Customer>>('/customers/me', data),
};

// ── LOAN PRODUCTS ─────────────────────────────────
export const productApi = {
  getActive: () => get<ApiResp<LoanProduct[]>>('/loan-products'),
  getAll: () => get<ApiResp<LoanProduct[]>>('/loan-products/all'),
  getById: (id: number) => get<ApiResp<LoanProduct>>(`/loan-products/${id}`),
  create: (data: LoanProductCreateRequest) => post<ApiResp<LoanProduct>>('/loan-products', data),
  update: (id: number, data: LoanProductCreateRequest) => put<ApiResp<LoanProduct>>(`/loan-products/${id}`, data),
  toggle: (id: number) => patch<ApiResp<null>>(`/loan-products/${id}/toggle`),
};

// ── LOAN APPLICATIONS ─────────────────────────────
export const applicationApi = {
  getAll: (q?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (customerId) params.append('customerId', String(customerId));
    return get<ApiResp<LoanApplication[]>>(`/loan-applications?${params}`);
  },
  getMine: () => get<ApiResp<LoanApplication[]>>('/loan-applications/mine'),
  getById: (id: number) => get<ApiResp<LoanApplication>>(`/loan-applications/${id}`),
  create: (data: LoanApplicationCreateRequest) => post<ApiResp<LoanApplication>>('/loan-applications', data),
  submit: (id: number) => post<ApiResp<LoanApplication>>(`/loan-applications/${id}/submit`),
  approve: (id: number, notes: string) => post<ApiResp<LoanApplication>>(`/loan-applications/${id}/approve`, { notes }),
  reject: (id: number, notes: string) => post<ApiResp<LoanApplication>>(`/loan-applications/${id}/reject`, { notes }),
  disburse: (id: number) => post<ApiResp<LoanAccount>>(`/loan-applications/${id}/disburse`),
};

// ── ASSESSMENTS ───────────────────────────────────
export const assessmentApi = {
  run: (applicationId: number) => post<ApiResp<LoanAssessment>>(`/assessments/application/${applicationId}`),
  get: (applicationId: number) => get<ApiResp<LoanAssessment>>(`/assessments/application/${applicationId}`),
};

// ── LOAN ACCOUNTS ─────────────────────────────────
export const accountApi = {
  getAll: (q?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (customerId) params.append('customerId', String(customerId));
    return get<ApiResp<LoanAccount[]>>(`/loan-accounts?${params}`);
  },
  getMine: () => get<ApiResp<LoanAccount[]>>('/loan-accounts/mine'),
  getById: (id: number) => get<ApiResp<LoanAccount>>(`/loan-accounts/${id}`),
};

// ── PAYMENTS ──────────────────────────────────────
export const paymentApi = {
  process: (accountId: number, amount: number, method: string, notes?: string) =>
    post<ApiResp<PaymentTransaction>>(`/payments/account/${accountId}`, { amount, method, notes }),
  getByAccount: (accountId: number) =>
    get<ApiResp<PaymentTransaction[]>>(`/payments/account/${accountId}`),
};

// ── DOCUMENTS ─────────────────────────────────────
export const documentApi = {
  upload: (applicationId: number, documentType: string, file: File, notes?: string) => {
    const fd = new FormData();
    fd.append('applicationId', String(applicationId));
    fd.append('documentType', documentType);
    fd.append('file', file);
    if (notes) fd.append('notes', notes);
    return request<ApiResp<ApplicationDocument>>('POST', '/documents/upload', fd, true);
  },
  getByApplication: (applicationId: number) =>
    get<ApiResp<ApplicationDocument[]>>(`/documents/application/${applicationId}`),
};

// ── USERS ─────────────────────────────────────────
export const userApi = {
  getAll: () => get<ApiResp<AppUser[]>>('/users'),
  getById: (id: number) => get<ApiResp<AppUser>>(`/users/${id}`),
  create: (data: UserCreateRequest) => post<ApiResp<AppUser>>('/users', data),
  toggleStatus: (id: number) => patch<ApiResp<null>>(`/users/${id}/toggle-status`),
};

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────
export interface ApiResp<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  fullName: string;
  roles: string[];
}
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}
export interface AppUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}
export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
}
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  finCode: string;
  idSerial: string;
  birthDate: string;
  gender: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  employmentStatus: string;
  employerName?: string;
  monthlyIncome: number;
  incomeCurrency: string;
  blacklisted: boolean;
  creditScore?: number;
  createdAt: string;
}
export interface CustomerCreateRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  finCode: string;
  idSerial: string;
  idIssuedBy?: string;
  idIssuedDate?: string;
  idExpiryDate?: string;
  birthDate: string;
  gender: string;
  mobile: string;
  mobileAlt?: string;
  email?: string;
  address?: string;
  city?: string;
  employmentStatus: string;
  employerName?: string;
  monthlyIncome: number;
  incomeCurrency?: string;
}
export interface LoanProduct {
  id: number;
  name: string;
  code: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestType: string;
  baseInterestRate: number;
  originationFeeRate: number;
  maxDti: number;
  currency: string;
  collateralRequired: boolean;
  minAge: number;
  maxAge: number;
  minIncome?: number;
  active: boolean;
}
export interface LoanProductCreateRequest {
  name: string;
  code: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestType: string;
  baseInterestRate: number;
  originationFeeRate: number;
  maxDti: number;
  currency: string;
  collateralRequired: boolean;
  minAge: number;
  maxAge: number;
  minIncome?: number;
}
export interface LoanApplication {
  id: number;
  applicationNo: string;
  customer: Customer;
  loanProduct: LoanProduct;
  requestedAmount: number;
  requestedTerm: number;
  currency: string;
  purpose?: string;
  hasCollateral: boolean;
  collateralType?: string;
  hasGuarantor: boolean;
  status: string;
  submittedAt?: string;
  precheckPassed?: boolean;
  precheckNotes?: string;
  createdAt: string;
}
export interface LoanApplicationCreateRequest {
  customerId: number;
  loanProductId: number;
  requestedAmount: number;
  requestedTerm: number;
  currency?: string;
  purpose?: string;
  hasCollateral: boolean;
  collateralType?: string;
  collateralDescription?: string;
  collateralEstimatedValue?: number;
  hasGuarantor: boolean;
  guarantorName?: string;
  guarantorFin?: string;
}
export interface LoanAccount {
  id: number;
  accountNo: string;
  customer: Customer;
  loanProduct: LoanProduct;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  currency: string;
  balancePrincipal: number;
  balanceInterest: number;
  balancePenalty: number;
  status: string;
  disbursementDate?: string;
  maturityDate?: string;
  nextPaymentDate?: string;
  repaymentSchedules?: RepaymentSchedule[];
  createdAt: string;
}
export interface RepaymentSchedule {
  id: number;
  installmentNo: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}
export interface PaymentTransaction {
  id: number;
  transactionNo: string;
  amount: number;
  paymentMethod: string;
  method: string; // alias mapped from paymentMethod
  penaltyPart: number;
  interestPart: number;
  principalPart: number;
  notes?: string;
  transactionDate: string;
}
export interface ApplicationDocument {
  id: number;
  documentType: string;
  originalFileName: string;
  notes?: string;
  uploadedAt: string;
}
export interface LoanAssessment {
  id: number;
  creditScore: number;
  dti: number;
  recommendation: string;
  notes?: string;
  assessedAt: string;
}
export interface DashboardSummary {
  totalCustomers: number;
  activeApplications: number;
  pendingApplications: number;
  totalLoanAccounts: number;
  totalVerifiedUsers: number;
  totalDisbursedAzn: number;
  totalOverdueAzn: number;
  portfolioAtRiskPercentage: number;
  overdueLoanAccounts: number;
  applicationsByStatus: Record<string, number>;
}
export interface TrendData {
  labels: string[];
  disbursementVolume: number[];
  repaymentVolume: number[];
  applicationCounts: number[];
}
