/**
 * Modal displayed when the snap connection is lost (unauthorized error)
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

interface ConnectionLostModalProps {
  isOpen: boolean;
  onReconnect: () => void;
}

export const ConnectionLostModal: React.FC<ConnectionLostModalProps> = ({
  isOpen,
  onReconnect
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <DialogTitle>Connection Lost</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p>
              Your wallet connection has been lost. This can happen when:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Snap permissions have been revoked</li>
              <li>The snap was updated or reinstalled</li>
              <li>MetaMask settings were changed</li>
            </ul>
            <p className="font-medium pt-2">
              Please reconnect your wallet to continue.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onReconnect} className="w-full">
            Reconnect Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
