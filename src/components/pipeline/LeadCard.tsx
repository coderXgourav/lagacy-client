import React from 'react';
import ScoreBadge from './ScoreBadge';

interface LeadCardProps {
  entity_name: string;
  owner_name?: string;
  lead_level: string;
  ein_confidence_label: string;
  call_window?: string;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  entity_name, 
  owner_name, 
  lead_level, 
  ein_confidence_label, 
  call_window 
}) => {
  let borderColor = "border-gray-800";
  if (lead_level === 'priority') borderColor = "border-red-500 shadow-red-500/20 shadow-lg";
  else if (lead_level === 'hot') borderColor = "border-orange-500 shadow-orange-500/10 shadow-md";
  else if (lead_level === 'warm') borderColor = "border-yellow-500/50";

  return (
    <div className={`p-4 rounded-xl border bg-[#1a1a1a] ${borderColor} transition-all hover:scale-[1.01] cursor-pointer`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-white truncate max-w-[200px]">{entity_name}</h3>
          <p className="text-gray-400 text-sm">{owner_name || "Owner Unknown"}</p>
        </div>
        <ScoreBadge level={lead_level} />
      </div>

      <div className="mt-4 flex flex-col space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">EIN Status:</span>
          <span className="text-gray-300 font-mono capitalize">{ein_confidence_label.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Action:</span>
          <span className="text-emerald-400 truncate max-w-[150px]" title={call_window}>{call_window || "Nurture"}</span>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
