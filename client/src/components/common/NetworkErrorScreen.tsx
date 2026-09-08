import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkErrorScreenProps {
  onRetry: () => void;
  isChecking?: boolean;
}

export const NetworkErrorScreen: React.FC<NetworkErrorScreenProps> = ({
  onRetry,
  isChecking = false,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center relative my-auto"
      >
        {/* Simple Icon Container */}
        <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
          <WifiOff className="w-9 h-9 stroke-[2]" />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          No Internet Connection
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Please check your network settings or Wi-Fi connection and try again.
        </p>

        {/* Simple Tips Checklist */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left mb-6 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-ocean-600 shrink-0" />
            <span>Verify your Wi-Fi or mobile data is turned on</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-ocean-600 shrink-0" />
            <span>Toggle Airplane mode off and on</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-ocean-600 shrink-0" />
            <span>Ensure your network router is connected</span>
          </div>
        </div>

        {/* Simple Action Button */}
        <button
          onClick={onRetry}
          disabled={isChecking}
          className="w-full py-3 px-6 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold text-sm sm:text-base transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking Connection...' : 'Try Again'}</span>
        </button>
      </motion.div>
    </div>
  );
};
