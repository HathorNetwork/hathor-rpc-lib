/**
 * Modal displayed to confirm wallet disconnection
 * Warns user that all localStorage data will be cleared
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  onDisconnect: () => void;
  onCancel: () => void;
}

export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  isOpen,
  onDisconnect,
  onCancel
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <DialogTitle>Disconnect Wallet</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p className="font-medium">
              Are you sure you want to disconnect your wallet?
            </p>
            <p className="text-sm">
              All wallet data stored locally will be permanently cleared, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-1">
              <li>Wallet connection information</li>
              <li>Network preferences</li>
              <li>Registered tokens</li>
              <li>Address mode settings</li>
            </ul>
            <p className="text-sm font-medium pt-2">
              You will need to reconnect your wallet to continue.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onDisconnect}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
