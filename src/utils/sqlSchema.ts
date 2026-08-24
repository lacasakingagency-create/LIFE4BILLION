/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- LIFE4BILLION POSTGRESQL / SUPABASE PRODUCTION DATABASE SCHEMA
-- Projetado para alta performance, integridade referencial e 
-- isolamento de segurança multi-inquilino (Row-Level Security - RLS).
-- Pronto para escalar para milhões de usuários.
-- ====================================================================

-- Habilitar extensões comuns necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS & PROFILES (Isolamento por Usuário)
-- ==========================================

-- Nota: A tabela auth.users é gerenciada nativamente pelo Supabase Auth.
-- Criamos perfis adicionais na tabela pública associada a ela.

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'owner'::text CHECK (role IN ('admin', 'owner', 'member', 'guest')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ler seus próprios perfis" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Gatilho automático para criar Perfil quando um novo Usuário se cadastrar no Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro Life4Billion'),
    NEW.raw_user_meta_data->>'avatar_url',
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 2. SUBSCRIPTIONS (Assinaturas Stripe)
-- ==========================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')) NOT NULL,
    price_id TEXT NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    tier_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários acessam apenas suas próprias assinaturas" 
ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);


-- ==========================================
-- 3. HABITS (Hábitos Diários)
-- ==========================================

CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily'::text NOT NULL,
    streak INTEGER DEFAULT 0 NOT NULL,
    last_completed DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerenciamento de hábitos individuais" 
ON public.habits FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_habits_user_id ON public.habits(user_id);


-- ==========================================
-- 4. GOALS (Objetivos com Alvo)
-- ==========================================

CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0 NOT NULL,
    unit TEXT NOT NULL,
    deadline DATE NOT NULL,
    category TEXT CHECK (category IN ('personal', 'fitness', 'business', 'financial')) NOT NULL,
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerenciamento de metas individuais" 
ON public.goals FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);


-- ==========================================
-- 5. HEALTH RECORDS (Saúde Diária)
-- ==========================================

CREATE TABLE public.health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    weight NUMERIC,
    systolic INTEGER,
    diastolic INTEGER,
    sleep_hours NUMERIC,
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso à saúde privada" 
ON public.health_records FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_health_user_date ON public.health_records(user_id, date);


-- ==========================================
-- 6. MEALS (Nutrição e Dietas)
-- ==========================================

CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso à nutrição pessoal" 
ON public.meals FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);


-- ==========================================
-- 7. PREGNANCY RECORDS (Acompanhamento Gestacional)
-- ==========================================

CREATE TABLE public.pregnancy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    week_number INTEGER NOT NULL,
    weight NUMERIC,
    symptoms TEXT,
    baby_size_estimate TEXT,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.pregnancy_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso à gestação pessoal" 
ON public.pregnancy_records FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 8. FAMILY MEMBERS (Família)
-- ==========================================

CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')) NOT NULL,
    birth_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a registros da família" 
ON public.family_members FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 9. TRANSACTIONS (Lançamentos Financeiros)
-- ==========================================

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso às finanças privadas" 
ON public.transactions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);


-- ==========================================
-- 10. BUDGETS (Orçamentos Mensais)
-- ==========================================

CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    limit_amount NUMERIC(12,2) NOT NULL,
    spent_amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
    period VARCHAR(7) NOT NULL, -- Formato 'AAAA-MM'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, category, period)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a limites de orçamentos" 
ON public.budgets FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 11. COMPANIES (ERP Corporativo)
-- ==========================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tax_id TEXT UNIQUE NOT NULL,
    address TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Proprietários controlam as empresas que criaram
CREATE POLICY "Empresas acessíveis pelo proprietário" 
ON public.companies FOR ALL USING (auth.uid() = owner_id);


-- ==========================================
-- 12. EMPLOYEES (RH e Funcionários)
-- ==========================================

CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    hire_date DATE NOT NULL,
    salary NUMERIC(12,2) NOT NULL,
    status TEXT CHECK (status IN ('active', 'suspended', 'terminated')) DEFAULT 'active'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Permite acesso aos funcionários se o usuário atual for dono da empresa
CREATE POLICY "Funcionários acessíveis pelo dono" 
ON public.employees FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = employees.company_id AND companies.owner_id = auth.uid()
  )
);

CREATE INDEX idx_employees_company ON public.employees(company_id);


-- ==========================================
-- 13. PAYROLL (Folha de Pagamento)
-- ==========================================

CREATE TABLE public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    pay_period VARCHAR(7) NOT NULL, -- Formato 'AAAA-MM'
    base_salary NUMERIC(12,2) NOT NULL,
    bonuses NUMERIC(12,2) DEFAULT 0 NOT NULL,
    deductions NUMERIC(12,2) DEFAULT 0 NOT NULL,
    net_pay NUMERIC(12,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processed', 'paid')) DEFAULT 'pending'::text NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Folha de pagamento acessível pelo dono da empresa" 
ON public.payroll FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees
    JOIN public.companies ON companies.id = employees.company_id
    WHERE employees.id = payroll.employee_id AND companies.owner_id = auth.uid()
  )
);


