import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { colors, spacing, type } from '../theme';

export default function Login({ navigation, onLogin }: { navigation?: any; onLogin?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medications, setMedications] = useState('');
  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceGroup, setInsuranceGroup] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  // Emergency contact
  const [emgName, setEmgName] = useState('');
  const [emgRelationship, setEmgRelationship] = useState('');
  const [emgPhone, setEmgPhone] = useState('');
  const [emgIsICE, setEmgIsICE] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        // Password requirements: min 8 chars, at least 1 number, 1 letter
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
          Alert.alert('Password Requirements', 'Password must be at least 8 characters and include both letters and numbers.');
          setLoading(false);
          return;
        }
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          // Create user profile in Firestore
          const user = cred.user;
          const profile = {
            id: user.uid,
            name,
            email,
            phone,
            date_of_birth: dateOfBirth,
            blood_type: bloodType,
            allergies: allergies.split(',').map(a => a.trim()).filter(Boolean),
            medical_conditions: medicalConditions.split(',').map(a => a.trim()).filter(Boolean),
            medications: medications.split(',').map(a => a.trim()).filter(Boolean),
            insurance_info: {
              provider: insuranceProvider,
              policyNumber: insurancePolicy,
              groupNumber: insuranceGroup,
              expiryDate: insuranceExpiry,
            },
            emergency_contacts: [
              {
                id: '1',
                name: emgName,
                relationship: emgRelationship,
                phone: emgPhone,
                isICE: emgIsICE,
              },
            ],
          };
          await setDoc(doc(db, 'profiles', user.uid), profile);
          Alert.alert('Account created', 'You can now log in.');
          setIsRegister(false);
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            Alert.alert('Registration Error', 'This email is already in use. Please use a different email or log in.');
          } else if (e.code === 'auth/invalid-email') {
            Alert.alert('Registration Error', 'Invalid email address.');
          } else {
            Alert.alert('Registration Error', e.message);
          }
        }
      } else {
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
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image source={require('../assets/logo.png')} style={{ width: 100, height: 100, resizeMode: 'contain', marginBottom: 8 }} />
          <Text style={[type.h1, { marginBottom: 8 }]}>{isRegister ? 'Create Account' : 'Login'}</Text>
        </View>
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
        {isRegister && (
          <>
            <TextInput style={[styles.input, focusedInput === 'name' && styles.inputFocused]} placeholder="Full Name" value={name} onChangeText={setName} onFocus={() => setFocusedInput('name')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'phone' && styles.inputFocused]} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" onFocus={() => setFocusedInput('phone')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'dob' && styles.inputFocused]} placeholder="Date of Birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} onFocus={() => setFocusedInput('dob')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'blood' && styles.inputFocused]} placeholder="Blood Type (optional)" value={bloodType} onChangeText={setBloodType} onFocus={() => setFocusedInput('blood')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'allergies' && styles.inputFocused]} placeholder="Allergies (comma separated)" value={allergies} onChangeText={setAllergies} onFocus={() => setFocusedInput('allergies')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'medcond' && styles.inputFocused]} placeholder="Medical Conditions (comma separated)" value={medicalConditions} onChangeText={setMedicalConditions} onFocus={() => setFocusedInput('medcond')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'medications' && styles.inputFocused]} placeholder="Medications (comma separated)" value={medications} onChangeText={setMedications} onFocus={() => setFocusedInput('medications')} onBlur={() => setFocusedInput(null)} />
            <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Insurance Info</Text>
            <TextInput style={[styles.input, focusedInput === 'insProvider' && styles.inputFocused]} placeholder="Provider" value={insuranceProvider} onChangeText={setInsuranceProvider} onFocus={() => setFocusedInput('insProvider')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'insPolicy' && styles.inputFocused]} placeholder="Policy Number" value={insurancePolicy} onChangeText={setInsurancePolicy} onFocus={() => setFocusedInput('insPolicy')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'insGroup' && styles.inputFocused]} placeholder="Group Number" value={insuranceGroup} onChangeText={setInsuranceGroup} onFocus={() => setFocusedInput('insGroup')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'insExpiry' && styles.inputFocused]} placeholder="Expiry Date (YYYY-MM-DD)" value={insuranceExpiry} onChangeText={setInsuranceExpiry} onFocus={() => setFocusedInput('insExpiry')} onBlur={() => setFocusedInput(null)} />
            <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Emergency Contact</Text>
            <TextInput style={[styles.input, focusedInput === 'emgName' && styles.inputFocused]} placeholder="Name" value={emgName} onChangeText={setEmgName} onFocus={() => setFocusedInput('emgName')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'emgRel' && styles.inputFocused]} placeholder="Relationship" value={emgRelationship} onChangeText={setEmgRelationship} onFocus={() => setFocusedInput('emgRel')} onBlur={() => setFocusedInput(null)} />
            <TextInput style={[styles.input, focusedInput === 'emgPhone' && styles.inputFocused]} placeholder="Phone" value={emgPhone} onChangeText={setEmgPhone} keyboardType="phone-pad" onFocus={() => setFocusedInput('emgPhone')} onBlur={() => setFocusedInput(null)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>Is ICE (In Case of Emergency)?</Text>
              <Pressable onPress={() => setEmgIsICE(v => !v)} style={{ marginLeft: 8, padding: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: emgIsICE ? colors.primary : colors.card }}>
                <Text style={{ color: emgIsICE ? '#fff' : colors.text }}>{emgIsICE ? 'Yes' : 'No'}</Text>
              </Pressable>
            </View>
          </>
        )}
        <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setIsRegister(r => !r)}>
          <Text style={styles.link}>{isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}</Text>
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
