declare module 'katex/dist/contrib/auto-render' {
  import { RenderMathInElementOptions } from 'katex';
  export default function renderMathInElement(
    element: HTMLElement,
    options?: RenderMathInElementOptions
  ): void;
}
