"use node";

// Re-export core actions
export * from "./aiModules/coreActions";

// Re-export domain-specific actions
export * from "./aiModules/marketActions";
export * from "./aiModules/financialActions";
export * from "./aiModules/customerActions";
export * from "./aiModules/pitchDeckActions";
export * from "./aiModules/adaptiveActions";
export * from "./aiModules/documentActions";
export * from "./aiModules/reportActions";
export * from "./aiModules/analysisActions";

// Re-export internal services if needed
export { callOllama, callOllamaInternal } from "./ollamaService";
