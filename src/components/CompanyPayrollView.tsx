/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Plus, 
  Trash2, 
  Calculator, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Briefcase, 
  AlertCircle, 
  X, 
  Clock, 
  UserPlus,
  FileSpreadsheet,
  Printer,
  Search,
  Sliders,
  Settings,
  Grid
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Company, Employee, Payroll } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface SpreadsheetTemplate {
  category: string;
  name: string;
  useCase: string;
  cols: string[];
  rows: any[];
}

const UNIVERSAL_SPREADSHEETS: SpreadsheetTemplate[] = [
  {
    category: 'Recrutamento',
    name: 'Controle de Candidatos (ATS simples)',
    useCase: 'Gerenciar vagas, candidatos e etapas do processo seletivo.',
    cols: ['Candidato', 'Vaga', 'Etapa Atual', 'Nota Entrevista', 'Responsável', 'Status'],
    rows: [
      { id: '1', field0: 'Amanda Silva', field1: 'Desenvolvedora Frontend', field2: 'Entrevista Técnica', field3: '4.5', field4: 'Lucas King', field5: 'Em Andamento' },
      { id: '2', field0: 'Bruno Souza', field1: 'Gerente de Produto', field2: 'Proposta Enviada', field3: '4.8', field4: 'Lucas King', field5: 'Aprovado' },
      { id: '3', field0: 'Carla Dias', field1: 'UI/UX Designer', field2: 'Triagem de Portfólio', field3: '3.9', field4: 'Mariana Costa', field5: 'Em Triagem' },
      { id: '4', field0: 'Daniel Lima', field1: 'Engenheiro de Dados', field2: 'Reprovado', field3: '2.5', field4: 'Pedro Rocha', field5: 'Arquivado' }
    ]
  },
  {
    category: 'Recrutamento',
    name: 'Banco de Talentos',
    useCase: 'Cadastro de candidatos para futuras oportunidades.',
    cols: ['Nome Completo', 'Área Principal', 'Anos Exp', 'Pretensão Salarial', 'Contato', 'Observação'],
    rows: [
      { id: '1', field0: 'Eduardo Santos', field1: 'Infraestrutura / Devops', field2: '5', field3: 'R$ 8.500', field4: 'edu@email.com', field5: 'Excelente perfil cloud' },
      { id: '2', field0: 'Fernanda Lima', field1: 'Customer Success', field2: '2', field3: 'R$ 4.000', field4: 'fer@email.com', field5: 'Destaque em empatia' },
      { id: '3', field0: 'Gustavo Cruz', field1: 'Desenvolvedor Backend', field2: '4', field3: 'R$ 7.500', field4: 'gus@email.com', field5: 'Conhecimento em NestJS' }
    ]
  },
  {
    category: 'Recrutamento',
    name: 'Cronograma de Entrevistas',
    useCase: 'Organizar entrevistas e responsáveis.',
    cols: ['Candidato', 'Vaga', 'Data/Hora', 'Entrevistador', 'Link Sala', 'Status'],
    rows: [
      { id: '1', field0: 'Thiago Neves', field1: 'Product Designer', field2: '15/07/2026 14:00', field3: 'Mariana Costa', field4: 'meet.google.com/abc', field5: 'Confirmado' },
      { id: '2', field0: 'Sofia Loren', field1: 'Data Analyst', field2: '16/07/2026 10:00', field3: 'Lucas King', field4: 'meet.google.com/xyz', field5: 'Aguardando' }
    ]
  },
  {
    category: 'Funcionários',
    name: 'Cadastro de Colaboradores',
    useCase: 'Dados pessoais, cargo, salário e documentos.',
    cols: ['Nome Completo', 'Cargo / Função', 'Salário Nominal', 'Data Admissão', 'Documento CNPJ/CPF', 'Status'],
    rows: [
      { id: '1', field0: 'Roberto Carlos', field1: 'CFO / Dir. Financeiro', field2: 'R$ 18.500,00', field3: '12/01/2024', field4: '123.456.789-00', field5: 'Ativo' },
      { id: '2', field0: 'Juliana Paes', field1: 'Lead UX Architect', field2: 'R$ 11.200,00', field3: '05/03/2025', field4: '987.654.321-11', field5: 'Ativo' },
      { id: '3', field0: 'Marcos Frota', field1: 'DevOps Coordinator', field2: 'R$ 10.500,00', field3: '18/09/2024', field4: '456.123.789-22', field5: 'Ativo' }
    ]
  },
  {
    category: 'Frequência',
    name: 'Controle de Ponto',
    useCase: 'Entrada, saída, atrasos e faltas.',
    cols: ['Colaborador', 'Data', 'Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2', 'Atraso (min)', 'Horas Extras'],
    rows: [
      { id: '1', field0: 'Roberto Carlos', field1: '09/07/2026', field2: '08:00', field3: '12:00', field4: '13:00', field5: '17:00', field6: '0', field7: '0' },
      { id: '2', field0: 'Juliana Paes', field1: '09/07/2026', field2: '08:15', field3: '12:00', field4: '13:00', field5: '17:00', field6: '15', field7: '0' },
      { id: '3', field0: 'Marcos Frota', field1: '09/07/2026', field2: '08:00', field3: '12:00', field4: '13:00', field5: '18:30', field6: '0', field7: '90' }
    ]
  },
  {
    category: 'Férias',
    name: 'Controle de Férias',
    useCase: 'Períodos vencidos, programados e pagos.',
    cols: ['Colaborador', 'Período Aquisitivo', 'Início das Férias', 'Fim das Férias', 'Dias de Gozo', 'Abono Pecuniário', 'Status'],
    rows: [
      { id: '1', field0: 'Roberto Carlos', field1: '2024/2025', field2: '01/08/2026', field3: '30/08/2026', field4: '30', field5: 'Não', field6: 'Programado' },
      { id: '2', field0: 'Juliana Paes', field1: '2024/2025', field2: '15/12/2026', field3: '05/01/2027', field4: '20', field5: 'Sim (10 dias)', field6: 'Aprovado' }
    ]
  },
  {
    category: 'Folha de Pagamento',
    name: 'Cálculo de Salários / Folha',
    useCase: 'Salário base, descontos, benefícios e impostos.',
    cols: ['Colaborador', 'Salário Base', 'Horas Extras', 'Insalubridade', 'INSS', 'IRRF', 'VT/VR', 'Líquido Receber'],
    rows: [
      { id: '1', field0: 'Roberto Carlos', field1: '18500', field2: '0', field3: '0', field4: '900', field5: '3500', field6: '250', field7: '13850' },
      { id: '2', field0: 'Juliana Paes', field1: '11200', field2: '450', field3: '0', field4: '900', field5: '1800', field6: '250', field7: '8700' },
      { id: '3', field0: 'Marcos Frota', field1: '10500', field2: '600', field3: '250', field4: '900', field5: '1600', field6: '250', field7: '8600' }
    ]
  },
  {
    category: 'Desempenho',
    name: 'Avaliação de Desempenho',
    useCase: 'Notas, feedbacks e competências.',
    cols: ['Colaborador', 'Autoavaliação (1-5)', 'Avaliação Líder', 'Média Geral', 'Meta Batida (%)', 'Feedback Principal', 'Plano Ação'],
    rows: [
      { id: '1', field0: 'Roberto Carlos', field1: '4.5', field2: '4.8', field3: '4.65', field4: '102%', field5: 'Destaque em governança corporativa e orçamentação', field6: 'Manter mentoria de gestores' },
      { id: '2', field0: 'Juliana Paes', field1: '4.0', field2: '4.2', field3: '4.10', field4: '95%', field5: 'Entrega consistente e refinamento de design premium', field6: 'Curso avançado de design de sistemas' }
    ]
  },
  {
    category: 'Treinamento',
    name: 'Controle de Treinamentos',
    useCase: 'Cursos realizados e certificados.',
    cols: ['Colaborador', 'Treinamento', 'Instituição', 'Carga Horária (h)', 'Data Conclusão', 'Certificado', 'Custo'],
    rows: [
      { id: '1', field0: 'Juliana Paes', field1: 'Design Thinking & AI Workshop', field2: 'Interaction Design Foundation', field3: '40', field4: '10/05/2026', field5: 'Sim', field6: 'R$ 750' },
      { id: '2', field0: 'Marcos Frota', field1: 'Docker & Kubernetes Mastery', field2: 'Linux Academy', field3: '60', field4: '15/06/2026', field5: 'Sim', field6: 'R$ 1.200' }
    ]
  },
  {
    category: 'Indicadores',
    name: 'Dashboard de Indicadores de RH',
    useCase: 'Indicadores gerais do setor.',
    cols: ['Mês / Competência', 'Headcount Ativo', 'Admissões', 'Demissões', 'Investimento T&D', 'Taxa Absenteísmo', 'NPS de Clima'],
    rows: [
      { id: '1', field0: 'Maio/2026', field1: '25', field2: '2', field3: '0', field4: 'R$ 3.500', field5: '1.2%', field6: '84' },
      { id: '2', field0: 'Junho/2026', field1: '27', field2: '3', field3: '1', field4: 'R$ 5.800', field5: '0.8%', field6: '87' }
    ]
  },
  {
    category: 'Indicadores',
    name: 'Turnover e Absenteísmo',
    useCase: 'Taxa de rotatividade.',
    cols: ['Mês / Competência', 'Média de Funcionários', 'Total Rescisões', 'Turnover Mensal (%)', 'Total Faltas', 'Taxa Absenteísmo (%)'],
    rows: [
      { id: '1', field0: 'Janeiro/2026', field1: '22', field2: '1', field3: '4.5%', field4: '12', field5: '2.1%' },
      { id: '2', field0: 'Fevereiro/2026', field1: '24', field2: '0', field3: '0.0%', field4: '8', field5: '1.4%' }
    ]
  }
];

