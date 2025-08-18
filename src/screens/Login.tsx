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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const validateAccountStep = () => {
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert(
        'Password Requirements',
        'Password must be at least 8 characters and include both letters and numbers.'
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    return true;
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
        Alert.alert('Login Error', 'No user found with this email.');
      } else if (e.code === 'auth/wrong-password') {
        Alert.alert('Login Error', 'Incorrect password.');
      } else if (e.code === 'auth/invalid-email') {
        Alert.alert('Login Error', 'Invalid email address.');
      } else {
        Alert.alert('Login Error', e.message);
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
              style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
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
              style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TextInput
              style={[styles.input, focusedInput === 'confirm' && styles.inputFocused]}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedInput('confirm')}
              onBlur={() => setFocusedInput(null)}
            />
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
