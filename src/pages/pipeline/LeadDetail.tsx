import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ArrowLeft, User, Link as LinkIcon, Phone, Mail, Building2, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import StageTracker from '../../components/pipeline/StageTracker';
import ScoreBadge from '../../components/pipeline/ScoreBadge';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Poll aggressively if raw/pending processing, otherwise poll slower
  const { data: statusData, refetch } = useQuery({
    queryKey: ['leadStatus', id],
    queryFn: () => api.intelligence.getLeadStatus(id!),
    refetchInterval: (data: any) => {
      const isDone = data && (data.lead?.pipeline_stage === 'qualified' || data.lead?.pipeline_stage === 'dead');
      return isDone ? 30000 : 2000; // Poll every 2s while running
    }
  });

  const lead = statusData?.lead;
  const isFailed = statusData?.jobs?.some((j: any) => j.status === 'failed');

  if (!lead) return <div className="p-8 text-white text-center">Loading Lead Data...</div>;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (lead.ein_confidence_score / 100) * circumference;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-[#0f0f0f] min-h-screen text-gray-200">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <button onClick={() => navigate('/pipeline')} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Pipeline
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-4">
              <span>{lead.entity_name}</span>
              <ScoreBadge level={lead.lead_level} />
            </h1>
            <p className="text-gray-400 mt-1 uppercase tracking-wider text-sm">{lead.entity_type} • {lead.state} • {lead.filing_id}</p>
          </div>
        </div>
        
        {/* EIN Circular Ring */}
        <div className="flex flex-col items-center bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
              <circle 
                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                className={lead.ein_confidence_score > 60 ? 'text-emerald-500' : lead.ein_confidence_score > 30 ? 'text-yellow-500' : 'text-red-500'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" 
              />
            </svg>
            <span className="absolute text-2xl font-bold text-white">{lead.ein_confidence_score}</span>
          </div>
          <span className="text-xs text-gray-500 mt-2 tracking-widest uppercase">EIN Confidence</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800">
        <StageTracker currentStage={lead.pipeline_stage} isFailed={isFailed} />
      </div>

      {lead.disqualified && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center text-red-500">
          <AlertCircle className="mr-3" />
          <div>
            <p className="font-bold">Lead Disqualified</p>
            <p className="text-sm opacity-80">{lead.disqualify_reason || lead.outreach_blocked_reason}</p>
          </div>
        </div>
      )}

      {lead.pitch_angle && !lead.disqualified && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-emerald-400 mb-2 uppercase flex items-center tracking-wider">
            <MessageSquare size={16} className="mr-2" /> OpenAI Action Pitch
          </h3>
          <p className="text-lg text-white font-medium italic">"{lead.pitch_angle}"</p>
          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-center text-sm">
            <span className="text-gray-400">Recommended Action Window:</span>
            <span className="text-emerald-400 font-bold">{lead.call_window}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Info Panel */}
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl space-y-6">
          <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold border-b border-gray-800 pb-2">Intelligence Target</h3>
          
          {lead.owner_name ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/10 p-3 rounded-full text-blue-400"><User size={20} /></div>
                <div>
                  <p className="text-white font-bold">{lead.owner_name}</p>
                  <p className="text-gray-500 text-sm">{lead.owner_role || 'Role Unknown'}</p>
                </div>
                {lead.identity_match === 'true' && <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />}
              </div>

              {lead.owner_phone && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone size={16} className="text-gray-500" />
                  <span>{lead.owner_phone}</span>
                  {lead.phone_valid && <span className="text-emerald-500 text-xs bg-emerald-500/10 px-2 py-0.5 rounded">Verified {lead.phone_type}</span>}
                </div>
              )}

              {lead.owner_email && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail size={16} className="text-gray-500" />
                  <span>{lead.owner_email}</span>
                  {lead.email_valid && <span className="text-emerald-500 text-xs bg-emerald-500/10 px-2 py-0.5 rounded">DNS Verified</span>}
                </div>
              )}
            </div>
          ) : (
             <div className="text-gray-600 italic text-center py-8">Owner intelligence not found for this entity.</div>
          )}
        </div>

        {/* Company Info Panel */}
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl space-y-6">
          <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold border-b border-gray-800 pb-2">Business Presence</h3>
          
          <div className="space-y-4">
            {lead.website ? (
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="flex items-center space-x-3 text-blue-400 hover:underline">
                <LinkIcon size={16} />
                <span>{lead.website}</span>
              </a>
            ) : (
              <div className="flex items-center space-x-3 text-gray-600">
                <LinkIcon size={16} />
                <span>No website found</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-gray-300">
               <Building2 size={16} className="text-gray-500" />
               <span>Google Business Profile: {lead.google_business_found ? 'Active' : 'Unclaimed'}</span>
            </div>

            {lead.ein_score_breakdown && (
              <div className="bg-[#0f0f0f] border border-gray-800 p-4 rounded-lg mt-4 text-xs font-mono text-gray-400 space-y-2">
                <div className="flex justify-between"><span>Age &gt; 15 Days</span> <span className={lead.ein_score_breakdown.older_than_15_days ? "text-emerald-500" : "text-gray-600"}>{lead.ein_score_breakdown.older_than_15_days ? "[ YES ]" : "[ NO ]"}</span></div>
                <div className="flex justify-between"><span>Payment Gateway</span> <span className={lead.ein_score_breakdown.has_payment_gateway ? "text-emerald-500" : "text-gray-600"}>{lead.ein_score_breakdown.has_payment_gateway ? "[ YES ]" : "[ NO ]"}</span></div>
                <div className="flex justify-between"><span>Legal/Terms</span> <span className={lead.ein_score_breakdown.has_invoice_or_legal_page ? "text-emerald-500" : "text-gray-600"}>{lead.ein_score_breakdown.has_invoice_or_legal_page ? "[ YES ]" : "[ NO ]"}</span></div>
                <div className="flex justify-between"><span>BBB/Credit File</span> <span className={lead.ein_score_breakdown.has_bbb_or_credit_profile ? "text-emerald-500" : "text-gray-600"}>{lead.ein_score_breakdown.has_bbb_or_credit_profile ? "[ YES ]" : "[ NO ]"}</span></div>
                {lead.ein_score_breakdown.is_shell_or_agent_only && <div className="text-red-500 mt-2">! Shell / Registered Agent Penalty Applied</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
