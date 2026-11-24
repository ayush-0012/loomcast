import * as SecureStore from 'expo-secure-store';

import { createCredentialStorage } from './credential-storage';

export const credentialStorage = createCredentialStorage(SecureStore);
