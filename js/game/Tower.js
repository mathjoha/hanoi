import * as THREE from 'three';

export class Tower {
    constructor(index, position) {
        this.index = index;
        this.position = position;
        this.disks = [];
        this.mesh = null;
        this.originalMaterial = null;
        this.isHighlighted = false;

        this.createMesh();
    }

    createMesh() {
        const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 16);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            roughness: 0.5,
            metalness: 0.7
        });

        this.mesh = new THREE.Mesh(poleGeometry, poleMaterial);
        this.mesh.position.set(this.position.x, 2.5, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.tower = this;

        this.originalMaterial = poleMaterial;

        const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x444455,
            roughness: 0.6,
            metalness: 0.6
        });

        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(this.position.x, 0.15, this.position.z);
        base.castShadow = true;
        base.receiveShadow = true;

        this.mesh.userData.base = base;
    }

    addDisk(disk) {
        this.disks.push(disk);
        disk.setTower(this);
        this.updateDiskPosition(disk);
    }

    removeDisk() {
        return this.disks.pop();
    }

    getTopDisk() {
        if (this.disks.length === 0) return null;
        return this.disks[this.disks.length - 1];
    }

    hasDisk(disk) {
        return this.disks.includes(disk);
    }

    getDiskCount() {
        return this.disks.length;
    }

    updateDiskPosition(disk) {
        const diskIndex = this.disks.indexOf(disk);
        const y = 0.4 + diskIndex * 0.4;
        disk.setPosition(this.position.x, y, this.position.z);
    }

    updateAllDiskPositions() {
        this.disks.forEach((disk, index) => {
            const y = 0.4 + index * 0.4;
            disk.setPosition(this.position.x, y, this.position.z);
        });
    }

    getPositionForNewDisk() {
        const y = 0.4 + this.disks.length * 0.4;
        return new THREE.Vector3(this.position.x, y, this.position.z);
    }

    setHighlighted(highlighted) {
        if (!this.mesh) return;

        if (highlighted && !this.isHighlighted) {
            const highlightMaterial = new THREE.MeshStandardMaterial({
                color: 0x00d4ff,
                emissive: 0x00d4ff,
                emissiveIntensity: 0.5,
                roughness: 0.3,
                metalness: 0.9
            });
            this.mesh.material = highlightMaterial;
            this.isHighlighted = true;
        } else if (!highlighted && this.isHighlighted) {
            this.mesh.material = this.originalMaterial;
            this.isHighlighted = false;
        }
    }

    canAcceptDisk(disk) {
        if (this.disks.length === 0) return true;
        const topDisk = this.getTopDisk();
        return disk.getSize() < topDisk.getSize();
    }

    getMesh() {
        return this.mesh;
    }

    getBase() {
        return this.mesh.userData.base;
    }

    getPosition() {
        return this.position;
    }

    getIndex() {
        return this.index;
    }

    clear() {
        this.disks = [];
    }
}
