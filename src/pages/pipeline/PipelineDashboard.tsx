import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Users, AlertTriangle, ShieldCheck, Play, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LeadCard from '../../components/pipeline/LeadCard';

const PipelineDashboard = () => {
  const navigate = useNavigate();
  const [filterStage, setFilterStage] = useState('all');

  const { data: statsData } = useQuery({
    queryKey: ['intelligenceStats'],
    queryFn: () => api.intelligence.getPipelineStats(),
    refetchInterval: 30000
  });

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['intelligenceLeads', filterStage],
    queryFn: () => api.intelligence.getAllLeads({ stage: filterStage, limit: 100 }),
    refetchInterval: 15000
  });

  const stats = statsData?.stats || { total_qualified: 0, total_disqualified: 0, average_ein_score: 0 };
  const leads = leadsData?.leads || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0f0f0f] min-h-screen text-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            MERN Intelligence Pipeline
          </h1>
          <p className="text-gray-400 mt-2">Autonomous 5-Stage Enrichment & Qualification Orchestrator</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => navigate('/pipeline/new')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded flex items-center font-semibold transition-colors">
            <Play size={18} className="mr-2" /> Start Pipeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl flex items-center space-x-4">
          <div className="p-4 bg-blue-500/10 rounded-lg text-blue-400"><Users size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Total Processed</p>
            <p className="text-2xl font-bold font-mono">{leadsData?.total || 0}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/10 rounded-lg text-emerald-400"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Qualified Leads</p>
            <p className="text-2xl font-bold font-mono">{stats.total_qualified}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl flex items-center space-x-4">
          <div className="p-4 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Disqualified</p>
            <p className="text-2xl font-bold font-mono">{stats.total_disqualified}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl flex items-center space-x-4">
          <div className="p-4 bg-purple-500/10 rounded-lg text-purple-400"><Target size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Avg EIN Score</p>
            <p className="text-2xl font-bold font-mono">{Math.round(stats.average_ein_score)}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Intelligence Directory</h2>
          <select 
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Stages</option>
            <option value="raw">Raw / In Queue</option>
            <option value="qualified">Qualified</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Loading Pipeline Data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {leads.length > 0 ? leads.map((lead: any) => (
              <div key={lead._id} onClick={() => navigate(`/pipeline/${lead._id}`)}>
                <LeadCard 
                  entity_name={lead.entity_name}
                  owner_name={lead.owner_name}
                  lead_level={lead.lead_level}
                  ein_confidence_label={lead.ein_confidence_label}
                  call_window={lead.call_window}
                />
              </div>
            )) : (
              <div className="col-span-3 text-center py-12 border border-dashed border-gray-800 rounded-lg text-gray-500">
                No leads found in this stage.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineDashboard;
