# Multi-stage build for Sovereign CA
FROM rust:1-bookworm as builder

WORKDIR /usr/src/sovereign-ca
COPY . .
RUN cargo build --release

# Final image
FROM debian:bookworm-slim

# Install CFSSL and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssl_1.6.4_linux_amd64 -o /usr/local/bin/cfssl \
    && curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.4/cfssljson_1.6.4_linux_amd64 -o /usr/local/bin/cfssljson \
    && chmod +x /usr/local/bin/cfssl /usr/local/bin/cfssljson \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary and assets
COPY --from=builder /usr/src/sovereign-ca/target/release/sovereign-ca .
COPY assets ./assets
COPY *.json .

# Initial PKI generation
RUN mkdir -p pki && \
    cfssl gencert -initca ca-csr.json | cfssljson -bare pki/ca

EXPOSE 11440

CMD ["./sovereign-ca"]
