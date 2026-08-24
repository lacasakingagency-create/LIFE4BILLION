-- ==============================================================================
-- LIFE4BILLION SAAS - SCHEMA COMPLETO PARA SUPABASE (POSTGRESQL)
-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Perfis de Usuários (Integrado ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'member', 'guest')),
  phone TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Assinaturas e Planos Stripe
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'trialing' CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
  price_id TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  tier_name TEXT DEFAULT 'Free' CHECK (tier_name IN ('Free', 'Pro Plan', 'Enterprise'))
);

-- 4. Hábitos e Rotinas
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  streak INT DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Metas e Objetivos
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_value NUMERIC(15,2) DEFAULT 0,
  current_value NUMERIC(15,2) DEFAULT 0,
  unit TEXT DEFAULT '',
  deadline DATE,
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'fitness', 'business', 'financial')),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Registros de Saúde Física & Sono
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC(6,2),
  systolic INT,
  diastolic INT,
  sleep_hours NUMERIC(4,2),
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Diário Alimentar & Nutrição
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meal_type TEXT DEFAULT 'breakfast' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories INT DEFAULT 0,
  protein NUMERIC(6,2) DEFAULT 0,
  carbs NUMERIC(6,2) DEFAULT 0,
  fat NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Acompanhamento Gestacional / Gravidez
CREATE TABLE IF NOT EXISTS public.pregnancy_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  week_number INT DEFAULT 1,
  weight NUMERIC(6,2),
  symptoms TEXT,
  baby_size_estimate TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Membros da Família
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT DEFAULT 'other' CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  birth_date DATE,
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Transações Financeiras Pessoais
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable')),
  subcategory TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Orçamentos Mensais
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC(15,2) DEFAULT 0,
  spent_amount NUMERIC(15,2) DEFAULT 0,
  period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Empresas Corporativas (ERP)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Funcionários da Empresa
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  hire_date DATE,
  salary NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  avatar_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Folha de Pagamento
