import { useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";

type ActionNotificationProps = {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  durationMs?: number;
};

export default function ActionNotification({
  title,
  message,
  isOpen,
  onClose,
  durationMs = 3000,
}: ActionNotificationProps) {
  const barControls = useAnimationControls();

  useEffect(() => {
    if (!isOpen) return;

    // Reset bar to full width
    barControls.set({ scaleX: 1 });

    // Start countdown animation
    barControls.start({
      scaleX: 0,
      transition: {
        duration: durationMs / 1000,
        ease: "linear",
      },
    });

    const timer = setTimeout(onClose, durationMs);

    return () => {
      clearTimeout(timer);
      barControls.stop(); // interrupt animation immediately
    };
  }, [isOpen, durationMs, onClose, barControls]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white py-6 px-2 shadow-xl select-none"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h1 className="text-center font-bold text-2xl">
              {title}
            </h1>

            <p className="mb-4 text-center text-gray-800">
              {message}
            </p>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="rounded-lg bg-black/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/60 active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* ⏱️ Timer bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 w-full origin-right bg-black/90"
              animate={barControls}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
