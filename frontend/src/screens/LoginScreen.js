import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, TextInput, Button, Paragraph } from 'react-native-paper';
import { api, authFetch, setAuthToken } from '../config/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !username)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch(api.register, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Registration failed');
        }
      }

      const loginRes = await fetch(api.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const err = await loginRes.json();
        throw new Error(err.detail || 'Login failed');
      }

      const { access_token } = await loginRes.json();
      await setAuthToken(access_token);
      navigation.navigate('Home');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Title style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Title>

        {isRegister && (
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
          />
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          {isRegister ? 'Register' : 'Login'}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsRegister(!isRegister)}
          style={styles.toggle}
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Home')}
          style={styles.skip}
        >
          Skip for now
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  form: { padding: 20, marginTop: 40 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 16 },
  button: { marginTop: 8, paddingVertical: 4 },
  toggle: { marginTop: 16 },
  skip: { marginTop: 8 },
});

export default LoginScreen;