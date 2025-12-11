export class UIController {
    constructor(gameState) {
        this.gameState = gameState;

        this.elements = {
            difficultySelector: document.getElementById('difficulty-selector'),
            resetButton: document.getElementById('reset-button'),
            controlPanel: document.getElementById('control-panel'),
            dismissButton: document.getElementById('dismiss-panel'),
            showButton: document.getElementById('show-panel')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.difficultySelector.addEventListener('change', () => {
            const diskCount = parseInt(this.elements.difficultySelector.value);
            this.gameState.reset(diskCount);
        });

        this.elements.resetButton.addEventListener('click', () => {
            this.gameState.reset();
        });

        this.elements.dismissButton.addEventListener('click', () => {
            this.elements.controlPanel.classList.add('hidden');
            this.elements.showButton.classList.remove('hidden');
        });

        this.elements.showButton.addEventListener('click', () => {
            this.elements.controlPanel.classList.remove('hidden');
            this.elements.showButton.classList.add('hidden');
        });
    }
}
