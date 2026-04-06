import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { Fonts, Spacing, LetterSpacing } from '../src/constants/theme';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    if (isSignUp) {
      if (!username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, username.trim(), displayName.trim());
      if (err) setError(err);
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    }
    setLoading(false);
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>☕</Text>
          <Text style={[styles.title, { color: colors.text }]}>CoffeeClub</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
                placeholder="Display name"
                placeholderTextColor={colors.textFaint}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
                placeholder="Username"
                placeholderTextColor={colors.textFaint}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
            placeholder="Password (6+ characters)"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          <Pressable
            onPress={canSubmit && !loading ? handleSubmit : undefined}
            disabled={!canSubmit || loading}
          >
            <LinearGradient
              colors={canSubmit ? ['#D4A050', '#E8C97A', '#D4A050'] : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(null); }} style={styles.toggle}>
            <Text style={[styles.toggleText, { color: colors.accent }]}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.gutter,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    letterSpacing: LetterSpacing.display,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    gap: 14,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#D45A28',
    textAlign: 'center',
  },
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
});
