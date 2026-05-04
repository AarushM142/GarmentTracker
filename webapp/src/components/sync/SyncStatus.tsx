'use client';

import { useSync } from '@/hooks/use-sync';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SyncStatus({ isCollapsed }: { isCollapsed?: boolean }) {
  const { isOnline, syncStatus, pendingCount, processQueue } = useSync();

  const config = {
    synced: {
      color: 'bg-primary/10 text-primary',
      icon: CheckCircle2,
      label: 'Synced',
      borderColor: 'border-primary/20',
      spin: false,
    },
    offline: {
      color: 'bg-muted text-muted-foreground',
      icon: WifiOff,
      label: 'Offline',
      borderColor: 'border-border',
      spin: false,
    },
    syncing: {
      color: 'bg-secondary/10 text-secondary',
      icon: RefreshCw,
      label: 'Syncing',
      borderColor: 'border-secondary/20',
      spin: true,
    },
    failed: {
      color: 'bg-destructive/10 text-destructive',
      icon: AlertCircle,
      label: 'Sync Error',
      borderColor: 'border-destructive/20',
      spin: false,
    },
  };

  const current = config[syncStatus];
  const Icon = current.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={syncStatus}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={() => syncStatus === 'failed' && processQueue()}
        className={cn(
          "flex items-center gap-2 rounded-full border shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95",
          current.borderColor,
          current.color,
          isCollapsed ? "p-2 aspect-square justify-center" : "px-3 py-1.5"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-3.5 h-3.5", current.spin && "animate-spin")} />
          {pendingCount > 0 && syncStatus !== 'syncing' && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-sm">
              {pendingCount}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="text-[11px] font-bold uppercase tracking-widest animate-fade-in">
            {current.label}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
