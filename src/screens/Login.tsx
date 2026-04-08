import React, { useState, useRef, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  ScrollView,
  Image,
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
import { colors, spacing, radius, animation, shadow } from '../theme';
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

export default function Login({ onLogin }: Readonly<LoginProps>) {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError } = useToast();

  const STEPS: { key: StepKey; label: string }[] = [
    { key: 0, label: t('auth.stepAccount', 'Account') },
    { key: 1, label: t('auth.stepPersonal', 'Personal') },
  ];
  const loginLabel = t('auth.loginLabel', 'Login');
  const registerLabel = t('auth.registerLabel', 'Register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<StepKey>(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      errors.email = t('auth.emailRequired', 'Email is required');
    } else if (!emailRegex.test(email)) {
      errors.email = t('auth.invalidEmail', 'Please enter a valid email address');
    }
    if (!password) {
      errors.password = t('auth.passwordRequired', 'Password is required');
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAccountStep = () => {
    const errors: RegisterErrorState = {};
    if (!email) {
      errors.email = t('auth.emailRequired', 'Email is required');
    } else if (!emailRegex.test(email)) {
      errors.email = t('auth.invalidEmail', 'Please enter a valid email address');
    }
    if (!password) {
      errors.password = t('auth.passwordRequired', 'Password is required');
    } else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = t('auth.invalidPassword', 'Password must be at least 8 characters and include both letters and numbers');
    }
    if (!confirmPassword) {
      errors.confirmPassword = t('auth.confirmPasswordRequired', 'Please confirm your password');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDoNotMatch', 'Passwords do not match');
    }
    setRegisterAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePersonalStep = () => {
    const errors: RegisterPersonalErrors = {};
    const health: HealthErrors = {};
    if (!name.trim()) {
      errors.name = t('auth.nameRequired', 'Full name is required');
    }
    if (phone && !/^\d{7,}$/.test(phone)) {
      errors.phone = t('auth.phoneInvalid', 'Please enter a valid phone number (at least 7 digits)');
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = t('auth.dobInvalid', 'Date of Birth must be in YYYY-MM-DD format');
    }
    const bt = bloodType === 'custom' ? customBloodType.trim() : bloodType;
    if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt)) {
      health.bloodType = t('auth.bloodTypeFormatInvalid', 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-');
    }
    if (allergies.some(a => !a.trim())) {
      health.allergies = t('auth.allergyEmpty', 'Allergy cannot be empty');
    }
    if (medicalConditions.some(c => !c.trim())) {
      health.conditions = t('auth.conditionEmpty', 'Condition cannot be empty');
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
      showSuccess(t('auth.signInSuccess', 'Welcome back!'), t('auth.signInSuccessMessage', 'You have successfully signed in.'));
      if (onLogin) onLogin();
    } catch (e: any) {
      let errorMessage = t('auth.genericError', 'Login failed. Please try again.');
      
      if (e.code === 'auth/user-not-found') {
        errorMessage = t('auth.userNotFound', 'No user found with this email');
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = t('auth.wrongPassword', 'Incorrect password');
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmailAddress', 'Invalid email address');
      } else if (e.code === 'auth/invalid-credential') {
        errorMessage = t('auth.invalidCredential', 'Invalid credentials. Please check your email and password');
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = t('auth.tooManyRequests', 'Too many failed attempts. Please try again later');
      }

      showError(t('auth.loginFailed', 'Login Failed'), errorMessage);
      setLoginErrors({ email: errorMessage });
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
      showSuccess(t('auth.signUpSuccess', 'Account created successfully!'), t('auth.registerSuccessMessage', 'You can now access all features.'));
      setIsRegister(false);
      setRegisterStep(0);
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setPhone('');
      setDateOfBirth('');
      setBloodType('');
      setAllergies([]);
      setMedicalConditions([]);
    } catch (e: any) {
      let errorMessage = t('auth.createAccountFailed', 'Failed to create account. Please try again.');

      if (e.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.emailAlreadyInUse', 'This email is already in use.');
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmailAddress', 'Invalid email address');
      } else if (e.code === 'auth/weak-password') {
        errorMessage = t('auth.weakPassword', 'Password is too weak. Please use a stronger password');
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage = t('auth.networkError', 'Please check your internet connection and try again');
      }

      showError(t('auth.registrationFailed', 'Registration Failed'), errorMessage);
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
      showSuccess(t('auth.emailSentTitle', 'Email Sent'), t('auth.forgotEmailSent', 'Password reset email has been sent to your inbox'));
      setShowForgot(false);
      setForgotEmail('');
    } catch (e: any) {
      let errorMessage = t('auth.forgotEmailFailed', 'Failed to send reset email');
      if (e.code === 'auth/user-not-found') {
        errorMessage = t('auth.forgotEmailNotFound', 'No user found with this email address');
      }
      showError(t('common.error', 'Error'), errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

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
    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          focusedInput === id && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={focusedInput === id ? colors.primary : colors.muted} 
              style={styles.inputIcon}
            />
          )}
          <TextInput
            {...rest}
            style={[styles.input, icon && styles.inputWithIcon]}
            onFocus={() => setFocusedInput(id)}
            onBlur={event => {
              rest.onBlur?.(event);
              setFocusedInput(null);
            }}
            placeholderTextColor={colors.muted}
            secureTextEntry={isPassword && !passwordVisible}
          />
          {showPasswordToggle && (
            <Pressable onPress={onTogglePassword} style={styles.passwordToggle}>
              <Ionicons 
                name={passwordVisible ? 'eye-off' : 'eye'} 
                size={20} 
                color={colors.muted} 
              />
            </Pressable>
          )}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  const renderLogin = () => (
    <View style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t('auth.signInToAccount', 'Sign in to your account')}</Text>
        <Text style={styles.subtitle}>{t('auth.loginSubtitle', 'Welcome back! Please enter your details')}</Text>
      </View>

      {renderInput({
        id: 'login-email',
        placeholder: t('auth.emailPlaceholder', 'Enter your email'),
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => {
          setEmail(text);
          if (loginErrors.email) setLoginErrors(e => ({ ...e, email: undefined }));
        },
        error: loginErrors.email,
        icon: 'mail-outline',
      })}

      {renderInput({
        id: 'login-password',
        placeholder: t('auth.passwordPlaceholder', 'Enter your password'),
        value: password,
        onChangeText: text => {
          setPassword(text);
          if (loginErrors.password) setLoginErrors(e => ({ ...e, password: undefined }));
        },
        error: loginErrors.password,
        icon: 'lock-closed-outline',
        isPassword: true,
        passwordVisible: showPassword,
        showPasswordToggle: true,
        onTogglePassword: () => setShowPassword(!showPassword),
      })}

      <Pressable onPress={() => setShowForgot(true)} style={styles.forgotButton}>
        <Text style={styles.forgotText}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
      </Pressable>

      <Button
        title={loading ? t('auth.signingIn', 'Signing in...') : t('auth.signInButton', 'Sign In')}
        onPress={handleLogin}
        disabled={loading}
        loading={loading}
        fullWidth
        style={styles.primaryButton}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>{t('auth.noAccount', "Don't have an account?")}</Text>
        <Pressable onPress={() => setIsRegister(true)}>
          <Text style={styles.switchLink}>{t('auth.signUpHere', 'Sign up here')}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderAccountStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t('auth.createAccountTitle', 'Create Account')}</Text>
        <Text style={styles.subtitle}>{t('auth.createAccountSubtitle', 'Enter your email and password to get started')}</Text>
      </View>

      {renderInput({
        id: 'register-email',
        placeholder: t('auth.emailAddress', 'Email'),
        autoCapitalize: 'none',
        keyboardType: 'email-address',
        value: email,
        onChangeText: text => {
          setEmail(text);
          if (registerAccountErrors.email) setRegisterAccountErrors(e => ({ ...e, email: undefined }));
        },
        onBlur: () => {
          if (!email) setRegisterAccountErrors(e => ({ ...e, email: t('auth.emailRequired', 'Email is required.') }));
          else if (!emailRegex.test(email)) setRegisterAccountErrors(e => ({ ...e, email: t('auth.invalidEmail', 'Please enter a valid email address.') }));
          else setRegisterAccountErrors(e => ({ ...e, email: undefined }));
        },
        error: registerAccountErrors.email,
        icon: 'mail-outline',
      })}

      {renderInput({
        id: 'register-password',
        placeholder: t('auth.password', 'Password'),
        value: password,
        onChangeText: text => {
          setPassword(text);
          if (registerAccountErrors.password) setRegisterAccountErrors(e => ({ ...e, password: undefined }));
        },
        onBlur: () => {
          if (!password) setRegisterAccountErrors(e => ({ ...e, password: t('auth.passwordRequired', 'Password is required.') }));
          else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
            setRegisterAccountErrors(e => ({ ...e, password: t('auth.invalidPassword', 'Password must be at least 8 characters and include both letters and numbers.') }));
          else setRegisterAccountErrors(e => ({ ...e, password: undefined }));
        },
        error: registerAccountErrors.password,
        icon: 'lock-closed-outline',
        isPassword: true,
        passwordVisible: showPassword,
        showPasswordToggle: true,
        onTogglePassword: () => setShowPassword(!showPassword),
      })}

      {renderInput({
        id: 'register-confirm',
        placeholder: t('auth.confirmPassword', 'Confirm Password'),
        value: confirmPassword,
        onChangeText: text => {
          setConfirmPassword(text);
          if (registerAccountErrors.confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
        },
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
        onTogglePassword: () => setShowConfirmPassword(!showConfirmPassword),
      })}

      <Button
        title={t('common.next', 'Next')}
        onPress={() => {
          if (validateAccountStep()) setRegisterStep(1);
        }}
        fullWidth
        style={styles.primaryButton}
      />
    </View>
  );

  const renderPersonalStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t('auth.personalInfoTitle', 'Personal Information')}</Text>
        <Text style={styles.subtitle}>{t('auth.personalInfoSubtitle', 'Tell us about yourself to complete your medical profile')}</Text>
      </View>

      {renderInput({
        id: 'register-name',
        placeholder: t('auth.fullName', 'Full Name'),
        value: name,
        onChangeText: text => {
          setName(text);
          if (registerPersonalErrors.name) setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
        },
        onBlur: () => {
          if (!name.trim()) setRegisterPersonalErrors(e => ({ ...e, name: t('auth.nameRequired', 'Full name is required.') }));
          else setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
        },
        error: registerPersonalErrors.name,
        icon: 'person-outline',
      })}

      {renderInput({
        id: 'register-phone',
        placeholder: t('auth.phonePlaceholderOptional', 'Phone Number (optional)'),
        keyboardType: 'phone-pad',
        value: phone,
        onChangeText: text => {
          setPhone(text);
          if (registerPersonalErrors.phone) setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
        },
        onBlur: () => {
          if (phone && !/^\d{7,}$/.test(phone)) setRegisterPersonalErrors(e => ({ ...e, phone: t('auth.phoneInvalid', 'Please enter a valid phone number (at least 7 digits).') }));
          else setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
        },
        error: registerPersonalErrors.phone,
        icon: 'call-outline',
      })}

      {renderInput({
        id: 'register-dob',
        placeholder: t('auth.dobPlaceholder', 'Date of Birth (YYYY-MM-DD) - optional'),
        keyboardType: 'numbers-and-punctuation',
        value: dateOfBirth,
        onChangeText: text => {
          setDateOfBirth(text);
          if (registerPersonalErrors.dateOfBirth) setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
        },
        onBlur: () => {
          if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth))
            setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: t('auth.dobInvalid', 'Date of Birth must be in YYYY-MM-DD format.') }));
          else setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
        },
        error: registerPersonalErrors.dateOfBirth,
        icon: 'calendar-outline',
      })}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('auth.healthBasics', 'Health Information (Optional)')}</Text>
      </View>
      
      {healthErrors.bloodType ? <Text style={styles.errorText}>{healthErrors.bloodType}</Text> : null}
      <BloodTypePicker value={bloodType} onChange={setBloodType} />
      
      {bloodType === 'custom' && renderInput({
        id: 'register-blood-custom',
        placeholder: t('auth.bloodCustomPlaceholder', 'Custom Blood Type (e.g., A+, B-, O+)'),
        value: customBloodType,
        onChangeText: text => setCustomBloodType(text),
        onBlur: () => {
          const bt = customBloodType.trim();
          if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt))
            setHealthErrors(e => ({ ...e, bloodType: t('auth.bloodTypeFormatInvalid', 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-.') }));
          else setHealthErrors(e => ({ ...e, bloodType: undefined }));
        },
        error: healthErrors.bloodType,
        icon: 'water-outline',
      })}

      <View style={styles.chipRow}>
        <TextInput
          placeholder={t('auth.allergyPlaceholder', 'Add allergy (optional)')}
          value={allergyInput}
          onChangeText={setAllergyInput}
          style={[styles.inputWrapper, { flex: 1 }]}
          placeholderTextColor={colors.textSecondary}
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
          placeholder={t('auth.conditionPlaceholder', 'Add medical condition (optional)')}
          value={conditionInput}
          onChangeText={setConditionInput}
          style={[styles.inputWrapper, { flex: 1 }]}
          placeholderTextColor={colors.textSecondary}
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

      <Button
        title={loading ? t('auth.creatingAccount', 'Creating account...') : t('auth.signUpButton', 'Create Account')}
        onPress={handleRegister}
        disabled={loading}
        loading={loading}
        fullWidth
        style={styles.primaryButton}
      />
    </View>
  );

  return (
    <ScreenContainer
      scrollable
      withPadding={false}
      contentContainerStyle={styles.container}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.heroTitle}>{isRegister ? t('auth.registerTitle', 'Create your medical ID') : t('auth.welcomeBack', 'Welcome back')}</Text>
          <Text style={styles.heroSubtitle}>
            {isRegister ? t('auth.registerSubtitle', 'Join MedLink to keep your medical essentials in one place.') : t('auth.welcomeSubtitle', 'Sign in to continue your connected care journey.')}
          </Text>
          <SegmentedControl
            options={[loginLabel, registerLabel]}
            value={isRegister ? registerLabel : loginLabel}
            onChange={value => {
              const register = value === registerLabel;
              setIsRegister(register);
              if (!register) setRegisterStep(0);
            }}
          />
          {/* Language Switcher */}
          <View style={styles.langSwitcher}>
            {([{ code: 'en', flag: '🇺🇸' }, { code: 'fr', flag: '🇫🇷' }, { code: 'ar', flag: '🇸🇦' }] as const).map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => i18n.changeLanguage(lang.code)}
                style={[styles.langBtn, i18n.language === lang.code && styles.langBtnActive]}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ width: '100%' }}
      >
        <Animated.View
          style={[
            styles.formWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Card variant="elevated" style={styles.cardSurface}>
            {isRegister ? (
              <>
                <View style={styles.stepper}>
                  {STEPS.map((step, index) => (
                    <View key={step.key} style={styles.stepItem}>
                      <View style={[styles.stepCircle, registerStep >= step.key && styles.stepCircleActive]}>
                        <Text style={[styles.stepNumber, registerStep >= step.key && { color: '#fff' }]}>{index + 1}</Text>
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
                {registerStep === 0 ? renderAccountStep() : renderPersonalStep()}
                {registerStep === 1 ? (
                  <Button
                    title={t('common.back', 'Back')}
                    onPress={() => setRegisterStep(0)}
                    variant="secondary"
                    fullWidth
                    style={styles.secondaryButton}
                  />
                ) : null}
              </>
            ) : (
              renderLogin()
            )}
          </Card>
        </Animated.View>
      </KeyboardAvoidingView>

      <View style={styles.footerHint}>
        <Text style={styles.footerText}>
          {t('auth.byContinuing', 'By continuing you agree to our')} <Text style={styles.footerLink}>{t('auth.terms', 'Terms')}</Text> {t('common.and', 'and')} <Text style={styles.footerLink}>{t('auth.privacyPolicy', 'Privacy Policy')}</Text>.
        </Text>
      </View>

      {showForgot && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }]
            }}
          >
            <Card variant="elevated" style={styles.modalCard}>
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="lock-closed" size={28} color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>{t('auth.resetPassword', 'Reset password')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('auth.forgotPasswordSubtitle', "Enter your email address and we'll send you a password reset link.")}
                </Text>
              </View>
              {renderInput({
                id: 'forgot-email',
                placeholder: t('auth.emailAddress', 'Email'),
                autoCapitalize: 'none',
                keyboardType: 'email-address',
                value: forgotEmail,
                onChangeText: setForgotEmail,
                icon: 'mail-outline',
              })}
              <View style={styles.modalActions}>
                <Button
                  title={t('common.cancel', 'Cancel')}
                  onPress={() => {
                    setShowForgot(false);
                    setForgotEmail('');
                  }}
                  variant="secondary"
                  style={styles.secondaryButton}
                />
                <Button
                  title={forgotLoading ? t('auth.sending', 'Sending...') : t('auth.sendLink', 'Send link')}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                  loading={forgotLoading}
                  style={[styles.primaryButton, styles.modalPrimary]}
                />
              </View>
            </Card>
          </Animated.View>
        </Animated.View>
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
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#fff',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
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
  formContainer: {
    gap: spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    gap: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    ...shadow.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.bg,
    ...shadow.primary,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  inputWithIcon: {
    marginLeft: 0,
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadow.primary,
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  switchLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  disabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
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
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  tagText: {
    color: colors.chipText,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary50,
    marginBottom: spacing.lg,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  stepLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
  },
  stepDivider: {
    position: 'absolute',
    top: 18,
    left: '50%',
    right: -50,
    height: 2,
    backgroundColor: colors.primary200,
    zIndex: -1,
  },
  stepDividerActive: {
    backgroundColor: colors.primary,
  },
  footerHint: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
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
    backgroundColor: colors.overlay,
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
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalPrimary: {
    flex: 1,
  },
  langSwitcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  langBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  langFlag: {
    fontSize: 20,
  },
});
