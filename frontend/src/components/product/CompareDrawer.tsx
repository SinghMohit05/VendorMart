import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { Button } from '../ui/Button';

export const CompareDrawer: React.FC = () => {
  const { compareIds, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 max-w-lg w-full"
      >
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">
              Comparing {compareIds.length} Product{compareIds.length > 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-slate-400">
              Side-by-side local vendor pricing analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/compare')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Compare Now
          </Button>

          <button
            onClick={clearCompare}
            title="Clear comparison"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
