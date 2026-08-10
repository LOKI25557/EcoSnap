import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const AuthScreen = () => {
  const { login, register, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setError('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login to EcoSnap' : 'Register for EcoSnap'}</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLogin && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="small" color="#0000ff" style={styles.spinner} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title={isLogin ? 'Login' : 'Register'} onPress={handleSubmit} />
        </View>
      )}

      <View style={styles.switchContainer}>
        <Button
          title={isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          onPress={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          color="#8e8e93"
        />
      </View>

      {isLogin && (
        <View style={styles.resetContainer}>
          <Button
            title="Forgot Password?"
            onPress={handlePasswordReset}
            color="#8e8e93"
          />
        </View>
      )}
    </View>
  );
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
  buttonContainer: { marginTop: 15 },
  spinner: { marginVertical: 15 },
  switchContainer: { marginTop: 15 },
  resetContainer: { marginTop: 10 },
});

export default AuthNavigator;
