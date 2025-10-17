-- Create searches table to track all search operations
CREATE TABLE public.searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  radius INTEGER NOT NULL,
  category TEXT,
  lead_limit INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_leads INTEGER DEFAULT 0,
  legacy_sites_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table to store discovered business leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website_url TEXT,
  domain_created_date DATE,
  is_legacy BOOLEAN DEFAULT false,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_name TEXT,
  business_category TEXT,
  facebook_page TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (admin-only app)
CREATE POLICY "Allow all access to searches" 
ON public.searches 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to leads" 
ON public.leads 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_searches_status ON public.searches(status);
CREATE INDEX idx_searches_created_at ON public.searches(created_at DESC);
CREATE INDEX idx_leads_search_id ON public.leads(search_id);
CREATE INDEX idx_leads_is_legacy ON public.leads(is_legacy);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_searches_updated_at
BEFORE UPDATE ON public.searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();