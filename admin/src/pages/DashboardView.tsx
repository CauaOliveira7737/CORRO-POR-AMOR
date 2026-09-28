import React from 'react';
import { 
  Trophy, 
  Users, 
  Activity as ActivityIcon, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Challenge, ChallengeParticipant } from '@corro-por-amor/shared';

interface DashboardViewProps {
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  totalDistanceKm: number;
  completedCount: number;
  onNavigateTab: (tab: any) => void;
  onOpenCreateChallenge: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  challenges,
  participants,
  totalDistanceKm,
  completedCount,
  onNavigateTab,
  onOpenCreateChallenge,
}) => {
  const activeChallenges = challenges.filter(c => c.status === 'active');

  const kpis = [
    {
      label: 'Desafios Ativos',
      value: activeChallenges.length.toString(),
      icon: Trophy,
      subtext: `${challenges.length} no total`,
      color: 'var(--color-brand-blue)',
      bgColor: 'rgba(1, 79, 134, 0.08)',
    },
    {
      label: 'Participantes',
      value: participants.length.toString(),
      icon: Users,
      subtext: 'Atletas inscritos',
      color: 'var(--color-primary)',
      bgColor: 'rgba(42, 111, 151, 0.08)',
    },
    {
      label: 'KM Registrados',
      value: `${totalDistanceKm.toFixed(1)} km`,
      icon: ActivityIcon,
      subtext: 'Somados automaticamente',
      color: 'var(--color-primary-dark)',
      bgColor: 'rgba(1, 42, 74, 0.08)',
    },
    {
      label: 'Concluíram a Meta',
      value: completedCount.toString(),
      icon: CheckCircle2,
      subtext: '100% percorrido',
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-bg)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Painel do Organizador
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Visão geral em tempo real de desafios, quilometragens somadas e rankings.
          </p>
        </div>
        <button 
          onClick={onOpenCreateChallenge}
          className="btn-primary"
          style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={18} strokeWidth={2.2} />
          <span>Criar Novo Desafio</span>
        </button>
      </div>

      {/* 4 KPIs Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '20px',
      }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: kpi.bgColor,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: '-0.03em' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Challenges Overview */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Desafios em Andamento</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Acompanhamento de metas e engajamento dos corredores
            </p>
          </div>
          <button 
            onClick={() => onNavigateTab('challenges')}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <span>Ver Todos</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {challenges.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Nenhum desafio cadastrado ainda. Clique em "Criar Novo Desafio".
            </div>
          ) : (
            challenges.map((c) => {
              const enrolled = participants.filter(p => p.challenge_id === c.id);
              const finishers = enrolled.filter(p => p.completion_percentage >= 100);

              return (
                <div 
                  key={c.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(1, 79, 134, 0.1)',
                      color: 'var(--color-brand-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Trophy size={22} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                          {c.name}
                        </h4>
                        <span className={`badge ${c.status === 'active' ? 'badge-active' : 'badge-warning'}`}>
                          {c.status === 'active' ? 'Ativo' : c.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Metas: <strong>{c.distance_options && c.distance_options.length > 0 ? c.distance_options.map(k => `${k}k`).join(', ') : `${c.target_km} km`}</strong> • Período: {new Date(c.start_date).toLocaleDateString('pt-BR')} até {new Date(c.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        {enrolled.length} atletas
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                        {finishers.length} já concluíram
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigateTab('participants')}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      <span>Ver Ranking</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
