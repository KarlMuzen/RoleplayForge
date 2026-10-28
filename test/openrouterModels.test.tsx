// @vitest-environment jsdom
import '../test/setup';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  fetchOpenRouterModels,
  formatOpenRouterPricing,
  clearOpenRouterModelsCache,
} from '../src/services/openrouterModels';
import { OpenRouterModelPicker } from '../src/components/OpenRouterModelPicker';

describe('openrouterModels service', () => {
  beforeEach(() => {
    clearOpenRouterModelsCache();
    vi.restoreAllMocks();
  });

  it('formats openrouter pricing accurately', () => {
    expect(formatOpenRouterPricing(0, 0)).toBe('Free');
    expect(formatOpenRouterPricing(undefined, undefined)).toBe('Pricing unknown');
    expect(formatOpenRouterPricing(0.002, 0.010)).toBe('In: $0.002 · Out: $0.01 / 1K');
    expect(formatOpenRouterPricing(0.00045, 0.0032)).toBe('In: $0.00045 · Out: $0.0032 / 1K');
  });

  it('fetches and caches models from OpenRouter API', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'deepseek/deepseek-r1',
          name: 'DeepSeek: R1',
          context_length: 65536,
          pricing: {
            prompt: '0.00000055',
            completion: '0.00000219',
          },
        },
        {
          id: 'cognitivecomputations/dolphin-mistral-24b',
          name: 'Venice: Dolphin Mistral',
          context_length: 32768,
          pricing: {
            prompt: '0.0000002',
            completion: '0.0000009',
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as unknown as Response);

    const models = await fetchOpenRouterModels(true);
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('deepseek/deepseek-r1');
    expect(models[0].name).toBe('DeepSeek: R1');
    expect(models[0].promptPricePer1K).toBeCloseTo(0.00055, 6);
    expect(models[0].completionPricePer1K).toBeCloseTo(0.00219, 6);

    // Verify cache was populated in localStorage
    const cached = localStorage.getItem('openrouter_models_cache_v1');
    expect(cached).toBeTruthy();

    // Subsequent call should use cache without invoking fetch again
    const cachedModels = await fetchOpenRouterModels(false);
    expect(cachedModels).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('OpenRouterModelPicker component', () => {
  beforeEach(() => {
    clearOpenRouterModelsCache();
    vi.restoreAllMocks();
  });

  it('renders searchable combobox and filters models by search query', async () => {
    const mockData = [
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek: R1',
        contextLength: 65536,
        promptPricePer1K: 0.00055,
        completionPricePer1K: 0.00219,
      },
      {
        id: 'cognitivecomputations/dolphin-mistral-24b',
        name: 'Venice: Dolphin Mistral',
        contextLength: 32768,
        promptPricePer1K: 0.0002,
        completionPricePer1K: 0.0009,
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: mockData[0].id,
            name: mockData[0].name,
            context_length: mockData[0].contextLength,
            pricing: { prompt: '0.00000055', completion: '0.00000219' },
          },
          {
            id: mockData[1].id,
            name: mockData[1].name,
            context_length: mockData[1].contextLength,
            pricing: { prompt: '0.0000002', completion: '0.0000009' },
          },
        ],
      }),
    } as unknown as Response);

    const handleChange = vi.fn();
    render(
      <OpenRouterModelPicker
        value="deepseek/deepseek-r1"
        onChange={handleChange}
      />
    );

    // Initial value display
    expect(await screen.findByText('DeepSeek: R1')).toBeInTheDocument();

    // Open dropdown by clicking trigger container
    const trigger = screen.getByText('DeepSeek: R1');
    fireEvent.click(trigger);

    // Search for dolphin
    const searchInput = screen.getByPlaceholderText(/Filter by name or ID/i);
    fireEvent.change(searchInput, { target: { value: 'dolphin' } });

    // Expect dolphin option to be shown
    const dolphinOption = await screen.findByText('Venice: Dolphin Mistral');
    expect(dolphinOption).toBeInTheDocument();

    // Click dolphin option
    fireEvent.click(dolphinOption);
    expect(handleChange).toHaveBeenCalledWith('cognitivecomputations/dolphin-mistral-24b');
  });

  it('allows switching to manual input mode and entering custom model string', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as unknown as Response);

    const handleChange = vi.fn();
    render(
      <OpenRouterModelPicker
        value="custom/unreleased-model"
        onChange={handleChange}
      />
    );

    // Click "Enter model ID manually"
    const manualBtn = await screen.findByText(/Enter model ID manually/i);
    fireEvent.click(manualBtn);

    // Input is now a standard text input
    const input = screen.getByDisplayValue('custom/unreleased-model');
    fireEvent.change(input, { target: { value: 'custom/new-model-v2' } });
    expect(handleChange).toHaveBeenCalledWith('custom/new-model-v2');

    // Switch back to model list
    const listBtn = screen.getByText(/Select from model list/i);
    fireEvent.click(listBtn);
    expect(screen.getByText(/Model Selection \(OpenRouter\)/i)).toBeInTheDocument();
  });

  it('handles fetch failure gracefully and shows fallback text input with note', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network unavailable'));

    const handleChange = vi.fn();
    render(
      <OpenRouterModelPicker
        value="fallback-model"
        onChange={handleChange}
      />
    );

    expect(await screen.findByText(/Couldn't load model list — enter manually/i)).toBeInTheDocument();
    const input = screen.getByDisplayValue('fallback-model');
    fireEvent.change(input, { target: { value: 'my-manual-model' } });
    expect(handleChange).toHaveBeenCalledWith('my-manual-model');
  });
});

