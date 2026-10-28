// @vitest-environment jsdom
import '../test/setup';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionProfilesSection } from '../src/components/settings/ConnectionProfilesSection';
import { useDialogStore } from '../src/store/useDialogStore';
import type { ConnectionProfile } from '../src/db';

const testProfile: ConnectionProfile = {
  uuid: 'prof-1',
  name: 'Primary Gemini',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: 'test-key',
  temperature: 0.7,
  maxTokens: 2048,
  isDefault: true,
};

function renderSection(overrides: Partial<React.ComponentProps<typeof ConnectionProfilesSection>> = {}) {
  const deleteProfile = vi.fn().mockResolvedValue(undefined);
  const saveProfile = vi.fn().mockResolvedValue(undefined);
  const setActiveProfileUuid = vi.fn();

  render(
    <ConnectionProfilesSection
      profiles={[testProfile]}
      activeProfileUuid="prof-1"
      setActiveProfileUuid={setActiveProfileUuid}
      saveProfile={saveProfile}
      deleteProfile={deleteProfile}
      {...overrides}
    />
  );

  return { deleteProfile, saveProfile, setActiveProfileUuid };
}

describe('ConnectionProfilesSection - delete confirmation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT delete the profile until the user confirms the dialog', async () => {
    const showConfirmSpy = vi.spyOn(useDialogStore.getState(), 'showConfirm').mockResolvedValue(true);
    const { deleteProfile } = renderSection();

    fireEvent.click(screen.getByLabelText('Delete profile Primary Gemini'));

    // Confirmation must be asked before deletion happens.
    expect(showConfirmSpy).toHaveBeenCalledTimes(1);
    expect(showConfirmSpy.mock.calls[0][0]).toMatch(/primary gemini/i);

    await waitFor(() => expect(deleteProfile).toHaveBeenCalledWith('prof-1'));
  });

  it('does NOT call deleteProfile if the user cancels the confirmation dialog', async () => {
    vi.spyOn(useDialogStore.getState(), 'showConfirm').mockResolvedValue(false);
    const { deleteProfile } = renderSection();

    fireEvent.click(screen.getByLabelText('Delete profile Primary Gemini'));

    await waitFor(() => expect(useDialogStore.getState().showConfirm).toHaveBeenCalled());
    expect(deleteProfile).not.toHaveBeenCalled();
  });
});
