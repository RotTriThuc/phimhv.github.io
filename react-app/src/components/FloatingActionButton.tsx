/**
 * FloatingActionButton Component
 * 
 * Modern floating action button với hiệu ứng neon cyberpunk
 * Hỗ trợ multiple actions với expand animation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FloatingActionButton.css';

interface Action {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: Action[];
  mainIcon?: string;
}

const FloatingActionButton = ({ 
  actions, 
  mainIcon = '✨' 
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Animation variants
  const containerVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 45 }
  };

  const actionVariants = {
    collapsed: { 
      scale: 0, 
      opacity: 0,
      y: 0
    },
    expanded: (index: number) => ({
      scale: 1,
      opacity: 1,
      y: -(index + 1) * 70,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
        delay: index * 0.05
      }
    })
  };

  return (
    <div className="fab-container">
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggle}
            />
            
            {/* Action buttons */}
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                className="fab-action"
                custom={index}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={actionVariants}
                onClick={() => {
                  action.onClick();
                  setIsExpanded(false);
                }}
                style={{
                  background: action.color || 'var(--gradient-accent)'
                }}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: '0 0 40px rgba(255, 0, 128, 0.5)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="fab-action-icon">{action.icon}</span>
                <span className="fab-action-label">{action.label}</span>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        className={`fab-main ${isExpanded ? 'fab-main-active' : ''}`}
        onClick={handleToggle}
        variants={containerVariants}
        initial="collapsed"
        animate={isExpanded ? 'expanded' : 'collapsed'}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 0 50px rgba(121, 40, 202, 0.5)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="fab-main-icon"
          animate={{ rotate: isExpanded ? 135 : 0 }}
        >
          {mainIcon}
        </motion.span>
        
        {/* Pulsing ring effect */}
        <span className="fab-pulse-ring"></span>
        <span className="fab-pulse-ring"></span>
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;