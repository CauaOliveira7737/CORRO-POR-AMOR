import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image,
  Animated,
  StatusBar
} from 'react-native';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react-native';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  // Micro-animations
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(35)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const tabSwitchAnim = useRef(new Animated.Value(1)).current; // 1 for login, 0 for signup

  useEffect(() => {
    // Screen entrance animation (fade-in + slide-up)
    Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(sheetSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabChange = (loginMode: boolean) => {
    if (loginMode === isLogin) return;
    setErrorMsg(null);
    
    // Smooth fade/transition when switching tabs
    Animated.timing(tabSwitchAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsLogin(loginMode);
      Animated.timing(tabSwitchAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
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

        // Auto sign in if session was not automatically attached
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
        setErrorMsg('Este e-mail já está cadastrado. Alterne para Entrar.');
      } else if (msg.includes('Password should be at least')) {
        setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      } else {
        setErrorMsg(msg || 'Falha ao autenticar. Verifique sua conexão e dados.');
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.palette.blue1} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 1. Immersive Top Hero (Curved Header Style) */}
        <Animated.View 
          style={[
            styles.heroSection, 
            { opacity: entranceAnim }
          ]}
        >
          {/* Subtle Decorative Geometric Circles */}
          <View style={styles.decorCircleTopRight} />
          <View style={styles.decorCircleBottomLeft} />

          {/* Tag Pill */}
          <View style={styles.brandTagPill}>
            <Sparkles size={11} color={theme.colors.palette.blue9} strokeWidth={2.4} />
            <Text style={styles.brandTagText}>DESAFIOS VIRTUAIS & RUNNING CLUB</Text>
          </View>

          {/* Official Logo (White on Navy, Zero Box/Card) */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/logo-white.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heroSubtitle}>
            Supere seus limites, conquiste medalhas e suba no ranking.
          </Text>
        </Animated.View>

        {/* 2. Curved White Bottom Sheet */}
        <Animated.View 
          style={[
            styles.bottomSheet, 
            { 
              transform: [{ translateY: sheetSlideAnim }],
              opacity: entranceAnim
            }
          ]}
        >
          {/* Tab Switcher: Entrar / Cadastrar */}
          <View style={styles.tabTrack}>
            <TouchableOpacity
              onPress={() => handleTabChange(true)}
              style={[styles.tabButton, isLogin && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, isLogin && styles.tabButtonTextActive]}>
                Entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTabChange(false)}
              style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, !isLogin && styles.tabButtonTextActive]}>
                Criar Conta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Box */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form Fields with Fade/Transition */}
          <Animated.View style={[styles.formFields, { opacity: tabSwitchAnim }]}>
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOME COMPLETO</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputContainerFocused
                ]}>
                  <User 
                    size={18} 
                    color={focusedField === 'name' ? theme.colors.palette.blue4 : theme.colors.palette.blue7} 
                    strokeWidth={2}
                  />
                  <TextInput
                    placeholder="Seu nome de atleta"
                    placeholderTextColor={theme.colors.palette.blue7}
                    value={name}
                    onChangeText={setName}
                    style={styles.textInput}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-MAIL</Text>
              <View style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused
              ]}>
                <Mail 
                  size={18} 
                  color={focusedField === 'email' ? theme.colors.palette.blue4 : theme.colors.palette.blue7} 
                  strokeWidth={2}
                />
                <TextInput
                  placeholder="seu.email@exemplo.com"
                  placeholderTextColor={theme.colors.palette.blue7}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>SENHA</Text>
                {isLogin && (
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused
              ]}>
                <Lock 
                  size={18} 
                  color={focusedField === 'password' ? theme.colors.palette.blue4 : theme.colors.palette.blue7} 
                  strokeWidth={2}
                />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.palette.blue7}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={theme.colors.palette.blue7} />
                  ) : (
                    <Eye size={18} color={theme.colors.palette.blue7} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Action Button with Spring Scale Feedback */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPress={handleSubmit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading}
              style={styles.submitButton}
              activeOpacity={0.92}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitText}>
                    {isLogin ? 'ENTRAR NA CONTA' : 'CRIAR MINHA CONTA'}
                  </Text>
                  <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Security Footnote */}
          <View style={styles.footerNote}>
            <ShieldCheck size={14} color={theme.colors.palette.blue6} strokeWidth={2.2} />
            <Text style={styles.footerNoteText}>
              Ambiente protegido com telemetria anti-fraude
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.palette.blue1, // Deep navy background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // 1. Immersive Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingBottom: 48,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.palette.blue2,
    opacity: 0.45,
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.palette.blue3,
    opacity: 0.35,
  },
  brandTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(1, 79, 134, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(137, 194, 217, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  brandTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.palette.blue9,
    letterSpacing: 0.8,
  },
  logoWrapper: {
    width: 320,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroSubtitle: {
    fontSize: 13,
    color: theme.colors.palette.blue9,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    fontWeight: '500',
  },

  // 2. Curved White Bottom Sheet
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    gap: 18,
  },

  // Segmented Tab Switcher
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.palette.blue1,
    shadowColor: theme.colors.palette.blue1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.palette.blue6,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  // Error Box
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Form Fields
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.palette.blue1,
    letterSpacing: 0.6,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.palette.blue5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputContainerFocused: {
    borderColor: theme.colors.palette.blue4,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.palette.blue4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.palette.blue1,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: theme.colors.palette.blue4,
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.palette.blue4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Footer Note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: theme.colors.palette.blue6,
    fontWeight: '600',
  },
});
