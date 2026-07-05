'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'metrics-grid',
    title: 'Key Metrics',
    description: 'Track your business health at a glance. See total stock value, low stock alerts, active suppliers, and daily sales.',
    position: 'bottom',
  },
  {
    target: 'metric-stock',
    title: 'Total Stock Value',
    description: 'The total value of all inventory in your warehouse. Helps you understand your capital tied up in stock.',
    position: 'right',
  },
  {
    target: 'metric-low-stock',
    title: 'Low Stock Alerts',
    description: 'Products that need restocking. Click to view details and reorder before running out.',
    position: 'right',
  },
  {
    target: 'metric-suppliers',
    title: 'Active Suppliers',
    description: 'Your current supplier relationships and total spending. Helps manage your supply chain.',
    position: 'right',
  },
  {
    target: 'metric-sales',
    title: 'Daily Sales',
    description: 'Today\'s revenue and monthly sales performance. Track your business growth.',
    position: 'right',
  },
  {
    target: 'ai-insights',
    title: 'AI Insights',
    description: 'Smart recommendations powered by AI. Get personalized suggestions for restocking, dead stock, and fast-moving products.',
    position: 'bottom',
  },
  {
    target: 'insight-restock',
    title: 'Products to Restock',
    description: 'AI identifies products running low. Prioritize these to avoid stockouts and lost sales.',
    position: 'right',
  },
  {
    target: 'insight-dead-stock',
    title: 'Dead Stock Alerts',
    description: 'Products that haven\'t sold in 30+ days. Consider discounts or promotions to clear inventory.',
    position: 'right',
  },
  {
    target: 'insight-fast-moving',
    title: 'Fast-Moving Products',
    description: 'Your best sellers. Ensure these are always in stock to maximize revenue.',
    position: 'right',
  },
  {
    target: 'insight-supplier',
    title: 'Top Supplier',
    description: 'Your most valuable supplier relationship. Consider negotiating better terms or volume discounts.',
    position: 'right',
  },
  {
    target: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common tasks at your fingertips. Receive stock, restock items, move inventory, and more.',
    position: 'bottom',
  },
  {
    target: 'action-receive',
    title: 'Receive Stock',
    description: 'Record incoming inventory from suppliers. Updates stock levels automatically.',
    position: 'right',
  },
  {
    target: 'action-restock',
    title: 'Restock Items',
    description: 'Quickly reorder products that are running low. Streamlines your purchasing process.',
    position: 'right',
  },
  {
    target: 'action-move',
    title: 'Move Stock',
    description: 'Transfer inventory between locations or branches. Perfect for multi-location businesses.',
    position: 'right',
  },
];

interface DashboardTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function DashboardTour({ onComplete, onSkip }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = document.querySelector(`[data-tour="${TOUR_STEPS[currentStep].target}"]`) as HTMLElement;
    
    if (targetElement) {
      setHighlightedElement(targetElement);
      const rect = targetElement.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      
      // Scroll element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  if (!highlightedElement) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onSkip} />
      
      {/* Spotlight */}
      <div
        ref={spotlightRef}
        className="fixed z-50 pointer-events-none transition-all duration-300 ease-in-out"
        style={{
          top: position.top - 8,
          left: position.left - 8,
          width: position.width + 16,
          height: position.height + 16,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px #6B3FE7',
          borderRadius: '12px',
        }}
      >
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-xl animate-pulse bg-purple-500/10" />
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 max-w-sm transition-all duration-300 ease-in-out"
        style={{
          top: step.position === 'bottom' ? position.top + position.height + 20 : position.top - 200,
          left: step.position === 'right' ? position.left + position.width + 20 : position.left - 320,
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-purple-600' : index < currentStep ? 'bg-purple-300' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {TOUR_STEPS.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step.description}</p>

        {/* Action hint */}
        {step.action && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-purple-700 font-medium">{step.action}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>
                <Check size={16} />
                Got it!
              </>
            ) : (
              <>
                Next
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        {currentStep < TOUR_STEPS.length - 1 && (
          <button
            onClick={onSkip}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>
    </>
  );
}
