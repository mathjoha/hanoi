import * as THREE from 'three';
import { Tower } from './Tower.js';
import { Disk } from './Disk.js';

export class GameState {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.towers = [];
        this.disks = [];
        this.diskCount = 5;
        this.moveCount = 0;
        this.isComplete = false;
        this.isSolving = false;
        this.selectedDisk = null;
        this.listeners = {};

        this.init();
    }

    init() {
        this.createTowers();
        this.createDisks(this.diskCount);
    }

    createTowers() {
        this.towers = [];
        const positions = [
            new THREE.Vector3(-6, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(6, 0, 0)
        ];

        positions.forEach((pos, index) => {
            const tower = new Tower(index, pos);
            this.towers.push(tower);
            this.sceneManager.addToScene(tower.getMesh());
            this.sceneManager.addToScene(tower.getBase());
        });
    }

    createDisks(count) {
        this.disks.forEach(disk => {
            this.sceneManager.removeFromScene(disk.getMesh());
        });

        this.disks = [];
        this.towers.forEach(tower => tower.clear());

        for (let i = count; i >= 1; i--) {
            const disk = new Disk(i, count, this.towers, this.disks);
            this.disks.push(disk);
            this.sceneManager.addToScene(disk.getMesh());

            // Set up callback for when disk is placed via physics
            disk.setOnDiskPlaced(() => {
                this.moveCount++;
                this.emit('moveCountChanged', this.moveCount);
                this.checkWinCondition();
            });
        }

        for (let i = 0; i < this.disks.length; i++) {
            const disk = this.disks[i];
            const y = 0.4 + i * 0.4;
            const towerPos = this.towers[0].getPosition();
            disk.setPosition(towerPos.x, y, towerPos.z);
            this.towers[0].addDisk(disk);
        }

        this.moveCount = 0;
        this.isComplete = false;
        this.selectedDisk = null;
        this.emit('moveCountChanged', this.moveCount);
        this.emit('optimalMovesChanged', this.getOptimalMoves());
    }

    reset(diskCount = this.diskCount) {
        this.diskCount = diskCount;
        this.isSolving = false;
        this.createDisks(diskCount);
    }

    validateMove(sourceTower, destTower) {
        if (sourceTower === destTower) return false;
        if (sourceTower.getDiskCount() === 0) return false;

        const disk = sourceTower.getTopDisk();
        return destTower.canAcceptDisk(disk);
    }

    moveDisk(sourceTower, destTower) {
        if (!this.validateMove(sourceTower, destTower)) {
            return false;
        }

        const disk = sourceTower.removeDisk();
        destTower.addDisk(disk);

        this.moveCount++;
        this.emit('moveCountChanged', this.moveCount);

        this.checkWinCondition();

        return true;
    }

    checkWinCondition() {
        const targetTower = this.towers[2];

        console.log('Checking win condition...');
        console.log('Target tower disk count:', targetTower.getDiskCount());
        console.log('Total disk count:', this.diskCount);

        if (targetTower.getDiskCount() === this.diskCount) {
            const disksInOrder = targetTower.disks.every((disk, index, arr) => {
                if (index === 0) return true;
                return disk.getSize() < arr[index - 1].getSize();
            });

            console.log('Disks in order:', disksInOrder);

            if (disksInOrder) {
                this.isComplete = true;
                console.log('Game complete! Emitting event...');
                this.emit('gameComplete', {
                    moves: this.moveCount,
                    optimal: this.getOptimalMoves()
                });
            }
        }
    }

    getOptimalMoves() {
        return Math.pow(2, this.diskCount) - 1;
    }

    getTowers() {
        return this.towers;
    }

    getDisks() {
        return this.disks;
    }

    getTower(index) {
        return this.towers[index];
    }

    setSelectedDisk(disk) {
        if (this.selectedDisk) {
            this.selectedDisk.setHighlighted(false);
        }

        this.selectedDisk = disk;

        if (disk) {
            disk.setHighlighted(true);
        }
    }

    getSelectedDisk() {
        return this.selectedDisk;
    }

    clearSelection() {
        this.setSelectedDisk(null);
    }

    setSolving(solving) {
        this.isSolving = solving;
    }

    isSolvingGame() {
        return this.isSolving;
    }

    getMoveCount() {
        return this.moveCount;
    }

    getDiskCount() {
        return this.diskCount;
    }

    isGameComplete() {
        return this.isComplete;
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    update(deltaTime = 0.016) {
        this.disks.forEach(disk => {
            if (disk.isAnimating()) {
                disk.updateAnimation();
            }
            disk.updatePhysics(deltaTime);
        });
    }
}
