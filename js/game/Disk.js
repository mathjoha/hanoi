import * as THREE from 'three';

export class Disk {
    constructor(size, maxSize, towers = [], allDisks = []) {
        this.size = size;
        this.maxSize = maxSize;
        this.mesh = null;
        this.originalMaterial = null;
        this.tower = null;
        this.isSelected = false;
        this.targetPosition = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isPhysicsEnabled = false;
        this.gravity = -20;
        this.towers = towers;
        this.allDisks = allDisks;
        this.holeRadius = 0.22;
        this.poleRadius = 0.15;
        this.minRadius = 0.75;
        this.maxRadius = 2.5;
        this.radius = this.minRadius + (this.maxRadius - this.minRadius) * (this.size / this.maxSize);
        this.height = 0.4;

        this.createMesh();
    }

    createMesh() {
        const minRadius = 0.75;
        const maxRadius = 2.5;
        const radius = minRadius + (maxRadius - minRadius) * (this.size / this.maxSize);
        const height = 0.4;

        const shape = new THREE.Shape();
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

        const hole = new THREE.Path();
        hole.absarc(0, 0, this.holeRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        const extrudeSettings = {
            depth: height,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, 0);

        const color = this.getColorForSize(this.size, this.maxSize);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.6,
            emissive: color,
            emissiveIntensity: 0.1
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.disk = this;

        this.originalMaterial = material;
    }

    getColorForSize(size, maxSize) {
        const colors = [
            0xff6b6b,  // Red
            0xffa500,  // Orange
            0xffd93d,  // Yellow
            0x6bcf7f,  // Green
            0x4d96ff,  // Blue
            0x9d4edd,  // Purple
            0xff006e   // Pink
        ];

        const index = Math.floor((size - 1) * (colors.length - 1) / (maxSize - 1));
        return colors[Math.min(index, colors.length - 1)];
    }

    setPosition(x, y, z) {
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
        }
    }

    setHighlighted(highlighted) {
        if (!this.mesh) return;

        if (highlighted) {
            const highlightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.2,
                metalness: 0.8,
                emissive: 0x00d4ff,
                emissiveIntensity: 0.5
            });
            this.mesh.material = highlightMaterial;
            this.isSelected = true;
        } else {
            this.mesh.material = this.originalMaterial;
            this.isSelected = false;
        }
    }

    setHovering(hovering) {
        if (!this.mesh || this.isSelected) return;

        if (hovering) {
            const hoverMaterial = this.originalMaterial.clone();
            hoverMaterial.emissiveIntensity = 0.3;
            this.mesh.material = hoverMaterial;
        } else {
            this.mesh.material = this.originalMaterial;
        }
    }

    animateToPosition(targetX, targetY, targetZ, duration = 0.3) {
        this.targetPosition = new THREE.Vector3(targetX, targetY, targetZ);
        this.animationStartTime = Date.now();
        this.animationDuration = duration * 1000;
        this.startPosition = this.mesh.position.clone();
    }

    updateAnimation() {
        if (!this.targetPosition) return false;

        const elapsed = Date.now() - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        const eased = this.easeInOutCubic(progress);

        this.mesh.position.lerpVectors(this.startPosition, this.targetPosition, eased);

        if (progress >= 1) {
            this.mesh.position.copy(this.targetPosition);
            this.targetPosition = null;
            this.enablePhysics();
            return true;
        }

        return false;
    }

    updatePhysics(deltaTime) {
        if (!this.isPhysicsEnabled || this.isAnimating()) return;

        this.velocity.y += this.gravity * deltaTime;

        const newPos = this.mesh.position.clone();
        newPos.x += this.velocity.x * deltaTime;
        newPos.y += this.velocity.y * deltaTime;
        newPos.z += this.velocity.z * deltaTime;

        const tableHeight = 0.2;
        if (newPos.y - this.height / 2 <= tableHeight) {
            newPos.y = tableHeight + this.height / 2;
            this.velocity.y = 0;
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }

        const tableBounds = { minX: -9, maxX: 9, minZ: -4, maxZ: 4 };
        if (newPos.x - this.radius < tableBounds.minX || newPos.x + this.radius > tableBounds.maxX) {
            this.velocity.x = 0;
            newPos.x = this.mesh.position.x;
        }
        if (newPos.z - this.radius < tableBounds.minZ || newPos.z + this.radius > tableBounds.maxZ) {
            this.velocity.z = 0;
            newPos.z = this.mesh.position.z;
        }

        const poleCollision = this.checkPoleCollisionPhysics(newPos);
        if (poleCollision) {
            newPos.copy(this.mesh.position);
            this.velocity.set(0, 0, 0);
            this.isPhysicsEnabled = false;
        }

        const diskCollision = this.checkDiskCollision(newPos);
        if (diskCollision) {
            newPos.y = diskCollision.y;
            this.velocity.y = 0;
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }

        this.mesh.position.copy(newPos);

        if (Math.abs(this.velocity.y) < 0.01 && Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.z) < 0.01) {
            this.velocity.set(0, 0, 0);
            if (newPos.y - this.height / 2 <= tableHeight + 0.01) {
                this.isPhysicsEnabled = false;
            }
        }
    }

    checkDiskCollision(newPos) {
        for (const otherDisk of this.allDisks) {
            if (otherDisk === this) continue;

            const otherPos = otherDisk.getMesh().position;
            const distanceXZ = Math.sqrt(
                Math.pow(newPos.x - otherPos.x, 2) +
                Math.pow(newPos.z - otherPos.z, 2)
            );

            if (distanceXZ < this.radius + otherDisk.radius) {
                const verticalDistance = Math.abs(newPos.y - otherPos.y);
                if (verticalDistance < this.height) {
                    const topY = otherPos.y + otherDisk.height / 2 + this.height / 2;
                    return { y: topY, disk: otherDisk };
                }
            }
        }

        return null;
    }

    checkPoleCollisionPhysics(newPos) {
        const diskBottom = newPos.y - this.height / 2;

        if (diskBottom > 5 || diskBottom < 0) return false;

        for (const tower of this.towers) {
            const towerPos = tower.getPosition();
            const distanceXZ = Math.sqrt(
                Math.pow(newPos.x - towerPos.x, 2) +
                Math.pow(newPos.z - towerPos.z, 2)
            );

            const poleEdgeDistance = distanceXZ - this.poleRadius;
            const holeEdgeDistance = this.holeRadius;

            if (distanceXZ > this.radius + this.poleRadius) {
                continue;
            }

            if (distanceXZ + this.poleRadius <= this.holeRadius) {
                continue;
            }

            return true;
        }

        return false;
    }

    checkPoleCollision(x, y, z) {
        if (y > 5 || y < 0) return false;

        for (const tower of this.towers) {
            const towerPos = tower.getPosition();
            const distanceXZ = Math.sqrt(
                Math.pow(x - towerPos.x, 2) +
                Math.pow(z - towerPos.z, 2)
            );

            if (distanceXZ > this.holeRadius) {
                continue;
            }

            if (distanceXZ + this.poleRadius < this.holeRadius) {
                continue;
            }

            return true;
        }

        return false;
    }

    enablePhysics() {
        this.isPhysicsEnabled = true;
        this.velocity.set(0, 0, 0);
    }

    disablePhysics() {
        this.isPhysicsEnabled = false;
        this.velocity.set(0, 0, 0);
    }

    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    isAnimating() {
        return this.targetPosition !== null;
    }

    getMesh() {
        return this.mesh;
    }

    getSize() {
        return this.size;
    }

    setTower(tower) {
        this.tower = tower;
    }

    getTower() {
        return this.tower;
    }
}
