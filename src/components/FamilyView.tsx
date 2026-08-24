/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Heart, 
  Calendar, 
  Sparkles, 
  Cake, 
  AlertCircle,
  FolderHeart
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { FamilyMember } from '../types/schema';
import { useLanguageTheme } from '../utils/i18n';

interface FamilyViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function FamilyView({ onShowNotification }: FamilyViewProps) {
  const { t, language } = useLanguageTheme();

  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [members, setMembers] = useState<FamilyMember[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<'spouse' | 'child' | 'parent' | 'sibling' | 'other'>('spouse');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; size: string; type: string; content: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    setMembers(LocalDatabase.getFamilyMembers());
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        onShowNotification(
          t('familyAvatarTooLarge', 'Avatar muito grande'),
          t('familyAvatarExceedsLimit', 'O avatar excede o limite de 2MB.'),
          'warning'
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      // Limit file size to 5MB to avoid localStorage issues
      if (file.size > 5 * 1024 * 1024) {
        onShowNotification(
          t('familyFileTooLarge', 'Arquivo muito grande'),
          t('familyFileExceedsLimit', 'O arquivo "{name}" excede o limite de 5MB.').replace('{name}', file.name),
          'warning'
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(file.size / 1024).toFixed(0)} KB`;
        
        setUploadedDocs(prev => [
          ...prev, 
          {
            name: file.name,
            size: sizeFormatted,
            type: file.type,
            content: base64String
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDoc = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('familyProvideName', 'Por favor, informe o nome do membro da família.'));
      return;
    }
    if (!birthDate) {
      setFormError(t('familyProvideBirthDate', 'Por favor, informe a data de nascimento.'));
      return;
    }
    setFormError('');

    const newMem = LocalDatabase.addFamilyMember({
      name: name.trim(),
      relationship,
      birth_date: birthDate,
      notes: notes.trim() || t('familyNoNotes', 'Sem observações.'),
      documents: uploadedDocs,
      avatar_url: avatarUrl
    });

    setMembers(LocalDatabase.getFamilyMembers());
    setName('');
    setBirthDate('');
    setNotes('');
    setUploadedDocs([]);
    setAvatarUrl('');
    onShowNotification(
      t('familyProfileSaved', 'Perfil de Família Salvo'),
      t('familyMemberRegisteredSuccess', 'Membro "{name}" cadastrado com sucesso!').replace('{name}', newMem.name),
      'success'
    );
  };

  const handleDeleteMember = (id: string, name: string) => {
    const updated = LocalDatabase.deleteFamilyMember(id);
    setMembers(updated);
    onShowNotification(
      t('familyProfileRemoved', 'Perfil Removido'),
      t('familyProfileRemovedDesc', 'O registro de "{name}" foi apagado.').replace('{name}', name),
      'info'
    );
  };

  // Age Calculator Helper
  const calculateAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age === 0) {
      // Calculate months instead
      const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();
      return `${months} ${months === 1 ? t('familyMonth', tr('mês', 'month', 'mes')) : t('familyMonths', tr('meses', 'months', 'meses'))}`;
    }

    return `${age} ${age === 1 ? t('familyYear', tr('ano', 'year', 'año')) : t('familyYears', tr('anos', 'years', 'años'))}`;
  };

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'spouse': return t('familySpouseLabel', tr('Cônjuge / Parceiro(a)', 'Spouse / Partner', 'Cónyuge / Pareja'));
      case 'child': return t('familyChildLabel', tr('Filho(a)', 'Child', 'Hijo(a)'));
      case 'parent': return t('familyParentLabel', tr('Pai / Mãe', 'Parent', 'Padre / Madre'));
      case 'sibling': return t('familySiblingLabel', tr('Irmão / Irmã', 'Sibling', 'Hermano(a)'));
      default: return t('familyOtherLabel', tr('Outros', 'Other', 'Otros'));
    }
  };

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case 'spouse': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'child': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'parent': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'sibling': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="family-container">
      
      {/* Formulário Novo Membro */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit" id="family-form-panel">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center">
            <Users className="w-4 h-4 mr-1.5 text-indigo-400" />
            {t('familyAddMemberTitle', tr('Cadastrar Membro Familiar', 'Register Family Member', 'Registrar Miembro Familiar'))}
          </h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {t('familyAddMemberDesc', tr(
              'Gerencie os perfis de quem você ama e compartilha responsabilidades.',
              'Manage profiles of those you love and share responsibilities with.',
              'Gestione los perfiles de sus seres queridos y comparta responsabilidades.'
            ))}
          </p>
        </div>

        <form onSubmit={handleAddMember} className="space-y-4 mt-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {t('familyFullName', tr('Nome Completo', 'Full Name', 'Nombre Completo'))}
            </label>
            <input 
              type="text" 
              placeholder={tr('Ex: Ana Souza King', 'E.g., Ana Souza King', 'Ej: Ana Souza King')}
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
              id="input-family-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {t('familyRelationship', tr('Parentesco', 'Relationship / Role', 'Parentesco / Rol'))}
              </label>
              <select 
                value={relationship} onChange={(e) => setRelationship(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="spouse">{t('familySpouseOpt', tr('Cônjuge / Parceiro(a)', 'Spouse / Partner', 'Cónyuge / Pareja'))}</option>
                <option value="child">{t('familyChildOpt', tr('Filho(a)', 'Child', 'Hijo(a)'))}</option>
                <option value="parent">{t('familyParentOpt', tr('Mãe / Pai', 'Parent', 'Padre / Madre'))}</option>
                <option value="sibling">{t('familySiblingOpt', tr('Irmão / Irmã', 'Sibling', 'Hermano/Hermana'))}</option>
                <option value="other">{t('familyOtherOpt', tr('Outros', 'Other', 'Otros'))}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {t('familyBirthDate', tr('Nascimento', 'Birth Date', 'Nacimiento'))}
              </label>
              <input 
                type="date"
                value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {t('familyMedicalNotes', tr('Observações Médicas ou Gerais', 'Medical or General Notes', 'Observaciones Médicas o Generales'))}
            </label>
            <textarea 
              rows={3} 
              placeholder={t('familyNotesPlaceholder', tr(
                'Ex: Gosta de ler, possui intolerância a lactose...',
                'Medical notes, routine, emergency contact...',
                'Ej: Observaciones médicas, rutina, contacto de emergencia...'
              ))}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Upload de Avatar para o Membro Familiar */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('familyAvatarLabel', tr('Avatar do Membro (Opcional)', 'Member Avatar (Optional)', 'Avatar del Miembro (Opcional)'))}
            </label>
            <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg text-slate-400">👤</span>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  id="family-avatar-input"
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('family-avatar-input')?.click()}
                  className="bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                >
                  {t('familySelectImage', tr('Selecionar Imagem', 'Select Image', 'Seleccionar Imagen'))}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="ml-2 text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
                  >
                    {t('familyRemove', tr('Remover', 'Remove', 'Eliminar'))}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Upload Area with Drag and Drop */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('familyDocumentsLabel', tr('Documentos & Comprovantes (Upload Direto)', 'Documents & Receipts (Direct Upload)', 'Documentos y Comprobantes (Carga Directa)'))}
            </label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
              onClick={() => document.getElementById('family-file-input')?.click()}
            >
              <input 
                type="file" 
                id="family-file-input"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <span className="text-xl block mb-1">📂</span>
              <p className="text-[11px] font-bold text-slate-300">
                {t('familyDragDrop', tr('Arrastar & Soltar ou clique para fazer upload', 'Drag & Drop or click to upload', 'Arrastrar y Soltar o haga clic para cargar'))}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {t('familyAllowedFiles', tr('PDF, Word ou Imagens (Max 5MB)', 'PDF, Word or Images (Max 5MB)', 'PDF, Word o Imágenes (Máx 5MB)'))}
              </p>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-1.5 mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-indigo-400 font-mono block uppercase tracking-wide">
                  {t('familyAttachedFiles', tr('Arquivos anexados ({count}):', 'Attached files ({count}):', 'Archivos adjuntos ({count}):')).replace('{count}', String(uploadedDocs.length))}
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[10px] text-slate-300">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-mono text-[8px] text-indigo-400 bg-indigo-950/40 px-1 py-0.5 rounded uppercase font-bold">
                          {doc.name.split('.').pop() || 'doc'}
                        </span>
                        <span className="truncate max-w-[110px]" title={doc.name}>{doc.name}</span>
                        <span className="text-[8px] text-slate-500">({doc.size})</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDoc(idx);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold px-1"
                      >
                        {t('familyDelete', tr('Excluir', 'Delete', 'Eliminar'))}
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
            id="submit-family-btn"
          >
            {t('familySubmitBtn', tr('Adicionar à Família', 'Add to Family', 'Añadir a la Familia'))}
          </button>

          {formError && (
            <p className="text-rose-400 text-xs flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {formError}
            </p>
          )}
        </form>
      </div>

      {/* Listagem da Família (2 colunas) */}
      <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="family-list-panel">
        <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center">
          <Heart className="w-4 h-4 mr-1.5 text-rose-500 fill-rose-500/20" />
          {t('familyRegisteredMembers', tr('Membros da Família Cadastrados', 'Registered Family Members & Profiles', 'Miembros de la Familia Registrados'))}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
          {members.map((m) => (
            <div key={m.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl relative flex flex-col justify-between hover:border-slate-800 transition">
              <button 
                onClick={() => handleDeleteMember(m.id, m.name)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1"
                title={t('familyDeleteMemberTooltip', tr('Excluir membro', 'Delete member', 'Eliminar miembro'))}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 pr-6">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-400">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">{m.name}</h3>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold uppercase mt-1 inline-block ${getRelationshipColor(m.relationship)}`}>
                      {getRelationshipLabel(m.relationship)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1.5">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    {m.birth_date}
                  </span>
                  <span className="flex items-center font-semibold text-slate-200">
                    <Cake className="w-3.5 h-3.5 mr-1 text-pink-500" />
                    {calculateAge(m.birth_date)}
                  </span>
                </div>

                 {m.notes && (
                  <p className="text-slate-400 text-xs leading-relaxed border-t border-slate-850/60 pt-2">
                    <span className="text-slate-500 font-medium">{t('familyNotesLabel', tr('Notas:', 'Notes:', 'Notas:'))}</span> {m.notes}
                  </p>
                )}

                {m.documents && m.documents.length > 0 && (
                  <div className="border-t border-slate-850/60 pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {t('familyDocumentsCount', tr('Documentos ({count}):', 'Documents ({count}):', 'Documentos ({count}):')).replace('{count}', String(m.documents.length))}
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {m.documents.map((doc, docIdx) => (
                        <a 
                          key={docIdx}
                          href={doc.content}
                          download={doc.name}
                          className="flex items-center justify-between bg-slate-900 border border-slate-850 hover:border-slate-700 hover:bg-slate-950 px-2 py-1.5 rounded-lg text-[10px] text-slate-300 transition"
                          title={t('familyDownloadTooltip', tr('Clique para baixar', 'Click to download', 'Haga clic para descargar'))}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="font-mono text-[8px] text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                              {doc.name.split('.').pop() || 'doc'}
                            </span>
                            <span className="truncate max-w-[120px] font-medium" title={doc.name}>{doc.name}</span>
                          </div>
                          <span className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-wider pl-1 shrink-0">
                            {t('familyDownloadBtn', tr('Baixar', 'Download', 'Descargar'))}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="col-span-2 text-center py-16 border border-dashed border-slate-800 rounded-2xl">
              <FolderHeart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">
                {t('familyEmptyTitle', tr('Família não catalogada', 'No Family Members Registered', 'Familia no registrada'))}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {t('familyEmptyDesc', tr(
                  'Insira os membros ao lado para acompanhar aniversários e informações médicas unificadas.',
                  'Add members on the left to track birthdays and unified medical information.',
                  'Añada miembros a la izquierda para seguir cumpleaños e información médica unificada.'
                ))}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
