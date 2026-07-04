"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "warning" | "info" | "gold";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  icon?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

const TOAST_DURATION_MS = 3400;
let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, TOAST_DURATION_MS);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable from services and event handlers. */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "success", title, message, icon: "✓" }),
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "error", title, message, icon: "✕" }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "warning", title, message, icon: "⚠" }),
  info: (title: string, message?: string) =>
    useToastStore.getState().push({ tone: "info", title, message, icon: "ℹ" }),
  gold: (title: string, message?: string, icon = "★") =>
    useToastStore.getState().push({ tone: "gold", title, message, icon }),
};
