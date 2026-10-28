import { create } from 'zustand';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger';
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  inputValue: string;
  setInputValue: (v: string) => void;
  resolvePromise: ((value: boolean | string | null) => void) | null;
  showAlert: (message: string, title?: string, variant?: 'info' | 'warning' | 'danger') => Promise<void>;
  showConfirm: (message: string, title?: string, options?: Partial<DialogOptions>) => Promise<boolean>;
  showPrompt: (message: string, defaultValue?: string, title?: string, options?: Partial<DialogOptions>) => Promise<string | null>;
  closeDialog: (result: boolean | string | null) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  options: null,
  inputValue: '',
  setInputValue: (inputValue: string) => set({ inputValue }),
  resolvePromise: null,

  showAlert: (message: string, title?: string, variant: 'info' | 'warning' | 'danger' = 'info') => {
    return new Promise<void>((resolve) => {
      const prevResolve = get().resolvePromise;
      if (prevResolve) prevResolve(false);

      set({
        isOpen: true,
        inputValue: '',
        options: {
          title: title || 'Notice',
          message,
          type: 'alert',
          confirmText: 'OK',
          variant,
        },
        resolvePromise: () => resolve(),
      });
    });
  },

  showConfirm: (message: string, title?: string, options?: Partial<DialogOptions>) => {
    return new Promise<boolean>((resolve) => {
      const prevResolve = get().resolvePromise;
      if (prevResolve) prevResolve(false);

      set({
        isOpen: true,
        inputValue: '',
        options: {
          title: title || 'Confirm Action',
          message,
          type: 'confirm',
          confirmText: options?.confirmText || 'Confirm',
          cancelText: options?.cancelText || 'Cancel',
          variant: options?.variant || 'warning',
          ...options,
        },
        resolvePromise: (result: boolean | string | null) => resolve(Boolean(result)),
      });
    });
  },

  showPrompt: (message: string, defaultValue = '', title?: string, options?: Partial<DialogOptions>) => {
    return new Promise<string | null>((resolve) => {
      const prevResolve = get().resolvePromise;
      if (prevResolve) prevResolve(null);

      set({
        isOpen: true,
        inputValue: defaultValue,
        options: {
          title: title || 'Input Required',
          message,
          type: 'prompt',
          defaultValue,
          confirmText: options?.confirmText || 'Confirm',
          cancelText: options?.cancelText || 'Cancel',
          variant: options?.variant || 'info',
          ...options,
        },
        resolvePromise: (result: boolean | string | null) => resolve(typeof result === 'string' ? result : null),
      });
    });
  },

  closeDialog: (result: boolean | string | null) => {
    const { resolvePromise } = get();
    set({ isOpen: false, options: null, inputValue: '', resolvePromise: null });
    if (resolvePromise) {
      resolvePromise(result);
    }
  },
}));
