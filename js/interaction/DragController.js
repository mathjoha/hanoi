import * as THREE from 'three';

export class DragController {
    constructor(canvas, camera, gameState, controls) {
        this.canvas = canvas;
        this.camera = camera;
        this.gameState = gameState;
        this.controls = controls;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = null;
        this.isDragging = false;
        this.draggedDisk = null;
        this.draggedGroup = [];
        this.originalTower = null;
        this.hoveredTower = null;
        this.offset = new THREE.Vector3();
        this.dragDistance = 0;

        this.setupDragPlane();
        this.setupEventListeners();
    }

    setupDragPlane() {
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        planeGeometry.rotateX(-Math.PI / 2);
        const planeMaterial = new THREE.MeshBasicMaterial({
            visible: false
        });
        this.dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.dragPlane.position.y = 3;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    updateMousePosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    onMouseDown(event) {
        if (this.gameState.isSolvingGame() || this.gameState.isGameComplete()) {
            return;
        }

        this.updateMousePosition(event.clientX, event.clientY);

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const diskMeshes = this.gameState.getDisks().map(disk => disk.getMesh());
        const intersects = this.raycaster.intersectObjects(diskMeshes);

        if (intersects.length > 0) {
            const clickedDisk = intersects[0].object.userData.disk;
            this.startDragging(clickedDisk);
        }
    }

    startDragging(disk) {
        this.isDragging = true;
        this.draggedDisk = disk;
        this.originalTower = disk.getTower();

        // Find all disks on top of the selected disk based on position
        this.draggedGroup = [disk];
        const clickedPos = disk.getMesh().position;
        const allDisks = this.gameState.getDisks();

        for (const otherDisk of allDisks) {
            if (otherDisk === disk) continue;

            const otherPos = otherDisk.getMesh().position;
            // Check if disk is in the same X position (same stack) and above the clicked disk
            const sameStack = Math.abs(otherPos.x - clickedPos.x) < 0.5;
            const isAbove = otherPos.y > clickedPos.y;

            if (sameStack && isAbove) {
                this.draggedGroup.push(otherDisk);
            }
        }

        // Sort by Y position (bottom to top) to maintain order
        this.draggedGroup.sort((a, b) => a.getMesh().position.y - b.getMesh().position.y);

        // Remove all disks in the group from the tower if they belong to one
        if (this.originalTower) {
            for (let i = this.draggedGroup.length - 1; i >= 0; i--) {
                if (this.originalTower.disks.includes(this.draggedGroup[i])) {
                    this.originalTower.removeDisk();
                }
            }
        }

        this.gameState.setSelectedDisk(disk);

        const diskPos = disk.getMesh().position;
        this.dragDistance = diskPos.distanceTo(this.camera.position);
        this.lastValidPosition = diskPos.clone();

        if (this.controls) {
            this.controls.enabled = false;
        }

        // Disable physics for all disks in the group
        this.draggedGroup.forEach(d => d.disablePhysics());
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.draggedDisk) return;

        this.updateMousePosition(event.clientX, event.clientY);

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const ray = this.raycaster.ray;
        const desiredPosition = ray.origin.clone().add(ray.direction.multiplyScalar(this.dragDistance));

        // Lock to Z=0 plane (where all poles are) and constrain to table bounds
        desiredPosition.y = Math.max(0.2, desiredPosition.y);
        desiredPosition.z = 0;

        const newPosition = new THREE.Vector3(
            desiredPosition.x,
            desiredPosition.y,
            0
        );

        newPosition.x = Math.max(-9, Math.min(9, newPosition.x));

        // Check for pole collision during drag for all disks in the group
        let wouldCollide = false;
        for (const disk of this.draggedGroup) {
            const diskOffset = disk.getMesh().position.clone().sub(this.draggedDisk.getMesh().position);
            const diskNewPos = newPosition.clone().add(diskOffset);
            if (disk.checkPoleCollisionPhysics && disk.checkPoleCollisionPhysics(diskNewPos)) {
                wouldCollide = true;
                break;
            }
        }

        if (!wouldCollide) {
            const movement = newPosition.clone().sub(this.draggedDisk.getMesh().position);
            this.draggedGroup.forEach(disk => {
                const currentPos = disk.getMesh().position;
                disk.setPosition(currentPos.x + movement.x, currentPos.y + movement.y, currentPos.z + movement.z);
            });
            this.lastValidPosition = newPosition.clone();
        } else {
            // Try to slide along the obstacle
            const currentPos = this.draggedDisk.getMesh().position.clone();
            const movement = newPosition.clone().sub(currentPos);
            const slidePos = this.findSlidePosition(currentPos, movement);

            if (slidePos) {
                const slideMovement = slidePos.clone().sub(currentPos);
                this.draggedGroup.forEach(disk => {
                    const diskCurrentPos = disk.getMesh().position;
                    disk.setPosition(diskCurrentPos.x + slideMovement.x, diskCurrentPos.y + slideMovement.y, diskCurrentPos.z + slideMovement.z);
                });
                this.lastValidPosition = slidePos.clone();
            }
        }
    }

    findSlidePosition(currentPos, movement) {
        const steps = 10;
        for (let i = steps; i > 0; i--) {
            const fraction = i / steps;
            const testPos = currentPos.clone().add(movement.clone().multiplyScalar(fraction));

            // Check collision for all disks in the group
            let wouldCollide = false;
            for (const disk of this.draggedGroup) {
                const diskOffset = disk.getMesh().position.clone().sub(this.draggedDisk.getMesh().position);
                const diskTestPos = testPos.clone().add(diskOffset);
                if (disk.checkPoleCollisionPhysics && disk.checkPoleCollisionPhysics(diskTestPos)) {
                    wouldCollide = true;
                    break;
                }
            }

            if (!wouldCollide) {
                return testPos;
            }
        }
        return null;
    }


    onMouseUp(event) {
        if (!this.isDragging || !this.draggedDisk) return;

        this.completeDrag();
    }

    completeDrag() {
        this.gameState.clearSelection();

        // Enable physics for all disks in the group
        this.draggedGroup.forEach(disk => {
            disk.enablePhysics();
        });

        if (this.controls) {
            this.controls.enabled = true;
        }

        this.isDragging = false;
        this.draggedDisk = null;
        this.draggedGroup = [];
        this.originalTower = null;
        this.hoveredTower = null;
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(event) {
        if (this.isDragging) {
            event.preventDefault();
            const touch = event.changedTouches[0];
            this.onMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    getDragPlane() {
        return this.dragPlane;
    }
}
