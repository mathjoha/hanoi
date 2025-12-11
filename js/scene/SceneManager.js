import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.lastTime = 0;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);

        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.createBasePlatform();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 2, 0);
        this.controls.update();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;

        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;

        this.scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x432818, 0.3);
        this.scene.add(hemisphereLight);
    }

    createBasePlatform() {
        const platformGeometry = new THREE.BoxGeometry(18, 0.5, 8);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.7,
            metalness: 0.3
        });

        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -0.25;
        platform.receiveShadow = true;
        this.scene.add(platform);

        const edgeGeometry = new THREE.BoxGeometry(18.2, 0.3, 8.2);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.5
        });

        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.y = -0.4;
        this.scene.add(edge);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    startRenderLoop(updateCallback) {
        this.lastTime = performance.now();

        const animate = (currentTime) => {
            this.animationId = requestAnimationFrame(animate);

            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            this.controls.update();

            if (updateCallback) {
                updateCallback(deltaTime);
            }

            this.render();
        };

        animate(this.lastTime);
    }

    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    addToScene(object) {
        this.scene.add(object);
    }

    removeFromScene(object) {
        this.scene.remove(object);
    }

    getCamera() {
        return this.camera;
    }

    getScene() {
        return this.scene;
    }

    getControls() {
        return this.controls;
    }
}
