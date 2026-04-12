import React from 'react';
import { motion, PanInfo } from 'motion/react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-brand-dark/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(event, info: PanInfo) => {
          if (info.offset.y > 100) {
            onClose();
          }
        }}
        className="w-full max-h-[90vh] bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
