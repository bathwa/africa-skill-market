
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE opportunity_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE escrow_type AS ENUM ('mobile_wallet', 'bank');

-- Users profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  country TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 10,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service providers table
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  website TEXT,
  experience INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_projects INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  budget TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  files JSONB DEFAULT '[]',
  access_count INTEGER NOT NULL DEFAULT 0,
  max_access INTEGER NOT NULL DEFAULT 3,
  status opportunity_status NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Token transactions table
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'spend', 'referral_bonus'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment vouchers table
CREATE TABLE public.payment_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  tokens INTEGER NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  escrow_account_id UUID NOT NULL,
  proof_of_payment TEXT, -- Can be text, file path, or base64
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Escrow accounts table
CREATE TABLE public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type escrow_type NOT NULL,
  name TEXT NOT NULL,
  details TEXT NOT NULL,
  country TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunity access table (tracks who purchased access to which opportunities)
CREATE TABLE public.opportunity_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

-- Service provider access table (tracks who purchased access to which providers)
CREATE TABLE public.provider_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, user_id)
);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, provider_id, opportunity_id)
);

-- Project completions table
CREATE TABLE public.project_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status project_status NOT NULL DEFAULT 'pending',
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_awarded INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- RLS Policies for service_providers
CREATE POLICY "Anyone can view active service providers from same country" ON public.service_providers
  FOR SELECT USING (
    is_active = true AND 
    (country = (SELECT country FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can manage their own provider profile" ON public.service_providers
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for opportunities
CREATE POLICY "Anyone can view active opportunities from same country" ON public.opportunities
  FOR SELECT USING (
    is_active = true AND 
    (country = (SELECT country FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can manage their own opportunities" ON public.opportunities
  FOR ALL USING (auth.uid() = client_id);

-- RLS Policies for token_transactions
CREATE POLICY "Users can view their own transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.token_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payment_vouchers
CREATE POLICY "Users can view their own vouchers" ON public.payment_vouchers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own vouchers" ON public.payment_vouchers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vouchers" ON public.payment_vouchers
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can update voucher status" ON public.payment_vouchers
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for escrow_accounts
CREATE POLICY "Users can view escrow accounts from their country" ON public.escrow_accounts
  FOR SELECT USING (
    is_active = true AND 
    (country = (SELECT country FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage escrow accounts" ON public.escrow_accounts
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for opportunity_access
CREATE POLICY "Users can view their own access records" ON public.opportunity_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access records" ON public.opportunity_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for provider_access
CREATE POLICY "Users can view their own access records" ON public.provider_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access records" ON public.provider_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ratings
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- RLS Policies for project_completions
CREATE POLICY "Related users can view project completions" ON public.project_completions
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT user_id FROM public.service_providers WHERE id = provider_id) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Clients and providers can manage project completions" ON public.project_completions
  FOR ALL USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT user_id FROM public.service_providers WHERE id = provider_id)
  );

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- RLS Policies for announcements
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Insert default escrow accounts for Zimbabwe
INSERT INTO public.escrow_accounts (type, name, details, country) VALUES
  ('mobile_wallet', 'Mobile Wallets (Ecocash, Omari, Innbucks)', '0788420479 - Vusa Ncube', 'Zimbabwe'),
  ('bank', 'Innbucks MicroBank', 'Account Name: Abathwa Incubator PBC\nAccount Number: 013113351190001', 'Zimbabwe');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE 
      WHEN NEW.email IN ('abathwabiz@gmail.com', 'admin@abathwa.com', 'vvv.skillzone@gmail.com') THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END,
    COALESCE(NEW.raw_user_meta_data->>'country', 'Zimbabwe')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user tokens
CREATE OR REPLACE FUNCTION public.update_user_tokens(user_id UUID, token_amount INTEGER, transaction_type TEXT, description TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Update user's token balance
  UPDATE public.profiles 
  SET tokens = tokens + token_amount, updated_at = NOW()
  WHERE id = user_id;
  
  -- Record transaction
  INSERT INTO public.token_transactions (user_id, amount, transaction_type, description)
  VALUES (user_id, token_amount, transaction_type, description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref_number TEXT;
BEGIN
  ref_number := 'SZ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN ref_number;
END;
$$ LANGUAGE plpgsql;
