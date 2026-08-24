/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Utensils, 
  Sparkles, 
  Baby, 
  Plus, 
  Trash2, 
  Activity, 
  AlertCircle, 
  Calendar, 
  Moon, 
  CheckCircle2, 
  Apple, 
  Scale
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { HealthRecord, PregnancyRecord, Meal } from '../types/schema';
import { useTranslation } from '../utils/i18n';

interface HealthMealsViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function HealthMealsView({ onShowNotification }: HealthMealsViewProps) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'health' | 'pregnancy' | 'meals'>('health');
  
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [pregnancyRecords, setPregnancyRecords] = useState<PregnancyRecord[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

  // Health Form states
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sleep, setSleep] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [healthError, setHealthError] = useState('');

  // Pregnancy Form states
  const [pregWeek, setPregWeek] = useState('');
  const [pregWeight, setPregWeight] = useState('');
  const [pregSymptoms, setPregSymptoms] = useState('');
  const [pregNotes, setPregNotes] = useState('');
  const [pregSize, setPregSize] = useState('');
  const [pregError, setPregError] = useState('');

  // Meal Form states
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealError, setMealError] = useState('');

  useEffect(() => {
    setHealthRecords(LocalDatabase.getHealthRecords());
    setPregnancyRecords(LocalDatabase.getPregnancyRecords());
    setMeals(LocalDatabase.getMeals());
  }, []);

  const handleAddHealth = (e: React.FormEvent) => {
    e.preventDefault();
    const wNum = parseFloat(weight);
    const sysNum = parseInt(systolic);
    const diaNum = parseInt(diastolic);
    const sleepNum = parseFloat(sleep);

    if (isNaN(wNum) || wNum <= 0) {
      setHealthError(t('invalidWeight', 'Por favor, insira um peso válido.'));
      return;
    }
    if (systolic && isNaN(sysNum)) {
      setHealthError(t('invalidSystolic', 'Pressão sistólica inválida.'));
      return;
    }
    if (diastolic && isNaN(diaNum)) {
      setHealthError(t('invalidDiastolic', 'Pressão diastólica inválida.'));
      return;
    }
    if (isNaN(sleepNum) || sleepNum < 0 || sleepNum > 24) {
      setHealthError(t('invalidSleepHours', 'Horas de sono devem ser entre 0 e 24.'));
      return;
    }
    setHealthError('');

    LocalDatabase.addHealthRecord({
      date: new Date().toISOString().split('T')[0],
      weight: wNum,
      systolic: sysNum || null,
      diastolic: diaNum || null,
      sleep_hours: sleepNum,
      symptoms: symptoms.trim() || t('none', 'Nenhum'),
      notes: notes.trim() || t('noAdditionalNotes', 'Sem observações adicionais.')
    });

    setHealthRecords(LocalDatabase.getHealthRecords());
    setWeight('');
    setSystolic('');
    setDiastolic('');
    setSleep('');
    setSymptoms('');
    setNotes('');
    onShowNotification(t('vitalsSavedTitle', 'Sinais Vitais Salvos'), t('vitalsSavedMessage', 'Registro de saúde diário armazenado!'), 'success');
  };

  const handleAddPregnancy = (e: React.FormEvent) => {
    e.preventDefault();
    const week = parseInt(pregWeek);
    const weightVal = parseFloat(pregWeight);

    if (isNaN(week) || week <= 0 || week > 42) {
      setPregError(t('invalidPregnancyWeek', 'A semana gestacional deve ser entre 1 e 42.'));
      return;
    }
    if (pregWeight && isNaN(weightVal)) {
      setPregError(t('invalidMaternalWeight', 'Peso corporal inválido.'));
      return;
    }
    setPregError('');

    // Precalculate fetal estimate size depending on week
    let autoSize = pregSize.trim();
    if (!autoSize) {
      if (week <= 4) autoSize = t('fetalPoppy', 'Semente de papoula');
      else if (week <= 8) autoSize = t('fetalRaspberry', 'Framboesa (aprox. 1.6 cm)');
      else if (week <= 12) autoSize = t('fetalPlum', 'Ameixa (aprox. 5.4 cm)');
      else if (week <= 16) autoSize = t('fetalAvocado', 'Abacate (aprox. 11.6 cm)');
      else if (week <= 20) autoSize = t('fetalBanana', 'Banana (aprox. 25.6 cm)');
      else if (week <= 24) autoSize = t('fetalCorn', 'Espiga de milho (aprox. 30 cm)');
      else if (week <= 28) autoSize = t('fetalEggplant', 'Beringela (aprox. 37.6 cm)');
      else if (week <= 32) autoSize = t('fetalMelon', 'Melão amarelo (aprox. 42.4 cm)');
      else if (week <= 36) autoSize = t('fetalWatermelon', 'Melancia pequena (aprox. 47.4 cm)');
      else autoSize = t('fetalReady', 'Pronto para nascer!');
    }

    LocalDatabase.addPregnancyRecord({
      date: new Date().toISOString().split('T')[0],
      week_number: week,
      weight: weightVal || null,
      symptoms: pregSymptoms.trim() || t('mild', 'Leves'),
      baby_size_estimate: autoSize,
      doctor_notes: pregNotes.trim() || t('fetalPhysiologicalNormal', 'Desenvolvimento fisiológico normal.')
    });

    setPregnancyRecords(LocalDatabase.getPregnancyRecords());
    setPregWeek('');
    setPregWeight('');
    setPregSymptoms('');
    setPregNotes('');
    setPregSize('');
    onShowNotification(t('pregnancySavedTitle', 'Registro Gestacional Salvo'), t('pregnancySavedMessage', 'Semana {week} logada com sucesso!').replace('{week}', String(week)), 'success');
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(calories);
    const prot = parseInt(protein) || 0;
    const carb = parseInt(carbs) || 0;
    const ft = parseInt(fat) || 0;

    if (!foodName.trim()) {
      setMealError(t('foodDescriptionRequired', 'Por favor, informe a descrição do alimento.'));
      return;
    }
    if (isNaN(cal) || cal <= 0) {
      setMealError(t('invalidCalories', 'As calorias devem ser um número positivo.'));
      return;
    }
    setMealError('');

    LocalDatabase.addMeal({
      date: new Date().toISOString().split('T')[0],
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: ft
    });

    setMeals(LocalDatabase.getMeals());
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    onShowNotification(t('mealLoggedTitle', 'Refeição Logada'), t('mealLoggedMessage', 'Alimento adicionado à sua dieta de hoje!'), 'success');
  };

  const handleDeleteMeal = (id: string) => {
    const updated = LocalDatabase.deleteMeal(id);
    setMeals(updated);
    onShowNotification(t('mealRemovedTitle', 'Refeição Removida'), t('mealRemovedMessage', 'Registro excluído.'), 'info');
  };

  const handleDeleteHealth = (id: string) => {
    const updated = LocalDatabase.deleteHealthRecord(id);
    setHealthRecords(updated);
    onShowNotification(t('medicalRecordRemovedTitle', 'Registro Médico Removido'), t('medicalRecordRemovedMessage', 'Histórico atualizado.'), 'info');
  };

  return (
    <div className="space-y-6" id="health-meals-container">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800" id="health-tabs">
        <button 
          onClick={() => setActiveTab('health')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'health' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-health"
        >
          <Activity className="w-4 h-4" />
          <span>{t('tabHealth', 'Sinais Vitais')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('pregnancy')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'pregnancy' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-pregnancy"
        >
          <Baby className="w-4 h-4" />
          <span>{t('tabPregnancy', 'Gestação & Desenvolvimento')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('meals')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'meals' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-meals"
        >
          <Utensils className="w-4 h-4" />
          <span>{t('tabMeals', 'Dieta e Nutrição')}</span>
        </button>
      </div>

      {/* VIEW 1: HEALTH RECORDS (Sinais Vitais) */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tab-health-panel">
          {/* Formulário */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <Plus className="w-4 h-4 mr-1 text-indigo-400" />
              {t('logVitals', 'Logar Sinais Vitais do Dia')}
            </h3>
            <form onSubmit={handleAddHealth} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('bodyWeightKg', 'Peso Corporal (kg)')}</label>
                <input 
                  type="number" step="0.1" placeholder="78.5"
                  value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('systolicPressureMax', 'Pressão Sistólica (max)')}</label>
                  <input 
                    type="number" placeholder="120"
                    value={systolic} onChange={(e) => setSystolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('diastolicPressureMin', 'Pressão Diastólica (min)')}</label>
                  <input 
                    type="number" placeholder="80"
                    value={diastolic} onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('sleepHours', 'Horas de Sono')}</label>
                <input 
                  type="number" step="0.5" placeholder="7.5"
                  value={sleep} onChange={(e) => setSleep(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('symptomsLabel', 'Sintomas (Se houver)')}</label>
                <input 
                  type="text" placeholder={t('symptomsPlaceholder', 'Dor de cabeça leve, refluxo, dores musculares...')}
                  value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('medicalNotes', 'Anotações Médicas / Notas Gerais')}</label>
                <textarea 
                  rows={3} placeholder={t('notesPlaceholder', 'Disposição, dores musculares, estresse, hidratação...')}
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                {t('saveVitals', 'Salvar Sinais Vitais')}
              </button>

              {healthError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {healthError}
                </p>
              )}
            </form>
          </div>

          {/* Histórico */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('recentMedicalHistory', 'Histórico Médico Recente')}</h2>
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {healthRecords.map((r) => (
                <div key={r.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl relative">
                  <button 
                    onClick={() => handleDeleteHealth(r.id)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1"
                    title={t('deleteEntry', 'Excluir lançamento')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{r.date}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">{t('bodyWeight', 'Peso Corporal')}</span>
                      <span className="text-slate-200 font-bold">{r.weight} kg</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">{t('bloodPressure', 'Pressão Arterial')}</span>
                      <span className="text-slate-200 font-bold">{r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic}` : t('notMeasured', 'Não aferida')}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">{t('sleepDuration', 'Tempo de Sono')}</span>
                      <span className="text-slate-200 font-bold flex items-center">
                        <Moon className="w-3 h-3 mr-0.5 text-indigo-400" />
                        {r.sleep_hours}h
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs space-y-1.5">
                    <p className="text-slate-300"><span className="text-slate-500 font-medium">{t('symptomsLabelShort', 'Sintomas:')}</span> {r.symptoms}</p>
                    <p className="text-slate-400 leading-relaxed"><span className="text-slate-500 font-medium">{t('notesLabelShort', 'Notas:')}</span> {r.notes}</p>
                  </div>
                </div>
              ))}

              {healthRecords.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">{t('noMedicalRecords', 'Nenhum registro médico catalogado.')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PREGNANCY (Acompanhamento Gestacional) */}
      {activeTab === 'pregnancy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tab-pregnancy-panel">
          {/* Formulário */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <Baby className="w-4 h-4 mr-1 text-pink-400" />
              {t('newPregnancyTracking', 'Novo Acompanhamento Gestacional')}
            </h3>
            <form onSubmit={handleAddPregnancy} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('pregnancyWeekLabel', 'Semana da Gestação')}</label>
                <input 
                  type="number" placeholder="Ex: 14"
                  value={pregWeek} onChange={(e) => setPregWeek(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('maternalWeightKg', 'Peso da Gestante (kg) - Opcional')}</label>
                <input 
                  type="number" step="0.1" placeholder="Ex: 64.5"
                  value={pregWeight} onChange={(e) => setPregWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('babySizeEstimateOptional', 'Estimativa de Tamanho do Bebê (Opcional)')}</label>
                <input 
                  type="text" placeholder={t('babySizePlaceholder', 'Deixe em branco para cálculo automático do tamanho')}
                  value={pregSize} onChange={(e) => setPregSize(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('experiencedSymptoms', 'Sintomas Vivenciados')}</label>
                <input 
                  type="text" placeholder="Ex: Cansaço, azia, tonturas leves..."
                  value={pregSymptoms} onChange={(e) => setPregSymptoms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('obstetricianNotes', 'Anotações do Obstetra / Notas Gerais')}</label>
                <textarea 
                  rows={3} placeholder="Instruções de vitaminas, repouso, exames solicitados..."
                  value={pregNotes} onChange={(e) => setPregNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                {t('savePregnancyWeek', 'Salvar Semana Gestacional')}
              </button>

              {pregError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {pregError}
                </p>
              )}
            </form>
          </div>

          {/* Lista histórico gestação */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('pregnancyTimeline', 'Cronologia Gestacional e Desenvolvimento Fetal')}</h2>
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {pregnancyRecords.map((p) => (
                <div key={p.id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-900/80 text-indigo-300 font-bold text-xs px-3 py-1 rounded-full border border-indigo-700/40">
                        {t('weekNumber', 'Semana {week}').replace('{week}', String(p.week_number))}
                      </span>
                      <span className="text-[11px] text-slate-500">{p.date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
                      <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('fetalSize', 'Fetal (Tamanho)')}</span>
                        <span className="text-slate-200 font-semibold text-xs">{p.baby_size_estimate}</span>
                      </div>
                    </div>

                    {p.weight && (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('bodyWeight', 'Peso Corporal')}</span>
                          <span className="text-slate-200 font-semibold text-xs">{p.weight} kg</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-xs space-y-2 border-t border-slate-800/40 pt-3">
                    <p className="text-slate-300"><span className="text-slate-500 font-semibold">{t('symptomsLabelShort', 'Sintomas:')}</span> {p.symptoms}</p>
                    <p className="text-slate-400 leading-relaxed"><span className="text-slate-500 font-semibold">{t('medicalInstructions', 'Instruções médicas:')}</span> {p.doctor_notes}</p>
                  </div>
                </div>
              ))}

              {pregnancyRecords.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">{t('noPregnancyLogged', 'Nenhuma semana gestacional logged.')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DIETA & NUTRIÇÃO */}
      {activeTab === 'meals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tab-meals-panel">
          {/* Formulário */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <Apple className="w-4 h-4 mr-1 text-emerald-400" />
              {t('addFoodMeal', 'Adicionar Alimento / Refeição')}
            </h3>
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('mealLabel', 'Refeição')}</label>
                <select 
                  value={mealType} onChange={(e) => setMealType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="breakfast">{t('breakfast', 'Café da Manhã')}</option>
                  <option value="lunch">{t('lunch', 'Almoço')}</option>
                  <option value="dinner">{t('dinner', 'Jantar')}</option>
                  <option value="snack">{t('snack', 'Lanche / Snack')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('foodDescription', 'Descrição do Alimento')}</label>
                <input 
                  type="text" placeholder="Ex: Filé de frango 150g, arroz integral, brócolis..."
                  value={foodName} onChange={(e) => setFoodName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('caloriesKcal', 'Calorias (kcal)')}</label>
                <input 
                  type="number" placeholder="Ex: 520"
                  value={calories} onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">{t('proteinGrams', 'Proteínas (g)')}</label>
                  <input 
                    type="number" placeholder="30"
                    value={protein} onChange={(e) => setProtein(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">{t('carbsGrams', 'Carbos (g)')}</label>
                  <input 
                    type="number" placeholder="45"
                    value={carbs} onChange={(e) => setCarbs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">{t('fatGrams', 'Gorduras (g)')}</label>
                  <input 
                    type="number" placeholder="12"
                    value={fat} onChange={(e) => setFat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                {t('logFood', 'Logar Alimento')}
              </button>

              {mealError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {mealError}
                </p>
              )}
            </form>
          </div>

          {/* Resumo Diário e Refeições */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Widget de Contagem Calórica */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">{t('cumulativeIntakeToday', 'Ingestão Acumulada (Hoje)')}</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-slate-950/55 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">{t('calories', 'Calorias')}</span>
                  <span className="text-white text-lg font-bold">{meals.reduce((sum, m) => sum + m.calories, 0)} kcal</span>
                </div>
                <div className="bg-slate-950/55 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">{t('protein', 'Proteínas')}</span>
                  <span className="text-emerald-400 text-lg font-bold">{meals.reduce((sum, m) => sum + m.protein, 0)}g</span>
                </div>
                <div className="bg-slate-950/55 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">{t('carbs', 'Carbos')}</span>
                  <span className="text-cyan-400 text-lg font-bold">{meals.reduce((sum, m) => sum + m.carbs, 0)}g</span>
                </div>
                <div className="bg-slate-950/55 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">{t('fat', 'Gorduras')}</span>
                  <span className="text-amber-500 text-lg font-bold">{meals.reduce((sum, m) => sum + m.fat, 0)}g</span>
                </div>
              </div>
            </div>

            {/* Listagem */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('mealsDiary', 'Diário de Refeições')}</h2>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {meals.map((m) => (
                  <div key={m.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-850 text-slate-300 font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full border border-slate-700/55">
                          {m.meal_type === 'breakfast' ? t('breakfast', 'Café da Manhã') : m.meal_type === 'lunch' ? t('lunch', 'Almoço') : m.meal_type === 'dinner' ? t('dinner', 'Jantar') : t('snack', 'Lanche')}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.date}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 mt-1.5">{m.food_name}</p>
                      <div className="flex space-x-3 text-[10px] text-slate-400 mt-1">
                        <span>{t('p', 'P')}: {m.protein}g</span>
                        <span>{t('c', 'C')}: {m.carbs}g</span>
                        <span>{t('g', 'G')}: {m.fat}g</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-bold text-white">{m.calories} kcal</span>
                      <button 
                        onClick={() => handleDeleteMeal(m.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {meals.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12">{t('noMealsLogged', 'Nenhum alimento catalogado hoje.')}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
