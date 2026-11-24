import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { credentialStorage } from '../../adapters/secure-credentials';
import { saveOAuthApp } from './save-oauth-app';

export default function CredentialsScreen() {
  const [platform, setPlatform] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const clientIdInput = useRef<TextInputInstance>(null);
  const secretInput = useRef<TextInputInstance>(null);
  const savingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const VisibilityIcon = showSecret ? EyeOff : Eye;

  function clearStatus() {
    setError('');
    setSuccess('');
  }

  async function save() {
    if (savingRef.current || isWeb) return;
    clearStatus();
    if (!/^[a-z0-9_-]+$/.test(platform.trim().toLowerCase())) {
      setError('Enter a platform, such as youtube, instagram, or x.');
      return;
    }
    if (!clientId.trim()) {
      setError('Enter your client ID.');
      clientIdInput.current?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await saveOAuthApp(credentialStorage, { platform, clientId, clientSecret });
      setPlatform('');
      setClientId('');
      setClientSecret('');
      setShowSecret(false);
      setSuccess('Credentials saved on this device. Account authorization is the next step and is not available yet.');
    } catch {
      // Native errors may contain sensitive values; keep them out of the UI.
      setError('Could not save credentials. Your entries are still here. Please try again on the mobile app.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={styles.content}>
          <View style={styles.intro}>
            <Text role="heading" style={styles.title}>Add a platform</Text>
            <Text style={styles.description}>Save your app credentials before connecting your account.</Text>
          </View>

          <View style={styles.field}>
            <Text nativeID="platform-label" style={styles.label}>Platform</Text>
            <TextInput
              accessibilityLabel="Platform"
              accessibilityLabelledBy="platform-label"
              style={styles.input}
              placeholder="e.g. youtube"
              placeholderTextColor="#697586"
              value={platform}
              onChangeText={(value) => { setPlatform(value); clearStatus(); }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              returnKeyType="next"
              onSubmitEditing={() => clientIdInput.current?.focus()}
            />
            <Text style={styles.helper}>Use a name like youtube, instagram, or x.</Text>
          </View>

          <View style={styles.field}>
            <Text nativeID="client-id-label" style={styles.label}>Client ID</Text>
            <TextInput
              ref={clientIdInput}
              accessibilityLabel="Client ID"
              accessibilityLabelledBy="client-id-label"
              style={styles.input}
              placeholder="Paste your client ID"
              placeholderTextColor="#697586"
              value={clientId}
              onChangeText={(value) => { setClientId(value); clearStatus(); }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              returnKeyType="next"
              onSubmitEditing={() => secretInput.current?.focus()}
            />
          </View>

          <View style={styles.field}>
            <Text nativeID="client-secret-label" style={styles.label}>Client secret (optional)</Text>
            <View style={styles.secretRow}>
              <TextInput
                ref={secretInput}
                accessibilityLabel="Client secret, optional"
                accessibilityLabelledBy="client-secret-label"
                style={[styles.input, styles.secretInput]}
                placeholder="Paste your client secret"
                placeholderTextColor="#697586"
                value={clientSecret}
                onChangeText={(value) => { setClientSecret(value); clearStatus(); }}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecret}
                editable={!saving}
                returnKeyType="done"
                onSubmitEditing={save}
              />
              <Pressable
                role="button"
                accessibilityLabel={showSecret ? 'Hide client secret' : 'Show client secret'}
                accessibilityState={{ disabled: saving }}
                onPress={() => setShowSecret(!showSecret)}
                disabled={saving}
                style={({ pressed }) => [styles.reveal, pressed && styles.revealPressed]}
              >
                <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden>
                  <VisibilityIcon size={20} strokeWidth={2} color="#475467" />
                </View>
              </Pressable>
            </View>
            <Text style={styles.helper}>Only add a secret if your platform requires one.</Text>
          </View>

          <Text style={styles.note}>Access and refresh tokens will be added after authorization. They are not needed for this step.</Text>

          {isWeb && (
            <Text style={styles.notice}>Web preview only. Open the Android or iOS app to save credentials securely.</Text>
          )}
          {!!error && <Text role="alert" accessibilityLiveRegion="polite" selectable style={styles.error}>{error}</Text>}
          {!!success && <Text accessibilityLiveRegion="polite" selectable style={styles.success}>{success}</Text>}

          <Pressable
            role="button"
            accessibilityLabel="Save credentials"
            accessibilityState={{ disabled: saving || isWeb, busy: saving }}
            disabled={saving || isWeb}
            onPress={save}
            style={({ pressed }) => [styles.saveButton, (saving || isWeb) && styles.disabled, pressed && styles.pressed]}
          >
            {saving && <ActivityIndicator color="#fff" />}
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save credentials'}</Text>
          </Pressable>
          <Text style={styles.helper}>Your credentials stay on this device.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 24 },
  intro: { gap: 10, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#101828' },
  description: { fontSize: 16, lineHeight: 24, color: '#475467' },
  field: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: '#101828' },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#98a2b3', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#101828', backgroundColor: '#fff' },
  helper: { fontSize: 14, lineHeight: 21, color: '#475467' },
  secretRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#98a2b3', borderRadius: 8 },
  secretInput: { flex: 1, minWidth: 0, borderWidth: 0, backgroundColor: 'transparent' },
  reveal: { minHeight: 48, minWidth: 48, marginRight: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  revealPressed: { backgroundColor: '#f2f4f7' },
  note: { padding: 16, borderRadius: 8, backgroundColor: '#f2f4f7', fontSize: 14, lineHeight: 22, color: '#344054' },
  notice: { fontSize: 14, lineHeight: 21, color: '#475467' },
  error: { fontSize: 14, lineHeight: 22, color: '#b42318' },
  success: { fontSize: 14, lineHeight: 22, color: '#067647' },
  saveButton: { minHeight: 52, padding: 14, borderRadius: 8, backgroundColor: '#175cd3', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  disabled: { backgroundColor: '#667085' },
  pressed: { opacity: 0.85 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
