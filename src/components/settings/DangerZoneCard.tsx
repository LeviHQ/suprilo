"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteAccountConfirmModal } from "@/components/settings/DeleteAccountConfirmModal";

interface DangerZoneCardProps {
  expectedDisplayName: string;
}

export function DangerZoneCard({ expectedDisplayName }: DangerZoneCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  return (
    <div
      id="danger-zone"
      className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-rose-950 tracking-tight">Danger Zone</h3>
          <p className="text-xs text-rose-800/80">
            Irreversible account termination, media cleanup, and record deletion.
          </p>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-rose-200">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-brand-dark">Delete Suprilo Creator Account</h4>
          <p className="text-xs text-brand-muted max-w-lg leading-relaxed">
            Permanently delete your profile, unique @handle reservation, surprise cards, recipient metrics, badges, and avatars.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-rose-600 hover:text-white border-rose-300 hover:bg-rose-600 shrink-0 text-xs gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Account</span>
        </Button>
      </div>

      {/* Dual-input confirmation modal */}
      <DeleteAccountConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        expectedDisplayName={expectedDisplayName}
      />
    </div>
  );
}

