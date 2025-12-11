import { SceneManager } from './scene/SceneManager.js';
import { GameState } from './game/GameState.js';
import { DragController } from './interaction/DragController.js';
import { UIController } from './ui/UIController.js';

class HanoiGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.sceneManager = null;
        this.gameState = null;
        this.dragController = null;
        this.uiController = null;

        this.init();
    }

    init() {
        this.sceneManager = new SceneManager(this.canvas);

        this.gameState = new GameState(this.sceneManager);

        this.dragController = new DragController(
            this.canvas,
            this.sceneManager.getCamera(),
            this.gameState,
            this.sceneManager.getControls()
        );

        this.sceneManager.addToScene(this.dragController.getDragPlane());

        this.uiController = new UIController(this.gameState);

        this.sceneManager.startRenderLoop((deltaTime) => {
            this.update(deltaTime);
        });

        console.log('Towers of Hanoi game initialized!');
    }

    update(deltaTime) {
        this.gameState.update(deltaTime);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HanoiGame();
});
