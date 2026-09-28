import React, { useState } from 'react';
import { Award, FileCheck, Truck, Check, Eye, X } from 'lucide-react';
import { Medal, Certificate } from '@corro-por-amor/shared';

interface MedalsViewProps {
  medals: Medal[];
  certificates: Certificate[];
  onUpdateMedalStatus: (medalId: string, status: 'pendente' | 'enviado' | 'entregue', trackingCode?: string) => Promise<void>;
}

export const MedalsView: React.FC<MedalsViewProps> = ({
  medals,
  certificates,
  onUpdateMedalStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'medals' | 'certificates'>('medals');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [editingMedalId, setEditingMedalId] = useState<string | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  const handleStatusChange = async (medal: Medal, newStatus: 'pendente' | 'enviado' | 'entregue') => {
    await onUpdateMedalStatus(medal.id, newStatus, medal.tracking_code || undefined);
  };

  const handleSaveTracking = async (medalId: string) => {
    await onUpdateMedalStatus(medalId, 'enviado', trackingCodeInput);
    setEditingMedalId(null);
    setTrackingCodeInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            Medalhas Físicas & Certificados
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Acompanhe a logística de envio de medalhas e emissão de certificados dos concluintes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('medals')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'medals' ? 'var(--color-brand-blue)' : '#FFFFFF',
              color: activeTab === 'medals' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={16} />
            <span>Medalhas Físicas ({medals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'certificates' ? 'var(--color-brand-blue)' : '#FFFFFF',
              color: activeTab === 'certificates' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileCheck size={16} />
            <span>Certificados Digitais ({certificates.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'medals' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '16px 20px' }}>Atleta Concluinte</th>
                <th style={{ padding: '16px 20px' }}>Desafio</th>
                <th style={{ padding: '16px 20px' }}>Status de Envio</th>
                <th style={{ padding: '16px 20px' }}>Rastreio</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {medals.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Nenhuma medalha pendente no momento. Assim que um atleta concluir 100% de um desafio com medalha, ela aparecerá aqui.
                  </td>
                </tr>
              ) : (
                medals.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      {m.athlete?.name || 'Atleta Concluinte'}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--color-text-body)' }}>
                      {m.challenge?.name || 'Desafio'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${
                        m.status === 'entregue' ? 'badge-success' :
                        m.status === 'enviado' ? 'badge-active' : 'badge-warning'
                      }`}>
                        {m.status === 'entregue' ? 'Entregue ao Atleta' :
                         m.status === 'enviado' ? 'Enviado / Em Trânsito' : 'Pendente de Envio'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                      {editingMedalId === m.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="Ex: BR123456789"
                            value={trackingCodeInput}
                            onChange={(e) => setTrackingCodeInput(e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          />
                          <button onClick={() => handleSaveTracking(m.id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            Salvar
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: m.tracking_code ? 'var(--color-text-body)' : 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {m.tracking_code || 'Sem rastreio'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingMedalId(m.id);
                            setTrackingCodeInput(m.tracking_code || '');
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          Rastreio
                        </button>
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m, e.target.value as any)}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregue">Entregue</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '16px 20px' }}>Atleta</th>
                <th style={{ padding: '16px 20px' }}>Desafio</th>
                <th style={{ padding: '16px 20px' }}>Código do Certificado</th>
                <th style={{ padding: '16px 20px' }}>Data de Conclusão</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Visualizar</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Nenhum certificado emitido até o momento.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      {cert.athlete?.name || 'Atleta'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {cert.challenge?.name || 'Desafio'}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--color-brand-blue)', fontWeight: 600 }}>
                      {cert.certificate_code}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      {new Date(cert.completed_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Eye size={14} />
                        <span>Ver Certificado</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Visualizador de Certificado */}
      {selectedCert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(1, 42, 74, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            maxWidth: '650px',
            width: '100%',
            textAlign: 'center',
            border: '8px solid var(--color-brand-blue)',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedCert(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>

            <Award size={48} color="var(--color-brand-blue)" style={{ margin: '0 auto 16px' }} />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              Corro por Amor — Desafios Virtuais
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '12px 0 20px' }}>
              CERTIFICADO DE PARTICIPAÇÃO
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              Certificamos com orgulho que o atleta
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-brand-blue)', margin: '12px 0' }}>
              {selectedCert.athlete?.name || 'ATLETA CONCLUINTE'}
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--color-text-body)', lineHeight: 1.6 }}>
              concluiu com êxito o desafio virtual <strong>{selectedCert.challenge?.name}</strong>,
              percorrendo a meta de <strong>{selectedCert.challenge?.target_km || 50} KM</strong> com dedicação, amor e superação.
            </p>
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Código de Autenticidade: <strong>{selectedCert.certificate_code}</strong> • Data: {new Date(selectedCert.completed_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
