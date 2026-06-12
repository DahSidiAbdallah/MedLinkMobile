import React, { useState, useRef, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import BloodTypePicker from '../components/BloodTypePicker';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import { auth, db } from '../lib/firebase';
import { colors, spacing, radius, animation, shadow } from '../theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';

type LoginProps = { navigation?: any; onLogin?: () => void };
type StepKey = 0 | 1;
type RegisterErrorState = { email?: string; password?: string; confirmPassword?: string };
type RegisterPersonalErrors = { name?: string; phone?: string; dateOfBirth?: string };
type HealthErrors = { bloodType?: string; allergies?: string; conditions?: string };

import FlagGB from '../assets/gb.svg';
import FlagFR from '../assets/fr.svg';
import FlagMR from '../assets/mr.svg';

const LANGS = [
  { code: 'en', Flag: FlagGB },
  { code: 'fr', Flag: FlagFR },
  { code: 'ar', Flag: FlagMR },
] as const;

export default function Login({ onLogin }: Readonly<LoginProps>) {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<StepKey>(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (showForgot) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0.96);
    }
  }, [showForgot]);

  // Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Health info
  const [bloodType, setBloodType] = useState('');
  const [customBloodType, setCustomBloodType] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);

  // Error states
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [registerAccountErrors, setRegisterAccountErrors] = useState<RegisterErrorState>({});
  const [registerPersonalErrors, setRegisterPersonalErrors] = useState<RegisterPersonalErrors>({});
  const [healthErrors, setHealthErrors] = useState<HealthErrors>({});

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = t('auth.emailRequired', 'Email is required');
    else if (!emailRegex.test(email)) errors.email = t('auth.invalidEmail', 'Please enter a valid email address');
    if (!password) errors.password = t('auth.passwordRequired', 'Password is required');
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAccountStep = () => {
    const errors: RegisterErrorState = {};
    if (!email) errors.email = t('auth.emailRequired', 'Email is required');
    else if (!emailRegex.test(email)) errors.email = t('auth.invalidEmail', 'Please enter a valid email address');
    if (!password) errors.password = t('auth.passwordRequired', 'Password is required');
    else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      errors.password = t('auth.invalidPassword', 'At least 8 characters with letters and numbers');
    if (!confirmPassword) errors.confirmPassword = t('auth.confirmPasswordRequired', 'Please confirm your password');
    else if (password !== confirmPassword) errors.confirmPassword = t('auth.passwordsDoNotMatch', 'Passwords do not match');
    setRegisterAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePersonalStep = () => {
    const errors: RegisterPersonalErrors = {};
    const health: HealthErrors = {};
    if (!name.trim()) errors.name = t('auth.nameRequired', 'Full name is required');
    if (phone && !/^\d{7,}$/.test(phone)) errors.phone = t('auth.phoneInvalid', 'Enter a valid phone number (min 7 digits)');
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))
      errors.dateOfBirth = t('auth.dobInvalid', 'Use YYYY-MM-DD format');
    const bt = bloodType === 'custom' ? customBloodType.trim() : bloodType;
    if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt))
      health.bloodType = t('auth.bloodTypeFormatInvalid', 'Must be A+, A-, B+, B-, AB+, AB-, O+, or O-');
    if (allergies.some(a => !a.trim())) health.allergies = t('auth.allergyEmpty', 'Allergy cannot be empty');
    if (medicalConditions.some(c => !c.trim())) health.conditions = t('auth.conditionEmpty', 'Condition cannot be empty');
    setRegisterPersonalErrors(errors);
    setHealthErrors(health);
    return Object.keys(errors).length === 0 && Object.keys(health).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showSuccess(t('auth.signInSuccess', 'Welcome back!'), t('auth.signInSuccessMessage', 'You have successfully signed in.'));
      if (onLogin) onLogin();
    } catch (e: any) {
      let msg = t('auth.genericError', 'Login failed. Please try again.');
      if (e.code === 'auth/user-not-found') msg = t('auth.userNotFound', 'No user found with this email');
      else if (e.code === 'auth/wrong-password') msg = t('auth.wrongPassword', 'Incorrect password');
      else if (e.code === 'auth/invalid-email') msg = t('auth.invalidEmailAddress', 'Invalid email address');
      else if (e.code === 'auth/invalid-credential') msg = t('auth.invalidCredential', 'Invalid credentials. Check your email and password');
      else if (e.code === 'auth/too-many-requests') msg = t('auth.tooManyRequests', 'Too many attempts. Try again later');
      showError(t('auth.loginFailed', 'Login Failed'), msg);
      setLoginErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validatePersonalStep()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const finalBloodType = bloodType === 'custom' ? customBloodType.trim() : bloodType;
      const profile = {
        id: user.uid,
        name,
        email,
        phone,
        date_of_birth: dateOfBirth,
        blood_type: finalBloodType || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        medical_conditions: medicalConditions.length > 0 ? medicalConditions : undefined,
      };
      await setDoc(doc(db, 'profiles', user.uid), profile);
      showSuccess(
        t('auth.signUpSuccess', 'Account created!'),
        t('auth.registerSuccessMessage', 'You can now access all features.'),
      );
      setIsRegister(false);
      setRegisterStep(0);
      setEmail(''); setPassword(''); setConfirmPassword('');
      setName(''); setPhone(''); setDateOfBirth('');
      setBloodType(''); setAllergies([]); setMedicalConditions([]);
    } catch (e: any) {
      let msg = t('auth.createAccountFailed', 'Failed to create account. Please try again.');
      if (e.code === 'auth/email-already-in-use') msg = t('auth.emailAlreadyInUse', 'This email is already in use.');
      else if (e.code === 'auth/invalid-email') msg = t('auth.invalidEmailAddress', 'Invalid email address');
      else if (e.code === 'auth/weak-password') msg = t('auth.weakPassword', 'Password is too weak');
      else if (e.code === 'auth/network-request-failed') msg = t('auth.networkError', 'Check your internet connection');
      showError(t('auth.registrationFailed', 'Registration Failed'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showError(t('common.error', 'Error'), t('auth.forgotEmailEmpty', 'Please enter your email address'));
      return;
    }
    if (!emailRegex.test(forgotEmail)) {
      showError(t('common.error', 'Error'), t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      showSuccess(t('auth.emailSentTitle', 'Email Sent'), t('auth.forgotEmailSent', 'Password reset email sent to your inbox'));
      setShowForgot(false);
      setForgotEmail('');
    } catch (e: any) {
      let msg = t('auth.forgotEmailFailed', 'Failed to send reset email');
      if (e.code === 'auth/user-not-found') msg = t('auth.forgotEmailNotFound', 'No user found with this email');
      showError(t('common.error', 'Error'), msg);
    } finally {
      setForgotLoading(false);
    }
  };

  /* ─────────────────────────────────────────
   * Shared input renderer
   * ───────────────────────────────────────── */
  const renderInput = (
    props: React.ComponentProps<typeof TextInput> & {
      error?: string;
      id: string;
      icon?: React.ComponentProps<typeof Ionicons>['name'];
      showPasswordToggle?: boolean;
      isPassword?: boolean;
      passwordVisible?: boolean;
      onTogglePassword?: () => void;
    },
  ) => {
    const { error, id, icon, showPasswordToggle, isPassword, passwordVisible, onTogglePassword, ...rest } = props;
    const focused = focusedInput === id;
    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={focused ? colors.primary : colors.muted}
              style={styles.inputIcon}
            />
          )}
          <TextInput
            {...rest}
            style={styles.input}
            onFocus={() => setFocusedInput(id)}
            onBlur={event => { rest.onBlur?.(event); setFocusedInput(null); }}
            placeholderTextColor={colors.muted}
            secureTextEntry={isPassword && !passwordVisible}
          />
          {showPasswordToggle && (
            <Pressable onPress={onTogglePassword} style={styles.passwordToggle} hitSlop={8}>
              <Ionicons
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.muted}
              />
            </Pressable>
          )}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  /* ─────────────────────────────────────────
   * Form sections — fields only, no headers
   * ───────────────────────────────────────── */
  const renderLoginFields = () => (
    <View style={styles.fieldGroup}>
      {renderInput({
        id: 'login-email',
        placeholder: t('auth.emailAddress', 'Email address'),
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => { setEmail(text); if (loginErrors.email) setLoginErrors(e => ({ ...e, email: undefined })); },
        error: loginErrors.email,
        icon: 'mail-outline',
      })}
      {renderInput({
        id: 'login-password',
        placeholder: t('auth.password', 'Password'),
        value: password,
        onChangeText: text => { setPassword(text); if (loginErrors.password) setLoginErrors(e => ({ ...e, password: undefined })); },
        error: loginErrors.password,
        icon: 'lock-closed-outline',
        isPassword: true,
        passwordVisible: showPassword,
        showPasswordToggle: true,
        onTogglePassword: () => setShowPassword(v => !v),
      })}
      <Pressable onPress={() => setShowForgot(true)} style={styles.forgotBtn}>
        <Text style={styles.forgotText}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
      </Pressable>
    </View>
  );

  const renderAccountFields = () => (
    <View style={styles.fieldGroup}>
      {renderInput({
        id: 'register-email',
        placeholder: t('auth.emailAddress', 'Email address'),
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => { setEmail(text); if (registerAccountErrors.email) setRegisterAccountErrors(e => ({ ...e, email: undefined })); },
        onBlur: () => {
          if (!email) setRegisterAccountErrors(e => ({ ...e, email: t('auth.emailRequired', 'Email is required.') }));
          else if (!emailRegex.test(email)) setRegisterAccountErrors(e => ({ ...e, email: t('auth.invalidEmail', 'Enter a valid email.') }));
          else setRegisterAccountErrors(e => ({ ...e, email: undefined }));
        },
        error: registerAccountErrors.email,
        icon: 'mail-outline',
      })}
      {renderInput({
        id: 'register-password',
        placeholder: t('auth.password', 'Password'),
        value: password,
        onChangeText: text => { setPassword(text); if (registerAccountErrors.password) setRegisterAccountErrors(e => ({ ...e, password: undefined })); },
        onBlur: () => {
          if (!password) setRegisterAccountErrors(e => ({ ...e, password: t('auth.passwordRequired', 'Password is required.') }));
          else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
            setRegisterAccountErrors(e => ({ ...e, password: t('auth.invalidPassword', 'Min 8 chars, letters and numbers.') }));
          else setRegisterAccountErrors(e => ({ ...e, password: undefined }));
        },
        error: registerAccountErrors.password,
        icon: 'lock-closed-outline',
        isPassword: true,
        passwordVisible: showPassword,
        showPasswordToggle: true,
        onTogglePassword: () => setShowPassword(v => !v),
      })}
      {renderInput({
        id: 'register-confirm',
        placeholder: t('auth.confirmPassword', 'Confirm password'),
        value: confirmPassword,
        onChangeText: text => { setConfirmPassword(text); if (registerAccountErrors.confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined })); },
        onBlur: () => {
          if (!confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: t('auth.confirmPasswordRequired', 'Please confirm your password.') }));
          else if (password !== confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: t('auth.passwordsDoNotMatch', 'Passwords do not match.') }));
          else setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
        },
        error: registerAccountErrors.confirmPassword,
        icon: 'lock-closed-outline',
        isPassword: true,
        passwordVisible: showConfirmPassword,
        showPasswordToggle: true,
        onTogglePassword: () => setShowConfirmPassword(v => !v),
      })}
    </View>
  );

  const renderPersonalFields = () => (
    <View style={styles.fieldGroup}>
      {renderInput({
        id: 'register-name',
        placeholder: t('auth.fullName', 'Full name'),
        value: name,
        onChangeText: text => { setName(text); if (registerPersonalErrors.name) setRegisterPersonalErrors(e => ({ ...e, name: undefined })); },
        onBlur: () => {
          if (!name.trim()) setRegisterPersonalErrors(e => ({ ...e, name: t('auth.nameRequired', 'Full name is required.') }));
          else setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
        },
        error: registerPersonalErrors.name,
        icon: 'person-outline',
      })}
      {renderInput({
        id: 'register-phone',
        placeholder: t('auth.phonePlaceholderOptional', 'Phone number (optional)'),
        keyboardType: 'phone-pad',
        value: phone,
        onChangeText: text => { setPhone(text); if (registerPersonalErrors.phone) setRegisterPersonalErrors(e => ({ ...e, phone: undefined })); },
        onBlur: () => {
          if (phone && !/^\d{7,}$/.test(phone)) setRegisterPersonalErrors(e => ({ ...e, phone: t('auth.phoneInvalid', 'Min 7 digits.') }));
          else setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
        },
        error: registerPersonalErrors.phone,
        icon: 'call-outline',
      })}
      {renderInput({
        id: 'register-dob',
        placeholder: t('auth.dobPlaceholder', 'Date of birth — YYYY-MM-DD (optional)'),
        keyboardType: 'numbers-and-punctuation',
        value: dateOfBirth,
        onChangeText: text => { setDateOfBirth(text); if (registerPersonalErrors.dateOfBirth) setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined })); },
        onBlur: () => {
          if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))
            setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: t('auth.dobInvalid', 'Use YYYY-MM-DD format.') }));
          else setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
        },
        error: registerPersonalErrors.dateOfBirth,
        icon: 'calendar-outline',
      })}

      {/* Health section */}
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionLabel}>{t('auth.healthBasics', 'Health info')}</Text>
        <View style={styles.optionalPill}><Text style={styles.optionalText}>{t('common.optional', 'Optional')}</Text></View>
      </View>

      {healthErrors.bloodType ? <Text style={styles.errorText}>{healthErrors.bloodType}</Text> : null}
      <BloodTypePicker value={bloodType} onChange={setBloodType} />

      {bloodType === 'custom' && renderInput({
        id: 'register-blood-custom',
        placeholder: t('auth.bloodCustomPlaceholder', 'Custom blood type (e.g. A+, B-)'),
        value: customBloodType,
        onChangeText: text => setCustomBloodType(text),
        onBlur: () => {
          const bt = customBloodType.trim();
          if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt))
            setHealthErrors(e => ({ ...e, bloodType: t('auth.bloodTypeFormatInvalid', 'Must be A+, A-, B+, B-, AB+, AB-, O+, or O-') }));
          else setHealthErrors(e => ({ ...e, bloodType: undefined }));
        },
        error: healthErrors.bloodType,
        icon: 'water-outline',
      })}

      {/* Allergies */}
      <View style={styles.chipRow}>
        <TextInput
          placeholder={t('auth.allergyPlaceholder', 'Add allergy (optional)')}
          value={allergyInput}
          onChangeText={setAllergyInput}
          style={[styles.inputWrapper, { flex: 1 }]}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.addChipBtn}
          onPress={() => {
            if (!allergyInput.trim()) return;
            setAllergies(prev => [...prev, allergyInput.trim()]);
            setAllergyInput('');
            setHealthErrors(e => ({ ...e, allergies: undefined }));
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
      {healthErrors.allergies ? <Text style={styles.errorText}>{healthErrors.allergies}</Text> : null}
      <View style={styles.tagList}>
        {allergies.map((a, idx) => (
          <Pressable
            key={`${a}-${idx}`}
            onPress={() => setAllergies(prev => prev.filter((_, i) => i !== idx))}
            style={styles.tag}
          >
            <Text style={styles.tagText}>{a}</Text>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      {/* Conditions */}
      <View style={styles.chipRow}>
        <TextInput
          placeholder={t('auth.conditionPlaceholder', 'Add medical condition (optional)')}
          value={conditionInput}
          onChangeText={setConditionInput}
          style={[styles.inputWrapper, { flex: 1 }]}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.addChipBtn}
          onPress={() => {
            if (!conditionInput.trim()) return;
            setMedicalConditions(prev => [...prev, conditionInput.trim()]);
            setConditionInput('');
            setHealthErrors(e => ({ ...e, conditions: undefined }));
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
      {healthErrors.conditions ? <Text style={styles.errorText}>{healthErrors.conditions}</Text> : null}
      <View style={styles.tagList}>
        {medicalConditions.map((c, idx) => (
          <Pressable
            key={`${c}-${idx}`}
            onPress={() => setMedicalConditions(prev => prev.filter((_, i) => i !== idx))}
            style={styles.tag}
          >
            <Text style={styles.tagText}>{c}</Text>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  /* ─────────────────────────────────────────
   * Dynamic page title / subtitle
   * ───────────────────────────────────────── */
  const getTitle = () => {
    if (!isRegister) return t('auth.welcomeBack', 'Welcome back.');
    return registerStep === 0
      ? t('auth.createAccountTitle', 'Create account.')
      : t('auth.personalInfoTitle', 'Your details.');
  };

  const getSubtitle = () => {
    if (!isRegister) return t('auth.loginSubtitle', 'Sign in to continue.');
    return registerStep === 0
      ? t('auth.createAccountSubtitle', 'Enter your email and choose a password.')
      : t('auth.personalInfoSubtitle', 'Help us build your health profile.');
  };

  /* ─────────────────────────────────────────
   * Render
   * ───────────────────────────────────────── */
  return (
    <ScreenContainer scrollable withPadding={false} contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Centered brand hero ── */}
          <View style={styles.brandHero}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              // @ts-ignore — tintColor works on RN Image
              tintColor={colors.primary}
            />
            <Text style={styles.logoName}>MedLink</Text>
            <Text style={styles.logoTagline}>{t('common.tagline', 'Your Health Companion')}</Text>

            {/* Language switcher — centered */}
            <View style={styles.langRow}>
              {LANGS.map(l => (
                <Pressable
                  key={l.code}
                  onPress={() => i18n.changeLanguage(l.code)}
                  style={[styles.langPill, i18n.language === l.code && styles.langPillActive]}
                  hitSlop={6}
                >
                  <View style={styles.langFlag}>
                    <l.Flag width={20} height={14} />
                  </View>
                  {i18n.language === l.code && (
                    <Text style={styles.langLabel}>
                      {l.code.toUpperCase()}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Page header ── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{getTitle()}</Text>
            <Text style={styles.pageSubtitle}>{getSubtitle()}</Text>
          </View>

          {/* ── Register progress ── */}
          {isRegister && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, registerStep === 1 && styles.progressFillFull]} />
              </View>
              <Text style={styles.progressLabel}>
                {t('auth.stepOf', 'Step {{current}} of {{total}}', { current: registerStep + 1, total: 2 })}
              </Text>
            </View>
          )}

          {/* ── Fields ── */}
          <View style={styles.form}>
            {isRegister
              ? registerStep === 0 ? renderAccountFields() : renderPersonalFields()
              : renderLoginFields()
            }
          </View>

          {/* ── Primary CTA ── */}
          <View style={styles.ctaArea}>
            {isRegister ? (
              registerStep === 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                  onPress={() => { if (validateAccountStep()) setRegisterStep(1); }}
                >
                  <Text style={styles.primaryBtnText}>{t('common.continue', 'Continue')}</Text>
                  <Ionicons name="arrow-forward" size={17} color="#fff" />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, loading && styles.primaryBtnBusy, pressed && styles.primaryBtnPressed]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>{t('auth.signUpButton', 'Create Account')}</Text>
                  }
                </Pressable>
              )
            ) : (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, loading && styles.primaryBtnBusy, pressed && styles.primaryBtnPressed]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>{t('auth.signInButton', 'Sign In')}</Text>
                }
              </Pressable>
            )}

            {/* Back button on step 2 */}
            {isRegister && registerStep === 1 && (
              <Pressable style={styles.backBtn} onPress={() => setRegisterStep(0)}>
                <Ionicons name="arrow-back" size={15} color={colors.textSecondary} />
                <Text style={styles.backBtnText}>{t('common.back', 'Back')}</Text>
              </Pressable>
            )}
          </View>

          {/* ── Switch login / register ── */}
          <Pressable
            style={styles.switchRow}
            onPress={() => { setIsRegister(v => !v); setRegisterStep(0); }}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? t('auth.alreadyHaveAccount', 'Already have an account?')
                : t('auth.noAccount', "Don't have an account?")
              }
              {'  '}
              <Text style={styles.switchLink}>
                {isRegister ? t('auth.signInHere', 'Sign in') : t('auth.signUpHere', 'Sign up')}
              </Text>
            </Text>
          </Pressable>

          {/* ── Footer ── */}
          <View style={styles.footerArea}>
            <Text style={styles.footerText}>
              {t('auth.byContinuing', 'By continuing you agree to our')}{' '}
              <Text style={styles.footerLink}>{t('auth.terms', 'Terms')}</Text>
              {' '}{t('common.and', 'and')}{' '}
              <Text style={styles.footerLink}>{t('auth.privacyPolicy', 'Privacy Policy')}</Text>.
            </Text>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Forgot password overlay ── */}
      {showForgot && (
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', maxWidth: 360 }}>
            <Card variant="elevated" style={styles.modalCard}>
              <View style={styles.modalTop}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="lock-closed" size={22} color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>{t('auth.resetPassword', 'Reset password')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('auth.forgotPasswordSubtitle', "Enter your email and we'll send you a reset link.")}
                </Text>
              </View>
              {renderInput({
                id: 'forgot-email',
                placeholder: t('auth.emailAddress', 'Email address'),
                autoCapitalize: 'none',
                keyboardType: 'email-address',
                value: forgotEmail,
                onChangeText: setForgotEmail,
                icon: 'mail-outline',
              })}
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowForgot(false); setForgotEmail(''); }}
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel', 'Cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSendBtn, forgotLoading && styles.primaryBtnBusy]}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>{t('auth.sendLink', 'Send link')}</Text>
                  }
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

const BTN_BLUE = colors.primary;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingBottom: spacing.xxxl,
  },

  /* ── Centered brand hero ── */
  brandHero: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 6,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  logoName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.6,
  },
  logoTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langPillActive: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  langFlag: {
    width: 20,
    height: 14,
    borderRadius: 2,
    overflow: 'hidden',
  },
  langLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  /* ── Page header ── */
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  /* ── Register progress ── */
  progressRow: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.bgTertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressFillFull: {
    width: '100%',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  /* ── Form area ── */
  form: {
    paddingHorizontal: 24,
  },
  fieldGroup: {
    gap: 12,
  },

  /* ── Inputs — fill style, no border ── */
  inputContainer: {
    gap: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  inputWrapperError: {
    backgroundColor: colors.danger100,
    borderColor: colors.danger,
  },
  inputIcon: {
    marginRight: 10,
    opacity: 0.55,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: Platform.OS === 'ios' ? 0 : 14,
  },
  passwordToggle: {
    padding: 6,
    marginLeft: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginLeft: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    marginTop: 4,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Section divider (health info) ── */
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalPill: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  /* ── Chip / tag inputs ── */
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addChipBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── CTA area ── */
  ctaArea: {
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: BTN_BLUE,
    borderRadius: radius.lg,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnBusy: {
    opacity: 0.65,
  },
  primaryBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Switch row ── */
  switchRow: {
    paddingHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* ── Footer ── */
  footerArea: {
    paddingHorizontal: 24,
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },

  /* ── Forgot password modal ── */
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    ...shadow.xl,
  },
  modalTop: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSendBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BTN_BLUE,
  },
});
