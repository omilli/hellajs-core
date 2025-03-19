export interface Props {
  [key: string]: any;
  className?: string;
  id?: string;
  style?: Record<string, string | number>;
}

export interface HElement {
  type: string;
  props: Props;
  children: (HElement | string)[];
  element: string | HElement
}

// Simplified render result without event handling
export interface RenderedComponent {
  element: HTMLElement;
  props: HElement;
  pending: boolean;
}

// New separate event handler type with more flexible parameters
export interface EventManager {
  on: (
    events: string | string[],
    selectors: string | string[],
    callback: (e: Event) => void
  ) => EventManager;
  off: (
    events?: string | string[],
    selectors?: string | string[]
  ) => EventManager;
  cleanup: () => EventManager;
  getElement: () => HTMLElement;
}

export interface DiffContext {
  componentCache: Map<string, RenderedComponent>;
  clearCache(): void;
}
