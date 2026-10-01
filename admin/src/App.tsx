import React, { useState, useEffect } from 'react';
import { Sidebar, AdminTab } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { ChallengesView } from './pages/ChallengesView';
import { ChallengeModal } from './pages/ChallengeModal';
import { ParticipantsView } from './pages/ParticipantsView';
import { ValidationView } from './pages/ValidationView';
import { MedalsView } from './pages/MedalsView';
import { supabase } from './api/supabase';
import { Challenge, ChallengeParticipant, Activity, Medal, Certificate } from '@corro-por-amor/shared';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [isDeletingChallenge, setIsDeletingChallenge] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Challenges
      const { data: chData, error: chErr } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (chData) setChallenges(chData);

      // 2. Fetch Participants with profile & challenge
      const { data: partData, error: partErr } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          athlete:profiles(*),
          challenge:challenges(*)
        `)
        .order('completed_km', { ascending: false });

      if (partData) setParticipants(partData);

      // 3. Fetch Activities
      const { data: actData, error: actErr } = await supabase
        .from('activities')
        .select(`
          *,
          athlete:profiles(*),
          challenge:challenges(*)
        `)
        .order('created_at', { ascending: false });

      if (actData) setActivities(actData);

      // 4. Fetch Medals
      const { data: medData } = await supabase
        .from('medals')
        .select(`
          *,
          athlete:profiles(*),
          challenge:challenges(*)
        `)
        .order('updated_at', { ascending: false });

      if (medData) setMedals(medData);

      // 5. Fetch Certificates
      const { data: certData } = await supabase
        .from('certificates')
        .select(`
          *,
          athlete:profiles(*),
          challenge:challenges(*)
        `)
        .order('completed_at', { ascending: false });

      if (certData) setCertificates(certData);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save Challenge (Create or Update)
  const handleSaveChallenge = async (challengeData: Partial<Challenge>) => {
    if (editingChallenge) {
      const { error } = await supabase
        .from('challenges')
        .update(challengeData)
        .eq('id', editingChallenge.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('challenges')
        .insert([challengeData]);
      if (error) throw error;
    }
    await fetchData();
  };

  // Delete Challenge prompt
  const handleDeleteChallenge = async (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    if (ch) {
      setChallengeToDelete(ch);
    }
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;
    setIsDeletingChallenge(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeToDelete.id);

      if (error) throw error;
      if (editingChallenge?.id === challengeToDelete.id) {
        setIsModalOpen(false);
        setEditingChallenge(null);
      }
      setChallengeToDelete(null);
      await fetchData();
    } catch (err: any) {
      alert('Erro ao excluir desafio: ' + err.message);
    } finally {
      setIsDeletingChallenge(false);
    }
  };

  // Activity Moderation (Approve)
  const handleApproveActivity = async (activityId: string) => {
    const { error } = await supabase
      .from('activities')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', activityId);

    if (error) {
      alert('Erro ao aprovar: ' + error.message);
      return;
    }
    await fetchData();
  };

  // Activity Moderation (Reject)
  const handleRejectActivity = async (activityId: string, reason: string) => {
    const { error } = await supabase
      .from('activities')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', activityId);

    if (error) {
      alert('Erro ao recusar: ' + error.message);
      return;
    }
    await fetchData();
  };

  // Update Medal Status
  const handleUpdateMedalStatus = async (medalId: string, status: 'pendente' | 'enviado' | 'entregue', trackingCode?: string) => {
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (trackingCode !== undefined) updatePayload.tracking_code = trackingCode;

    const { error } = await supabase
      .from('medals')
      .update(updatePayload)
      .eq('id', medalId);

    if (error) {
      alert('Erro ao atualizar medalha: ' + error.message);
      return;
    }
    await fetchData();
  };

  // Calculations for KPIs
  const totalKm = participants.reduce((acc, curr) => acc + (Number(curr.completed_km) || 0), 0);
  const completedAthletes = participants.filter((p) => p.completion_percentage >= 100).length;
  const pendingCount = activities.filter((a) => a.status === 'pending_review').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingValidationCount={pendingCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* Top bar with quick refresh */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={fetchData}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Sincronizar com banco de dados"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Atualizar Dados</span>
          </button>
        </div>

        {loading && challenges.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
            <Loader2 size={36} color="var(--color-brand-blue)" className="spin" />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600 }}>
              Carregando painel do Corro por Amor...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                challenges={challenges}
                participants={participants}
                totalDistanceKm={totalKm}
                completedCount={completedAthletes}
                onNavigateTab={setCurrentTab}
                onOpenCreateChallenge={() => {
                  setEditingChallenge(null);
                  setIsModalOpen(true);
                }}
              />
            )}

            {currentTab === 'challenges' && (
              <ChallengesView
                challenges={challenges}
                participants={participants}
                onOpenCreateModal={() => {
                  setEditingChallenge(null);
                  setIsModalOpen(true);
                }}
                onEditChallenge={(ch) => {
                  setEditingChallenge(ch);
                  setIsModalOpen(true);
                }}
                onDeleteChallenge={handleDeleteChallenge}
              />
            )}

            {currentTab === 'participants' && (
              <ParticipantsView
                participants={participants}
                challenges={challenges}
              />
            )}

            {currentTab === 'validation' && (
              <ValidationView
                activities={activities}
                onApproveActivity={handleApproveActivity}
                onRejectActivity={handleRejectActivity}
              />
            )}

            {currentTab === 'medals' && (
              <MedalsView
                medals={medals}
                certificates={certificates}
                onUpdateMedalStatus={handleUpdateMedalStatus}
              />
            )}
          </>
        )}
      </main>

      {/* Challenge Create / Edit Modal */}
      <ChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChallenge}
        editingChallenge={editingChallenge}
        onDelete={handleDeleteChallenge}
      />

      {/* Modern In-App Delete Confirmation Modal */}
      {challengeToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', backgroundColor: 'var(--color-surface, #FFFFFF)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '22px', backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>Excluir Desafio</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Ação definitiva e imediata</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-text-body)', lineHeight: 1.5, marginBottom: '24px' }}>
              Tem certeza que deseja excluir permanentemente o desafio <strong>"{challengeToDelete.name}"</strong>? Ele será removido do aplicativo e do ranking.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setChallengeToDelete(null)}
                disabled={isDeletingChallenge}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isDeletingChallenge ? 'not-allowed' : 'pointer',
                  opacity: isDeletingChallenge ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={confirmDeleteChallenge}
                disabled={isDeletingChallenge}
              >
                <Trash2 size={15} />
                <span>{isDeletingChallenge ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