-- ==========================================
-- 14. PRODUCTS (Catálogo de Produtos)
-- ==========================================

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos acessíveis pelo dono" 
ON public.products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = products.company_id AND companies.owner_id = auth.uid()
  )
);


-- ==========================================
-- 15. INVENTORY (Estoque)
-- ==========================================

CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 0 NOT NULL,
    location TEXT,
    reorder_point INTEGER DEFAULT 5 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(product_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estoque acessível pelo dono" 
ON public.inventory FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.products
    JOIN public.companies ON companies.id = products.company_id
    WHERE products.id = inventory.product_id AND companies.owner_id = auth.uid()
  )
);


-- ==========================================
-- 16. CUSTOMERS (CRM Clientes)
-- ==========================================

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tags TEXT[], -- Array de tags para segmentação (ex: VIP, Novo, Ativo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes acessíveis pelo dono" 
ON public.customers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = customers.company_id AND companies.owner_id = auth.uid()
  )
);


-- ==========================================
-- 17. SALES (Vendas)
-- ==========================================

CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT CHECK (status IN ('completed', 'pending', 'refunded')) DEFAULT 'completed'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendas acessíveis pelo dono" 
ON public.sales FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = sales.company_id AND companies.owner_id = auth.uid()
  )
);

CREATE INDEX idx_sales_company ON public.sales(company_id);


-- ==========================================
-- 18. REPORTS (Relatórios Gerenciais)
-- ==========================================

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('financial', 'sales', 'inventory', 'employees')) NOT NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL, -- Métricas consolidadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relatórios acessíveis pelo dono" 
ON public.reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = reports.company_id AND companies.owner_id = auth.uid()
  )
);


-- ==========================================
-- 19. AI_HISTORY (Histórico de Consultas IA)
-- ==========================================

CREATE TABLE public.ai_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Histórico IA individual" 
ON public.ai_history FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 20. NOTIFICATIONS (Notificações do Sistema)
-- ==========================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notificações individuais" 
ON public.notifications FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;


-- ==========================================
-- 21. NET_WORTH_ITEMS (Patrimônio e Wealth Tracking)
-- ==========================================

CREATE TABLE public.net_worth_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('asset', 'liability')) NOT NULL,
    category TEXT CHECK (category IN (
        'Properties', 'Vehicles', 'Businesses', 'Investments', 
        'Gold & Precious Metals', 'Collectibles', 'Electronics', 'Insurance', 'Other'
    )) NOT NULL,
    name TEXT NOT NULL,
    purchase_price NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    estimated_value NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    photo TEXT, -- Armazenamento base64 / URL do anexo
    receipt TEXT, -- Armazenamento base64 / URL do recibo
    document TEXT, -- Armazenamento base64 / URL do comprovante
    photo_name TEXT,
    receipt_name TEXT,
    document_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.net_worth_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerenciamento de patrimônio individual" 
ON public.net_worth_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_net_worth_user ON public.net_worth_items(user_id);
CREATE INDEX idx_net_worth_category ON public.net_worth_items(category);


-- ==========================================
-- 22. CALCULATOR_PREFERENCES (Favoritos e Recentes)
-- ==========================================

CREATE TABLE public.calculator_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    favorites TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    recently_used TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.calculator_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preferências de calculadora individuais" 
ON public.calculator_preferences FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 23. USER ROLES & PERMISSIONS (RBAC Seguro)
-- ==========================================

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'owner', 'member', 'guest')) DEFAULT 'member' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem consultar seus próprios papéis
CREATE POLICY "Leitura dos próprios papéis" 
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Somente administradores verificados podem gerenciar permissões
CREATE POLICY "Administradores gerenciam papéis" 
ON public.user_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid() AND r.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);


-- ==========================================
-- 24. EBOOKS (Learning Hub - Livros e Guias Digitais)
-- ==========================================

CREATE TABLE public.ebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    product_url TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(15,2),
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    status TEXT CHECK (status IN ('published', 'draft')) DEFAULT 'draft' NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    ai_recommendation_data JSONB DEFAULT '{}'::JSONB NOT NULL,
    views_count INTEGER DEFAULT 0 NOT NULL,
    clicks_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- Usuários comuns podem apenas visualizar livros com status publicado
CREATE POLICY "Leitura pública de livros publicados" 
ON public.ebooks FOR SELECT USING (status = 'published');

-- Apenas o administrador autorizado pode criar, editar ou excluir e-books
CREATE POLICY "Gerenciamento exclusivo de livros por Administrador" 
ON public.ebooks FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- ==========================================
-- 25. CRIAÇÃO DE ÍNDICES ADICIONAIS PARA DESEMPENHO
-- ==========================================

-- Índices adicionais para otimização de consultas
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_customers_company ON public.customers(company_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_budgets_period ON public.budgets(period);
CREATE INDEX idx_ebooks_status ON public.ebooks(status);
CREATE INDEX idx_ebooks_featured ON public.ebooks(is_featured);

`;
