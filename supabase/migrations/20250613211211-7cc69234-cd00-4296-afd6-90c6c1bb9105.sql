
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create user_approvals table
CREATE TABLE public.user_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status user_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_approvals
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into user_approvals with pending status
  INSERT INTO public.user_approvals (user_id, status)
  VALUES (NEW.id, 'pending');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- Insert the first admin user (luke.turner@dcaam.com)
-- Note: This will only work if the user exists in auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find the admin user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'luke.turner@dcaam.com';
  
  -- If user exists, make them admin and approve them
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Approve the user
    INSERT INTO public.user_approvals (user_id, status, approved_at)
    VALUES (admin_user_id, 'approved', now())
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'approved',
      approved_at = now();
  END IF;
END;
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for user_approvals
CREATE POLICY "Users can view their own approval status" ON public.user_approvals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all approvals" ON public.user_approvals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update approvals" ON public.user_approvals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for existing tables to be more restrictive
-- Drop existing permissive policies and create restrictive ones

-- Deals policies
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update all deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete all deals" ON public.deals;

CREATE POLICY "Approved users can view all deals" ON public.deals
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create deals" ON public.deals
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update deals" ON public.deals
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete deals" ON public.deals
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Investors policies
DROP POLICY IF EXISTS "Users can view all investors" ON public.investors;
DROP POLICY IF EXISTS "Users can create investors" ON public.investors;
DROP POLICY IF EXISTS "Users can update all investors" ON public.investors;
DROP POLICY IF EXISTS "Users can delete all investors" ON public.investors;

CREATE POLICY "Approved users can view all investors" ON public.investors
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create investors" ON public.investors
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update investors" ON public.investors
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete investors" ON public.investors
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Portfolio companies policies
DROP POLICY IF EXISTS "Users can view all portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Users can create portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Users can update all portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Users can delete all portfolio companies" ON public.portfolio_companies;

CREATE POLICY "Approved users can view all portfolio companies" ON public.portfolio_companies
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create portfolio companies" ON public.portfolio_companies
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update portfolio companies" ON public.portfolio_companies
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete portfolio companies" ON public.portfolio_companies
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Similar updates for other tables (contacts, call_notes, reminders, file_attachments)
-- Contacts policies
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete all contacts" ON public.contacts;

CREATE POLICY "Approved users can view all contacts" ON public.contacts
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete contacts" ON public.contacts
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_approvals_user_id ON public.user_approvals(user_id);
CREATE INDEX idx_user_approvals_status ON public.user_approvals(status);
