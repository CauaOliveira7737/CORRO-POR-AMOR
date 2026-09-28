import React, { useState } from 'react';
import { X, Trophy, Calendar, CheckSquare, Award } from 'lucide-react';
import { Challenge } from '@corro-por-amor/shared';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challengeData: Partial<Challenge>) => Promise<void>;
  editingChallenge?: Challenge | null;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingChallenge,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(editingChallenge?.name || '');
  const [description, setDescription] = useState(editingChallenge?.description || '');
  const [imageUrl, setImageUrl] = useState(editingChallenge?.image_url || '');
  const [startDate, setStartDate] = useState(editingChallenge?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(editingChallenge?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  // Distance options (Multiple KM choices)
  const initialDistances = editingChallenge?.distance_options && editingChallenge.distance_options.length > 0
    ? editingChallenge.distance_options
    : editingChallenge?.target_km
    ? [editingChallenge.target_km]
    : [25, 50, 100];

  const [distanceOptions, setDistanceOptions] = useState<number[]>(initialDistances);
  const [customKm, setCustomKm] = useState('');
  const [minKmPerActivity, setMinKmPerActivity] = useState(editingChallenge?.min_km_per_activity ? editingChallenge.min_km_per_activity.toString() : '1');
  const [hasMedal, setHasMedal] = useState(editingChallenge ? editingChallenge.has_medal : true);
  const [hasCertificate, setHasCertificate] = useState(editingChallenge ? editingChallenge.has_certificate : true);
  
  // Gamification XP fields
  const [xpJoin, setXpJoin] = useState(editingChallenge?.xp_join ? editingChallenge.xp_join.toString() : '50');
  const [xpActivity, setXpActivity] = useState(editingChallenge?.xp_activity ? editingChallenge.xp_activity.toString() : '10');
  const [xpCompletion, setXpCompletion] = useState(editingChallenge?.xp_completion ? editingChallenge.xp_completion.toString() : '100');
  const [xpFirstPlace, setXpFirstPlace] = useState(editingChallenge?.xp_first_place ? editingChallenge.xp_first_place.toString() : '50');

  const [saving, setSaving] = useState(false);

  const togglePreset = (km: number) => {
    if (distanceOptions.includes(km)) {
      if (distanceOptions.length > 1) {
        setDistanceOptions(distanceOptions.filter((d) => d !== km));
      }
    } else {
      setDistanceOptions([...distanceOptions, km].sort((a, b) => a - b));
    }
  };

  const handleAddCustomKm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(customKm);
    if (!isNaN(val) && val > 0 && !distanceOptions.includes(val)) {
      setDistanceOptions([...distanceOptions, val].sort((a, b) => a - b));
      setCustomKm('');
    }
  };

  const handleRemoveKm = (km: number) => {
    if (distanceOptions.length > 1) {
      setDistanceOptions(distanceOptions.filter((d) => d !== km));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || distanceOptions.length === 0) return;
    setSaving(true);
    const sorted = [...distanceOptions].sort((a, b) => a - b);
    try {
      await onSave({
        name,
        description,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
        start_date: startDate,
        end_date: endDate,
        target_km: sorted[0] || 50,
        distance_options: sorted,
        min_km_per_activity: parseFloat(minKmPerActivity),
        has_medal: hasMedal,
        has_certificate: hasCertificate,
        xp_join: parseInt(xpJoin, 10),
        xp_activity: parseInt(xpActivity, 10),
        xp_completion: parseInt(xpCompletion, 10),
        xp_first_place: parseInt(xpFirstPlace, 10),
        status: 'active',
      });
      onClose();
    } catch (err) {
      console.error('Error saving challenge:', err);
      alert('Erro ao salvar desafio. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(1, 42, 74, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(1, 79, 134, 0.1)',
              color: 'var(--color-brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trophy size={20} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
              {editingChallenge ? 'Editar Desafio Virtual' : 'Criar Novo Desafio Virtual'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              Nome do Desafio *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Desafio dos Ventos"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              Descrição e Regras
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o propósito do desafio, incentivos para os atletas e orientações gerais..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Multiple Distance Options */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Opções de Distância para o Desafio *
              </label>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {distanceOptions.length} opção(ões) selecionada(s)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              O atleta poderá escolher uma dessas metas ao se inscrever no desafio.
            </p>

            {/* Selected Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {distanceOptions.map((km) => (
                <div
                  key={km}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <span>{km} KM</span>
                  {distanceOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKm(km)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                        padding: '0 2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                Sugestões Rápidas:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[5, 10, 21, 42, 50, 100, 150].map((preset) => {
                  const isSelected = distanceOptions.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'rgba(1, 79, 134, 0.1)' : '#FFFFFF',
                        color: isSelected ? 'var(--color-brand-blue)' : 'var(--color-text-body)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? `✓ ${preset} km` : `+ ${preset} km`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Distance Adder & Min KM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
                  Outra Distância Personalizada (KM)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={customKm}
                    onChange={(e) => setCustomKm(e.target.value)}
                    placeholder="Ex: 75"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomKm();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomKm}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
                  Distância Mín. por Corrida (KM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={minKmPerActivity}
                  onChange={(e) => setMinKmPerActivity(e.target.value)}
                  placeholder="Ex: 1.0"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
                Data de Término *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              URL da Imagem de Capa
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem-do-desafio.jpg"
              style={{ width: '100%' }}
            />
          </div>

          {/* Gamification Settings */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '12px' }}>
              Configuração de Pontuação de XP
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Ao Participar
                </label>
                <input
                  type="number"
                  value={xpJoin}
                  onChange={(e) => setXpJoin(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Por Atividade
                </label>
                <input
                  type="number"
                  value={xpActivity}
                  onChange={(e) => setXpActivity(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Ao Concluir
                </label>
                <input
                  type="number"
                  value={xpCompletion}
                  onChange={(e) => setXpCompletion(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  1º a Concluir
                </label>
                <input
                  type="number"
                  value={xpFirstPlace}
                  onChange={(e) => setXpFirstPlace(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px' }}
                />
              </div>
            </div>
          </div>

          {/* Recompensas Checkboxes */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={hasMedal}
                onChange={(e) => setHasMedal(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Possui Medalha Física</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={hasCertificate}
                onChange={(e) => setHasCertificate(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Gera Certificado Digital</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border-subtle)',
          }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : (editingChallenge ? 'Atualizar Desafio' : 'Publicar Desafio')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
