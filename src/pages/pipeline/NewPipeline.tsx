import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Rocket } from 'lucide-react';

const NewPipeline = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    entity_name: '',
    state: '',
    formation_date: '',
    filing_id: '',
    entity_type: 'LLC'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.intelligence.runPipeline(formData);
      if (res.success && res.leadId) {
        navigate(`/pipeline/${res.leadId}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to initiate pipeline');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 bg-[#0f0f0f] min-h-screen text-gray-200">
      <button onClick={() => navigate('/pipeline')} className="flex items-center text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Directory
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white">Initialize New Pipeline</h1>
        <p className="text-gray-400 mt-2">Enter the raw filing data. The Orchestrator will autonomously enrich the identity, score the EIN confidence, validate the contacts, and qualify the lead.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Entity Name *</label>
            <input 
              type="text" 
              required
              className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Apex Freight LLC"
              value={formData.entity_name}
              onChange={(e) => setFormData({...formData, entity_name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">State Prefix *</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. TX, CA, FL"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Entity Type</label>
              <select 
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 focus:border-emerald-500 focus:outline-none"
                value={formData.entity_type}
                onChange={(e) => setFormData({...formData, entity_type: e.target.value})}
              >
                <option value="LLC">LLC</option>
                <option value="INC">INC</option>
                <option value="CORP">CORP</option>
                <option value="DBA">DBA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Formation Date (Optional)</label>
              <input 
                type="date" 
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                value={formData.formation_date}
                onChange={(e) => setFormData({...formData, formation_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Filing ID (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded px-4 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. 08031201"
                value={formData.filing_id}
                onChange={(e) => setFormData({...formData, filing_id: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex justify-center items-center transition-colors"
        >
          {isSubmitting ? 'Initializing Orchestrator...' : <><Rocket size={20} className="mr-2" /> Launch Intelligence Pipeline</>}
        </button>
      </form>
    </div>
  );
};

export default NewPipeline;
