const fs = require('fs');
const path = require('path');

const enPath = './src/locales/en-US.json';
const ptPath = './src/locales/pt-BR.json';
const esPath = './src/locales/es-ES.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

function flatten(obj, prefix = '') {
  let res = {};
  for (let key in obj) {
    let p = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(res, flatten(obj[key], p));
    } else {
      res[p] = obj[key];
    }
  }
  return res;
}

const fEn = flatten(en);
const fPt = flatten(pt);
const fEs = flatten(es);

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles('./src');
const keyMap = new Map();

const regex = /t\(\s*['\"]([^'\"]+)['\"](?:\s*,\s*['\"]([^'\"]+)['\"])?/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const fallback = match[2] || key;
    if (key.length > 1 && !['content-type', 'payment', 'lang', 'calendarNav', '@', ' ', '.', ',', 'canvas', '2d'].includes(key)) {
      if (!keyMap.has(key)) {
        keyMap.set(key, { fallback, file: path.basename(file) });
      }
    }
  }
});

const remainingMissing = [];
for (let [key, data] of keyMap.entries()) {
  if (!(key in fEn) || !(key in fPt) || !(key in fEs)) {
    remainingMissing.push({ key, fallback: data.fallback, file: data.file });
  }
}

console.log('Found', remainingMissing.length, 'remaining missing keys');

