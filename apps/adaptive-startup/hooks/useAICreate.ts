import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Centralized AI Creation Hooks
 * 
 * This file contains wrappers for AI-related actions that generate content 
 * and save it directly to the database.
 * 
 * Grouping these here helps distinguish between general AI queries and 
 * actions that modify project state.
 */

// Daily Memo & Strategy
/** Generates a daily memo and saves it to the database */
export const useAIGenerateDailyMemo = () => useAction(api.ai.generateDailyMemo);
/** Generates a comprehensive strategy summary for the startup */
export const useAIGenerateStartupSummary = () => useAction(api.ai.generateStartupSummary);

// Research & Analysis
/** Generates a deep market research report and saves it to the project data */
export const useAIGenerateMarketResearch = () => useAction(api.ai.generateMarketResearch);
/** Performs a competitor analysis and updates the project state */
export const useAIGenerateCompetitorAnalysis = () => useAction(api.ai.generateCompetitorAnalysis);
/** Analyzes the revenue model and provides strategic feedback */
export const useAIAnalyzeRevenueModel = () => useAction(api.ai.analyzeRevenueModel);

// Collateral Generation
/** Generates a full pitch deck based on project data */
export const useAIGeneratePitchDeck = () => useAction(api.ai.generatePitchDeck);

// Canvas & Strategy Suggestions
/** Suggests content for a specific Business Model Canvas section */
export const useAISuggestCanvasSection = () => useAction(api.ai.suggestCanvasSection);
