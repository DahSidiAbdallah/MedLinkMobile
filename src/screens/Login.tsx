import React, { useState } from 'react';
import { Platform } from 'react-native';
import BloodTypePicker from '../components/BloodTypePicker';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { colors, spacing, type } from '../theme';

export default function Login({ navigation, onLogin }: { navigation?: any; onLogin?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  const [healthErrors, setHealthErrors] = useState<{ bloodType?: string; allergies?: string; conditions?: string }>({});

  // Forgot password dialog state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Inline error state for login fields
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  // Inline error state for register fields (account step)
  const [registerAccountErrors, setRegisterAccountErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  // Inline error state for register fields (personal step)
  const [registerPersonalErrors, setRegisterPersonalErrors] = useState<{ name?: string; phone?: string; dateOfBirth?: string }>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    let errors: { email?: string; password?: string } = {};
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
    let errors: { email?: string; password?: string; confirmPassword?: string } = {};
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
    let errors: { name?: string; phone?: string; dateOfBirth?: string } = {};
    let health: { bloodType?: string; allergies?: string; conditions?: string } = {};
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (phone && !/^\d{7,}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits).';
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = 'Date of Birth must be in YYYY-MM-DD format.';
    }
    // Blood type validation
    const bt = bloodType === 'custom' ? customBloodType.trim() : bloodType;
    if (bt && !/^A[+-]$|^B[+-]$|^AB[+-]$|^O[+-]$/.test(bt)) {
      health.bloodType = 'Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-.';
    }
    // Allergies validation
    if (allergies.some(a => !a.trim())) {
      health.allergies = 'Allergy cannot be empty.';
    }
    // Conditions validation
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
      } else {
        setLoginErrors({ email: e.message });
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
      const profile = {
        id: user.uid,
        name,
        email,
        phone,
        date_of_birth: dateOfBirth,
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
      } else {
        Alert.alert('Registration Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 100, height: 100, resizeMode: 'contain', marginBottom: 8 }}
          />
          <Text style={[type.h1, { marginBottom: 8 }]}>
            {isRegister ? 'Create Account' : 'Login'}
          </Text>
        </View>
        {isRegister && (
          <View style={styles.stepper}>
            <View style={styles.stepWrapper}>
              <View
                style={[styles.stepCircle, registerStep >= 0 && styles.stepCircleActive]}
              >
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text
                style={[styles.stepLabel, registerStep === 0 && styles.stepLabelActive]}
              >
                Account
              </Text>
            </View>
            <View style={[styles.stepLine, registerStep > 0 && styles.stepLineActive]} />
            <View style={styles.stepWrapper}>
              <View
                style={[styles.stepCircle, registerStep >= 1 && styles.stepCircleActive]}
              >
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text
                style={[styles.stepLabel, registerStep === 1 && styles.stepLabelActive]}
              >
                Personal
              </Text>
            </View>
          </View>
        )}

        {!isRegister && (
          <>
            <TextInput
              style={[styles.input, focusedInput === 'email' && styles.inputFocused, loginErrors.email && styles.inputError]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (loginErrors.email) setLoginErrors(e => ({ ...e, email: undefined }));
              }}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => {
                setFocusedInput(null);
                if (!email) setLoginErrors(e => ({ ...e, email: 'Email is required.' }));
                else if (!emailRegex.test(email)) setLoginErrors(e => ({ ...e, email: 'Please enter a valid email address.' }));
                else setLoginErrors(e => ({ ...e, email: undefined }));
              }}
            />
            {loginErrors.email ? <Text style={styles.errorText}>{loginErrors.email}</Text> : null}
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused, loginErrors.password && styles.inputError]}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (loginErrors.password) setLoginErrors(e => ({ ...e, password: undefined }));
              }}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => {
                setFocusedInput(null);
                if (!password) setLoginErrors(e => ({ ...e, password: 'Password is required.' }));
                else setLoginErrors(e => ({ ...e, password: undefined }));
              }}
            />
            {loginErrors.password ? <Text style={styles.errorText}>{loginErrors.password}</Text> : null}
            <Pressable onPress={() => setShowForgot(true)}>
              <Text style={{ color: colors.primary, marginTop: -4, marginBottom: 12, alignSelf: 'flex-end', textDecorationLine: 'underline' }}>Forgot password?</Text>
            </Pressable>
            <Pressable
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
            {/* Forgot Password Dialog */}
            {showForgot && (
                <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: spacing.xl, width: 340, alignItems: 'center', elevation: 7, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 }}>
                  <Ionicons name="lock-closed-outline" size={40} color={colors.primary} style={{ marginBottom: 10 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8, color: colors.primary }}>Reset Password</Text>
                  <Text style={{ color: colors.text, marginBottom: 18, textAlign: 'center', fontSize: 15, lineHeight: 20 }}>
                    Enter your email address and we'll send you a password reset link.
                  </Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 0, width: '100%' }]}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                    <View style={{ flexDirection: 'row', marginTop: 22, width: '100%', gap: 0 }}>
                    <Pressable style={{ flex: 1, marginRight: 8, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.line }} onPress={() => { setShowForgot(false); setForgotEmail(''); }}>
                      <Text style={styles.buttonSecondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={{ flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8 }}
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
                      {forgotLoading ? <ActivityIndicator color={colors.card} /> : <Text style={styles.buttonText}>Send</Text>}
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {isRegister && registerStep === 0 && (
          <>
            <TextInput
              style={[styles.input, focusedInput === 'email' && styles.inputFocused, registerAccountErrors.email && styles.inputError]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (registerAccountErrors.email) setRegisterAccountErrors(e => ({ ...e, email: undefined }));
              }}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => {
                setFocusedInput(null);
                if (!email) setRegisterAccountErrors(e => ({ ...e, email: 'Email is required.' }));
                else if (!emailRegex.test(email)) setRegisterAccountErrors(e => ({ ...e, email: 'Please enter a valid email address.' }));
                else setRegisterAccountErrors(e => ({ ...e, email: undefined }));
              }}
            />
            {registerAccountErrors.email ? <Text style={styles.errorText}>{registerAccountErrors.email}</Text> : null}
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused, registerAccountErrors.password && styles.inputError]}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (registerAccountErrors.password) setRegisterAccountErrors(e => ({ ...e, password: undefined }));
              }}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => {
                setFocusedInput(null);
                if (!password) setRegisterAccountErrors(e => ({ ...e, password: 'Password is required.' }));
                else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) setRegisterAccountErrors(e => ({ ...e, password: 'Password must be at least 8 characters and include both letters and numbers.' }));
                else setRegisterAccountErrors(e => ({ ...e, password: undefined }));
              }}
            />
            {registerAccountErrors.password ? <Text style={styles.errorText}>{registerAccountErrors.password}</Text> : null}
            <TextInput
              style={[styles.input, focusedInput === 'confirm' && styles.inputFocused, registerAccountErrors.confirmPassword && styles.inputError]}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (registerAccountErrors.confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
              }}
              onFocus={() => setFocusedInput('confirm')}
              onBlur={() => {
                setFocusedInput(null);
                if (!confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: 'Please confirm your password.' }));
                else if (password !== confirmPassword) setRegisterAccountErrors(e => ({ ...e, confirmPassword: 'Passwords do not match.' }));
                else setRegisterAccountErrors(e => ({ ...e, confirmPassword: undefined }));
              }}
            />
            {registerAccountErrors.confirmPassword ? <Text style={styles.errorText}>{registerAccountErrors.confirmPassword}</Text> : null}
            <Pressable
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={() => {
                if (validateAccountStep()) setRegisterStep(1);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Next</Text>
              )}
            </Pressable>
          </>
        )}

        {isRegister && registerStep === 1 && (
          <>
            <TextInput
              style={[styles.input, focusedInput === 'name' && styles.inputFocused, registerPersonalErrors.name && styles.inputError]}
              placeholder="Full Name"
              value={name}
              onChangeText={text => {
                setName(text);
                if (registerPersonalErrors.name) setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
              }}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => {
                setFocusedInput(null);
                if (!name.trim()) setRegisterPersonalErrors(e => ({ ...e, name: 'Full name is required.' }));
                else setRegisterPersonalErrors(e => ({ ...e, name: undefined }));
              }}
            />
            {registerPersonalErrors.name ? <Text style={styles.errorText}>{registerPersonalErrors.name}</Text> : null}
            <TextInput
              style={[styles.input, focusedInput === 'phone' && styles.inputFocused, registerPersonalErrors.phone && styles.inputError]}
              placeholder="Phone"
              value={phone}
              onChangeText={text => {
                setPhone(text);
                if (registerPersonalErrors.phone) setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
              }}
              keyboardType="phone-pad"
              onFocus={() => setFocusedInput('phone')}
              onBlur={() => {
                setFocusedInput(null);
                if (phone && !/^\d{7,}$/.test(phone)) setRegisterPersonalErrors(e => ({ ...e, phone: 'Please enter a valid phone number (at least 7 digits).' }));
                else setRegisterPersonalErrors(e => ({ ...e, phone: undefined }));
              }}
            />
            {registerPersonalErrors.phone ? <Text style={styles.errorText}>{registerPersonalErrors.phone}</Text> : null}
            <TextInput
              style={[styles.input, focusedInput === 'dob' && styles.inputFocused, registerPersonalErrors.dateOfBirth && styles.inputError]}
              placeholder="Date of Birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={text => {
                setDateOfBirth(text);
                if (registerPersonalErrors.dateOfBirth) setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
              }}
              onFocus={() => setFocusedInput('dob')}
              onBlur={() => {
                setFocusedInput(null);
                if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: 'Date of Birth must be in YYYY-MM-DD format.' }));
                else setRegisterPersonalErrors(e => ({ ...e, dateOfBirth: undefined }));
              }}
            />
            {registerPersonalErrors.dateOfBirth ? <Text style={styles.errorText}>{registerPersonalErrors.dateOfBirth}</Text> : null}


            {/* Blood Type Dropdown (cross-platform) */}
            <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Blood Type</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <BloodTypePicker value={bloodType} onChange={setBloodType} />
              {bloodType === 'custom' && (
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  placeholder="Enter blood type"
                  value={customBloodType}
                  onChangeText={setCustomBloodType}
                />
              )}
            </View>
            {healthErrors.bloodType && <Text style={styles.errorText}>{healthErrors.bloodType}</Text>}

            {/* Allergies Chip Input */}
            <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Allergies</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Add allergy"
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={() => {
                  if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
                    setAllergies([...allergies, allergyInput.trim()]);
                    setAllergyInput('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={{ marginLeft: 8, backgroundColor: colors.primary, borderRadius: 999, padding: 8 }}
                onPress={() => {
                  if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
                    setAllergies([...allergies, allergyInput.trim()]);
                    setAllergyInput('');
                  }
                }}
              >
                <Text style={{ color: colors.card, fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
              {allergies.map((a, i) => (
                <View key={a + i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginRight: 6, marginBottom: 4 }}>
                  <Text style={{ color: '#222', fontSize: 15, marginRight: 4 }}>{a}</Text>
                  <Pressable onPress={() => setAllergies(allergies.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 18, marginLeft: 2 }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            {healthErrors.allergies && <Text style={styles.errorText}>{healthErrors.allergies}</Text>}

            {/* Medical Conditions Chip Input */}
            <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Medical Conditions</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Add condition"
                value={conditionInput}
                onChangeText={setConditionInput}
                onSubmitEditing={() => {
                  if (conditionInput.trim() && !medicalConditions.includes(conditionInput.trim())) {
                    setMedicalConditions([...medicalConditions, conditionInput.trim()]);
                    setConditionInput('');
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={{ marginLeft: 8, backgroundColor: colors.primary, borderRadius: 999, padding: 8 }}
                onPress={() => {
                  if (conditionInput.trim() && !medicalConditions.includes(conditionInput.trim())) {
                    setMedicalConditions([...medicalConditions, conditionInput.trim()]);
                    setConditionInput('');
                  }
                }}
              >
                <Text style={{ color: colors.card, fontWeight: 'bold', fontSize: 18 }}>+</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
              {medicalConditions.map((c, i) => (
                <View key={c + i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginRight: 6, marginBottom: 4 }}>
                  <Text style={{ color: '#222', fontSize: 15, marginRight: 4 }}>{c}</Text>
                  <Pressable onPress={() => setMedicalConditions(medicalConditions.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 18, marginLeft: 2 }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            {healthErrors.conditions && <Text style={styles.errorText}>{healthErrors.conditions}</Text>}

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.buttonSecondary, loading && { opacity: 0.7 }]}
                onPress={() => setRegisterStep(0)}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { flex: 1, marginLeft: 8 }, loading && { opacity: 0.7 }]}
                onPress={() => {
                  if (validatePersonalStep()) handleRegister();
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        <Pressable
          onPress={() => {
            setIsRegister(r => !r);
            setRegisterStep(0);
          }}
        >
          <Text style={styles.link}>
            {isRegister
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: 320,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'space-between',
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    color: colors.text,
    fontSize: 12,
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text,
  },
  stepLabelActive: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.lg,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    marginRight: 8,
  },
  buttonSecondaryText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText: {
  color: colors.card,
    fontWeight: 'bold',
    fontSize: 18,
  },
  link: {
    color: colors.primary,
    marginTop: spacing.lg,
    textDecorationLine: 'underline',
  },
});
