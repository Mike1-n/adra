import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'SSP 0';
  const num = Number(amount);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `SSP ${formatted}`;
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

/**
 * Resolves facilitation status for a field case/task.
 * Returns { req, status, isPaid, isApproved, isPending, isRejected, isLocked, label, badgeClass }
 * If isPaid or isApproved, isLocked = true, locking any further facilitation requests.
 */
export function getTaskFacilitationStatus(task, requests = []) {
  if (!task || !Array.isArray(requests) || requests.length === 0) {
    return { req: null, status: 'none', isPaid: false, isApproved: false, isPending: false, isRejected: false, isLocked: false, label: 'None', badgeClass: 'bg-slate-100 text-slate-700' };
  }

  const taskId = String(task.id || '').toLowerCase().trim();
  const requestCode = String(task.request_code || '').toLowerCase().trim();
  const benName = String(task.beneficiary_name || '').toLowerCase().trim();

  // Find all funding requests matching this task
  const matching = requests.filter(r => {
    if (!r) return false;
    const rTaskId = String(r.linked_task_id || r.request_id || '').toLowerCase().trim();
    const rCode = String(r.linked_request_code || '').toLowerCase().trim();
    const rBen = String(r.linked_beneficiary_name || r.beneficiary_name || '').toLowerCase().trim();

    return (
      (taskId && rTaskId && taskId === rTaskId) ||
      (requestCode && rCode && requestCode === rCode) ||
      (benName && rBen && benName === rBen) ||
      (task.id && r.linked_task_id === task.id) ||
      (task.request_code && r.linked_request_code === task.request_code)
    );
  });

  if (!matching.length) {
    return { req: null, status: 'none', isPaid: false, isApproved: false, isPending: false, isRejected: false, isLocked: false, label: 'None', badgeClass: 'bg-slate-100 text-slate-700' };
  }

  // 1. Paid / Disbursed: Locked
  const disbursedReq = matching.find(r => 
    r.status === 'Disbursed' || 
    r.status === 'Disbursed / Paid' || 
    r.status === 'Paid' || 
    r.stage === 4 || 
    Boolean(r.disbursed_at) || 
    Boolean(r.finance_disbursement?.disbursed_at) ||
    r.finance_disbursement?.status === 'Disbursed'
  );

  if (disbursedReq) {
    return {
      req: disbursedReq,
      status: 'paid',
      isPaid: true,
      isApproved: true,
      isPending: false,
      isRejected: false,
      isLocked: true,
      label: 'Facilitation Paid',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }

  // 2. Approved (Supervisor / PM): Locked
  const approvedReq = matching.find(r => 
    r.status?.toLowerCase().includes('approved') || 
    r.stage === 2 || 
    r.stage === 3
  );

  if (approvedReq) {
    return {
      req: approvedReq,
      status: 'approved',
      isPaid: false,
      isApproved: true,
      isPending: false,
      isRejected: false,
      isLocked: true,
      label: 'Facilitation Approved',
      badgeClass: 'bg-emerald-100 text-[#006B56] border-emerald-300'
    };
  }

  // 3. Pending Review: Locked
  const pendingReq = matching.find(r => 
    !r.status?.toLowerCase().includes('reject') && 
    r.stage !== -1 && 
    !r.returned_to_worker
  );

  if (pendingReq) {
    return {
      req: pendingReq,
      status: 'pending',
      isPaid: false,
      isApproved: false,
      isPending: true,
      isRejected: false,
      isLocked: true,
      label: 'Facilitation Pending',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }

  // 4. Rejected: Unlocked (can be revised or requested again)
  const rejectedReq = matching.find(r => 
    r.status?.toLowerCase().includes('reject') || 
    r.stage === -1 || 
    r.returned_to_worker
  );

  return {
    req: rejectedReq,
    status: rejectedReq ? 'rejected' : 'none',
    isPaid: false,
    isApproved: false,
    isPending: false,
    isRejected: Boolean(rejectedReq),
    isLocked: false,
    label: rejectedReq ? 'Returned' : 'None',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300'
  };
}

/**
 * Safely opens an attached evidence document (supports https, blob, and base64 data URLs).
 * Browsers block top-level navigation to data: URLs, so data: URLs are converted to Blob URLs first.
 */
export function openEvidenceDocument(doc) {
  const rawUrl = typeof doc === 'string' ? doc : (doc?.url || doc?.data_url || '');
  if (!rawUrl) return false;

  const fileName = (typeof doc === 'object' && doc?.name) ? doc.name : 'document';

  const openTargetUrl = (targetUrl, revokeAfter = false) => {
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    if (revokeAfter) {
      setTimeout(() => {
        try { URL.revokeObjectURL(targetUrl); } catch {}
      }, 60000);
    }
    return true;
  };

  if (rawUrl.startsWith('data:')) {
    try {
      const commaIdx = rawUrl.indexOf(',');
      if (commaIdx === -1) return false;
      const meta = rawUrl.slice(5, commaIdx);
      const dataPart = rawUrl.slice(commaIdx + 1);
      const mimeType = meta.split(';')[0] || 'application/octet-stream';
      const isBase64 = meta.includes(';base64');

      let byteArray;
      if (isBase64) {
        const binaryStr = atob(dataPart);
        byteArray = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          byteArray[i] = binaryStr.charCodeAt(i);
        }
      } else {
        const decoded = decodeURIComponent(dataPart);
        byteArray = new TextEncoder().encode(decoded);
      }

      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      return openTargetUrl(blobUrl, true);
    } catch (err) {
      console.warn('Failed to open data URL document:', err);
      const a = document.createElement('a');
      a.href = rawUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  }

  return openTargetUrl(rawUrl, false);
}