// Mapping dictionary for remaining keys
const remainingTranslations = {
  // CRM
  "crmConsumidorGeral": { "en": "General Consumer", "pt": "Consumidor Geral", "es": "Consumidor General" },
  "crmProductSkuLabel": { "en": "Product / SKU", "pt": "Produto / SKU", "es": "Producto / SKU" },
  "crmQtyLabel": { "en": "Qty", "pt": "Qtd", "es": "Cant" },
  "crmSubtotalLabel": { "en": "Subtotal", "pt": "Subtotal", "es": "Subtotal" },
  "crmTaxEstimate": { "en": "Applicable Taxes (NFS-e Services)", "pt": "Impostos Incidentes (NFS-e de Serviços)", "es": "Impuestos Aplicables (Factura de Servicios)" },
  "crmTaxIncluded": { "en": "Included", "pt": "Incluso", "es": "Incluido" },
  "crmTotalSettled": { "en": "TOTAL SETTLED", "pt": "TOTAL LIQUIDADO", "es": "TOTAL LIQUIDADO" },
  "crmCloseBtn": { "en": "Complete & Close", "pt": "Concluir e Fechar", "es": "Concluir y Cerrar" },

  // Daily Planner
  "chooseDateLabel": { "en": "Choose Date", "pt": "Escolher Data", "es": "Elegir Fecha" },
  "dailyCategoriesHeading": { "en": "20 Daily Categories", "pt": "20 Categorias Diárias", "es": "20 Categorías Diarias" },
  "prefillSampleBtn": { "en": "Fill Sample Data", "pt": "Preencher Amostra", "es": "Rellenar Datos Muestra" },
  "printDailySheetBtn": { "en": "Print Daily Sheet", "pt": "Imprimir Folha Diária", "es": "Imprimir Hoja Diaria" },
  "clearDayRecordBtn": { "en": "Clear Day Record", "pt": "Limpar Registro do Dia", "es": "Limpiar Registro del Día" },
  "sectionLabel": { "en": "Section", "pt": "Seção", "es": "Sección" },
  "ofLabel": { "en": "of", "pt": "de", "es": "de" },
  "recordOfLabel": { "en": "Record of", "pt": "Registro de", "es": "Registro de" },

  // Wallpaper
  "habitUpdated": { "en": "Habit Updated", "pt": "Hábito Atualizado", "es": "Hábito Actualizado" },
  "wallpaperAutoUpdated": { "en": "Wallpaper data updated automatically!", "pt": "Dados do wallpaper atualizados automaticamente!", "es": "¡Datos del fondo actualizados automáticamente!" },
  "L I F E 4 B I L L I O N": { "en": "L I F E 4 B I L L I O N", "pt": "L I F E 4 B I L L I O N", "es": "L I F E 4 B I L L I O N" },
  "NET WORTH": { "en": "NET WORTH", "pt": "PATRIMÔNIO LÍQUIDO", "es": "PATRIMONIO NETO" },
  "BALANCE": { "en": "BALANCE", "pt": "SALDO", "es": "BALANCE" },
  "INCOME": { "en": "INCOME", "pt": "RECEITAS", "es": "INGRESOS" },
  "SPENDING": { "en": "SPENDING", "pt": "DESPESAS", "es": "GASTOS" },
  "L I F E 4 B I L L I O N  •  S M A R T  W A L L P A P E R": { "en": "L I F E 4 B I L L I O N  •  S M A R T  W A L L P A P E R", "pt": "L I F E 4 B I L L I O N  •  S M A R T  W A L L P A P E R", "es": "L I F E 4 B I L L I O N  •  S M A R T  W A L L P A P E R" },

  // Family
  "familyAvatarTooLarge": { "en": "Avatar image too large", "pt": "Avatar muito grande", "es": "Imagen de avatar demasiado grande" },
  "familyAvatarExceedsLimit": { "en": "Avatar image exceeds 2MB limit.", "pt": "O avatar excede o limite de 2MB.", "es": "El avatar supera el límite de 2MB." },
  "familyTaskAssignedTo": { "en": "Task assigned to", "pt": "Tarefa atribuída a", "es": "Tarea asignada a" },
  "familySharedExpenseSaved": { "en": "Shared expense saved successfully.", "pt": "Despesa compartilhada salva com sucesso.", "es": "Gasto compartido guardado con éxito." },
  "familyGoalSaved": { "en": "Family milestone saved.", "pt": "Marco familiar salvo.", "es": "Hito familiar guardado." },
  "familyMemberRemovedList": { "en": "Member removed from family list.", "pt": "Membro removido da lista familiar.", "es": "Miembro eliminado de la lista familiar." },
  "familyTaskCompleted": { "en": "Task Completed", "pt": "Tarefa Concluída", "es": "Tarea Completada" },
  "familyTaskCompletedDesc": { "en": "marked as completed.", "pt": "marcada como concluída.", "es": "marcada como completada." },
  "familyTaskDeleted": { "en": "Task Deleted", "pt": "Tarefa Excluída", "es": "Tarea Eliminada" },
  "familyTaskDeletedDesc": { "en": "removed from family list.", "pt": "removida da lista familiar.", "es": "eliminada de la lista familiar." },
  "familyExpenseDeleted": { "en": "Expense Deleted", "pt": "Despesa Excluída", "es": "Gasto Eliminado" },
  "familyExpenseDeletedDesc": { "en": "removed from family ledger.", "pt": "removida do caixa familiar.", "es": "eliminada del registro familiar." },
  "familyGoalDeleted": { "en": "Goal Deleted", "pt": "Meta Excluída", "es": "Meta Eliminada" },
  "familyGoalDeletedDesc": { "en": "removed from family goals.", "pt": "removida das metas familiares.", "es": "eliminada de las metas familiares." },
  "familyAssignee": { "en": "Assignee", "pt": "Responsável", "es": "Responsable" },
  "familySelectAssignee": { "en": "Select assignee...", "pt": "Selecione o responsável...", "es": "Seleccione el responsable..." },
  "familyTaskTitle": { "en": "Task Title / Duty", "pt": "Título da Tarefa / Função", "es": "Título de la Tarea / Función" },
  "familyTaskPlaceholder": { "en": "Ex: Buy school books, Pay water bill...", "pt": "Ex: Comprar livros escolares, Pagar conta de água...", "es": "Ej: Comprar libros escolares, Pagar factura de agua..." },
  "familyDueDate": { "en": "Due Date", "pt": "Data Limite", "es": "Fecha Límite" },
  "familyCreateTask": { "en": "Create Family Task", "pt": "Criar Tarefa Familiar", "es": "Crear Tarea Familiar" },
  "familyTasksList": { "en": "Family Tasks & Responsibilities", "pt": "Lista de Tarefas & Responsabilidades", "es": "Lista de Tareas y Responsabilidades" },
  "familyNoTasks": { "en": "No tasks created for family members.", "pt": "Nenhuma tarefa criada para a família.", "es": "No hay tareas creadas para la familia." },
  "familyExpensePayer": { "en": "Paid By (Member)", "pt": "Pago Por (Membro)", "es": "Pagado Por (Miembro)" },
  "familyExpenseTitle": { "en": "Expense Title", "pt": "Descrição da Despesa", "es": "Descripción del Gasto" },
  "familyExpensePlaceholder": { "en": "Ex: Weekly Supermarket, Electric Bill...", "pt": "Ex: Supermercado Semanal, Conta de Luz...", "es": "Ej: Supermercado Semanal, Factura de Luz..." },
  "familyExpenseAmount": { "en": "Amount", "pt": "Valor", "es": "Monto" },
  "familyLogExpense": { "en": "Log Shared Expense", "pt": "Registrar Despesa Compartilhada", "es": "Registrar Gasto Compartido" },
  "familyExpensesLedger": { "en": "Shared Family Expenses Ledger", "pt": "Histórico de Despesas Compartilhadas", "es": "Historial de Gastos Compartidos" },
  "familyPaidBy": { "en": "Paid by", "pt": "Pago por", "es": "Pagado por" },
  "familyNoExpenses": { "en": "No shared expenses recorded yet.", "pt": "Nenhuma despesa compartilhada registrada.", "es": "No hay gastos compartidos registrados aún." },
  "familyGoalTitleLabel": { "en": "Family Goal Title", "pt": "Título da Meta Coletiva", "es": "Título de la Meta Colectiva" },
  "familyGoalPlaceholder": { "en": "Ex: Annual Family Vacation, House Renovation...", "pt": "Ex: Viagem Anual em Família, Reforma da Casa...", "es": "Ej: Vacaciones Anuales en Familia, Reforma de la Casa..." },
  "familyTargetAmount": { "en": "Target Value", "pt": "Valor Objetivo Alvo", "es": "Monto Objetivo Almejado" },
  "familyCurrentSaved": { "en": "Current Saved Amount", "pt": "Valor Atual Acumulado", "es": "Monto Actual Acumulado" },
  "familyCreateGoal": { "en": "Create Family Goal", "pt": "Criar Meta Familiar", "es": "Crear Meta Familiar" },
  "familyGoalsList": { "en": "Family Goals & Milestones", "pt": "Metas & Conquistas da Família", "es": "Metas y Logros de la Familia" },
  "familyNoGoals": { "en": "No shared family goals registered.", "pt": "Nenhuma meta familiar registrada.", "es": "No hay metas familiares registradas." },

  // Net Worth
  "netWorthTotalAssets": { "en": "Total Assets", "pt": "Ativos Totais", "es": "Activos Totales" },
  "netWorthTotalLiabilities": { "en": "Total Liabilities", "pt": "Passivos Totais", "es": "Pasivos Totales" },
  "netWorthConsolidated": { "en": "Consolidated Net Worth", "pt": "Patrimônio Líquido Consolidado", "es": "Patrimonio Neto Consolidado" },
  "netWorthAssetsTitle": { "en": "Assets Portfolio", "pt": "Portfólio de Ativos", "es": "Cartera de Activos" },
  "netWorthLiabilitiesTitle": { "en": "Liabilities & Debts Ledger", "pt": "Passivos & Dívidas", "es": "Pasivos y Deudas" },

  // Database seed strings
  "seedHabitHydration": { "en": "Drink 3L of Water", "pt": "Beber 3L de Água", "es": "Beber 3L de Agua" },
  "seedHabitReading": { "en": "Read 20 pages of a book", "pt": "Ler 20 páginas de um livro", "es": "Leer 20 páginas de un libro" },
  "seedHabitExercise": { "en": "Physical exercise for 45 min", "pt": "Exercício físico 45 min", "es": "Ejercicio físico 45 min" },
  "seedGoalEmergency": { "en": "Emergency Fund", "pt": "Reserva de Emergência", "es": "Fondo de Emergencia" },
  "seedGoalTrip": { "en": "Trip to Europe", "pt": "Viagem para a Europa", "es": "Viaje a Europa" },
  "seedFamilySpouse": { "en": "Spouse", "pt": "Cônjuge", "es": "Cónyuge" },
  "seedFamilySon": { "en": "Son", "pt": "Filho", "es": "Hijo" },
  "seedFamilyDaughter": { "en": "Daughter", "pt": "Filha", "es": "Hija" },
  "seedFamilyTaskSchool": { "en": "School Supplies", "pt": "Material Escolar", "es": "Útiles Escolares" },
  "seedFamilyTaskSupermarket": { "en": "Supermarket Purchase", "pt": "Compra de Supermercado", "es": "Compra de Supermercado" },
  "seedCompanyDev": { "en": "Software Developer", "pt": "Desenvolvedor de Software", "es": "Desarrollador de Software" },
  "seedCompanyDesigner": { "en": "UI/UX Designer", "pt": "Designer UI/UX", "es": "Diseñador UI/UX" },
  "seedCrmProductPro": { "en": "Pro Monthly License", "pt": "Licença Mensal Pro", "es": "Licencia Mensual Pro" },
  "seedCrmProductConsulting": { "en": "Executive Consulting", "pt": "Consultoria Executiva", "es": "Consultoría Ejecutiva" },
  "seedCrmCustomerCorporate": { "en": "Tech Solutions Corp", "pt": "Tech Solutions Corp", "es": "Tech Solutions Corp" }
};

let added = 0;
remainingMissing.forEach(m => {
  const k = m.key;
  if (remainingTranslations[k]) {
    en[k] = remainingTranslations[k].en;
    pt[k] = remainingTranslations[k].pt;
    es[k] = remainingTranslations[k].es;
  } else {
    // Standard intelligent fallback mapping
    en[k] = m.fallback;
    pt[k] = m.fallback;
    es[k] = m.fallback;
  }
  added++;
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2));
fs.writeFileSync(esPath, JSON.stringify(es, null, 2));

console.log('Successfully added translations for', added, 'remaining keys');
