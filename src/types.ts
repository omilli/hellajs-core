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

export interface DiffContext {
  componentCache: Map<string, RenderedComponent>;
  clearCache(): void;
}
