jest.mock('@expo/vector-icons',()=>({Ionicons:()=>null}));
jest.mock('expo-sqlite',()=>({openDatabaseAsync:jest.fn()}));
jest.mock('expo-crypto',()=>({randomUUID:jest.fn(()=>globalThis.crypto.randomUUID()),digestStringAsync:jest.fn(),CryptoDigestAlgorithm:{SHA256:'SHA-256'}}));
