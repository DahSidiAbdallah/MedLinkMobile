import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
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

  // Inline error state for login fields
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  // Inline error state for register fields (account step)
  const [registerAccountErrors, setRegisterAccountErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

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
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return false;
    }
    if (phone && !/^\d{7,}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return false;
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert('Invalid Date', 'Date of Birth must be in YYYY-MM-DD format.');
      return false;
    }
    return true;
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
            <Pressable
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
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
              style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
            <TextInput
              style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              onFocus={() => setFocusedInput('phone')}
              onBlur={() => setFocusedInput(null)}
            />
            <TextInput
              style={[styles.input, focusedInput === 'dob' && styles.inputFocused]}
              placeholder="Date of Birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              onFocus={() => setFocusedInput('dob')}
              onBlur={() => setFocusedInput(null)}
            />
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
                onPress={handleRegister}
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  link: {
    color: colors.primary,
    marginTop: spacing.lg,
    textDecorationLine: 'underline',
  },
});
