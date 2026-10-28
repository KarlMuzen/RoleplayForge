/**
 * High-Quality Character Card Cover & Logo Generator
 * Generates rich AI character portrait artwork or procedural digital art covers.
 */

export interface LogoOptions {
  name: string;
  description?: string;
  personality?: string;
  tags?: string[];
  style?: 'anime' | 'fantasy' | 'cyberpunk' | 'gothic' | 'cinematic' | 'emblem';
}

export async function generateCharacterLogoBytes(options: LogoOptions): Promise<Uint8Array> {
  const {
    name,
    description = '',
    personality = '',
    tags = [],
    style = 'anime',
  } = options;

  // Try AI image generation via Pollinations AI diffusion with timeout fallback
  if (style !== 'emblem') {
    try {
      const aiImageBytes = await fetchAICharacterArtwork(name, description, personality, tags, style);
      if (aiImageBytes && aiImageBytes.length > 0) {
        return aiImageBytes;
      }
    } catch (err) {
      console.warn('AI artwork generation network fallback:', err);
    }
  }

  // Fallback to rich procedural canvas digital art renderer
  return renderProceduralCanvasCover(options);
}

/**
 * Fetches real AI character portrait illustration and overlays character card framing
 */
async function fetchAICharacterArtwork(
  name: string,
  description: string,
  personality: string,
  tags: string[],
  style: 'anime' | 'fantasy' | 'cyberpunk' | 'gothic' | 'cinematic'
): Promise<Uint8Array | null> {
  const styleKeywordsMap: Record<string, string> = {
    anime: 'masterpiece anime character portrait cover art, high quality anime key visual, vivid colors, detailed face, character design',
    fantasy: 'epic high fantasy RPG character portrait illustration, detailed armor or mage robes, dramatic magical lighting, concept art',
    cyberpunk: 'futuristic cyberpunk character portrait, glowing neon ambient lighting, detailed sci-fi attire, hyperdetailed concept art',
    gothic: 'gothic dark fantasy character portrait, dramatic moonlight rim lighting, intricate dark vampire or demon attire',
    cinematic: 'cinematic digital art character portrait, studio lighting, highly detailed facial features, 8k resolution digital painting',
  };

  const stylePrompt = styleKeywordsMap[style] || styleKeywordsMap.anime;
  const tagStr = tags.slice(0, 5).join(', ');
  const descShort = (description + ' ' + personality).replace(/[^\w\s,]/gi, '').slice(0, 120);

  const fullPrompt = `${stylePrompt}, character portrait of ${name}, ${tagStr}, ${descShort}, centered composition, best quality, clear focus`;

  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=512&height=768&seed=${seed}&nologo=true`;

  // Fetch with 8 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    // Render onto 512x768 Card Cover Canvas with framing overlay
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw background artwork
    ctx.drawImage(imageBitmap, 0, 0, 512, 768);

    // Add subtle top and bottom vignette gradient overlays for high legibility
    const topGrd = ctx.createLinearGradient(0, 0, 0, 120);
    topGrd.addColorStop(0, 'rgba(10, 15, 30, 0.6)');
    topGrd.addColorStop(1, 'rgba(10, 15, 30, 0)');
    ctx.fillStyle = topGrd;
    ctx.fillRect(0, 0, 512, 120);

    const botGrd = ctx.createLinearGradient(0, 580, 0, 768);
    botGrd.addColorStop(0, 'rgba(10, 15, 30, 0)');
    botGrd.addColorStop(0.6, 'rgba(10, 15, 30, 0.7)');
    botGrd.addColorStop(1, 'rgba(5, 8, 18, 0.95)');
    ctx.fillStyle = botGrd;
    ctx.fillRect(0, 580, 512, 188);

    // Draw Character Name Card Banner at the bottom
    ctx.save();
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 12;

    const bannerY = 705;
    const bannerW = 440;
    const bannerH = 50;

    // Glassmorphism plaque
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(256 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayName = name.length > 26 ? name.slice(0, 24) + '...' : name;
    ctx.fillText(displayName.toUpperCase(), 256, bannerY);
    ctx.restore();

    // Convert Canvas to PNG Blob -> Uint8Array
    return new Promise((resolve) => {
      canvas.toBlob((b) => {
        if (!b) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(new Uint8Array(reader.result));
          } else {
            resolve(null);
          }
        };
        reader.readAsArrayBuffer(b);
      }, 'image/png');
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Rich Procedural Digital Art Canvas Cover Renderer (Offline/Fallback)
 */
function renderProceduralCanvasCover(options: LogoOptions): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(new Uint8Array());
      return;
    }

    const { name, tags: _tags = [], style = 'anime' } = options;

    // Palette per style
    let bgColors: [string, string, string];
    let primaryColor: string;
    let accentColor: string;

    switch (style) {
      case 'cyberpunk':
        bgColors = ['#0f051d', '#1a0b2e', '#03001e'];
        primaryColor = '#00f0ff';
        accentColor = '#ff007f';
        break;
      case 'gothic':
        bgColors = ['#18080a', '#2a0d12', '#0a0204'];
        primaryColor = '#f87171';
        accentColor = '#fda4af';
        break;
      case 'fantasy':
        bgColors = ['#021c12', '#063021', '#010d08'];
        primaryColor = '#34d399';
        accentColor = '#a7f3d0';
        break;
      case 'cinematic':
        bgColors = ['#1f1300', '#3b2500', '#0f0900'];
        primaryColor = '#fbbf24';
        accentColor = '#fef08a';
        break;
      case 'anime':
      default:
        bgColors = ['#0f172a', '#1e1b4b', '#020617'];
        primaryColor = '#818cf8';
        accentColor = '#c7d2fe';
        break;
    }

    // 1. Background Radial & Atmospheric Light Beams
    const bgGrd = ctx.createRadialGradient(256, 300, 30, 256, 384, 500);
    bgGrd.addColorStop(0, bgColors[1]);
    bgGrd.addColorStop(0.5, bgColors[0]);
    bgGrd.addColorStop(1, bgColors[2]);
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, 512, 768);

    // Light rays
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = primaryColor;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(256, 0);
      ctx.lineTo(256 + Math.cos(i * 0.8) * 600, 768);
      ctx.lineTo(256 + Math.cos(i * 0.8 + 0.3) * 600, 768);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Character Portrait Silhouette Frame (Head & Shoulders Outline)
    ctx.save();
    ctx.translate(256, 320);

    // Glowing aura behind head
    const auraGrd = ctx.createRadialGradient(0, -40, 20, 0, -40, 180);
    auraGrd.addColorStop(0, primaryColor);
    auraGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrd;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, -40, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Stylized Character Silhouette
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 25;
    ctx.fillStyle = bgColors[0];
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;

    // Head circle
    ctx.beginPath();
    ctx.arc(0, -60, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shoulders arch
    ctx.beginPath();
    ctx.moveTo(-160, 180);
    ctx.quadraticCurveTo(-120, 50, 0, 45);
    ctx.quadraticCurveTo(120, 50, 160, 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 3. Floating Particles
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 50; i++) {
      const px = (Math.sin(i * 12.3) * 0.5 + 0.5) * 512;
      const py = (Math.cos(i * 17.1) * 0.5 + 0.5) * 600;
      const pr = (i % 3) + 1;
      ctx.globalAlpha = 0.15 + (i % 4) * 0.2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Character Initials Emblem Crest
    const words = name.trim().split(/\s+/).filter(Boolean);
    let initials = 'CF';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 1) {
      initials = words[0].slice(0, 2).toUpperCase();
    }

    ctx.save();
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 256, 260);
    ctx.restore();

    // 5. Character Name Title Plaque
    ctx.save();
    const bannerY = 680;
    const bannerW = 420;
    const bannerH = 52;

    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(256 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayName = name.length > 26 ? name.slice(0, 24) + '...' : name;
    ctx.fillText(displayName.toUpperCase(), 256, bannerY);
    ctx.restore();

    // Convert Canvas to PNG Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(new Uint8Array());
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          resolve(new Uint8Array());
        }
      };
      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}
