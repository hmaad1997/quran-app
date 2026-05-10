import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  interactive?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ children, interactive, className = '', ...rest }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={[
          'glass p-5',
          interactive ? 'transition hover:border-white/20 hover:bg-white/[0.06]' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
