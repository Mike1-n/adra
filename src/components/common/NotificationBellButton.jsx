import React, { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenterModal, getReadNotificationIds } from './NotificationCenterModal';
import { db } from '../../lib/supabase';

/**
 * Universal Notification Bell Button for all user module headers
 */
export function NotificationBellButton({
  currentUser,
  worker,
  extraData = {},
  onNavigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(getReadNotificationIds);
  const [complaintsCount, setComplaintsCount] = useState(0);

  // Sync read IDs when modal closes or opens
  useEffect(() => {
    setReadIds(getReadNotificationIds());
  }, [isOpen]);

  // Check pending message count
  useEffect(() => {
    let isMounted = true;
    async function checkCount() {
      if (extraData.pendingBeneficiaryMessagesCount !== undefined) {
        if (isMounted) setComplaintsCount(extraData.pendingBeneficiaryMessagesCount);
        return;
      }
      try {
        const complaints = await db.getComplaints('all');
        if (isMounted && Array.isArray(complaints)) {
          const role = (currentUser?.role || '').toLowerCase();
          const workerName = worker?.name || currentUser?.full_name || '';
          const pending = complaints.filter(c => {
            const recipientRole = (c.recipient_role || '').toLowerCase();
            const recipientName = (c.recipient_name || '').toLowerCase();
            let isForUser = false;
            if (role.includes('field')) {
              isForUser = recipientRole.includes('field') || (workerName && recipientName.includes(workerName.toLowerCase()));
            } else if (role.includes('supervisor')) {
              isForUser = recipientRole.includes('supervisor') || (workerName && recipientName.includes(workerName.toLowerCase()));
            } else if (role.includes('program') || role.includes('pm')) {
              isForUser = recipientRole.includes('program') || recipientRole.includes('manager');
            } else {
              isForUser = c.status !== 'Resolved';
            }
            return isForUser && c.status !== 'Resolved' && c.category !== 'Field Worker Response';
          });
          setComplaintsCount(pending.length > 0 ? pending.length : (role.includes('field') ? 2 : 0));
        }
      } catch (e) {
        console.error('Error checking complaints count', e);
      }
    }
    checkCount();
    return () => { isMounted = false; };
  }, [currentUser?.role, worker, extraData.pendingBeneficiaryMessagesCount]);

  // Compute total unread alerts
  const unreadCount = useMemo(() => {
    let count = 0;
    // Check household messages alert
    if (complaintsCount > 0 && !readIds.has('notif-household-messages')) {
      count++;
    }

    const role = (currentUser?.role || '').toLowerCase();
    if (role.includes('field')) {
      if (!readIds.has('notif-urgent-audits')) count++;
      if (!readIds.has('notif-hub-ready-cargo')) count++;
    } else if (role.includes('supervisor')) {
      if (!readIds.has('notif-sup-facs')) count++;
      if (!readIds.has('notif-sup-unassigned')) count++;
    } else if (role.includes('program')) {
      if (!readIds.has('notif-pm-facs')) count++;
      if (!readIds.has('notif-pm-requests')) count++;
    } else if (role.includes('finance')) {
      if (!readIds.has('notif-finance-payouts')) count++;
    } else if (role.includes('inventory')) {
      if (!readIds.has('notif-inventory-dispatches')) count++;
    } else if (role.includes('beneficiary')) {
      if (!readIds.has('notif-ben-status')) count++;
    } else {
      if (!readIds.has('notif-admin-approvals')) count++;
    }

    return count;
  }, [complaintsCount, readIds, currentUser?.role]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs"
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4 text-white shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#004D3F] shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenterModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setReadIds(getReadNotificationIds());
        }}
        currentUser={currentUser}
        worker={worker}
        extraData={extraData}
        onNavigate={onNavigate}
      />
    </>
  );
}
