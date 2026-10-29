// @vitest-environment jsdom
import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { CardAvatar, type CardAvatarProps } from '../src/components/CardAvatar';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe('CardAvatar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderAvatar = async (props: CardAvatarProps) => {
    await act(async () => {
      root.render(<CardAvatar {...props} />);
    });
  };

  it('shows the image when a source is set', async () => {
    await renderAvatar({
      src: '/avatar.png',
      name: 'Ada Lovelace',
      alt: 'Ada Lovelace',
      className: 'w-full h-full object-cover',
    });

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/avatar.png');
    expect(container.textContent).not.toContain('AL');
  });

  it('shows initials instead of a broken image after an error', async () => {
    await renderAvatar({
      src: '/broken.png',
      name: 'Ada Lovelace',
      alt: 'Ada Lovelace',
      className: 'w-full h-full',
    });

    await act(async () => {
      container.querySelector('img')?.dispatchEvent(new Event('error'));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('AL');
    expect(container.textContent).not.toContain('Ada Lovelace');
  });

  it('shows the image again when the source changes after a failure', async () => {
    await renderAvatar({
      src: '/broken.png',
      name: 'Ada Lovelace',
      alt: 'Ada Lovelace',
      className: 'w-full h-full',
    });
    await act(async () => {
      container.querySelector('img')?.dispatchEvent(new Event('error'));
    });
    expect(container.querySelector('img')).toBeNull();

    await renderAvatar({
      src: '/new-avatar.png',
      name: 'Ada Lovelace',
      alt: 'Ada Lovelace',
      className: 'w-full h-full',
    });

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/new-avatar.png');
    expect(container.textContent).not.toContain('AL');
  });

  it('uses the first letters of up to two words', async () => {
    await renderAvatar({
      src: '',
      name: 'Ada Lovelace',
      alt: 'Ada Lovelace',
      className: 'w-full h-full',
      fallbackClassName: 'text-4xl',
    });

    expect(container.textContent).toBe('AL');
  });

  it('shows the User icon when the name has no letters or digits', async () => {
    await renderAvatar({
      src: '',
      name: '!!!',
      alt: 'Character',
      className: 'w-full h-full',
    });

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.textContent).toBe('');
  });

  it('shows the empty label only when the source is empty', async () => {
    await renderAvatar({
      src: '',
      name: 'Ada Lovelace',
      alt: 'Character Cover',
      className: 'w-full h-full',
      emptyLabel: 'No Cover',
    });
    expect(container.textContent).toContain('No Cover');

    await renderAvatar({
      src: '/broken.png',
      name: 'Ada Lovelace',
      alt: 'Character Cover',
      className: 'w-full h-full',
      emptyLabel: 'No Cover',
    });
    await act(async () => {
      container.querySelector('img')?.dispatchEvent(new Event('error'));
    });

    expect(container.textContent).not.toContain('No Cover');
    expect(container.textContent).toContain('AL');
  });
});
