import React from 'react';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Target, 
  Award, 
  Edit3, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Challenge, ChallengeParticipant } from '@corro-por-amor/shared';

interface ChallengesViewProps {
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  onOpenCreateModal: () => void;
  onEditChallenge: (challenge: Challenge) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  participants,
  onOpenCreateModal,
  onEditChallenge,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Desafios Virtuais
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Gerencie datas, metas de quilometragem, premiações e regras dos desafios.
          </p>
        </div>
        <button onClick={onOpenCreateModal} className="btn-primary">
          <Plus size={18} strokeWidth={2.2} />
          <span>Criar Desafio</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {challenges.map((c) => {
          const enrolled = participants.filter((p) => p.challenge_id === c.id);
          const finishers = enrolled.filter((p) => p.completion_percentage >= 100);

          return (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className={`badge ${c.status === 'active' ? 'badge-active' : 'badge-warning'}`}>
                    {c.status === 'active' ? 'Em Andamento' : c.status}
                  </span>
                  <button 
                    onClick={() => onEditChallenge(c)}
                    style={{ color: 'var(--color-brand-blue)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                  {c.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {c.description || 'Sem descrição cadastrada.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-body)' }}>
                    <Target size={16} strokeWidth={2} color="var(--color-brand-blue)" />
                    <span>
                      Metas: <strong>{c.distance_options && c.distance_options.length > 0 ? c.distance_options.map(k => `${k} km`).join(' • ') : `${c.target_km} km`}</strong> (Mín. {c.min_km_per_activity} km/corrida)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-body)' }}>
                    <Calendar size={16} strokeWidth={2} color="var(--color-brand-blue)" />
                    <span>{new Date(c.start_date).toLocaleDateString('pt-BR')} até {new Date(c.end_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-body)' }}>
                    <Award size={16} strokeWidth={2} color="var(--color-brand-blue)" />
                    <span>
                      {c.has_medal && '🏅 Medalha Física '}
                      {c.has_certificate && '📜 Certificado Digital'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Participantes</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {enrolled.length} atletas ({finishers.length} concluintes)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(1, 79, 134, 0.1)',
                    color: 'var(--color-brand-blue)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    +{c.xp_completion} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
