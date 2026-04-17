import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface StageTrackerProps {
  currentStage: string;
  isFailed?: boolean;
}

const STAGES = [
  { id: 'raw', label: 'Raw' },
  { id: 'identity', label: 'Identity' },
  { id: 'owner', label: 'Owner' },
  { id: 'ein_score', label: 'EIN Score' },
  { id: 'contact', label: 'Contact' },
  { id: 'qualify', label: 'Qualified' }
];

const MAPPING: Record<string, number> = {
  raw: 0,
  identity_enriched: 1,
  owner_found: 2,
  ein_scored: 3,
  contact_validated: 4,
  qualified: 5,
  outreach_sent: 5,
  engaged: 5,
  converted: 5,
  dead: 5
};

const StageTracker: React.FC<StageTrackerProps> = ({ currentStage, isFailed = false }) => {
  const currentIndex = MAPPING[currentStage] !== undefined ? MAPPING[currentStage] : -1;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-800 -z-10 -translate-y-1/2 rounded" />
        
        {STAGES.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          let Icon = Circle;
          let colorClass = "text-gray-700 bg-[#0f0f0f]";

          if (isCompleted) {
            Icon = CheckCircle2;
            colorClass = "text-emerald-500 bg-[#0f0f0f]";
          } else if (isCurrent && isFailed) {
            Icon = XCircle;
            colorClass = "text-red-500 bg-[#0f0f0f]";
          } else if (isCurrent) {
            Icon = Loader2;
            colorClass = "text-blue-500 bg-[#0f0f0f] animate-spin";
          }

          return (
            <div key={step.id} className="flex flex-col items-center group relative bg-[#0f0f0f] px-1">
              <Icon size={24} className={colorClass} strokeWidth={isCompleted || isCurrent ? 2.5 : 2} />
              <span className={`absolute top-8 text-[10px] whitespace-nowrap font-medium 
                ${isCompleted ? 'text-emerald-500/80' : isCurrent ? 'text-blue-400' : 'text-gray-600'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageTracker;
