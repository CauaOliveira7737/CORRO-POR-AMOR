import React, { useState } from 'react';
import { Search, Trophy, CheckCircle2, User, Award } from 'lucide-react';
import { ChallengeParticipant, Challenge } from '@corro-por-amor/shared';

interface ParticipantsViewProps {
  participants: ChallengeParticipant[];
  challenges: Challenge[];
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  participants,
  challenges,
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('all');
  const [selectedDistanceTarget, setSelectedDistanceTarget] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeChallenge = challenges.find((c) => c.id === selectedChallengeId);
  const availableDistances: number[] = Array.from(
    new Set([
      ...(activeChallenge?.distance_options || []),
      ...participants
        .filter((p) => selectedChallengeId === 'all' || p.challenge_id === selectedChallengeId)
        .map((p) => p.target_km)
        .filter((k): k is number => !!k),
    ])
  ).sort((a, b) => a - b);

  const filtered = participants.filter((p) => {
    const matchesChallenge = selectedChallengeId === 'all' || p.challenge_id === selectedChallengeId;
    const pTargetKm = p.target_km || challenges.find((c) => c.id === p.challenge_id)?.target_km || 50;
    const matchesDistance = selectedDistanceTarget === 'all' || String(pTargetKm) === selectedDistanceTarget;
    const athleteName = p.athlete?.name || '';
    const athleteEmail = p.athlete?.email || '';
    const matchesSearch = 
      athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athleteEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChallenge && matchesDistance && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Participantes & Ranking
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Consulte o progresso de cada atleta, quilometragem acumulada e status de conclusão por meta.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px' }}
          />
        </div>

        <select
          value={selectedChallengeId}
          onChange={(e) => {
            setSelectedChallengeId(e.target.value);
            setSelectedDistanceTarget('all');
          }}
          style={{ minWidth: '200px' }}
        >
          <option value="all">Todos os Desafios</option>
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {availableDistances.length > 0 && (
          <select
            value={selectedDistanceTarget}
            onChange={(e) => setSelectedDistanceTarget(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">
              Todas as Metas de KM ({participants.filter(p => selectedChallengeId === 'all' || p.challenge_id === selectedChallengeId).length})
            </option>
            {availableDistances.map((km) => {
              const countInKm = participants.filter(
                (p) => (selectedChallengeId === 'all' || p.challenge_id === selectedChallengeId) && (p.target_km || 50) === km
              ).length;
              return (
                <option key={km} value={String(km)}>
                  Meta {km} KM ({countInKm})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Participants Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '16px 20px' }}>Atleta</th>
              <th style={{ padding: '16px 20px' }}>Desafio</th>
              <th style={{ padding: '16px 20px' }}>Quilometragem</th>
              <th style={{ padding: '16px 20px' }}>Progresso</th>
              <th style={{ padding: '16px 20px' }}>Status</th>
              <th style={{ padding: '16px 20px' }}>XP & Nível</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Nenhum atleta encontrado para os critérios de busca.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isCompleted = p.completion_percentage >= 100;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(1, 79, 134, 0.1)',
                          color: 'var(--color-brand-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}>
                          {p.athlete?.name ? p.athlete.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{p.athlete?.name || 'Atleta'}</span>
                            {p.is_first_to_finish && (
                              <span title="Primeiro a Concluir o Desafio" style={{ color: 'var(--color-warning)', display: 'inline-flex' }}>
                                <Trophy size={14} />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {p.athlete?.email || 'Sem e-mail'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--color-text-body)' }}>
                      <div>{p.challenge?.name || 'Desafio'}</div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(1, 79, 134, 0.08)',
                          color: 'var(--color-brand-blue)',
                        }}>
                          Meta: {p.target_km || p.challenge?.target_km || 50} km
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-primary-dark)' }}>
                        {p.completed_km.toFixed(1)} km
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {' '}/ {p.target_km || p.challenge?.target_km || 50} km
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', width: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.min(100, p.completion_percentage)}%`,
                            height: '100%',
                            backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-brand-blue)',
                            borderRadius: 'var(--radius-full)',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isCompleted ? 'var(--color-success)' : 'var(--color-brand-blue)' }}>
                          {Math.round(p.completion_percentage)}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} />
                          <span>CONCLUÍDO</span>
                        </span>
                      ) : (
                        <span className="badge badge-active">
                          <span>EM ANDAMENTO</span>
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-brand-blue)', fontSize: '13px' }}>
                        {p.athlete?.xp_total || 0} XP
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        (Nível {p.athlete?.level || 1})
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
