# Tekimax Architecture & Principles

This document outlines the core architectural principles and building blocks of the Tekimax platform. It serves as a guide for maintaining high standards in code quality, system reliability, and developer experience.

## 1. Core Philosophy

Our architecture is driven by a commitment to **robustness**, **clarity**, and **safety**. We do not compromise on these values. Every line of code should contribute to a system that is predictable, easy to reason about, and resilient to errors.

## 2. Architectural Building Blocks

The Tekimax platform is composed of several key building blocks that work in harmony:

-   **Frontend**: Built with **React** and **Vite**, utilizing **TypeScript** for strict type checking. It leverages **Tailwind CSS** for a utility-first styling approach and **Zustand** for state management.
-   **Backend Data & Logic**: Powered by **Convex**, providing a serverless backend that offers real-time data synchronization, ACID transactions, and end-to-end type safety.
-   **High-Performance Services**: Critical services and metering agents are implemented in **Rust** (e.g., using Axum) for maximum performance, memory safety, and low latency.
-   **Infrastructure**: Deployed on **Cloudflare** (Pages, Workers, R2) and **Fly.io** for a globally distributed, low-latency edge network.

## 3. Key Principles

### 3.1. Good Abstractions
We value abstractions that simplify complexity without obscuring reality.
-   **Intent-Revealing Interfaces**: APIs and components should clearly communicate *what* they do, hiding the *how*.
-   **Leak-Proof Abstractions**: avoid leaking implementation details to the consumer. If a component changes its internal logic, consuming code should not need to change.
-   **Simplicity over Cleverness**: clear, readable code is preferred over complex "one-liners".

### 3.2. Uncompromising Type Safety
"Data should never be in the wrong place."
-   **End-to-End Typing**: We enforce type safety across the entire stack. From the database schema in Convex to the Rust services and the React frontend, data structures are strictly defined.
-   **Compile-Time Verification**: We rely on the compiler (TypeScript/Rust) to catch errors before they reach runtime. `any` is strictly forbidden unless absolutely necessary and contained.
-   **Contract-First Development**: Define types and interfaces before implementing logic.

### 3.3. Modularity and Information Hiding
-   **Encapsulation**: Modules and components should expose only what is necessary (the "surface area"). implementation details, internal state, and helper functions should remain private.
-   **Decoupling**: Services should be loosely coupled. Changes in one module should have minimal impact on others.
-   **Single Responsibility**: Each function, component, or service should have one clear purpose.

### 3.4. End-to-End Consistency
-   **State Management**: We ensure state consistency across the client and server.
    -   *Server State*: Managed by Convex, serving as the single source of truth.
    -   *Client State*: Managed by Zustand or React Query, kept in sync with the server via real-time subscriptions.
-   **Transactions & Concurrency**:
    -   All state mutations must be **atomic**. We use transactional functions (e.g., Convex mutations) to ensure that operations either complete fully or fail safely.
    -   **Race Condition Prevention**: We design systems to handle concurrent user actions gracefully, utilizing optimistic updates where appropriate but always verifying against the server's transactional authority.

## 4. Development Standards
-   **Code formatting**: Prettier is non-negotiable.
-   **Linting**: strict ESLint rules to enforce best practices.
-   **Testing**: Critical paths must be tested.

---
*This architecture document is a living guide. As the system evolves, so too should our understanding and documentation of these principles.*
