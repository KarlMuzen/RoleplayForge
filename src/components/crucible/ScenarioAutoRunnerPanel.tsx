import React from 'react';
import type { StoredCard, ConnectionProfile } from '../../db';
import type { useCrucibleRun } from './useCrucibleRun';
import { ScenarioPicker } from './ScenarioPicker';
import { TranscriptViewer } from './TranscriptViewer';

export interface ScenarioAutoRunnerPanelProps {
  crucibleRun: ReturnType<typeof useCrucibleRun>;
  cards: StoredCard[];
  activeCardUuid: string | null;
  activeCardRecord?: StoredCard | null;
  characterName: string;
  profiles: ConnectionProfile[];
}

export const ScenarioAutoRunnerPanel: React.FC<ScenarioAutoRunnerPanelProps> = ({
  crucibleRun,
  cards,
  activeCardUuid,
  activeCardRecord,
  characterName,
  profiles,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <ScenarioPicker
        groupMemberUuids={crucibleRun.groupMemberUuids}
        toggleGroupMember={crucibleRun.toggleGroupMember}
        cards={cards}
        activeCardUuid={activeCardUuid}
        isSimulatingScenario={crucibleRun.isSimulatingScenario}
        handleRunSimulation={crucibleRun.handleRunSimulation}
        handleStopSimulation={crucibleRun.handleStopSimulation}
        scenarioTurnCount={crucibleRun.scenarioTurnCount}
        setScenarioTurnCount={crucibleRun.setScenarioTurnCount}
        scriptedTemplate={crucibleRun.scriptedTemplate}
        handleAddScriptEntry={crucibleRun.handleAddScriptEntry}
        handleRemoveScriptEntry={crucibleRun.handleRemoveScriptEntry}
        currentSimTurn={crucibleRun.currentSimTurn}
        selectedPersona="scripted"
      />

      <TranscriptViewer
        simulatedTranscript={crucibleRun.simulatedTranscript}
        isSimulatingScenario={crucibleRun.isSimulatingScenario}
        selectedPersona="scripted"
        characterName={characterName}
        simSpeakerTyping={crucibleRun.simSpeakerTyping}
        onClearTranscript={() => crucibleRun.simulatedTranscript.length > 0 && crucibleRun.handleStopSimulation()}
        scenarioHistory={
          (activeCardRecord?.scenarios as {
            id: string;
            name: string;
            persona: string;
            turnCount: number;
            lastRunResult?: Record<
              string,
              {
                error?: string;
                transcript?: { role: string; text: string; speakerUuid?: string; speakerName?: string }[];
                scores?: {
                  agendaHeld: boolean;
                  tellConsistency: number;
                  loreDelivery: number;
                  driftOnsetTurn: number | null;
                  reasoning: string;
                };
              }
            >;
          }[]) || []
        }
        profiles={profiles}
        activeCardUuid={activeCardUuid || activeCardRecord?.uuid}
      />
    </div>
  );
};
