import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateTimeString;
  }
}

export function generateCode(prefix = 'REC') {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}-${randomNum}`;
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'on track':
      return 'badge-emerald';
    case 'planned':
    case 'ongoing':
      return 'badge-blue';
    case 'needs attention':
    case 'suspended':
      return 'badge-amber';
    case 'cancelled':
    case 'critical':
      return 'badge-rose';
    default:
      return 'badge-slate';
  }
}

export function calculatePercentage(part, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