const HR_CATEGORIES_MAP: { [cat: string]: { name: string; desc: string }[] } = {
  'Recrutamento': [
    { name: 'Controle de Candidatos (ATS simples)', desc: 'Gerenciar vagas, candidatos e etapas do processo seletivo.' },
    { name: 'Banco de Talentos', desc: 'Cadastro de candidatos para futuras oportunidades.' },
    { name: 'Cronograma de Entrevistas', desc: 'Organizar entrevistas e responsáveis.' }
  ],
  'Funcionários': [
    { name: 'Cadastro de Colaboradores', desc: 'Dados pessoais, cargo, salário e documentos.' },
    { name: 'Controle de Contratos', desc: 'Datas de admissão, renovação e vencimento.' },
    { name: 'Organograma', desc: 'Estrutura da empresa e departamentos.' }
  ],
  'Folha de Pagamento': [
    { name: 'Cálculo de Salários / Folha', desc: 'Salário base, descontos, benefícios e impostos.' },
    { name: 'Controle de Horas Extras', desc: 'Registro e cálculo de horas extras.' },
    { name: 'Controle de Benefícios', desc: 'Vale-transporte, alimentação, plano de saúde etc.' }
  ],
  'Frequência': [
    { name: 'Controle de Ponto', desc: 'Entrada, saída, atrasos e faltas.' },
    { name: 'Banco de Horas', desc: 'Saldo positivo e negativo dos colaboradores.' },
    { name: 'Escala de Trabalho', desc: 'Turnos e horários da equipe.' }
  ],
  'Férias': [
    { name: 'Controle de Férias', desc: 'Períodos vencidos, programados e pagos.' },
    { name: 'Planejamento de Férias', desc: 'Calendário anual de férias.' }
  ],
  'Desempenho': [
    { name: 'Avaliação de Desempenho', desc: 'Notas, feedbacks e competências.' },
    { name: 'Plano de Desenvolvimento Individual (PDI)', desc: 'Desenvolvimento de competências.' }
  ],
  'Treinamento': [
    { name: 'Controle de Treinamentos', desc: 'Cursos realizados e certificados.' },
    { name: 'Matriz de Competências', desc: 'Competências por colaborador.' }
  ],
  'Documentação': [
    { name: 'Controle de Documentos', desc: 'Validade de documentos e certificados.' },
    { name: 'Checklist de Admissão', desc: 'Documentos necessários para contratação.' },
    { name: 'Checklist de Demissão', desc: 'Procedimentos de desligamento.' }
  ],
  'Saúde': [
    { name: 'Controle de Exames Ocupacionais', desc: 'ASO, exames periódicos e vencimentos.' },
    { name: 'Controle de EPIs', desc: 'Entrega e validade dos equipamentos.' }
  ],
  'Indicadores': [
    { name: 'Dashboard de Indicadores de RH', desc: 'Indicadores gerais do setor.' },
    { name: 'Turnover e Absenteísmo', desc: 'Taxa de rotatividade.' },
    { name: 'Headcount', desc: 'Quantidade de colaboradores.' },
    { name: 'Custos com Funcionários', desc: 'Gastos totais por colaborador.' }
  ],
  'Clima': [
    { name: 'Pesquisa de Clima Organizacional', desc: 'Resultados das pesquisas internas.' },
    { name: 'Pesquisa de Satisfação', desc: 'NPS interno e satisfação dos colaboradores.' }
  ],
  'Compliance': [
    { name: 'Controle de Advertências', desc: 'Advertências e suspensões.' },
    { name: 'Controle de Equipamentos', desc: 'Notebook, celular e outros ativos entregues.' }
  ],
  'Financeiro RH': [
    { name: 'Orçamento de RH', desc: 'Planejamento financeiro anual do RH.' },
    { name: 'Controle de Reembolsos', desc: 'Reembolsos de despesas dos colaboradores.' }
  ],
  'Diversidade': [
    { name: 'Indicadores de Diversidade', desc: 'Gênero, idade, inclusão e outros indicadores.' }
  ],
  'Comunicação': [
    { name: 'Calendário de RH', desc: 'Datas comemorativas e campanhas internas.' },
    { name: 'Controle de Eventos', desc: 'Organização de treinamentos e eventos internos.' }
  ]
};

