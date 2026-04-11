import { motion } from "motion/react";

export function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 border-4 border-brand-dark/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 border-4 border-brand-light rounded-full border-t-transparent border-r-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-4 bg-brand-dark rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
