export enum AppMode {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE'
}

export interface TreeState {
  mode: AppMode;
  rotationOffset: number; // Controlled by gesture
}

export interface GestureControlProps {
  onGesture: (mode: AppMode) => void;
  onMove: (x: number) => void;
  isActive: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      instancedMesh: any;
      octahedronGeometry: any;
      meshStandardMaterial: any;
      icosahedronGeometry: any;
      tetrahedronGeometry: any;
      coneGeometry: any;
      pointLight: any;
      ambientLight: any;
      color: any;
    }
  }
}