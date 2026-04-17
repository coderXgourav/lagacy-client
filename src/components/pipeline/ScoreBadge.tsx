import React from 'react';

interface ScoreBadgeProps {
  level: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ level }) => {
  let bgColor = "bg-gray-600";
  let label = "Cold";

  switch (level?.toLowerCase()) {
    case "priority":
      bgColor = "bg-red-500 text-white";
      label = "Priority";
      break;
    case "hot":
      bgColor = "bg-orange-500 text-white";
      label = "Hot";
      break;
    case "warm":
      bgColor = "bg-yellow-500 text-black";
      label = "Warm";
      break;
    case "cold":
      bgColor = "bg-gray-500 text-white";
      label = "Cold";
      break;
    case "unqualified":
      bgColor = "bg-slate-700 text-gray-300";
      label = "Unqualified";
      break;
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${bgColor}`}>
      {label}
    </span>
  );
};

export default ScoreBadge;
