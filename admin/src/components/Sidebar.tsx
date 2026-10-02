import React from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  ShieldCheck, 
  Award, 
  ExternalLink,
  LogOut
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'challenges' | 'participants' | 'validation' | 'medals';

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingValidationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingValidationCount,
}) => {
  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'challenges' as AdminTab, label: 'Desafios', icon: Trophy },
    { id: 'participants' as AdminTab, label: 'Participantes', icon: Users },
    { 
      id: 'validation' as AdminTab, 
      label: 'Validação de Atividades', 
      icon: ShieldCheck,
      badge: pendingValidationCount > 0 ? pendingValidationCount : undefined,
    },
    { id: 'medals' as AdminTab, label: 'Medalhas & Certificados', icon: Award },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          overflow: 'hidden',
        }}>
          <img 
            src="/favicon.png" 
            alt="Corro por Amor" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: '-0.02em' }}>
            CORRO POR AMOR
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Painel do Organizador
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-brand-blue)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'rgba(1, 79, 134, 0.08)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border-subtle)',
        fontSize: '12px',
        color: 'var(--color-text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Supabase Conectado</span>
        </div>
        <p style={{ fontSize: '11px', lineHeight: 1.4 }}>
          "O atleta corre. O aplicativo registra. O sistema soma."
        </p>
      </div>
    </aside>
  );
};
