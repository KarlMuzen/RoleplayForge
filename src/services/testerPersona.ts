export type TesterPersona = 'scripted';

export interface PersonaConfig {
  id: TesterPersona;
  name: string;
  description: string;
  systemPrompt: string;
}

export const TESTER_PERSONAS: Record<TesterPersona, PersonaConfig> = {
  scripted: {
    id: 'scripted',
    name: 'Scripted Probes',
    description: 'Author-defined, turn-indexed injections for deterministic regression testing.',
    systemPrompt: '',
  }
};

