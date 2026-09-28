import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Activity } from '@corro-por-amor/shared';

interface ValidationViewProps {
  activities: Activity[];
  onApproveActivity: (activityId: string) => Promise<void>;
  onRejectActivity: (activityId: string, reason: string) => Promise<void>;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  activities,
  onApproveActivity,
  onRejectActivity,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending_review' | 'all'>('pending_review');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Atividade incompatível com os critérios de corrida a pé.');

  const pendingList = activities.filter(a => a.status === 'pending_review');
  const displayList = filterStatus === 'pending_review' ? pendingList : activities;

  const handleApprove = async (id: string) => {
    if (confirm('Deseja realmente aprovar esta atividade? Os quilômetros e XP serão somados ao atleta imediatamente.')) {
      await onApproveActivity(id);
    }
  };

  const handleRejectConfirm = async (id: string) => {
    await onRejectActivity(id, rejectReason);
    setRejectingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Validação de Atividades & Anti-Fraude
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Atividades com anomalias de velocidade (acima de 25 km/h) ou saltos de GPS são retidas aqui para revisão humana.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterStatus('pending_review')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filterStatus === 'pending_review' ? 'var(--color-brand-blue)' : '#FFFFFF',
              color: filterStatus === 'pending_review' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Pendentes ({pendingList.length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filterStatus === 'all' ? 'var(--color-brand-blue)' : '#FFFFFF',
              color: filterStatus === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Todas as Atividades ({activities.length})
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      {displayList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
          <ShieldAlert size={40} style={{ color: 'var(--color-success)', marginBottom: '12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '18px', color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
            Nenhuma atividade pendente de análise!
          </h3>
          <p style={{ fontSize: '14px' }}>
            Todas as corridas registradas no aplicativo foram validadas e computadas automaticamente com sucesso.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayList.map((act) => {
            const isPending = act.status === 'pending_review';

            return (
              <div 
                key={act.id} 
                className="card"
                style={{
                  borderLeft: isPending ? '4px solid var(--color-warning)' : '1px solid var(--color-border)',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(1, 79, 134, 0.1)',
                      color: 'var(--color-brand-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '16px',
                    }}>
                      {act.athlete?.name ? act.athlete.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          {act.athlete?.name || 'Atleta'}
                        </h4>
                        <span className={`badge ${
                          act.status === 'approved' ? 'badge-success' :
                          act.status === 'pending_review' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {act.status === 'approved' ? 'Aprovada' :
                           act.status === 'pending_review' ? 'Revisão Necessária' : 'Recusada'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Desafio: <strong>{act.challenge?.name || 'Corrida Livre'}</strong> • Registrada em {new Date(act.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Badge Group */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Distância</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        {act.distance_km.toFixed(2)} km
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tempo</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        {Math.floor(act.moving_seconds / 60)} min
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ritmo Médio</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-blue)' }}>
                        {act.average_pace}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Banner if Flagged */}
                {act.rejection_reason && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-warning-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(217, 119, 6, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: 'var(--color-warning)',
                  }}>
                    <AlertTriangle size={18} strokeWidth={2} />
                    <span><strong>Motivo da Sinalização:</strong> {act.rejection_reason}</span>
                  </div>
                )}

                {/* Action Controls for Pending Review */}
                {isPending && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                  }}>
                    {rejectingId === act.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Motivo da recusa..."
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        />
                        <button onClick={() => handleRejectConfirm(act.id)} className="btn-danger">
                          Confirmar Recusa
                        </button>
                        <button onClick={() => setRejectingId(null)} className="btn-secondary">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setRejectingId(act.id)} className="btn-secondary" style={{ color: 'var(--color-danger)' }}>
                          <XCircle size={16} />
                          <span>Recusar Atividade</span>
                        </button>
                        <button onClick={() => handleApprove(act.id)} className="btn-primary" style={{ backgroundColor: 'var(--color-success)' }}>
                          <CheckCircle size={16} />
                          <span>Aprovar Atividade</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
