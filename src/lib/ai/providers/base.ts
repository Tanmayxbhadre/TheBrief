import {
  AIProvider,
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
} from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  abstract isAvailable(): boolean;
  abstract generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse>;
  abstract improve(request: ImproveRequest): Promise<ImproveResponse>;

  /**
   * Helper to parse JSON from AI model response safely (handles markdown code blocks like ```json ... ```)
   */
  protected parseJsonResponse<T>(rawText: string): T {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(clean) as T;
    } catch (err) {
      throw new Error(`Failed to parse AI structured response as JSON: ${(err as Error).message}\nRaw: ${rawText.slice(0, 200)}`);
    }
  }
}
