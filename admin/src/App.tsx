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
import { Loader2, RefreshCw } from 'lucide-react';

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
      />
    </div>
  );
};

export default App;
