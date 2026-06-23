'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import {
  PARTICLE_COUNT,
  PARTICLE_COUNT_MOBILE,
  MODEL_URL,
  PRECOMPUTED_URL,
  WELCOME_MODEL_URL,
  WELCOME_PRECOMPUTED_URL,
  HERO_CONFIG,
  HERO_CONFIG_LAPTOP,
  HERO_CONFIG_MOBILE,
  WELCOME_CONFIG,
  WELCOME_CONFIG_LAPTOP,
  WELCOME_CONFIG_MOBILE,
  CHARMINAR_MODEL_URL,
  CHARMINAR_PRECOMPUTED_URL,
  CHARMINAR_CONFIG,
  CHARMINAR_CONFIG_LAPTOP,
  CHARMINAR_CONFIG_MOBILE,
  COMMITTEE_SCALE_MOBILE,
  COMMITTEE_SCALE_LAPTOP,
  COMMITTEE_SCALE_DESKTOP,
  COMMITTEE_Y_MOBILE,
  COMMITTEE_Y_LAPTOP,
  COMMITTEE_Y_DESKTOP,
} from './hero/constants';
import { getDeviceType, DeviceType } from './hero/getDeviceType';
import { loadPointData, normalizePointArrays } from './hero/pointCloudUtils';
import { DebugControls, DebugValues } from './hero/DebugControls';
import { Navigation } from './hero/Navigation';
import { HeroContent } from './hero/HeroContent';
import { WelcomeContent } from './hero/WelcomeContent';
import { AboutContent } from './hero/AboutContent';
import { PricingContent } from './hero/PricingContent';
import { CommitteeContent } from './hero/CommitteeContent';
import { ExploreContent } from './hero/ExploreContent';
import { LoadingScreen } from './hero/LoadingScreen';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HandHeroSection() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const welcomeSectionRef = useRef<HTMLElement>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const pricingSectionRef = useRef<HTMLElement>(null);
  const committeeSectionRef = useRef<HTMLElement>(null);
  const exploreSectionRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const welcomeContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const pricingContentRef = useRef<HTMLDivElement>(null);
  const committeeContentRef = useRef<HTMLDivElement>(null);
  const exploreContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const sceneRef = useRef<any>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentGestureRef = useRef<'hero' | 'welcome' | 'dissolve' | 'committee' | 'explore'>('hero');
  const targetTransformRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 });
  const isMorphingRef = useRef(false);
  const isInteractiveRef = useRef(false); // For Charminar drag rotation
  const morphTweenRef = useRef<gsap.core.Tween | null>(null);
  const opacityTweenRef = useRef<gsap.core.Tween | null>(null);
  const positionTweenRef = useRef<gsap.core.Tween | null>(null);
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleTweenRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pastExploreSection, setPastExploreSection] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  // Get config based on device type (three-way: mobile / laptop / desktop)
  const heroConfig = deviceType === 'mobile' ? HERO_CONFIG_MOBILE : deviceType === 'laptop' ? HERO_CONFIG_LAPTOP : HERO_CONFIG;
  const welcomeConfig = deviceType === 'mobile' ? WELCOME_CONFIG_MOBILE : deviceType === 'laptop' ? WELCOME_CONFIG_LAPTOP : WELCOME_CONFIG;
  const charminarConfig = deviceType === 'mobile' ? CHARMINAR_CONFIG_MOBILE : deviceType === 'laptop' ? CHARMINAR_CONFIG_LAPTOP : CHARMINAR_CONFIG;
  const committeeScale = deviceType === 'mobile' ? COMMITTEE_SCALE_MOBILE : deviceType === 'laptop' ? COMMITTEE_SCALE_LAPTOP : COMMITTEE_SCALE_DESKTOP;
  const committeeY = deviceType === 'mobile' ? COMMITTEE_Y_MOBILE : deviceType === 'laptop' ? COMMITTEE_Y_LAPTOP : COMMITTEE_Y_DESKTOP;

  const [debugValues, setDebugValues] = useState<DebugValues>({
    rotX: HERO_CONFIG.rotationX,
    rotY: HERO_CONFIG.rotationY,
    rotZ: HERO_CONFIG.rotationZ,
    posX: HERO_CONFIG.positionX,
    posY: HERO_CONFIG.positionY,
    scale: HERO_CONFIG.scale,
    particleSize: HERO_CONFIG.particleSize,
    cameraZ: HERO_CONFIG.cameraZ,
    disperseStrength: 0.5,
    welcomePosX: WELCOME_CONFIG.positionX,
    welcomePosY: WELCOME_CONFIG.positionY,
    welcomeRotX: WELCOME_CONFIG.rotationX,
    welcomeRotY: WELCOME_CONFIG.rotationY,
    welcomeRotZ: WELCOME_CONFIG.rotationZ,
    welcomeScale: WELCOME_CONFIG.scale,
    charminarPosX: CHARMINAR_CONFIG.positionX,
    charminarPosY: CHARMINAR_CONFIG.positionY,
    charminarRotX: CHARMINAR_CONFIG.rotationX,
    charminarRotY: CHARMINAR_CONFIG.rotationY,
    charminarRotZ: CHARMINAR_CONFIG.rotationZ,
    charminarScale: CHARMINAR_CONFIG.scale,
  });

  const handleDebugChange = useCallback((key: string, value: number) => {
    setDebugValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    setMounted(true);
    setDeviceType(getDeviceType(window.innerWidth));

    const handleDeviceResize = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };
    window.addEventListener('resize', handleDeviceResize);
    return () => window.removeEventListener('resize', handleDeviceResize);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const device = getDeviceType(window.innerWidth);
    const mobile = device === 'mobile';
    const particleCount = mobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      mobile ? 45 : 35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, debugValues.cameraZ);

    const renderer = new THREE.WebGLRenderer({
      antialias: !mobile,
      alpha: true,
      powerPreference: mobile ? 'low-power' : 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    canvasRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    // Initialize colors to gray
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.33;
      colors[i + 1] = 0.33;
      colors[i + 2] = 0.33;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: debugValues.particleSize,
      color: 0x555555,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      vertexColors: false, // Start with uniform color, enable for Charminar
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Set initial transform
    targetTransformRef.current = {
      x: debugValues.posX,
      y: debugValues.posY,
      rotX: debugValues.rotX,
      rotY: debugValues.rotY,
      rotZ: debugValues.rotZ,
      scale: debugValues.scale,
    };
    points.position.set(debugValues.posX, debugValues.posY, 0);
    points.rotation.set(debugValues.rotX, debugValues.rotY, debugValues.rotZ);
    points.scale.setScalar(debugValues.scale);

    // Create dissolve state
    const createDissolveState = (basePoints: Float32Array): Float32Array => {
      const dissolved = new Float32Array(basePoints.length);
      for (let i = 0; i < basePoints.length; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 40;
        dissolved[i] = Math.cos(angle) * radius * (Math.random() + 0.5);
        dissolved[i + 1] = (Math.random() - 0.5) * radius;
        dissolved[i + 2] = Math.sin(angle) * radius * (Math.random() + 0.5);
      }
      return dissolved;
    };

    // Create committee state - particles form the title text "Organising Committee"
    const createCommitteeState = (numParticles: number): Float32Array => {
      const committee = new Float32Array(numParticles * 3);
      
      // Define letter patterns (7x9 grid for thicker, rounder letters)
      const letterPatterns: { [key: string]: number[][] } = {
        'O': [
          [0,0,1,1,1,0,0],
          [0,1,1,1,1,1,0],
          [1,1,0,0,0,1,1],
          [1,1,0,0,0,1,1],
          [1,1,0,0,0,1,1],
          [1,1,0,0,0,1,1],
          [1,1,0,0,0,1,1],
          [0,1,1,1,1,1,0],
          [0,0,1,1,1,0,0],
        ],
        'r': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,1,1,0,1,1,0],
          [0,1,1,1,1,1,1],
          [0,1,1,1,0,0,0],
          [0,1,1,0,0,0,0],
          [0,1,1,0,0,0,0],
          [0,1,1,0,0,0,0],
          [0,1,1,0,0,0,0],
        ],
        'g': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,1,1,1,1,0],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,0,1,1,1,1,1],
          [0,0,0,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,0,1,1,1,1,0],
        ],
        'a': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,1,1,1,1,0],
          [0,0,0,0,0,1,1],
          [0,0,1,1,1,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,1,1,1],
          [0,0,1,1,0,1,1],
        ],
        'n': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,1,1,1,1,1,0],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
        ],
        'i': [
          [0,0,0,0,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,0,0,0,0,0],
          [0,1,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,1,1,1,1,0,0],
        ],
        's': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,1,1,1,1,0],
          [0,1,1,0,0,1,1],
          [0,1,1,1,0,0,0],
          [0,0,1,1,1,0,0],
          [0,0,0,0,1,1,0],
          [0,1,1,0,0,1,1],
          [0,0,1,1,1,1,0],
        ],
        'C': [
          [0,0,1,1,1,1,0],
          [0,1,1,1,1,1,1],
          [1,1,1,0,0,0,1],
          [1,1,0,0,0,0,0],
          [1,1,0,0,0,0,0],
          [1,1,0,0,0,0,0],
          [1,1,1,0,0,0,1],
          [0,1,1,1,1,1,1],
          [0,0,1,1,1,1,0],
        ],
        'o': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,1,1,1,0,0],
          [0,1,1,0,1,1,0],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,0,1,1],
          [0,1,1,0,1,1,0],
          [0,0,1,1,1,0,0],
        ],
        'm': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [1,1,1,0,1,1,0],
          [1,0,1,1,0,1,1],
          [1,0,1,1,0,1,1],
          [1,0,1,1,0,1,1],
          [1,0,1,1,0,1,1],
          [1,0,1,1,0,1,1],
          [1,0,1,1,0,1,1],
        ],
        't': [
          [0,0,0,0,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,1,1,1,1,1,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0],
          [0,0,1,1,0,1,0],
          [0,0,0,1,1,0,0],
        ],
        'e': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,1,1,1,0,0],
          [0,1,1,0,1,1,0],
          [0,1,1,1,1,1,0],
          [0,1,1,0,0,0,0],
          [0,1,1,0,0,0,0],
          [0,1,1,0,0,1,0],
          [0,0,1,1,1,0,0],
        ],
        ' ': [
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0],
        ],
      };
      
      // Use 2 lines for text
      const text1 = "Organising";
      const text2 = "Committee";
      
      // Collect all points for the text
      const textPoints: { x: number; y: number }[] = [];
      
      const letterWidth = 7;
      const letterHeight = 9;
      const letterSpacing = 1;
      const lineSpacing = 2;
      // Responsive scale - smaller on mobile, intermediate on laptop
      const scale = device === 'mobile' ? COMMITTEE_SCALE_MOBILE : device === 'laptop' ? COMMITTEE_SCALE_LAPTOP : COMMITTEE_SCALE_DESKTOP;
      
      // Calculate widths for centering each line
      const calcWidth = (text: string) => {
        let w = 0;
        for (const char of text) {
          w += (letterWidth + letterSpacing) * scale;
        }
        return w - letterSpacing * scale;
      };
      
      const line1Width = calcWidth(text1);
      const line2Width = calcWidth(text2);
      
      // Position text - line 1 above, line 2 below
      const totalHeight = (letterHeight * 2 + lineSpacing) * scale;
      const baseY = totalHeight / 2;
      
      // Generate line 1 (Organising)
      let offsetX = -line1Width / 2;
      let offsetY = baseY;
      
      // Generate line 1 (Organising)
      for (const char of text1) {
        const pattern = letterPatterns[char];
        if (pattern) {
          for (let row = 0; row < letterHeight; row++) {
            for (let col = 0; col < letterWidth; col++) {
              if (pattern[row][col] === 1) {
                textPoints.push({
                  x: offsetX + col * scale,
                  y: offsetY - row * scale
                });
              }
            }
          }
        }
        offsetX += (letterWidth + letterSpacing) * scale;
      }
      
      // Generate line 2 (Committee)
      offsetX = -line2Width / 2;
      offsetY = baseY - (letterHeight + lineSpacing) * scale;
      
      for (const char of text2) {
        const pattern = letterPatterns[char];
        if (pattern) {
          for (let row = 0; row < letterHeight; row++) {
            for (let col = 0; col < letterWidth; col++) {
              if (pattern[row][col] === 1) {
                textPoints.push({
                  x: offsetX + col * scale,
                  y: offsetY - row * scale
                });
              }
            }
          }
        }
        offsetX += (letterWidth + letterSpacing) * scale;
      }
      
      // Distribute ALL particles across text points - no background particles
      const particlesPerPoint = Math.max(1, Math.floor(numParticles / textPoints.length));
      let particleIndex = 0;
      
      for (const point of textPoints) {
        for (let i = 0; i < particlesPerPoint && particleIndex < numParticles; i++) {
          // Add randomness for thickness and organic look
          const jitterX = (Math.random() - 0.5) * 0.1;
          const jitterY = (Math.random() - 0.5) * 0.1;
          const jitterZ = (Math.random() - 0.5) * 0.1;
          
          committee[particleIndex * 3] = point.x + jitterX;
          committee[particleIndex * 3 + 1] = point.y + jitterY;
          committee[particleIndex * 3 + 2] = jitterZ;
          particleIndex++;
        }
      }
      
      // Fill any remaining particles ON the text (cycle through text points)
      let pointIndex = 0;
      while (particleIndex < numParticles) {
        const point = textPoints[pointIndex % textPoints.length];
        const jitterX = (Math.random() - 0.5) * 0.12;
        const jitterY = (Math.random() - 0.5) * 0.12;
        const jitterZ = (Math.random() - 0.5) * 0.1;
        
        committee[particleIndex * 3] = point.x + jitterX;
        committee[particleIndex * 3 + 1] = point.y + jitterY;
        committee[particleIndex * 3 + 2] = jitterZ;
        particleIndex++;
        pointIndex++;
      }
      
      return committee;
    };

    sceneRef.current = { scene, camera, renderer, points, geometry, material, particleCount };

    // Disperse offsets array (declared early so morph can reset it)
    const disperseOffsets = new Float32Array(particleCount * 3);
    
    // Store Charminar colors separately
    let charminarColors: Float32Array | null = null;
    // Store gray colors for non-Charminar states
    const grayColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < grayColors.length; i += 3) {
      grayColors[i] = 0.33;
      grayColors[i + 1] = 0.33;
      grayColors[i + 2] = 0.33;
    }
    
    // Charminar color (sandstone/golden brown)
    const charminarColor = { r: 0.76, g: 0.60, b: 0.42 };

    // Load point clouds - all using simple position loading
    Promise.all([
      loadPointData(PRECOMPUTED_URL, MODEL_URL, mobile, particleCount),
      loadPointData(WELCOME_PRECOMPUTED_URL, WELCOME_MODEL_URL, mobile, particleCount),
      loadPointData(CHARMINAR_PRECOMPUTED_URL, CHARMINAR_MODEL_URL, mobile, particleCount),
    ]).then(([hero, welcome, charminar]) => {
      const [heroPoints, welcomePoints] = normalizePointArrays(hero, welcome);
      const dissolvePoints = createDissolveState(welcomePoints);
      const committeePoints = createCommitteeState(particleCount);
      
      // Normalize Charminar points to match particle count
      const charminarPoints = new Float32Array(particleCount * 3);
      charminarColors = new Float32Array(particleCount * 3);
      const srcLen = charminar.length / 3;
      for (let i = 0; i < particleCount; i++) {
        const srcIdx = (i % srcLen) * 3;
        charminarPoints[i * 3] = charminar[srcIdx];
        charminarPoints[i * 3 + 1] = charminar[srcIdx + 1];
        charminarPoints[i * 3 + 2] = charminar[srcIdx + 2];
        // Use fixed sandstone color with slight variation
        const variation = 0.9 + Math.random() * 0.2;
        charminarColors[i * 3] = charminarColor.r * variation;
        charminarColors[i * 3 + 1] = charminarColor.g * variation;
        charminarColors[i * 3 + 2] = charminarColor.b * variation;
      }

      // Set initial positions
      const posAttr = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < Math.min(posAttr.length, heroPoints.length); i++) {
        posAttr[i] = heroPoints[i];
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeBoundingSphere();

      sceneRef.current.states = {
        hero: heroPoints,
        welcome: welcomePoints,
        dissolve: dissolvePoints,
        committee: committeePoints,
        explore: charminarPoints,
      };
      sceneRef.current.charminarColors = charminarColors;
      sceneRef.current.grayColors = grayColors;

      setLoading(false);
      setupScrollTriggers();
    });

    // Morph function
    const morph = (targetGesture: 'hero' | 'welcome' | 'dissolve' | 'committee' | 'explore') => {
      // Skip if already at target gesture AND not currently morphing
      if (targetGesture === currentGestureRef.current && !isMorphingRef.current) return;
      
      const states = sceneRef.current?.states;
      if (!states) return;

      // Kill any existing morph tween to prevent conflicts
      if (morphTweenRef.current) {
        morphTweenRef.current.kill();
        morphTweenRef.current = null;
      }
      if (opacityTweenRef.current) {
        opacityTweenRef.current.kill();
        opacityTweenRef.current = null;
      }

      currentGestureRef.current = targetGesture;
      const target = states[targetGesture];
      const current = geometry.attributes.position.array as Float32Array;
      const start = new Float32Array(current);

      // Set morphing flag to prevent disperse effect from interfering
      isMorphingRef.current = true;

      // Reset disperse offsets when starting a morph
      for (let i = 0; i < disperseOffsets.length; i++) {
        disperseOffsets[i] = 0;
      }

      morphTweenRef.current = gsap.to({ t: 0 }, {
        t: 1,
        duration: 2,
        ease: 'expo.inOut',
        onUpdate: function() {
          const t = this.targets()[0].t;
          for (let i = 0; i < current.length; i++) {
            current[i] = start[i] + (target[i] - start[i]) * t;
          }
          geometry.attributes.position.needsUpdate = true;
        },
        onComplete: () => {
          // Allow disperse effect again after morph completes
          isMorphingRef.current = false;
          morphTweenRef.current = null;
        },
      });

      if (targetGesture === 'dissolve') {
        opacityTweenRef.current = gsap.to(material, { opacity: 0, duration: 2, ease: 'expo.inOut' });
      } else if (targetGesture === 'committee') {
        // Committee gets full opacity with dramatic entrance
        opacityTweenRef.current = gsap.to(material, { opacity: 0.95, duration: 2.5, ease: 'expo.out' });
      } else {
        opacityTweenRef.current = gsap.to(material, { opacity: 0.9, duration: 1.5, ease: 'expo.out' });
      }
    };

    // Move point cloud to target position
    const movePointCloud = (x: number, y: number, rotX: number, rotY: number, rotZ: number, scale: number) => {
      targetTransformRef.current = { x, y, rotX, rotY, rotZ, scale };
      
      // Kill existing position/rotation/scale tweens
      if (positionTweenRef.current) {
        positionTweenRef.current.kill();
        positionTweenRef.current = null;
      }
      if (rotationTweenRef.current) {
        rotationTweenRef.current.kill();
        rotationTweenRef.current = null;
      }
      if (scaleTweenRef.current) {
        scaleTweenRef.current.kill();
        scaleTweenRef.current = null;
      }
      
      positionTweenRef.current = gsap.to(points.position, { x, y, duration: 2, ease: 'expo.out' });
      rotationTweenRef.current = gsap.to(points.rotation, { x: rotX, y: rotY, z: rotZ, duration: 2, ease: 'expo.out' });
      scaleTweenRef.current = gsap.to(points.scale, { x: scale, y: scale, z: scale, duration: 2, ease: 'expo.out' });
    };

    // Setup scroll triggers
    const setupScrollTriggers = () => {
      // Get device-specific configs (three-way: mobile / laptop / desktop)
      const heroConf = device === 'mobile' ? HERO_CONFIG_MOBILE : device === 'laptop' ? HERO_CONFIG_LAPTOP : HERO_CONFIG;
      const welcomeConf = device === 'mobile' ? WELCOME_CONFIG_MOBILE : device === 'laptop' ? WELCOME_CONFIG_LAPTOP : WELCOME_CONFIG;
      const charminarConf = device === 'mobile' ? CHARMINAR_CONFIG_MOBILE : device === 'laptop' ? CHARMINAR_CONFIG_LAPTOP : CHARMINAR_CONFIG;
      const committeeYPos = device === 'mobile' ? COMMITTEE_Y_MOBILE : device === 'laptop' ? COMMITTEE_Y_LAPTOP : COMMITTEE_Y_DESKTOP;

      // Hero section
      ScrollTrigger.create({
        trigger: heroSectionRef.current,
        start: mobile ? 'top 90%' : 'top 80%',
        end: mobile ? 'bottom 30%' : 'bottom 20%',
        onEnter: () => {
          morph('hero');
          heroContentRef.current?.classList.add('active');
          movePointCloud(
            heroConf.positionX, heroConf.positionY,
            heroConf.rotationX, heroConf.rotationY, heroConf.rotationZ,
            heroConf.scale
          );
        },
        onEnterBack: () => {
          morph('hero');
          heroContentRef.current?.classList.add('active');
          movePointCloud(
            heroConf.positionX, heroConf.positionY,
            heroConf.rotationX, heroConf.rotationY, heroConf.rotationZ,
            heroConf.scale
          );
        },
        onLeave: () => heroContentRef.current?.classList.remove('active'),
        onLeaveBack: () => heroContentRef.current?.classList.remove('active'),
      });

      // Welcome section
      ScrollTrigger.create({
        trigger: welcomeSectionRef.current,
        start: mobile ? 'top 90%' : 'top 80%',
        end: mobile ? 'bottom 40%' : 'bottom 50%',
        onEnter: () => {
          morph('welcome');
          welcomeContentRef.current?.classList.add('active');
          movePointCloud(
            welcomeConf.positionX, welcomeConf.positionY,
            welcomeConf.rotationX, welcomeConf.rotationY, welcomeConf.rotationZ,
            welcomeConf.scale
          );
        },
        onEnterBack: () => {
          morph('welcome');
          welcomeContentRef.current?.classList.add('active');
          movePointCloud(
            welcomeConf.positionX, welcomeConf.positionY,
            welcomeConf.rotationX, welcomeConf.rotationY, welcomeConf.rotationZ,
            welcomeConf.scale
          );
        },
        onLeave: () => {
          welcomeContentRef.current?.classList.remove('active');
          morph('dissolve');
        },
        onLeaveBack: () => welcomeContentRef.current?.classList.remove('active'),
      });

      // About / Why Attend section
      ScrollTrigger.create({
        trigger: aboutSectionRef.current,
        start: mobile ? 'top 90%' : 'top 80%',
        end: mobile ? 'bottom 40%' : 'bottom 50%',
        onEnter: () => {
          aboutContentRef.current?.classList.add('active');
        },
        onEnterBack: () => {
          aboutContentRef.current?.classList.add('active');
          morph('dissolve');
        },
        onLeave: () => {
          aboutContentRef.current?.classList.remove('active');
        },
        onLeaveBack: () => aboutContentRef.current?.classList.remove('active'),
      });

      // Pricing section
      ScrollTrigger.create({
        trigger: pricingSectionRef.current,
        start: mobile ? 'top 90%' : 'top 80%',
        end: mobile ? 'bottom 40%' : 'bottom 50%',
        onEnter: () => {
          pricingContentRef.current?.classList.add('active');
        },
        onEnterBack: () => {
          pricingContentRef.current?.classList.add('active');
          morph('dissolve');
        },
        onLeave: () => {
          pricingContentRef.current?.classList.remove('active');
        },
        onLeaveBack: () => pricingContentRef.current?.classList.remove('active'),
      });

      // Committee section - simple content visibility only (no particles)
      ScrollTrigger.create({
        trigger: committeeSectionRef.current,
        start: mobile ? 'top 70%' : 'top 60%',
        end: mobile ? 'bottom 30%' : 'bottom 40%',
        onEnter: () => {
          committeeContentRef.current?.classList.add('active');
        },
        onEnterBack: () => {
          committeeContentRef.current?.classList.add('active');
        },
        onLeave: () => {
          committeeContentRef.current?.classList.remove('active');
        },
        onLeaveBack: () => {
          committeeContentRef.current?.classList.remove('active');
          morph('dissolve');
        },
      });

      // Explore Hyderabad section - Simple: form on enter, only dissolve when leaving
      let charminarVisible = false;
      let charminarForming = false;
      
      const formCharminar = () => {
        const states = sceneRef.current?.states;
        const charminarColorsData = sceneRef.current?.charminarColors;
        if (!states || !charminarColorsData) {
          return;
        }
        
        // If already visible or currently forming, don't restart
        if (charminarVisible || charminarForming) {
          return;
        }
        
        charminarForming = true;
        
        // Kill all existing animations
        if (morphTweenRef.current) morphTweenRef.current.kill();
        if (opacityTweenRef.current) opacityTweenRef.current.kill();
        if (colorTweenRef.current) colorTweenRef.current.kill();
        
        currentGestureRef.current = 'explore';
        isMorphingRef.current = true;
        
        // Reset disperse offsets
        for (let i = 0; i < disperseOffsets.length; i++) {
          disperseOffsets[i] = 0;
        }
        
        // Position for center of screen - SET IMMEDIATELY
        const posX = charminarConf.positionX;
        const posY = charminarConf.positionY;
        const scale = charminarConf.scale;
        
        points.position.set(posX, posY, 0);
        points.rotation.set(charminarConf.rotationX, charminarConf.rotationY, charminarConf.rotationZ);
        points.scale.setScalar(scale);
        targetTransformRef.current = { 
          x: posX, y: posY, 
          rotX: charminarConf.rotationX, 
          rotY: charminarConf.rotationY, 
          rotZ: charminarConf.rotationZ, 
          scale: scale 
        };
        
        const exploreState = states.explore;
        const dissolveState = states.dissolve;
        const positions = geometry.attributes.position.array as Float32Array;
        const colorAttr = geometry.attributes.color.array as Float32Array;
        
        // ALWAYS reset to dissolve state first for consistent animation
        for (let i = 0; i < positions.length; i++) {
          positions[i] = dissolveState[i];
        }
        geometry.attributes.position.needsUpdate = true;
        
        // Copy dissolve positions as start
        const startPositions = new Float32Array(dissolveState);
        const startColors = new Float32Array(colorAttr.length);
        for (let i = 0; i < colorAttr.length; i++) {
          startColors[i] = colorAttr[i];
        }
        
        // Enable vertex colors
        material.vertexColors = true;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
        
        // Start from 0 opacity
        material.opacity = 0;
        opacityTweenRef.current = gsap.to(material, {
          opacity: 0.95,
          duration: 1.5,
          ease: 'power2.out',
        });
        
        // Morph positions and colors
        const tweenObj = { progress: 0 };
        morphTweenRef.current = gsap.to(tweenObj, {
          progress: 1,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            const t = tweenObj.progress;
            for (let i = 0; i < positions.length; i++) {
              positions[i] = startPositions[i] + (exploreState[i] - startPositions[i]) * t;
              colorAttr[i] = startColors[i] + (charminarColorsData[i] - startColors[i]) * t;
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
          },
          onComplete: () => {
            // Set final positions exactly
            for (let i = 0; i < positions.length; i++) {
              positions[i] = exploreState[i];
              colorAttr[i] = charminarColorsData[i];
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
            isMorphingRef.current = false;
            charminarForming = false;
            charminarVisible = true;
          },
        });
      };
      
      const hideCharminar = () => {
        // Reset flags
        charminarVisible = false;
        charminarForming = false;
        
        // Kill all existing animations
        if (morphTweenRef.current) morphTweenRef.current.kill();
        if (opacityTweenRef.current) opacityTweenRef.current.kill();
        
        // Instant hide
        material.opacity = 0;
        material.vertexColors = false;
        material.color.setHex(0x555555);
        material.needsUpdate = true;
        isMorphingRef.current = false;
      };
      
      // Single trigger: form when explore section is visible
      // On mobile, trigger earlier (when 30% from top), on desktop when 20% from top
      ScrollTrigger.create({
        trigger: exploreSectionRef.current,
        start: mobile ? 'top 70%' : 'top 20%', // Trigger earlier - when section enters viewport
        end: 'bottom top',   // Section bottom hits screen top - HIDE
        onEnter: () => {
          // Reset flags to allow re-formation
          charminarVisible = false;
          charminarForming = false;
          exploreContentRef.current?.classList.add('active');
          formCharminar();
        },
        onLeave: () => {
          exploreContentRef.current?.classList.remove('active');
          hideCharminar();
          setPastExploreSection(true);
        },
        onEnterBack: () => {
          // Reset flags to allow re-formation
          charminarVisible = false;
          charminarForming = false;
          // IMPORTANT: Set this BEFORE forming so canvas is visible
          setPastExploreSection(false);
          exploreContentRef.current?.classList.add('active');
          // Force canvas to be visible immediately (don't wait for React)
          if (canvasRef.current) {
            canvasRef.current.style.opacity = '1';
          }
          // Small delay to ensure everything is ready
          setTimeout(() => {
            formCharminar();
          }, 50);
        },
        onLeaveBack: () => {
          // Reset flags and hide when leaving to committee
          charminarVisible = false;
          charminarForming = false;
          hideCharminar();
          exploreContentRef.current?.classList.remove('active');
        },
      });

      // Progress tracker
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => setScrollProgress(self.progress),
      });
    };

    // Mouse tracking and drag for Charminar rotation
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    const handleMouseDown = (e: MouseEvent) => {
      if (isInteractiveRef.current && currentGestureRef.current === 'explore') {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      // Drag rotation for Charminar
      if (isDragging && isInteractiveRef.current && currentGestureRef.current === 'explore') {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        points.rotation.y += deltaX * 0.005;
        points.rotation.x += deltaY * 0.005;
        
        // Clamp X rotation
        points.rotation.x = Math.max(-0.5, Math.min(0.5, points.rotation.x));
        
        targetTransformRef.current.rotY = points.rotation.y;
        targetTransformRef.current.rotX = points.rotation.x;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId: number;
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      // Skip floating/rotation effects during committee and explore states
      // (they handle their own positioning)
      if (currentGestureRef.current !== 'committee' && currentGestureRef.current !== 'explore') {
        // Subtle floating
        const floatOffset = Math.sin(time * 0.5) * 0.1;
        points.position.y = targetTransformRef.current.y + floatOffset;

        // Subtle rotation follow mouse
        points.rotation.x = targetTransformRef.current.rotX + Math.sin(time * 0.3) * 0.02;
        points.rotation.y = targetTransformRef.current.rotY + mouseRef.current.x * 0.05;
      } else if (currentGestureRef.current === 'explore' && !isDragging && !isMorphingRef.current) {
        // Slow auto-rotation for Charminar when not dragging
        points.rotation.y += 0.002;
        targetTransformRef.current.rotY = points.rotation.y;
      }

      // Mouse hover disperse effect - ONLY when not morphing and not in committee/explore state
      if (sceneRef.current?.states && currentGestureRef.current !== 'dissolve' && currentGestureRef.current !== 'committee' && currentGestureRef.current !== 'explore' && !isMorphingRef.current) {
        const positions = geometry.attributes.position.array as Float32Array;
        const currentState = sceneRef.current.states[currentGestureRef.current];
        
        if (currentState) {
          mouseVec.set(mouseRef.current.x, mouseRef.current.y);
          raycaster.setFromCamera(mouseVec, camera);
          
          points.updateMatrixWorld();
          const inverseMatrix = new THREE.Matrix4().copy(points.matrixWorld).invert();
          const localRayOrigin = raycaster.ray.origin.clone().applyMatrix4(inverseMatrix);
          const localRayDir = raycaster.ray.direction.clone().transformDirection(inverseMatrix).normalize();

          const disperseRadius = debugValues.disperseStrength * 1.2;
          const disperseStrength = debugValues.disperseStrength * 1.5;

          for (let i = 0; i < Math.min(positions.length, currentState.length); i += 3) {
            const targetX = currentState[i];
            const targetY = currentState[i + 1];
            const targetZ = currentState[i + 2];

            // Calculate distance from particle to mouse ray
            tempVec.set(targetX - localRayOrigin.x, targetY - localRayOrigin.y, targetZ - localRayOrigin.z);
            const t = tempVec.dot(localRayDir);
            const closestX = localRayOrigin.x + localRayDir.x * t;
            const closestY = localRayOrigin.y + localRayDir.y * t;
            const closestZ = localRayOrigin.z + localRayDir.z * t;

            const dx = targetX - closestX;
            const dy = targetY - closestY;
            const dz = targetZ - closestZ;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Apply disperse force if within radius
            if (dist < disperseRadius && disperseStrength > 0) {
              const falloff = 1 - dist / disperseRadius;
              const strength = falloff * falloff * disperseStrength;
              const len = dist > 0.001 ? dist : 0.001;
              disperseOffsets[i] += ((dx / len) * strength - disperseOffsets[i]) * 0.1;
              disperseOffsets[i + 1] += ((dy / len) * strength - disperseOffsets[i + 1]) * 0.1;
              disperseOffsets[i + 2] += ((dz / len) * strength - disperseOffsets[i + 2]) * 0.1;
            } else {
              // Return to original position
              disperseOffsets[i] *= 0.92;
              disperseOffsets[i + 1] *= 0.92;
              disperseOffsets[i + 2] *= 0.92;
            }

            // Apply offsets to positions
            positions[i] = targetX + disperseOffsets[i];
            positions[i + 1] = targetY + disperseOffsets[i + 1];
            positions[i + 2] = targetZ + disperseOffsets[i + 2];
          }
          geometry.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Kill all tracked tweens
      morphTweenRef.current?.kill();
      opacityTweenRef.current?.kill();
      positionTweenRef.current?.kill();
      rotationTweenRef.current?.kill();
      scaleTweenRef.current?.kill();
      colorTweenRef.current?.kill();
      
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [mounted, debugValues]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, material, points } = sceneRef.current;
    if (camera) camera.position.z = debugValues.cameraZ;
    if (material) material.size = debugValues.particleSize;
    
    // Update Charminar position in real-time when in explore state
    if (points && currentGestureRef.current === 'explore') {
      points.position.set(debugValues.charminarPosX, debugValues.charminarPosY, 0);
      points.rotation.set(debugValues.charminarRotX, debugValues.charminarRotY, debugValues.charminarRotZ);
      points.scale.setScalar(debugValues.charminarScale);
      targetTransformRef.current = {
        x: debugValues.charminarPosX,
        y: debugValues.charminarPosY,
        rotX: debugValues.charminarRotX,
        rotY: debugValues.charminarRotY,
        rotZ: debugValues.charminarRotZ,
        scale: debugValues.charminarScale,
      };
    }
  }, [debugValues.cameraZ, debugValues.particleSize, debugValues.charminarPosX, debugValues.charminarPosY, debugValues.charminarRotX, debugValues.charminarRotY, debugValues.charminarRotZ, debugValues.charminarScale]);

  if (!mounted) return <div className="min-h-[500vh] bg-[#f5f0e8]" />;

  return (
    <div className="relative">
      {/* Fixed canvas - hidden when past explore section */}
      <div 
        ref={canvasRef} 
        className={`fixed inset-0 z-[1] pointer-events-none transition-opacity duration-500 ${pastExploreSection ? 'opacity-0' : 'opacity-100'}`} 
      />

      {/* Fixed background - hidden when past explore section */}
      <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f5f0e8] transition-opacity duration-500 ${pastExploreSection ? 'opacity-0' : 'opacity-100'}`}>
        <div
          className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vh] rounded-full blur-[100px] opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(220, 230, 140, 0.8) 0%, rgba(235, 240, 180, 0.4) 50%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20%] -left-[20%] w-[60vw] h-[60vh] rounded-full blur-[120px] opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(200, 210, 180, 0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[50vw] h-[40vh] rounded-full blur-[80px] opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(235, 201, 117, 0.4) 0%, rgba(133, 32, 22, 0.1) 50%, transparent 70%)' }}
        />
      </div>

      {/* Debug controls disabled for production */}
      {/* <DebugControls values={debugValues} onChange={handleDebugChange} scrollProgress={scrollProgress} /> */}
      {loading && <LoadingScreen />}
      <Navigation />

      {/* Content sections */}
      <div className="relative z-[10]">
        {/* SECTION 1: Hero */}
        <section ref={heroSectionRef} className="min-h-screen flex items-end pb-16 md:pb-24">
          <div 
            ref={heroContentRef}
            className="section-content w-full px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <HeroContent />
          </div>
        </section>

        {/* SECTION 2: Welcome */}
        <section ref={welcomeSectionRef} className="min-h-screen flex items-end md:items-center py-8 md:py-0">
          <div 
            ref={welcomeContentRef}
            className="section-content section-right w-full px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <WelcomeContent />
          </div>
        </section>

        {/* SECTION 3: About / Why Attend */}
        <section ref={aboutSectionRef} className="min-h-screen flex items-center py-8 md:py-0">
          <div 
            ref={aboutContentRef}
            className="section-content w-full px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <AboutContent />
          </div>
        </section>

        {/* SECTION 4: Pricing */}
        <section ref={pricingSectionRef} className="min-h-screen flex items-center py-8 md:py-0">
          <div 
            ref={pricingContentRef}
            className="section-content w-full px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <PricingContent />
          </div>
        </section>

        {/* SECTION 5: Committee */}
        <section ref={committeeSectionRef} className="min-h-screen flex items-start md:items-center pt-4 md:pt-0 pb-20 md:pb-0">
          <div 
            ref={committeeContentRef}
            className="section-content w-full px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <CommitteeContent />
          </div>
        </section>

        {/* SECTION 6: Explore Hyderabad */}
        <section ref={exploreSectionRef} className="min-h-screen flex items-center py-8 md:py-0">
          <div 
            ref={exploreContentRef}
            className="section-content w-full h-full px-4 sm:px-6 md:px-8 lg:px-12 py-4"
          >
            <ExploreContent />
          </div>
        </section>
      </div>

      <style jsx>{`
        .section-content {
          opacity: 0;
          transform: translateX(-30px);
          transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .section-content.section-right {
          transform: translateX(30px);
        }
        .section-content.active {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </div>
  );
}

export default HandHeroSection;
