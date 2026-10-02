import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Flame, Mail, Lock, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme';
import { supabase } from '../api/supabase';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              role: 'athlete',
            },
          },
        });
        if (signUpError) throw signUpError;

        // Auto sign in if session was not attached
        if (!signUpData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInError) throw signInError;
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (msg.includes('User already registered')) {
        setErrorMsg('Este e-mail já está cadastrado. Tente entrar.');
      } else if (msg.includes('Password should be at least')) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setErrorMsg(msg || 'Erro na autenticação. Verifique seus dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Hero with Pristine Official Logo */}
        <View style={styles.brandHero}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandSubtitle}>
            Desafios virtuais de corrida, rankings em tempo real e medalhas exclusivas.
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          {/* Segmented Auth Switcher */}
          <View style={styles.tabTrack}>
            <TouchableOpacity
              onPress={() => { setIsLogin(true); setErrorMsg(null); }}
              style={[styles.tabButton, isLogin && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, isLogin && styles.tabButtonTextActive]}>
                Entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setIsLogin(false); setErrorMsg(null); }}
              style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, !isLogin && styles.tabButtonTextActive]}>
                Cadastrar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOME COMPLETO</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={theme.colors.textSecondary} />
                <TextInput
                  placeholder="Seu nome completo"
                  placeholderTextColor={theme.colors.textMutedSoft}
                  value={name}
                  onChangeText={setName}
                  style={styles.textInput}
                />
              </View>
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-MAIL</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="seu.email@exemplo.com"
                placeholderTextColor={theme.colors.textMutedSoft}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SENHA</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMutedSoft}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'ENTRAR NA CONTA' : 'CRIAR MINHA CONTA'}
                </Text>
                <ArrowRight size={16} color={theme.colors.white} strokeWidth={2.4} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security badge footer */}
        <View style={styles.footerNote}>
          <ShieldCheck size={14} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            Dados protegidos e telemetria anti-fraude ativa
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  logoBadge: {
    backgroundColor: '#000000',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  brandLogoImage: {
    width: 250,
    height: 160,
  },
  brandSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xxl,
    padding: 24,
    ...theme.shadows.floating,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 16,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: theme.colors.subtleGray,
    borderRadius: theme.radius.full,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.full,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryDark,
    ...theme.shadows.card,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radius.md,
    padding: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.subtleGray,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...theme.shadows.floating,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(1, 79, 134, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(1, 79, 134, 0.12)',
  },
  demoButtonText: {
    color: theme.colors.brandBlue,
    fontSize: 12,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