const generateTemplateOnDemand = (name: string, category: string, useCase: string): SpreadsheetTemplate => {
  const existing = UNIVERSAL_SPREADSHEETS.find(t => t.name === name);
  if (existing) return existing;

  let cols = ['Item', 'Descrição', 'Responsável', 'Data Registro', 'Status', 'Observações'];
  let rows: any[] = [
    { id: '1', field0: 'Registro Inicial A', field1: 'Atividade padrão cadastrada', field2: 'Lucas King', field3: '10/07/2026', field4: 'Pendente', field5: 'Sincronizado via ERP' },
    { id: '2', field0: 'Registro Inicial B', field1: 'Auditoria de conformidade', field2: 'Mariana Costa', field3: '12/07/2026', field4: 'Concluído', field5: 'Nenhuma inconformidade' }
  ];

  if (category === 'Férias' || name.includes('Férias')) {
    cols = ['Colaborador', 'Início Previsto', 'Fim Previsto', 'Dias de Gozo', 'Abono Pecuniário', 'Status'];
    rows = [
      { id: '1', field0: 'Amanda Silva', field1: '15/12/2026', field2: '05/01/2027', field3: '20', field4: 'Sim', field5: 'Aprovado' },
      { id: '2', field0: 'Daniel Lima', field1: '10/01/2027', field2: '10/02/2027', field3: '30', field4: 'Não', field5: 'Pendente' }
    ];
  } else if (category === 'Compliance' || name.includes('Advertências')) {
    cols = ['Colaborador', 'Tipo de Ocorrência', 'Data Ocorrência', 'Testemunha', 'Nível Gravidade', 'Status Assinatura'];
    rows = [
      { id: '1', field0: 'Bruno Souza', field1: 'Atraso Injustificado', field2: '08/07/2026', field3: 'Mariana Costa', field4: 'Leve', field5: 'Assinado' }
    ];
  } else if (category === 'Financeiro RH' || name.includes('Reembolsos') || name.includes('Orçamento')) {
    cols = ['Descrição da Despesa', 'Colaborador', 'Setor Solicitante', 'Valor Reembolso', 'Data Solicitação', 'Aprovador', 'Status'];
    rows = [
      { id: '1', field0: 'Hospedagem AWS Training', field1: 'Daniel Lima', field2: 'Engenharia', field3: 'R$ 350,00', field4: '05/07/2026', field5: 'Lucas King', field6: 'Liquidado' },
      { id: '2', field0: 'Uber visita cliente Life4Billion', field1: 'Amanda Silva', field2: 'Suporte', field3: 'R$ 45,50', field4: '08/07/2026', field5: 'Mariana Costa', field6: 'Aprovado' }
    ];
  } else if (category === 'Documentação' || name.includes('Documentos') || name.includes('Checklist')) {
    cols = ['Nome do Documento / Etapa', 'Tipo de Arquivo', 'Data Upload', 'Validade', 'Obrigatório', 'Status'];
    rows = [
      { id: '1', field0: 'RG / CPF Frente e Verso', field1: 'PDF', field2: '10/06/2026', field3: 'Indeterminada', field4: 'Sim', field5: 'Validado' },
      { id: '2', field0: 'Comprovante de Residência', field1: 'PNG', field2: '11/06/2026', field3: '90 dias', field4: 'Sim', field5: 'Aguardando Revisão' }
    ];
  } else if (category === 'Treinamento' || name.includes('Cursos') || name.includes('Matriz')) {
    cols = ['Colaborador', 'Curso / Certificação', 'Plataforma', 'Status Conclusão', 'Nota Final', 'Validade'];
    rows = [
      { id: '1', field0: 'Carla Dias', field1: 'UX Sistêmico Interativo', field2: 'Coursera', field3: 'Concluído', field4: '9.8', field5: '12/12/2028' }
    ];
  } else if (category === 'Saúde' || name.includes('Exames') || name.includes('EPI')) {
    cols = ['Colaborador', 'Exame / Equipamento', 'Data Realização', 'Vencimento / Próximo', 'Médico / Resp', 'Status'];
    rows = [
      { id: '1', field0: 'Amanda Silva', field1: 'Exame Periódico Clínico', field2: '15/05/2026', field3: '15/05/2027', field4: 'Dr. Roberto Cruz', field5: 'Apto' }
    ];
  } else if (category === 'Clima' || name.includes('Clima') || name.includes('Satisfação')) {
    cols = ['Setor', 'Pontuação Clima (0-10)', 'Feedback Anônimo', 'Nível Estresse', 'Ações Corretivas', 'Status Acompanhamento'];
    rows = [
      { id: '1', field0: 'Tecnologia', field1: '8.7', field2: 'Excelente autonomia e flexibilidade de horários', field3: 'Baixo', field4: 'Melhorar lanches na copa', field5: 'Em execução' },
      { id: '2', field0: 'Vendas', field1: '7.2', field2: 'Metas agressivas provocam cansaço extra', field3: 'Médio', field4: 'Sessão semanal de alinhamento com RH', field5: 'Agendado' }
    ];
  } else if (category === 'Diversidade' || name.includes('Diversidade')) {
    cols = ['Setor', 'Gênero Feminino (%)', 'Gênero Masculino (%)', 'Inclusão PCD (%)', 'Multigeracional (%)', 'Ações de Equidade', 'Nota Geral NPS'];
    rows = [
      { id: '1', field0: 'Tecnologia', field1: '40%', field2: '60%', field3: '8%', field4: '15%', field5: 'Vagas exclusivas e mentoria interna', field6: '88' },
      { id: '2', field0: 'Operações', field1: '55%', field2: '45%', field3: '10%', field4: '20%', field5: 'Workshop de diversidade cognitiva', field6: '92' }
    ];
  } else if (category === 'Comunicação' || name.includes('Comunicação') || name.includes('Calendário')) {
    cols = ['Data Evento', 'Nome da Campanha', 'Canais Divulgação', 'Orçamento Estimado', 'Público Alvo', 'Status'];
    rows = [
      { id: '1', field0: '05/09/2026', field1: 'Setembro Amarelo Mindfulness', field2: 'E-mail, Slack, Cartazes', field3: 'R$ 1.500', field4: 'Todos os Colaboradores', field5: 'Confirmado' }
    ];
  }

  return {
    category,
    name,
    useCase,
    cols,
    rows
  };
};

interface CompanyPayrollViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function CompanyPayrollView({ onShowNotification }: CompanyPayrollViewProps) {
  const { t, language } = useLanguageTheme();
  const [activeTab, setActiveTab] = useState<'employees' | 'company' | 'payroll' | 'spreadsheets'>('employees');
  
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  // Spreadsheets dynamic workspace states
  const [selectedTemplate, setSelectedTemplate] = useState<SpreadsheetTemplate | null>(null);
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Recrutamento');

