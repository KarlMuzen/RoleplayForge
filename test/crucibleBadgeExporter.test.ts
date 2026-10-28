// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderTrustBadgeCanvasBytes, type CrucibleTrustReportData } from '../src/utils/crucibleBadgeExporter';

describe('crucibleBadgeExporter', () => {
  beforeEach(() => {
    const mockContext = {
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      roundRect: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
      type = 'image/png'
    ) {
      // Return a valid PNG header blob for testing
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const blob = new Blob([pngHeader], { type });
      setTimeout(() => callback(blob), 0);
    };
  });

  it('renders non-empty PNG bytes for a typical trust report object', async () => {
    const report: CrucibleTrustReportData = {
      characterName: 'Aria of the Veil',
      passRate: 100,
      totalPassed: 6,
      totalTested: 6,
      driftString: 'No drift in 10 turns',
      modelString: 'gemini-2.5-flash + claude-3-5-sonnet',
      totalCardTokens: 2150,
      targetBudget: 4096,
    };

    const bytes = await renderTrustBadgeCanvasBytes(report);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(8);

    // Verify PNG magic signature
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50); // P
    expect(bytes[2]).toBe(0x4e); // N
    expect(bytes[3]).toBe(0x47); // G
  });

  it('handles edge cases gracefully without throwing (0 probes, empty fields, null passRate)', async () => {
    const edgeCases: CrucibleTrustReportData[] = [
      {
        characterName: '',
        passRate: null,
        totalPassed: 0,
        totalTested: 0,
        driftString: '',
        modelString: '',
        totalCardTokens: 0,
        targetBudget: 4096,
      },
      {
        characterName: 'Untitled',
        passRate: 0,
        totalPassed: 0,
        totalTested: 5,
        driftString: 'Drift detected on turn 1',
        modelString: 'None',
        totalCardTokens: 5200,
        targetBudget: 4096,
      },
      {
        characterName: 'A'.repeat(200), // very long name
        passRate: 50,
        totalPassed: 2,
        totalTested: 4,
        driftString: 'Not tested / Drift detected',
        modelString: 'model-a + model-b + model-c + model-d + model-e',
        totalCardTokens: 1000,
        targetBudget: 2048,
      },
    ];

    for (const report of edgeCases) {
      const bytes = await renderTrustBadgeCanvasBytes(report);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    }
  });
});