CREATE TABLE IF NOT EXISTS public.payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  base_salary NUMERIC(15,2) DEFAULT 0,
  bonuses NUMERIC(15,2) DEFAULT 0,
  deductions NUMERIC(15,2) DEFAULT 0,
  net_pay NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Produtos do Catálogo / ERP
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(15,2) DEFAULT 0,
  cost NUMERIC(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Estoque de Produtos
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  location TEXT,
  reorder_point INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Clientes / CRM
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Vendas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT DEFAULT 1,
  total_amount NUMERIC(15,2) DEFAULT 0,
  date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Relatórios Gerenciais
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('financial', 'sales', 'inventory', 'employees')),
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Histórico de Consultas da IA Gemini
CREATE TABLE IF NOT EXISTS public.ai_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  provider TEXT DEFAULT 'gemini',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Notificações do Sistema
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Biblioteca Digital / E-Books
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  product_url TEXT,
  category TEXT,
  price NUMERIC(15,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  recommendations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Reserva de Emergência
CREATE TABLE IF NOT EXISTS public.emergency_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_amount NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  deadline DATE,
  purpose TEXT DEFAULT 'job_loss' CHECK (purpose IN ('medical', 'job_loss', 'family', 'unexpected', 'custom')),
  custom_purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Gestão de Dívidas e Passivos
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor TEXT NOT NULL,
  total_amount NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  minimum_payment NUMERIC(15,2) DEFAULT 0,
  due_date DATE,
  category TEXT DEFAULT 'credit_card' CHECK (category IN ('credit_card', 'personal_loan', 'mortgage', 'student_loan', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Cartões de Crédito e Débito
CREATE TABLE IF NOT EXISTS public.financial_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  type TEXT DEFAULT 'credit' CHECK (type IN ('credit', 'debit')),
  brand TEXT DEFAULT 'visa' CHECK (brand IN ('visa', 'master_black', 'master_gold', 'other')),
  limit_amount NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  available_credit NUMERIC(15,2) DEFAULT 0,
  payment_due_date DATE,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  last_4 VARCHAR(4),
  cardholder_name TEXT,
  expiry_date TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Histórico de Dívidas Quitadas
CREATE TABLE IF NOT EXISTS public.paid_debt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor TEXT NOT NULL,
  total_paid NUMERIC(15,2) DEFAULT 0,
  date_completed DATE DEFAULT CURRENT_DATE,
  interest_saved NUMERIC(15,2) DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXAÇÃO DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- ==============================================================================
-- TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL AO REGISTRAR NO SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'owner'
  );

  INSERT INTO public.subscriptions (user_id, status, tier_name, price_id)
  VALUES (
    NEW.id,
    'active',
    'Pro Plan',
    'price_stripe_pro_annual'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS DE ACESSO
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paid_debt_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso permissivas para o usuário autenticado dono dos dados
DO $$
BEGIN
  -- Perfis
  DROP POLICY IF EXISTS "Usuários gerenciam seu próprio perfil" ON public.profiles;
  CREATE POLICY "Usuários gerenciam seu próprio perfil" ON public.profiles FOR ALL USING (auth.uid() = id);

  -- Tabelas do usuário por user_id
  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.habits';
  CREATE POLICY "Acesso por user_id" ON public.habits FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.goals';
  CREATE POLICY "Acesso por user_id" ON public.goals FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.health_records';
  CREATE POLICY "Acesso por user_id" ON public.health_records FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.meals';
  CREATE POLICY "Acesso por user_id" ON public.meals FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.pregnancy_records';
  CREATE POLICY "Acesso por user_id" ON public.pregnancy_records FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.family_members';
  CREATE POLICY "Acesso por user_id" ON public.family_members FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.transactions';
  CREATE POLICY "Acesso por user_id" ON public.transactions FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.budgets';
  CREATE POLICY "Acesso por user_id" ON public.budgets FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.subscriptions';
  CREATE POLICY "Acesso por user_id" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.ai_histories';
  CREATE POLICY "Acesso por user_id" ON public.ai_histories FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.notifications';
  CREATE POLICY "Acesso por user_id" ON public.notifications FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.emergency_funds';
  CREATE POLICY "Acesso por user_id" ON public.emergency_funds FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.debts';
  CREATE POLICY "Acesso por user_id" ON public.debts FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.financial_cards';
  CREATE POLICY "Acesso por user_id" ON public.financial_cards FOR ALL USING (auth.uid() = user_id);

  EXECUTE 'DROP POLICY IF EXISTS "Acesso por user_id" ON public.paid_debt_logs';
  CREATE POLICY "Acesso por user_id" ON public.paid_debt_logs FOR ALL USING (auth.uid() = user_id);

  -- Empresas por owner_id
  EXECUTE 'DROP POLICY IF EXISTS "Proprietário acessa suas empresas" ON public.companies';
  CREATE POLICY "Proprietário acessa suas empresas" ON public.companies FOR ALL USING (auth.uid() = owner_id);

  -- Sub-entidades empresariais isoladas por empresa do proprietário autenticado
  EXECUTE 'DROP POLICY IF EXISTS "Funcionários acessíveis pelo dono" ON public.employees';
  CREATE POLICY "Funcionários acessíveis pelo dono" ON public.employees FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = employees.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Folhas de pagamento acessíveis pelo dono" ON public.payrolls';
  CREATE POLICY "Folhas de pagamento acessíveis pelo dono" ON public.payrolls FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = payrolls.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Produtos acessíveis pelo dono" ON public.products';
  CREATE POLICY "Produtos acessíveis pelo dono" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = products.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Estoque acessível pelo dono" ON public.inventory';
  CREATE POLICY "Estoque acessível pelo dono" ON public.inventory FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = inventory.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Clientes acessíveis pelo dono" ON public.customers';
  CREATE POLICY "Clientes acessíveis pelo dono" ON public.customers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = customers.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Vendas acessíveis pelo dono" ON public.sales';
  CREATE POLICY "Vendas acessíveis pelo dono" ON public.sales FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = sales.company_id AND companies.owner_id = auth.uid())
  );

  EXECUTE 'DROP POLICY IF EXISTS "Relatórios acessíveis pelo dono" ON public.reports';
  CREATE POLICY "Relatórios acessíveis pelo dono" ON public.reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = reports.company_id AND companies.owner_id = auth.uid())
  );

  -- E-books (Acesso público para leitura de publicados, gerenciamento por administradores)
  EXECUTE 'DROP POLICY IF EXISTS "Leitura pública de e-books" ON public.ebooks';
  CREATE POLICY "Leitura pública de e-books" ON public.ebooks FOR SELECT USING (true);

  EXECUTE 'DROP POLICY IF EXISTS "Admin gerencia e-books" ON public.ebooks';
  CREATE POLICY "Admin gerencia e-books" ON public.ebooks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
END $$;