  // Company Form states
  const [compName, setCompName] = useState('');
  const [compTax, setCompTax] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compWebsite, setCompWebsite] = useState('');

  // Employee Form states
  const [empFirst, setEmpFirst] = useState('');
  const [empLast, setEmpLast] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empHire, setEmpHire] = useState('');
  const [empError, setEmpError] = useState('');

  // Payslip Modal states
  const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);

  // Employee search, filters and detail states
  const [alphabetFilter, setAlphabetFilter] = useState<string | null>(null);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // New Employee Form attachments
  const [empAvatar, setEmpAvatar] = useState<string>('');
  const [empDocs, setEmpDocs] = useState<{ name: string; type: string; content: string; size?: string }[]>([]);
  const [isDraggingEmpDocs, setIsDraggingEmpDocs] = useState(false);

  // Helper functions for employee uploads
  const handleEmpAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        onShowNotification('Avatar muito grande', 'O avatar excede o limite de 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmpDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processEmpDocs(e.target.files);
    }
  };

  const processEmpDocs = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        onShowNotification('Arquivo muito grande', `O arquivo "${file.name}" excede o limite de 5MB.`, 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(file.size / 1024).toFixed(0)} KB`;
        
        setEmpDocs(prev => [
          ...prev, 
          {
            name: file.name,
            size: sizeFormatted,
            type: file.type,
            content: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEmpDoc = (idx: number) => {
    setEmpDocs(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    // Init LocalDatabase
    const comps = LocalDatabase.getCompanies();
    if (comps.length > 0) {
      setCompany(comps[0]);
      setCompName(comps[0].name);
      setCompTax(comps[0].tax_id);
      setCompAddress(comps[0].address);
      setCompWebsite(comps[0].website);
    }
    setEmployees(LocalDatabase.getEmployees());
    setPayrolls(LocalDatabase.getPayroll());
  }, []);

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      onShowNotification('Erro de Validação', 'O nome da empresa é obrigatório.', 'warning');
      return;
    }
    const updated = LocalDatabase.updateCompany({
      name: compName,
      tax_id: compTax,
      address: compAddress,
      website: compWebsite
    });
    setCompany(updated);
    onShowNotification('Perfil Empresarial Salvo', 'As informações corporativas foram atualizadas no ERP!', 'success');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFirst.trim() || !empLast.trim()) {
      setEmpError('Por favor, preencha o nome completo do funcionário.');
      return;
    }
    if (!empEmail.trim() || !empEmail.includes('@')) {
      setEmpError('Insira um e-mail corporativo válido.');
      return;
    }
    if (!empRole.trim()) {
      setEmpError('Defina o cargo do funcionário.');
      return;
    }
    const salaryVal = parseFloat(empSalary);
    if (isNaN(salaryVal) || salaryVal <= 0) {
      setEmpError('Informe um salário nominal válido positivo.');
      return;
    }
    if (!empHire) {
      setEmpError('Informe a data de contratação.');
      return;
    }
    setEmpError('');

    const newEmp = LocalDatabase.addEmployee({
      first_name: empFirst.trim(),
      last_name: empLast.trim(),
      email: empEmail.trim(),
      role: empRole.trim(),
      salary: salaryVal,
      hire_date: empHire,
      status: 'active',
      avatar_url: empAvatar,
      documents: empDocs
    });

    setEmployees(LocalDatabase.getEmployees());
    setEmpFirst('');
    setEmpLast('');
    setEmpEmail('');
    setEmpRole('');
    setEmpSalary('');
    setEmpHire('');
    setEmpAvatar('');
    setEmpDocs([]);
    onShowNotification('Colaborador Admitido!', `"${newEmp.first_name} ${newEmp.last_name}" adicionado à folha de pagamento corporativa.`, 'success');
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    const updated = LocalDatabase.deleteEmployee(id);
    setEmployees(updated);
    onShowNotification('Colaborador Desligado', `${name} foi removido do registro ativo.`, 'info');
  };

  const handleProcessPayroll = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    try {
      const payrollRecord = LocalDatabase.processPayroll(employeeId, '2026-07');
      setPayrolls(LocalDatabase.getPayroll());
      
      // Open payslip modal instantly
      setPayslipEmployee(emp);
      setSelectedPayslip(payrollRecord);

      onShowNotification(
        'Folha Processada!', 
        `Salário de ${emp.first_name} calculado. Despesa corporativa de R$ ${payrollRecord.net_pay.toFixed(2)} adicionada ao fluxo de caixa.`, 
        'success'
      );
    } catch (err: any) {
      onShowNotification('Erro', err.message, 'warning');
    }
  };

  const handleGridExport = (
    format: 'excel' | 'pdf' | 'docs' | 'print',
    title: string,
    cols: string[],
    dataRows: any[]
  ) => {
    if (dataRows.length === 0) {
      onShowNotification('Erro de Exportação', 'A planilha não contém dados para exportar.', 'warning');
      return;
    }

    if (format === 'excel') {
      const headers = cols.join(';');
      const rows = dataRows.map(row => {
        return cols.map((_, colIdx) => {
          const val = row[`field${colIdx}`] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';');
      });
      const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification('Sucesso', 'Planilha exportada com sucesso em formato Excel CSV!', 'success');
    } else if (format === 'pdf' || format === 'print') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        onShowNotification('Pop-up Bloqueado', 'Permita pop-ups para visualizar a impressão / PDF.', 'warning');
        return;
      }
      
      const tableRowsHTML = dataRows.map(row => {
        return `<tr>${cols.map((_, colIdx) => `<td>${row[`field${colIdx}`] || ''}</td>`).join('')}</tr>`;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; }
              h1 { font-size: 20px; color: #0f172a; margin-bottom: 6px; }
              p { font-size: 12px; color: #64748b; margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 11px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p>Gerado automaticamente via OmniSaaS ERP - ${new Date().toLocaleDateString('pt-BR')}</p>
            <table>
              <thead>
                <tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
            <div class="footer">
              OmniSaaS ERP • Sistema Integrado de Gestão Orçamentária e de Recursos Humanos
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      onShowNotification('Sucesso', 'Visualização de impressão enviada ao navegador.', 'success');
    } else if (format === 'docs') {
      const docContent = `
=========================================
${title.toUpperCase()}
=========================================
Gerado via OmniSaaS ERP em ${new Date().toLocaleDateString('pt-BR')}

${cols.join('\t')}\n` + dataRows.map(row => {
        return cols.map((_, colIdx) => row[`field${colIdx}`] || '').join('\t');
      }).join('\n') + `

