import React, { useState, useRef, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import BloodTypePicker from '../components/BloodTypePicker';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { auth, db } from '../lib/firebase';
import { colors, spacing, typography, radius, animation } from '../theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';

type LoginProps = { navigation?: any; onLogin?: () => void };

type StepKey = 0 | 1;

type RegisterErrorState = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type RegisterPersonalErrors = {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
};

type HealthErrors = {
  bloodType?: string;
  allergies?: string;
  conditions?: string;
};

const STEPS: { key: StepKey; label: string }[] = [
  { key: 0, label: 'Account' },
  { key: 1, label: 'Personal' },
];

export default function Login({ navigation, onLogin }: Readonly<LoginProps>) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<StepKey>(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  // Personal info fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Health fields
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

  // Forgot password dialog state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAccountStep = () => {
    const errors: RegisterErrorState = {};
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must be at least 8 characters and include both letters and numbers.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setRegisterAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePersonalStep = () => {
    const errors: RegisterPersonalErrors = {};
    const health: HealthErrors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (phone && !/^\d{7,}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits).';
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = 'Date of Birth must be in YYYY-MM-DD format.';
    }
    const bt = bloodType === 'custom' ? customBloodType.trim() : bloodType;
    if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt)) {
      health.bloodType = 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-.';
    }
    if (allergies.some(a => !a.trim())) {
      health.allergies = 'Allergy cannot be empty.';
    }
    if (medicalConditions.some(c => !c.trim())) {
      health.conditions = 'Condition cannot be empty.';
    }
    setRegisterPersonalErrors(errors);
    setHealthErrors(health);
    return Object.keys(errors).length === 0 && Object.keys(health).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin();
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        setLoginErrors({ email: 'No user found with this email.' });
      } else if (e.code === 'auth/wrong-password') {
        setLoginErrors({ password: 'Incorrect password.' });
      } else if (e.code === 'auth/invalid-email') {
        setLoginErrors({ email: 'Invalid email address.' });
      } else if (e.code === 'auth/invalid-credential') {
        setLoginErrors({ password: 'Invalid credentials. Please check your email and password.' });
      } else if (e.code === 'auth/too-many-requests') {
        setLoginErrors({ email: 'Too many failed attempts. Please try again later.' });
      } else {
        setLoginErrors({ email: e.message || 'Login failed. Please try again.' });
      }
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
      Alert.alert('Account created', 'You can now log in.');
      setIsRegister(false);
      setRegisterStep(0);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Registration Error', 'This email is already in use. Please use a different email or log in.');
      } else if (e.code === 'auth/invalid-email') {
        Alert.alert('Registration Error', 'Invalid email address.');
      } else if (e.code === 'auth/weak-password') {
        Alert.alert('Registration Error', 'Password is too weak. Please use a stronger password.');
      } else if (e.code === 'auth/network-request-failed') {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Registration Error', e.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    props: React.ComponentProps<typeof TextInput> & {
      error?: string;
      id: string;
    },
  ) => {
    const { error, id, ...rest } = props;
    return (
      <View style={{ width: '100%' }}>
        <TextInput
          {...rest}
          style={[
            styles.input,
            focusedInput === id && styles.inputFocused,
            error && styles.inputError,
          ]}
          onFocus={() => setFocusedInput(id)}
          onBlur={event => {
            rest.onBlur?.(event);
            setFocusedInput(null);
          }}
          placeholderTextColor={colors.muted}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  const renderLogin = () => (
    <>
      {renderInput({
        id: 'login-email',
        placeholder: 'Email',
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => {
          setEmail(text);
          if (loginErrors.email) setLoginErrors(e => ({ ...e, email: undefined }));
        },
        onBlur: () => {
          if (!email) setLoginErrors(e => ({ ...e, email: 'Email is required.' }));
          else if (!emailRegex.test(email)) setLoginErrors(e => ({ ...e, email: 'Please enter a valid email address.' }));
          else setLoginErrors(e => ({ ...e, email: undefined }));
        },
        error: loginErrors.email,
      })}
      {renderInput({
        id: 'login-password',
        placeholder: 'Password',
        secureTextEntry: true,
        value: password,
        onChangeText: text => {
          setPassword(text);
          if (loginErrors.password) setLoginErrors(e => ({ ...e, password: undefined }));
        },
        onBlur: () => {
          if (!password) setLoginErrors(e => ({ ...e, password: 'Password is required.' }));
          else setLoginErrors(e => ({ ...e, password: undefined }));
        },
        error: loginErrors.password,
      })}
      <Pressable onPress={() => setShowForgot(true)} style={styles.forgotLink}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>
      <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.card} /> : <Text style={styles.primaryButtonText}>{t('auth.signInButton', 'Login')}</Text>}
      </Pressable>
    </>
  );

  const renderAccountStep = () => (
    <>
      {renderInput({
        id: 'register-email',
        placeholder: 'Email',
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => {
          setEmail(text);
          if (registerAccountErrors.email) setRegisterAccountErrors(e => ({ ...e, email: undefined }));
        },
        onBlur: () => {
          if (!email) setRegisterAccountErrors(e => ({ ...e, email: 'Email is required.' }));
          else if (!emailRegex.test(email)) setRegisterAccountErrors(e => ({ ...e, email: 'Please enter a valid email address.' }));
          else setRegisterAccountErrors(e => ({ ...e, email: undefined }));
        },
        error: registerAccountErrors.email,
      })}
      {renderInput({
        id: 'register-password',
        placeholder: 'Password',
        secureTextEntry: true,
        value: password,
        onChangeText: text => {
          setPassword(text);
          if (registerAccountErrors.password) setRegisterAccountErrors(e => ({ ...e, password: undefined }));
        },
        onBlur: () => {
          if (!password) setRegisterAccountErrors(e => ({ ...e, password: 'Password is required.' }));
          else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
            setRegisterAccountErrors(e => ({ ...e, password: 'Password must be at least 8 characters and include both letters and numbers.' }));
          else setRegisterAccountErrors(e => ({ ...e, password: undefined }));
        },
        error: registerAccountErrors.password,
      })}
      {renderInput({
        id: 'register-confirm',
        placeholder: 'Confirm Password',
        secureTextEntry: true,
        value: confirmPassword,
        onChangeText: text => {
          setConfirmPassword(text);
          if (registerAccountErrors.confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
        },
        onBlur: () => {
          if (!confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: 'Please confirm your password.' }));
          else if (password !== confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: 'Passwords do not match.' }));
          else setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
        },
        error: registerAccountErrors.confirmPassword,
      })}
      <Pressable
        style={[styles.primaryButton]}
        onPress={() => {
          if (validateAccountStep()) setRegisterStep(1);
        }}
      >
        <Text style={styles.primaryButtonText}>{t('common.next', 'Next')}</Text>
      </Pressable>
    </>
  );

  const renderPersonalStep = () => (
    <>
      {renderInput({
        id: 'register-name',
        placeholder: 'Full Name',
        value: name,
        onChangeText: text => {
          setName(text);
          if (registerPersonalErrors.name) setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
        },
        onBlur: () => {
          if (!name.trim()) setRegisterPersonalErrors(e => ({ ...e, name: 'Full name is required.' }));
          else setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
        },
        error: registerPersonalErrors.name,
      })}
      {renderInput({
        id: 'register-phone',
        placeholder: 'Phone Number',
        keyboardType: 'phone-pad',
        value: phone,
        onChangeText: text => {
          setPhone(text);
          if (registerPersonalErrors.phone) setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
        },
        onBlur: () => {
          if (phone && !/^\d{7,}$/.test(phone)) setRegisterPersonalErrors(e => ({ ...e, phone: 'Please enter a valid phone number (at least 7 digits).' }));
          else setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
        },
        error: registerPersonalErrors.phone,
      })}
      {renderInput({
        id: 'register-dob',
        placeholder: 'Date of Birth (YYYY-MM-DD)',
        keyboardType: 'numbers-and-punctuation',
        value: dateOfBirth,
        onChangeText: text => {
          setDateOfBirth(text);
          if (registerPersonalErrors.dateOfBirth) setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
        },
        onBlur: () => {
          if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))
            setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: 'Date of Birth must be in YYYY-MM-DD format.' }));
          else setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
        },
        error: registerPersonalErrors.dateOfBirth,
      })}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('auth.healthBasics', 'Health basics')}</Text>
        {healthErrors.bloodType ? <Text style={styles.errorText}>{healthErrors.bloodType}</Text> : null}
      </View>
      <BloodTypePicker value={bloodType} onChange={setBloodType} />
      {bloodType === 'custom' && renderInput({
        id: 'register-blood-custom',
        placeholder: 'Custom Blood Type',
        value: customBloodType,
        onChangeText: text => setCustomBloodType(text),
        onBlur: () => {
          const bt = customBloodType.trim();
          if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt))
            setHealthErrors(e => ({ ...e, bloodType: 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-.' }));
          else setHealthErrors(e => ({ ...e, bloodType: undefined }));
        },
        error: healthErrors.bloodType,
      })}

      <View style={styles.chipRow}>
        <TextInput
          placeholder="Add allergy"
          value={allergyInput}
          onChangeText={setAllergyInput}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.addChip}
          onPress={() => {
            if (!allergyInput.trim()) return;
            setAllergies(prev => [...prev, allergyInput.trim()]);
            setAllergyInput('');
            setHealthErrors(e => ({ ...e, allergies: undefined }));
          }}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {healthErrors.allergies ? <Text style={styles.errorText}>{healthErrors.allergies}</Text> : null}
      <View style={styles.tagList}>
        {allergies.map((a, idx) => (
          <Pressable key={`${a}-${idx}`} onPress={() => setAllergies(prev => prev.filter((_, i) => i !== idx))} style={styles.tag}>
            <Text style={styles.tagText}>{a}</Text>
            <Ionicons name="close" size={16} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.chipRow}>
        <TextInput
          placeholder="Add condition"
          value={conditionInput}
          onChangeText={setConditionInput}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={styles.addChip}
          onPress={() => {
            if (!conditionInput.trim()) return;
            setMedicalConditions(prev => [...prev, conditionInput.trim()]);
            setConditionInput('');
            setHealthErrors(e => ({ ...e, conditions: undefined }));
          }}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {healthErrors.conditions ? <Text style={styles.errorText}>{healthErrors.conditions}</Text> : null}
      <View style={styles.tagList}>
        {medicalConditions.map((c, idx) => (
          <Pressable key={`${c}-${idx}`} onPress={() => setMedicalConditions(prev => prev.filter((_, i) => i !== idx))} style={styles.tag}>
            <Text style={styles.tagText}>{c}</Text>
            <Ionicons name="close" size={16} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.card} /> : <Text style={styles.primaryButtonText}>{t('auth.signUpButton', 'Create account')}</Text>}
      </Pressable>
    </>
  );

  return (
    <ScreenContainer
      scrollable
      withPadding={false}
      contentContainerStyle={styles.container}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.heroTitle}>{isRegister ? 'Create your medical ID' : 'Welcome back'}</Text>
        <Text style={styles.heroSubtitle}>
          {isRegister ? 'Join MedLink to keep your medical essentials in one place.' : 'Sign in to continue your connected care journey.'}
        </Text>
        <SegmentedControl
          options={['Login', 'Register']}
          value={isRegister ? 'Register' : 'Login'}
          onChange={value => {
            const register = value === 'Register';
            setIsRegister(register);
            if (!register) setRegisterStep(0);
          }}
        />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ width: '100%' }}
      >
        <View style={styles.formWrapper}>
          <Card style={styles.cardSurface}>
            {isRegister ? (
              <>
                <View style={styles.stepper}>
                  {STEPS.map((step, index) => (
                    <View key={step.key} style={styles.stepItem}>
                      <View style={[styles.stepCircle, registerStep >= step.key && styles.stepCircleActive]}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.stepLabel, registerStep === step.key && styles.stepLabelActive]}>
                        {step.label}
                      </Text>
                      {index < STEPS.length - 1 ? (
                        <View style={[styles.stepDivider, registerStep > step.key && styles.stepDividerActive]} />
                      ) : null}
                    </View>
                  ))}
                </View>
                <View style={{ gap: spacing.md }}>
                  {registerStep === 0 ? renderAccountStep() : renderPersonalStep()}
                </View>
                {registerStep === 1 ? (
                  <Pressable style={styles.secondaryButton} onPress={() => setRegisterStep(0)}>
                    <Text style={styles.secondaryText}>{t('common.back', 'Back')}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <View style={{ gap: spacing.md }}>{renderLogin()}</View>
            )}
          </Card>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footerHint}>
        <Text style={styles.footerText}>
          {t('auth.byContinuing', 'By continuing you agree to our')} <Text style={styles.footerLink}>{t('auth.terms', 'Terms')}</Text> {t('common.and', 'and')} <Text style={styles.footerLink}>{t('auth.privacyPolicy', 'Privacy Policy')}</Text>.
        </Text>
      </View>

      {showForgot && (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="lock-closed" size={28} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('auth.resetPassword', 'Reset password')}</Text>
              <Text style={styles.modalSubtitle}>
                Enter your email address and we'll send you a password reset link.
              </Text>
            </View>
            {renderInput({
              id: 'forgot-email',
              placeholder: 'Email',
              autoCapitalize: 'none',
              keyboardType: 'email-address',
              value: forgotEmail,
              onChangeText: setForgotEmail,
            })}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setShowForgot(false);
                  setForgotEmail('');
                }}
              >
                <Text style={styles.secondaryText}>{t('common.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.modalPrimary]}
                onPress={async () => {
                  if (!forgotEmail || !emailRegex.test(forgotEmail)) {
                    Alert.alert('Invalid Email', 'Please enter a valid email address.');
                    return;
                  }
                  setForgotLoading(true);
                  try {
                    await sendPasswordResetEmail(auth, forgotEmail);
                    Alert.alert('Password Reset', 'A password reset link has been sent to your email.');
                    setShowForgot(false);
                    setForgotEmail('');
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Failed to send reset email.');
                  } finally {
                    setForgotLoading(false);
                  }
                }}
                disabled={forgotLoading}
              >
                {forgotLoading ? <ActivityIndicator color={colors.card} /> : <Text style={styles.primaryButtonText}>{t('auth.sendLink', 'Send link')}</Text>}
              </Pressable>
            </View>
          </Card>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  hero: {
    paddingTop: spacing.xxl * 1.4,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
  },
  heroTitle: {
    ...typography.h1,
    color: '#fff',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formWrapper: {
    marginTop: -spacing.xxl * 0.7,
    paddingHorizontal: spacing.xl,
  },
  cardSurface: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 6,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    color: colors.card,
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.muted,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addChip: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  tagText: {
    color: colors.chipText,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepLabel: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.primary,
  },
  stepDivider: {
    position: 'absolute',
    top: 18,
    right: -spacing.md,
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  stepDividerActive: {
    backgroundColor: colors.primary,
  },
  footerHint: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    gap: spacing.lg,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37,99,235,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalPrimary: {
    flex: 1,
  },
});
