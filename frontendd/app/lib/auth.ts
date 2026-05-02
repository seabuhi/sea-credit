import type { AppUser, LoginResponse } from './api';

export function saveAuth(data: LoginResponse) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  
  const user = {
    id: data.userId,
    username: data.username,
    fullName: data.fullName,
    roles: data.roles
  };
  localStorage.setItem('user_info', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
}

export function getUser(): any {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user_info');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) return false;
  return user.roles.some(r => r === role || r === `ROLE_${role}`);
}

export function hasAnyRole(...roles: string[]): boolean {
  return roles.some(r => hasRole(r));
}

export function isAdmin() { return hasRole('ADMIN'); }
export function isClient() { return hasRole('CLIENT'); }
export function isCreditOfficer() { return hasRole('CREDIT_OFFICER'); }
export function isApprover() { return hasRole('APPROVER') || hasRole('ADMIN'); }
export function isCashier() { return hasRole('CASHIER') || hasRole('ADMIN'); }
export function isOperator() { return hasRole('OPERATOR') || hasRole('ADMIN'); }

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Qaralama',
  SUBMITTED: 'Təqdim edilib',
  PRECHECK_PASSED: 'Ön yoxlama keçib',
  PRECHECK_FAILED: 'Ön yoxlama uğursuz',
  PENDING_BUREAU: 'Büro gözlənilir',
  DOCUMENTS_PENDING: 'Sənəd gözlənilir',
  UNDER_REVIEW: 'İcmalda',
  RISK_ASSESSMENT_DONE: 'Risk qiymətləndirildi',
  APPROVED: 'Təsdiqləndi',
  REJECTED: 'İmtina edildi',
  CONTRACT_GENERATED: 'Müqavilə hazırlandı',
  SIGNED: 'İmzalandı',
  DISBURSED: 'Vəsait köçürüldü',
  ACTIVE: 'Aktiv',
  OVERDUE: 'Gecikmiş',
  RESTRUCTURED: 'Restrukturizasiya',
  CLOSED: 'Bağlandı',
  CANCELLED: 'Ləğv edildi',
};

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-gray',
  SUBMITTED: 'badge-blue',
  PRECHECK_PASSED: 'badge-blue',
  PRECHECK_FAILED: 'badge-red',
  PENDING_BUREAU: 'badge-yellow',
  DOCUMENTS_PENDING: 'badge-yellow',
  UNDER_REVIEW: 'badge-blue',
  RISK_ASSESSMENT_DONE: 'badge-purple',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
  CONTRACT_GENERATED: 'badge-purple',
  SIGNED: 'badge-purple',
  DISBURSED: 'badge-green',
  ACTIVE: 'badge-green',
  OVERDUE: 'badge-red',
  RESTRUCTURED: 'badge-yellow',
  CLOSED: 'badge-gray',
  CANCELLED: 'badge-gray',
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING_DISBURSEMENT: 'Disbursement gözlənilir',
  ACTIVE: 'Aktiv',
  OVERDUE: 'Gecikmiş',
  RESTRUCTURED: 'Restrukturizasiya',
  CLOSED: 'Bağlandı',
  WRITTEN_OFF: 'Silinmiş',
};

export const ACCOUNT_STATUS_BADGE: Record<string, string> = {
  PENDING_DISBURSEMENT: 'badge-yellow',
  ACTIVE: 'badge-green',
  OVERDUE: 'badge-red',
  RESTRUCTURED: 'badge-yellow',
  CLOSED: 'badge-gray',
  WRITTEN_OFF: 'badge-gray',
};

export function formatCurrency(amount: number, currency = 'AZN'): string {
  return new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const ROLES_AZ: Record<string, string> = {
  ADMIN: 'Administrator',
  OPERATOR: 'Operator',
  CREDIT_OFFICER: 'Kredit Məmuru',
  RISK_ANALYST: 'Risk Analitiki',
  APPROVER: 'Təsdiqləyici',
  CASHIER: 'Kassir',
  COLLECTION_AGENT: 'Kolleksiya Agenti',
  CLIENT: 'Müştəri',
};