=========================================
Fim do Relatório Corporativo
`;
      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_relatorio.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification('Sucesso', 'Relatório exportado com sucesso em formato DOCS (Texto)!', 'success');
    }
  };

  const handleMarkPaid = (id: string) => {
    const updated = LocalDatabase.updatePayrollStatus(id, 'paid');
    setPayrolls(updated);
    if (selectedPayslip?.id === id) {
      setSelectedPayslip({ ...selectedPayslip, status: 'paid' });
    }
    onShowNotification('Holerite Liquidado', 'Status de folha atualizado para PAGO!', 'success');
  };

  return (
    <div className="space-y-6" id="company-payroll-container">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800" id="payroll-tabs">
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'employees' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-employees"
        >
          <Users className="w-4 h-4" />
          <span>{t('tabEmployeesSalaries', 'Funcionários & Salários')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'payroll' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-payroll-records"
        >
          <Calculator className="w-4 h-4" />
          <span>{t('payroll', 'Folha de Pagamento')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('spreadsheets')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'spreadsheets' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-spreadsheets"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{t('tabHRSpreadsheets', 'Planilhas Universais de RH')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('company')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'company' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-company"
        >
          <Building className="w-4 h-4" />
          <span>{t('tabCompanyProfile', 'Perfil ERP Corporativo')}</span>
        </button>
      </div>

      {/* TELA 1: EMPLOYEES (Funcionários & Salários) */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="panel-employees">
          
          {/* Adicionar Colaborador Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <UserPlus className="w-4 h-4 mr-1.5 text-indigo-400" />
              Admitir Novo Colaborador
            </h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Nome</label>
                  <input 
                    type="text" placeholder="Juliana"
                    value={empFirst} onChange={(e) => setEmpFirst(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Sobrenome</label>
                  <input 
                    type="text" placeholder="Mendes"
                    value={empLast} onChange={(e) => setEmpLast(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">E-mail Corporativo</label>
                <input 
                  type="email" placeholder="juliana.mendes@life4billion.com"
                  value={empEmail} onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Cargo / Função</label>
                <input 
                  type="text" placeholder="Ex: Desenvolvedor Fullstack"
                  value={empRole} onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Salário Nominal (R$)</label>
                  <input 
                    type="number" placeholder="12000"
                    value={empSalary} onChange={(e) => setEmpSalary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Admissão</label>
                  <input 
                    type="date"
                    value={empHire} onChange={(e) => setEmpHire(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Upload de Avatar */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase">Avatar do Colaborador (Opcional)</label>
                <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {empAvatar ? (
                      <img src={empAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-slate-400">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="emp-avatar-input"
                      onChange={handleEmpAvatarChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('emp-avatar-input')?.click()}
                      className="bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      Selecionar Avatar
                    </button>
                    {empAvatar && (
                      <button
                        type="button"
                        onClick={() => setEmpAvatar('')}
                        className="ml-2 text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload de Documentos */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase">Documentos & Comprovantes</label>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingEmpDocs(true); }}
                  onDragLeave={() => setIsDraggingEmpDocs(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingEmpDocs(false);
                    if (e.dataTransfer.files) {
                      processEmpDocs(e.dataTransfer.files);
                    }
                  }}
                  className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                    isDraggingEmpDocs 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                  onClick={() => document.getElementById('emp-file-input')?.click()}
                >
                  <input 
                    type="file" 
                    id="emp-file-input"
                    multiple
                    onChange={handleEmpDocsChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <span className="text-lg block mb-1">📂</span>
                  <p className="text-[10px] font-bold text-slate-300">Arrastar ou clique para fazer upload</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">PDF, DOC ou Imagens (Max 5MB)</p>
                </div>

                {empDocs.length > 0 && (
                  <div className="space-y-1 mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-bold text-indigo-400 font-mono block uppercase tracking-wide">Documentos anexados ({empDocs.length}):</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {empDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[10px] text-slate-300">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="font-mono text-[8px] text-indigo-400 bg-indigo-950/40 px-1 py-0.5 rounded uppercase font-bold">
                              {doc.name.split('.').pop() || 'doc'}
                            </span>
                            <span className="truncate max-w-[100px]" title={doc.name}>{doc.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEmpDoc(idx);
                            }}
                            className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold px-1"
                          >
                            Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                Admitir Colaborador
              </button>

              {empError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {empError}
                </p>
              )}
            </form>
          </div>

          {/* Diretório de Funcionários */}
          <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 relative" id="employees-directory">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h2 className="text-sm font-bold text-white tracking-tight">Membros de Equipe Registrados</h2>
              
              {/* Barra de Pesquisa com Sugestão Auto-suggest */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="text-slate-500 w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou iniciais..."
                  value={empSearchQuery}
                  onChange={(e) => {
                    setEmpSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmpSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-355 text-xs"
                  >
                    ×
                  </button>
                )}

                {/* Dropdown de sugestões */}
                {showSuggestions && empSearchQuery.trim() !== '' && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                    {employees
                      .filter(e => {
                        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
                        const initials = `${e.first_name[0]}${e.last_name[0]}`.toLowerCase();
                        const query = empSearchQuery.toLowerCase();
                        return fullName.includes(query) || initials.includes(query) || e.role.toLowerCase().includes(query) || e.email.toLowerCase().includes(query);
                      })
                      .map(e => (
                        <div
                          key={e.id}
                          onClick={() => {
                            setSelectedEmployee(e);
                            setEmpSearchQuery('');
                            setShowSuggestions(false);
                          }}
                          className="flex items-center space-x-3 p-2 hover:bg-slate-850 cursor-pointer transition text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {e.avatar_url ? (
                              <img src={e.avatar_url} alt={e.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-indigo-400">
                                {e.first_name[0]}{e.last_name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{e.first_name} {e.last_name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{e.role}</p>
                          </div>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold shrink-0 uppercase tracking-wider">
                            Ficha
                          </span>
                        </div>
                      ))}
                    {employees.filter(e => {
                      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
                      const initials = `${e.first_name[0]}${e.last_name[0]}`.toLowerCase();
                      const query = empSearchQuery.toLowerCase();
                      return fullName.includes(query) || initials.includes(query) || e.role.toLowerCase().includes(query) || e.email.toLowerCase().includes(query);
                    }).length === 0 && (
                      <div className="p-3 text-center text-[11px] text-slate-500">
                        Nenhum colaborador encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BARRA ALFABÉTICA (A-Z) */}
            <div className="flex flex-wrap gap-1 mb-4 p-1.5 bg-slate-950/60 rounded-xl border border-slate-850/60 overflow-x-auto scrollbar-none items-center">
              <button
                type="button"
                onClick={() => setAlphabetFilter(null)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition shrink-0 ${
                  alphabetFilter === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                Todos
              </button>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
                const isSelected = alphabetFilter === letter;
                const hasEmployees = employees.some(e => e.first_name.charAt(0).toUpperCase() === letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setAlphabetFilter(letter)}
                    className={`w-6 h-6 text-[10px] font-bold rounded-lg transition shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : hasEmployees
                          ? 'bg-slate-900 text-indigo-400 hover:bg-slate-850 hover:text-indigo-300 border border-slate-800/80'
                          : 'bg-transparent text-slate-600 cursor-default'
                    }`}
                    disabled={!hasEmployees && !isSelected}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Tabela de Colaboradores */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs">
                    <th className="pb-3 font-medium">Colaborador (Em Ordem Alfabética)</th>
                    <th className="pb-3 font-medium">Cargo / Função</th>
                    <th className="pb-3 font-medium">Salário Nominal</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {[...employees]
                    .sort((a, b) => {
                      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                      return nameA.localeCompare(nameB, 'pt-BR');
                    })
                    .filter((e) => {
                      // Alphabetical filter
                      if (alphabetFilter) {
                        if (e.first_name.charAt(0).toUpperCase() !== alphabetFilter) {
                          return false;
                        }
                      }
                      // Text search filter
                      if (empSearchQuery.trim() !== '') {
                        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
                        const initials = `${e.first_name[0]}${e.last_name[0]}`.toLowerCase();
                        const query = empSearchQuery.toLowerCase();
                        if (!fullName.includes(query) && !initials.includes(query) && !e.role.toLowerCase().includes(query) && !e.email.toLowerCase().includes(query)) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/15 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {e.avatar_url ? (
                                <img src={e.avatar_url} alt={`${e.first_name}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-indigo-400 text-xs">
                                  {e.first_name[0]}{e.last_name[0]}
                                </span>
                              )}
                            </div>
                            <div 
                              onClick={() => setSelectedEmployee(e)}
                              className="cursor-pointer group flex flex-col items-start min-w-0"
                            >
                              <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center text-xs">
                                {e.first_name} {e.last_name}
                                <span className="ml-1.5 px-1 bg-indigo-500/10 text-[8px] text-indigo-300 font-bold tracking-wider rounded uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ver Ficha
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{e.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-slate-350">{e.role}</td>
                        <td className="py-3 font-semibold text-slate-200 text-xs">{formatCurrency(e.salary, language)}</td>
                        <td className="py-3">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            e.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {e.status === 'active' ? 'Ativo' : 'Suspenso'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleProcessPayroll(e.id)}
                              className="bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-bold px-2 py-1 rounded-lg transition"
                              id={`process-payroll-btn-${e.id}`}
                            >
                              Calcular Salário
                            </button>
                            <button 
                              onClick={() => handleDeleteEmployee(e.id, `${e.first_name} ${e.last_name}`)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">Nenhum colaborador registrado no diretório.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TELA 2: PAYROLL RECORDS (Folha de Pagamento Histórica) */}
      {activeTab === 'payroll' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="panel-payroll">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                {t('payrollTitle', 'Folha de Pagamento & Holerites (Estilo Excel)')}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {t('payrollDesc', 'Visualização analítica consolidada de pagamentos corporativos e encargos tributários.')}
              </p>
              
              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-850">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold self-center mr-1">Exportar:</span>
                <button
                  onClick={() => {
                    const cols = ['Colaborador', 'Cargo', 'Competência', 'Salário Bruto', 'Benefícios', 'Retenções', 'Líquido', 'Status'];
                    const dataRows = payrolls.map(p => {
                      const emp = employees.find(e => e.id === p.employee_id);
                      return {
                        field0: emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
                        field1: emp ? emp.role : 'N/A',
                        field2: p.pay_period,
                        field3: formatCurrency(p.base_salary, language),
                        field4: formatCurrency(p.bonuses, language),
                        field5: formatCurrency(p.deductions, language),
                        field6: formatCurrency(p.net_pay, language),
                        field7: p.status === 'paid' ? 'Pago' : 'Processado'
                      };
                    });
                    handleGridExport('excel', 'Folha de Pagamento', cols, dataRows);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  title="Exportar para formato Excel (.xls/.csv)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>EXCEL</span>
                </button>
                <button
                  onClick={() => {
                    const cols = ['Colaborador', 'Cargo', 'Competência', 'Salário Bruto', 'Benefícios', 'Retenções', 'Líquido', 'Status'];
                    const dataRows = payrolls.map(p => {
                      const emp = employees.find(e => e.id === p.employee_id);
                      return {
                        field0: emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
                        field1: emp ? emp.role : 'N/A',
                        field2: p.pay_period,
                        field3: formatCurrency(p.base_salary, language),
                        field4: formatCurrency(p.bonuses, language),
                        field5: formatCurrency(p.deductions, language),
                        field6: formatCurrency(p.net_pay, language),
                        field7: p.status === 'paid' ? 'Pago' : 'Processado'
                      };
                    });
                    handleGridExport('pdf', 'Folha de Pagamento', cols, dataRows);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  title="Salvar como PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => {
                    const cols = ['Colaborador', 'Cargo', 'Competência', 'Salário Bruto', 'Benefícios', 'Retenções', 'Líquido', 'Status'];
                    const dataRows = payrolls.map(p => {
                      const emp = employees.find(e => e.id === p.employee_id);
                      return {
                        field0: emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
                        field1: emp ? emp.role : 'N/A',
                        field2: p.pay_period,
                        field3: formatCurrency(p.base_salary, language),
                        field4: formatCurrency(p.bonuses, language),
                        field5: formatCurrency(p.deductions, language),
                        field6: formatCurrency(p.net_pay, language),
                        field7: p.status === 'paid' ? 'Pago' : 'Processado'
                      };
                    });
                    handleGridExport('docs', 'Folha de Pagamento', cols, dataRows);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  title="Exportar Relatório Word"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>DOCS</span>
                </button>
                <button
                  onClick={() => {
                    const cols = ['Colaborador', 'Cargo', 'Competência', 'Salário Bruto', 'Benefícios', 'Retenções', 'Líquido', 'Status'];
                    const dataRows = payrolls.map(p => {
                      const emp = employees.find(e => e.id === p.employee_id);
                      return {
                        field0: emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
                        field1: emp ? emp.role : 'N/A',
                        field2: p.pay_period,
                        field3: formatCurrency(p.base_salary, language),
                        field4: formatCurrency(p.bonuses, language),
                        field5: formatCurrency(p.deductions, language),
                        field6: formatCurrency(p.net_pay, language),
                        field7: p.status === 'paid' ? 'Pago' : 'Processado'
                      };
                    });
                    handleGridExport('print', 'Folha de Pagamento', cols, dataRows);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-500 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  title="Imprimir Planilha"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
            <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-300 text-xs font-semibold rounded-full">
              Julho / 2026
            </span>
          </div>
 
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs">
                  <th className="py-3 px-4 font-bold tracking-wider text-[10px] uppercase">Ref</th>
                  <th className="py-3 px-4 font-medium">Colaborador</th>
                  <th className="py-3 px-4 font-medium">Competência</th>
                  <th className="py-3 px-4 font-medium">Salário Bruto</th>
                  <th className="py-3 px-4 font-medium">Benefícios</th>
                  <th className="py-3 px-4 font-medium text-rose-400">Retenções (Impostos)</th>
                  <th className="py-3 px-4 font-medium">Líquido Creditado</th>
                  <th className="py-3 px-4 font-medium">Status de Pagamento</th>
                  <th className="py-3 px-4 font-medium text-right">Holerite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {payrolls.map((p, index) => {
                  const emp = employees.find(e => e.id === p.employee_id);
                  if (!emp) return null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono font-bold">A{index + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-200">{emp.first_name} {emp.last_name}</p>
                        <p className="text-[10px] text-slate-500">{emp.role}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.pay_period}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        <input
                          type="number"
                          value={p.base_salary}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = payrolls.map(pr => {
                              if (pr.id === p.id) {
                                return { ...pr, base_salary: val, net_pay: val + pr.bonuses - pr.deductions };
                              }
                              return pr;
                            });
                            setPayrolls(updated);
                          }}
                          className="w-24 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 text-indigo-400 font-bold px-2.5 py-1.5 rounded focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-mono">
                        <input
                          type="number"
                          value={p.bonuses}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = payrolls.map(pr => {
                              if (pr.id === p.id) {
                                return { ...pr, bonuses: val, net_pay: pr.base_salary + val - pr.deductions };
                              }
                              return pr;
                            });
                            setPayrolls(updated);
                          }}
                          className="w-20 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 text-emerald-400 font-bold px-2.5 py-1.5 rounded focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-rose-400 font-mono">
                        <input
                          type="number"
                          value={p.deductions}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = payrolls.map(pr => {
                              if (pr.id === p.id) {
                                return { ...pr, deductions: val, net_pay: pr.base_salary + pr.bonuses - val };
                              }
                              return pr;
                            });
                            setPayrolls(updated);
                          }}
                          className="w-20 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 text-rose-400 font-bold px-2.5 py-1.5 rounded focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-mono">
                        {formatCurrency(p.net_pay, language)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          p.status === 'processed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.status === 'paid' ? 'PAGO / Liquidado' : p.status === 'processed' ? 'Aprovado' : 'Aguardando'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => {
                            setPayslipEmployee(emp);
                            setSelectedPayslip(p);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold text-xs hover:underline flex items-center justify-end space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Holerite</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-500">Nenhum holerite processado nesta competência.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/40 text-xs font-bold border-t border-slate-800 font-mono">
                  <td colSpan={3} className="py-3 px-4 text-slate-400 uppercase text-[10px] font-sans">Totais Consolidados</td>
                  <td className="py-3 px-4 text-indigo-400">
                    {formatCurrency(payrolls.reduce((sum, r) => sum + r.base_salary, 0), language)}
                  </td>
                  <td className="py-3 px-4 text-emerald-400">
                    + {formatCurrency(payrolls.reduce((sum, r) => sum + r.bonuses, 0), language)}
                  </td>
                  <td className="py-3 px-4 text-rose-400">
                    - {formatCurrency(payrolls.reduce((sum, r) => sum + r.deductions, 0), language)}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-extrabold text-sm">
                    {formatCurrency(payrolls.reduce((sum, r) => sum + r.net_pay, 0), language)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TELA 4: PLANILHAS DE USO UNIVERSAL DE RH */}
      {activeTab === 'spreadsheets' && selectedTemplate === null && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" id="panel-spreadsheets-selector">
          {/* Categories Sidebar */}
          <div className="md:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Categorias</h3>
            {Object.keys(HR_CATEGORIES_MAP).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-60 bg-slate-850 px-1.5 py-0.5 rounded font-mono">
                  {HR_CATEGORIES_MAP[cat].length}
                </span>
              </button>
            ))}
          </div>

          {/* Templates Grid Selection */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 p-5 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Planilhas Universais de RH - {selectedCategory}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Selecione uma planilha modelo abaixo para abrir o editor interativo de células e exportar.</p>
              </div>
              
              {/* Search bar */}
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar planilha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HR_CATEGORIES_MAP[selectedCategory]
                ?.filter(tpl => tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((tpl) => (
                  <div
                    key={tpl.name}
                    onClick={() => {
                      const generated = generateTemplateOnDemand(tpl.name, selectedCategory, tpl.desc);
                      setSelectedTemplate(generated);
                      setGridRows(generated.rows);
                    }}
                    className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between group h-40"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {selectedCategory}
                        </span>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 transition" />
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs mt-3 group-hover:text-white transition">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {tpl.desc}
                      </p>
                    </div>
                    <div className="text-[10px] text-indigo-400 font-bold flex items-center mt-3 pt-3 border-t border-slate-850">
                      <span>Abrir Planilha Excel</span>
                      <span className="ml-1 text-xs font-mono">→</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spreadsheets' && selectedTemplate !== null && (
        <div className="space-y-6 animate-fade-in" id="panel-spreadsheets-workspace">
          {/* Workspace Header */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg mr-2 transition cursor-pointer"
                  >
                    ← Voltar
                  </button>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded uppercase">
                    {selectedTemplate.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center mt-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  {selectedTemplate.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedTemplate.useCase}
                </p>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-850">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold self-center mr-1">Exportar:</span>
                  <button
                    onClick={() => handleGridExport('excel', selectedTemplate.name, selectedTemplate.cols, gridRows)}
                    className="bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                    title="Exportar para formato Excel (.xls/.csv)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>EXCEL</span>
                  </button>
                  <button
                    onClick={() => handleGridExport('pdf', selectedTemplate.name, selectedTemplate.cols, gridRows)}
                    className="bg-slate-900 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                    title="Salvar como PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleGridExport('docs', selectedTemplate.name, selectedTemplate.cols, gridRows)}
                    className="bg-slate-900 hover:bg-slate-850 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                    title="Exportar Relatório Word"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>DOCS</span>
                  </button>
                  <button
                    onClick={() => handleGridExport('print', selectedTemplate.name, selectedTemplate.cols, gridRows)}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-500 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                    title="Imprimir Planilha"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 self-end">
                <button
                  onClick={() => {
                    const newRow: any = { id: Math.random().toString() };
                    selectedTemplate.cols.forEach((_, idx) => {
                      newRow[`field${idx}`] = '';
                    });
                    setGridRows(prev => [...prev, newRow]);
                    onShowNotification('Sucesso', 'Nova linha adicionada à planilha', 'info');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Linha</span>
                </button>
                <button
                  onClick={() => {
                    setGridRows([]);
                    onShowNotification('Limpar Planilha', 'Todos os dados foram resetados.', 'info');
                  }}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-850 transition cursor-pointer"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>
          </div>

          {/* Excel Grid Sheet */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="py-2.5 px-3 text-[10px] font-bold text-slate-500 border-r border-slate-800 w-12 text-center uppercase tracking-wider">Ref</th>
                    {selectedTemplate.cols.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 text-xs font-bold text-slate-300 border-r border-slate-800 font-sans">
                        {col}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-xs font-bold text-slate-500 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {gridRows.map((row, rIdx) => (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition animate-fade-in">
                      <td className="py-2 px-3 text-center border-r border-slate-850 text-[10px] font-mono font-bold text-slate-600 select-none bg-slate-900/20">
                        B{rIdx + 1}
                      </td>
                      {selectedTemplate.cols.map((_, cIdx) => (
                        <td key={cIdx} className="p-0.5 border-r border-slate-850">
                          <input
                            type="text"
                            value={row[`field${cIdx}`] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGridRows(prev => prev.map(r => r.id === row.id ? { ...r, [`field${cIdx}`]: val } : r));
                            }}
                            className="w-full bg-transparent text-xs text-slate-200 px-2.5 py-2 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 rounded font-sans"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            setGridRows(prev => prev.filter(r => r.id !== row.id));
                            onShowNotification('Sucesso', 'Linha removida da planilha', 'info');
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer transition"
                          title="Excluir linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {gridRows.length === 0 && (
                    <tr>
                      <td colSpan={selectedTemplate.cols.length + 2} className="py-12 text-center text-xs text-slate-500">
                        Planilha vazia. Clique em "Adicionar Linha" para começar a preencher seus dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TELA 3: COMPANY PROFILE (Configuração Corporativa ERP) */}
      {activeTab === 'company' && company && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="panel-company">
          <div className="max-w-xl">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <Building className="w-4 h-4 mr-1.5 text-indigo-400" />
              Editar Dados Tributários Corporativos (ERP Life4Billion)
            </h2>
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Razão Social / Nome de Fantasia</label>
                <input 
                  type="text" value={compName} onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Identificação Fiscal (CNPJ / NIF)</label>
                <input 
                  type="text" value={compTax} onChange={(e) => setCompTax(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Endereço da Sede Administrativa</label>
                <input 
                  type="text" value={compAddress} onChange={(e) => setCompAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Website Oficial corporativo</label>
                <input 
                  type="text" value={compWebsite} onChange={(e) => setCompWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Salvar Dados ERP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HOLERITE PAYSLIP MODAL (Extrema fidelidade visual SaaS) */}
      {selectedPayslip && payslipEmployee && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in" id="payslip-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="text-indigo-400 w-5 h-5" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Holerite Digital Simplificado</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedPayslip(null);
                  setPayslipEmployee(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payslip Content */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              {/* Company Info */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{company?.name || 'Life4Billion Technologies Ltda'}</h4>
                  <p className="text-slate-500 mt-0.5">CNPJ: {company?.tax_id || '45.123.897/0001-22'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-indigo-400">JULHO / 2026</p>
                  <p className="text-slate-500">Recibo de Salário</p>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[9px]">Colaborador</span>
                  <span className="text-slate-200 font-bold">{payslipEmployee.first_name} {payslipEmployee.last_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-medium text-[9px]">Função</span>
                  <span className="text-slate-200 font-semibold">{payslipEmployee.role}</span>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-850 pb-1.5 text-slate-500 font-medium">
                  <span>Descrição / Eventos</span>
                  <div className="flex space-x-8">
                    <span>Vencimentos</span>
                    <span>Descontos</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>Salário Base CLT</span>
                    <div className="flex space-x-8 text-right">
                      <span className="text-slate-300 font-medium">{formatCurrency(selectedPayslip.base_salary, language)}</span>
                      <span className="text-transparent">-</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Gratificação por Desempenho</span>
                    <div className="flex space-x-8 text-right">
                      <span className="text-emerald-400 font-medium">+{formatCurrency(selectedPayslip.bonuses, language)}</span>
                      <span className="text-transparent">-</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Retenções de Imposto de Renda / INSS</span>
                    <div className="flex space-x-8 text-right">
                      <span className="text-transparent">-</span>
                      <span className="text-rose-400 font-medium">-{formatCurrency(selectedPayslip.deductions, language)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold bg-slate-950/20 p-3 rounded-xl">
                <span className="text-white">Salário Líquido Creditado:</span>
                <span className="text-emerald-400 text-base">{formatCurrency(selectedPayslip.net_pay, language)}</span>
              </div>

              {/* Verification Info */}
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Assinado digitalmente via OmniSaaS ERP Gateway. Token: {selectedPayslip.id.toUpperCase()}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-950 px-5 py-4 border-t border-slate-850 flex justify-end space-x-3">
              {selectedPayslip.status !== 'paid' ? (
                <button 
                  onClick={() => handleMarkPaid(selectedPayslip.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Confirmar Pagamento (Liquidar)
                </button>
              ) : (
                <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 text-[10px] font-bold px-3 py-1.5 rounded-xl">
                  Transação Liquidada no Banco
                </span>
              )}
              <button 
                onClick={() => {
                  setSelectedPayslip(null);
                  setPayslipEmployee(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO COLABORADOR */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in" id="employee-detail-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex justify-between items-center">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Ficha Cadastral do Colaborador</span>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="p-6 bg-slate-950/40 border-b border-slate-850/60 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-indigo-950 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {selectedEmployee.avatar_url ? (
                  <img src={selectedEmployee.avatar_url} alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-400">
                    {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                <p className="text-xs text-indigo-400 font-medium">{selectedEmployee.role}</p>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-2 ${
                  selectedEmployee.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedEmployee.status === 'active' ? 'Ativo' : 'Suspenso'}
                </span>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block uppercase font-mono text-[9px] mb-1">E-mail de Trabalho</span>
                  <span className="text-slate-200 font-medium select-all">{selectedEmployee.email}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block uppercase font-mono text-[9px] mb-1">Data de Admissão</span>
                  <span className="text-slate-200 font-medium">{selectedEmployee.hire_date}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block uppercase font-mono text-[9px] mb-1">Salário Nominal</span>
                  <span className="text-slate-200 font-bold">{formatCurrency(selectedEmployee.salary, language)}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block uppercase font-mono text-[9px] mb-1">ID Único ERP</span>
                  <span className="text-slate-200 font-mono text-[10px] uppercase">{selectedEmployee.id.substring(0, 8)}...</span>
                </div>
              </div>

              {/* Documentos Anexados */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documentos Cadastrais e Comprovantes</h4>
                {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedEmployee.documents.map((doc, docIdx) => (
                      <a 
                        key={docIdx}
                        href={doc.content}
                        download={doc.name}
                        className="flex items-center justify-between bg-slate-950 border border-slate-850 hover:border-slate-700 hover:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-300 transition"
                        title="Clique para baixar"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-mono text-[8px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                            {doc.name.split('.').pop() || 'doc'}
                          </span>
                          <span className="truncate max-w-[180px] font-medium text-slate-200" title={doc.name}>{doc.name}</span>
                          {doc.size && <span className="text-[9px] text-slate-500">({doc.size})</span>}
                        </div>
                        <span className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-wider pl-2 shrink-0">Baixar</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-500">
                    Nenhum documento anexado a esta ficha cadastral.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-950 px-5 py-4 border-t border-slate-850 flex justify-end">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
