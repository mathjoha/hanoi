export class UIController {
    constructor(gameState) {
        this.gameState = gameState;

        this.elements = {
            difficultySelector: document.getElementById('difficulty-selector'),
            resetButton: document.getElementById('reset-button'),
            controlPanel: document.getElementById('control-panel'),
            dismissButton: document.getElementById('dismiss-panel'),
            showButton: document.getElementById('show-panel'),
            winModal: document.getElementById('win-modal'),
            closeModal: document.getElementById('close-modal'),
            movesCount: document.getElementById('moves-count'),
            optimalCount: document.getElementById('optimal-count')
        };

        this.setupEventListeners();
        this.setupGameListeners();
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

        this.elements.closeModal.addEventListener('click', () => {
            this.elements.winModal.classList.add('hidden');
            this.gameState.reset();
        });
    }

    setupGameListeners() {
        console.log('Setting up game listeners in UIController');
        this.gameState.on('gameComplete', (data) => {
            console.log('UIController received gameComplete event:', data);
            this.showWinModal(data);
        });
    }

    showWinModal(data) {
        console.log('Showing win modal with data:', data);
        this.elements.movesCount.textContent = data.moves;
        this.elements.optimalCount.textContent = data.optimal;
        this.elements.winModal.classList.remove('hidden');
    }
}
