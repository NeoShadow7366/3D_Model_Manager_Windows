/// <reference types="vite/client" />
/// <reference path="./model-viewer.d.ts" />

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src: string, alt: string, "auto-rotate"?: boolean, "camera-controls"?: boolean, exposure?: number, class?: string }, HTMLElement>;
  }
}
