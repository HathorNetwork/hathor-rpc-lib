import React, { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '../contexts/WalletContext';
import { tokenRegistryService } from '../services/TokenRegistryService';

interface RegisterTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Zod schema for token registration
const tokenConfigSchema = z.object({
  configString: z
    .string()
    .min(1, 'Configuration string is required')
    .refine(
      (val) => {
        const validation = tokenRegistryService.validateConfigString(val);
        return validation.valid;
      },
      'Invalid configuration string format or checksum'
    ),
});

type TokenConfigFormData = z.infer<typeof tokenConfigSchema>;

const RegisterTokenDialog: React.FC<RegisterTokenDialogProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { registerToken } = useWallet();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TokenConfigFormData>({
    resolver: zodResolver(tokenConfigSchema),
    defaultValues: {
      configString: '',
    },
    mode: 'onChange',
  });

  const configString = watch('configString');

  // Preview parsed token info
  const previewInfo = React.useMemo(() => {
    if (!configString) return null;
    const validation = tokenRegistryService.validateConfigString(configString);
    if (validation.valid && validation.parsed) {
      return validation.parsed;
    }
    return null;
  }, [configString]);

  const onSubmit = async (data: TokenConfigFormData) => {
    setIsLoading(true);
    setRegistrationError(null);
    setRegistrationSuccess(false);

    try {
      await registerToken(data.configString);
      setRegistrationSuccess(true);

      // Close dialog after short delay to show success message
      setTimeout(() => {
        reset();
        setRegistrationSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to register token:', err);
      setRegistrationError(err instanceof Error ? err.message : 'Failed to register token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setRegistrationError(null);
      setRegistrationSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 className="text-base font-bold text-primary-400">Register Token</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Configuration String Input */}
          <div>
            <label className="block text-base font-bold text-white mb-2">
              Configuration String
            </label>
            <textarea
              {...register('configString')}
              placeholder="[TokenName:TKN:00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:checksum]"
              rows={3}
              className={`w-full px-3 py-2 bg-[#0D1117] border ${
                errors.configString ? 'border-red-500' : 'border-border'
              } rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm`}
            />
            {errors.configString && (
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-400">{errors.configString.message}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Format: [name:symbol:uid:checksum]
            </p>
          </div>

          {/* Preview Section */}
          {previewInfo && !errors.configString && (
            <div className="bg-[#0D1117] border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                Token Preview
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm text-white font-medium">{previewInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Symbol:</span>
                  <span className="text-sm text-white font-medium">{previewInfo.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">UID:</span>
                  <span className="text-sm text-white font-mono break-all">
                    {previewInfo.uid.slice(0, 8)}...{previewInfo.uid.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {registrationError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{registrationError}</span>
            </div>
          )}

          {/* Success Message */}
          {registrationSuccess && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-green-400 text-sm">Token registered successfully!</span>
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading || !configString || !!errors.configString}
            className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering token
              </>
            ) : (
              'Register token'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterTokenDialog;
