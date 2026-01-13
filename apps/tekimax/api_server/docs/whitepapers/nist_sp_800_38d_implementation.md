# NIST SP 800-38D Implementation Specification
**Algorithm**: AES-256-GCM (Galois/Counter Mode)
**Compliance**: NIST Special Publication 800-38D

## 1. Overview
This document details the cryptographic implementation of the Sovereign Crypto Service (`/v1/crypto/*`). The service provides stateless encryption and decryption primitives compliant with **NIST SP 800-38D** guidelines for Block Cipher Modes of Operation.

The implementation utilizes the Rust `aes-gcm` crate (Pure Rust implementation of AES-GCM) which relies on the `aes` crate for the underlying block cipher and `ghash` for the universal hash function.

## 2. Cryptographic Parameters

### 2.1 Block Cipher
*   **Algorithm**: AES (Advanced Encryption Standard) as defined in FIPS 197.
*   **Key Size**: 256 bits (32 bytes).
*   **Block Size**: 128 bits (16 bytes).

### 2.2 Mode of Operation
*   **Mode**: GCM (Galois/Counter Mode).
*   **Authenticated Encryption**: Yes (AEAD). Provides confidentiality and data origin authentication.

### 2.3 Initialization Vector (IV/Nonce)
*   **Size**: 96 bits (12 bytes).
*   **Generation**: Randomly generated using **CSPRNG** (Cryptographically Secure Pseudo-Random Number Generator) via `OsRng`.
*   **Uniqueness**: Per-message uniqueness is probabilistic. With a 96-bit random nonce, the probability of collision is negligible for standard operational volumes ($2^{-32}$ collision probability after $2^48$ messages).

### 2.4 Authentication Tag
*   **Size**: 128 bits (16 bytes).
*   **Handling**: The authentication tag is appended to the ciphertext output.
*   **Verification**: Tag is verified constant-time during decryption before any plaintext is released. If verification fails, the operation returns a generic error (`Decryption failed`) to prevent padding oracle or timing attacks.

## 3. Implementation Details (`src/handlers/crypto.rs`)

### 3.1 Key Generation (`/v1/crypto/key`)
*   **Source**: `Aes256Gcm::generate_key(OsRng)`
*   **Entropy**: Operating System's CSPRNG (e.g., `/dev/urandom` on Unix, `CryptGenRandom` on Windows).
*   **Format**: Returned as Base64-encoded string.

### 3.2 Encryption (`/v1/crypto/encrypt`)
1.  **Input**: Base64 Key (32 bytes), Plaintext (String).
2.  **Nonce Construction**: `OsRng` generates 12 random bytes.
3.  **Operation**: `cipher.encrypt(nonce, plaintext)`.
4.  **Output**:
    *   `nonce_base64`: 12 bytes (Base64 encoded).
    *   `ciphertext_base64`: Encrypted data + 16-byte Auth Tag (Base64 encoded).

### 3.3 Decryption (`/v1/crypto/decrypt`)
1.  **Input**: Base64 Key, Base64 Nonce (12 bytes), Base64 Ciphertext.
2.  **Operation**: `cipher.decrypt(nonce, ciphertext)`.
3.  **Validation**: The authentication tag (last 16 bytes of ciphertext) is verified against the derived GHASH.
4.  **Output**: UTF-8 Plaintext if successful, or Error.

## 4. Security Considerations
*   **Statelessness**: The server retains **zero knowledge** of keys or data. Key management is the sole responsibility of the client.
*   **Max Usage**: Per NIST SP 800-38D, a single key should not be used to encrypt more than $2^{32}$ messages when using random 96-bit nonces to avoid collision risks.
*   **Zeroisation**: The implementation utilizes the `zeroize` crate with `ZeroizeOnDrop` traits. Sensitive key bytes (`SensitiveKey` struct) are stored in memory only for the duration of the cryptographic operation and are automatically overwritten with zeros (wiped) immediately when they drop out of scope. This prevents residual keys from lingering in heap or stack memory.
