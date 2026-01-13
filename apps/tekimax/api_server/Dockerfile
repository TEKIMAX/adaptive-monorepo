FROM rust:1-bookworm as builder
WORKDIR /usr/src

# Copy the workspace (api_server + local path deps) into the build context
COPY api_server ./api_server
COPY ollama_proxy ./ollama_proxy

RUN apt-get update && apt-get install -y pkg-config libssl-dev ca-certificates && \
    cd api_server && \
    cargo build --release --manifest-path Cargo.toml

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /usr/src/api_server/target/release/api_server ./api_server
RUN chmod +x ./api_server
EXPOSE 3000
ENV RUST_LOG=info
CMD ["./api_server"]
