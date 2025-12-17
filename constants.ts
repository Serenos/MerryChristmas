import * as THREE from 'three';

export const COLORS = {
  bg: '#050103',
  leaf1: '#FFB7C5', // Cherry Blossom
  leaf2: '#FF69B4', // Hot Pink
  ornament1: '#ffffff', // White
  ornament2: '#E6E6FA', // Lavender
  star: '#FFFACD', // Lemon Chiffon
};

export const COUNTS = {
  leaves: 5000,
  ornaments: 1500,
  ribbon: 1000,
};

// Math helpers
export const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Temp Object for InstancedMesh calculations
export const tempObject = new THREE.Object3D();
export const tempColor = new THREE.Color();