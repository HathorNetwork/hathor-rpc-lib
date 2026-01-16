import React from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

export interface ErrorDetails {
  type: string;
  message: string;
  timestamp: Date;
  stack?: string;
}

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorDetails;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  isOpen,
  onClose,
  error,
}) => {
  const { toast } = useToast();

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  };

  const getErrorText = () => {
    const lines = [
      `Error Type: ${error.type}`,
      `Message: ${error.message}`,
      `Timestamp: ${formatTimestamp(error.timestamp)}`,
    ];
    if (error.stack) {
      lines.push('', 'Stack Trace:', error.stack);
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getErrorText());
      toast({
        variant: 'success',
        title: 'Error details copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy error details:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to copy to clipboard',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Error Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Error Type */}
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Error Type</h4>
            <p className="text-sm text-muted-foreground">{error.type}</p>
          </div>

          {/* Message */}
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Message</h4>
            <p className="text-sm text-muted-foreground break-words">{error.message}</p>
          </div>

          {/* Timestamp */}
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Timestamp</h4>
            <p className="text-sm text-muted-foreground">{formatTimestamp(error.timestamp)}</p>
          </div>

          {/* Stack Trace */}
          {error.stack && (
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Stack Trace</h4>
              <div className="bg-[#0D1117] border border-border rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                  {error.stack}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2 hover:bg-primary/20 hover:text-primary hover:border-primary"
          >
            <Copy className="w-4 h-4" />
            Copy to Clipboard
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDetailsModal;
