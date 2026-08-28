// Main Game Engine with AR Support
class JurassicFNAFAR {
    constructor() {
        this.gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.currentWave = 1;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 30;
        this.maxAmmo = 120;
        this.dinosaurs = [];
        this.dinosDefeated = 0;
        this.threatLevel = 0;
        this.arSupported = false;
        
        this.initializeAR();
        this.setupEventListeners();
        this.setupUI();
    }

    async initializeAR() {
        // Check for AR support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                this.arSupported = true;
                const video = document.getElementById('camera-feed');
                video.srcObject = stream;
                this.setupARCamera();
            } catch (err) {
                console.warn('AR not available:', err);
                this.showFallbackMode();
            }
        }
    }

    setupARCamera() {
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // DeviceOrientation for mobile AR
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.deviceRotation = {
                    alpha: e.alpha,
                    beta: e.beta,
                    gamma: e.gamma
                };
            });
        }

        const drawFrame = () => {
            if (this.gameState === 'PLAYING') {
                // Draw camera feed
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Draw dinosaurs
                this.dinosaurs.forEach(dino => {
                    this.drawDinosaur(ctx, dino);
                });

                // Update game
                this.updateGame();
            }
            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    }

    drawDinosaur(ctx, dino) {
        // Calculate position based on screen size
        const size = 60;
        
        // Draw dinosaur representation (emoji + health bar)
        ctx.font = '48px Arial';
        ctx.fillText(dino.image, dino.x - 24, dino.y + 24);

        // Health bar
        const barWidth = 50;
        const barHeight = 5;
        const barX = dino.x - barWidth / 2;
        const barY = dino.y - 40;

        // Background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthPercent = dino.currentHealth / dino.health;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Name
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(dino.name, dino.x, dino.y + 50);
    }

    updateGame() {
        // Update dinosaur positions
        this.dinosaurs.forEach((dino, index) => {
            // Move towards player (center)
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const dx = centerX - dino.x;
            const dy = centerY - dino.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                dino.x += (dx / distance) * dino.speed;
                dino.y += (dy / distance) * dino.speed;
            }

            // Check if dinosaur reached player
            if (distance < 50) {
                const damageDealt = dino.attack;
                this.takeDamage(damageDealt);
                this.dinosaurs.splice(index, 1);
            }

            // Remove if off screen
            if (dino.x < -100 || dino.x > window.innerWidth + 100 ||
                dino.y < -100 || dino.y > window.innerHeight + 100) {
                this.dinosaurs.splice(index, 1);
            }
        });

        // Update threat level
        this.updateThreatLevel();

        // Check wave completion
        if (this.dinosaurs.length === 0) {
            this.startNextWave();
        }

        // Update HUD
        this.updateHUD();
    }

    updateThreatLevel() {
        this.threatLevel = 0;
        this.dinosaurs.forEach(dino => {
            this.threatLevel += dino.threat;
        });
        this.threatLevel = Math.min(this.threatLevel, 100);
    }

    shootDinosaur(dinosaurIndex) {
        if (this.ammo <= 0) return;

        if (this.dinosaurs[dinosaurIndex]) {
            const dino = this.dinosaurs[dinosaurIndex];
            dino.currentHealth -= 25; // Damage per shot

            this.ammo--;

            // Add visual feedback
            this.showDamageEffect(dino.x, dino.y);

            if (dino.currentHealth <= 0) {
                // Dinosaur defeated
                const points = Math.floor(dino.threat * 10 * (1 + this.currentWave * 0.1));
                this.score += points;
                this.dinosDefeated++;
                this.dinosaurs.splice(dinosaurIndex, 1);

                // Show kill notification
                this.showKillNotification(dino.name, points);
            }
        }

        // Reload check
        if (this.ammo === 0 && this.dinosDefeated % 5 === 0) {
            this.reload();
        }
    }

    showDamageEffect(x, y) {
        // Visual feedback for hit
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    showKillNotification(dinoName, points) {
        const alert = document.getElementById('detection-alert');
        const text = document.getElementById('alert-text');
        text.textContent = `${dinoName} DEFEATED! +${points}`;
        alert.classList.remove('hidden');
        setTimeout(() => alert.classList.add('hidden'), 2000);
    }

    startNextWave() {
        this.currentWave++;
        const waveData = getWave(this.currentWave);

        if (!waveData) {
            this.gameOver();
            return;
        }

        // Spawn dinosaurs
        waveData.dinosaurs.forEach(dinoId => {
            const dino = spawnDinosaur(dinoId);
            this.dinosaurs.push(dino);
        });

        // Show wave alert
        this.showWaveAlert(this.currentWave);
    }

    showWaveAlert(waveNumber) {
        const alert = document.getElementById('detection-alert');
        const text = document.getElementById('alert-text');
        text.textContent = `WAVE ${waveNumber} - INCOMING DINOSAURS!`;
        alert.classList.remove('hidden');
        setTimeout(() => alert.classList.add('hidden'), 3000);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.gameOver();
        }
    }

    reload() {
        this.ammo = this.maxAmmo;
    }

    updateHUD() {
        // Health
        const healthPercent = (this.health / this.maxHealth) * 100;
        document.getElementById('health-fill').style.width = healthPercent + '%';

        // Threat
        document.getElementById('threat-meter').style.width = this.threatLevel + '%';

        // Ammo
        document.getElementById('ammo-count').textContent = `${this.ammo}/${this.maxAmmo}`;

        // Wave
        document.getElementById('wave-number').textContent = this.currentWave;

        // Score
        document.getElementById('score').textContent = this.score;
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('bestiary-btn').addEventListener('click', () => this.showBestiary());
        document.getElementById('back-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
    }

    setupEventListeners() {
        // Tap to shoot
        document.getElementById('game-canvas').addEventListener('click', (e) => {
            if (this.gameState !== 'PLAYING') return;

            const rect = document.getElementById('game-canvas').getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicked on dinosaur
            for (let i = 0; i < this.dinosaurs.length; i++) {
                const dino = this.dinosaurs[i];
                const dist = Math.sqrt(Math.pow(x - dino.x, 2) + Math.pow(y - dino.y, 2));
                if (dist < 40) {
                    this.shootDinosaur(i);
                    return;
                }
            }
        });

        // Mobile touch support
        document.getElementById('game-canvas').addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = document.getElementById('game-canvas').getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            for (let i = 0; i < this.dinosaurs.length; i++) {
                const dino = this.dinosaurs[i];
                const dist = Math.sqrt(Math.pow(x - dino.x, 2) + Math.pow(y - dino.y, 2));
                if (dist < 40) {
                    this.shootDinosaur(i);
                    return;
                }
            }
        });
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.currentWave = 1;
        this.score = 0;
        this.health = this.maxHealth;
        this.ammo = this.maxAmmo;
        this.dinosaurs = [];
        this.dinosDefeated = 0;

        document.getElementById('game-menu').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('ar-view').classList.remove('hidden');

        this.startNextWave();
    }

    gameOver() {
        this.gameState = 'GAMEOVER';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('waves-survived').textContent = this.currentWave - 1;
        document.getElementById('dinos-defeated').textContent = this.dinosDefeated;
        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('ar-view').classList.add('hidden');
    }

    showMenu() {
        this.gameState = 'MENU';
        document.getElementById('game-menu').classList.remove('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('bestiary-screen').classList.add('hidden');
        document.getElementById('ar-view').classList.add('hidden');
    }

    showBestiary() {
        document.getElementById('game-menu').classList.add('hidden');
        document.getElementById('bestiary-screen').classList.remove('hidden');
        this.populateBestiary();
    }

    populateBestiary() {
        const list = document.getElementById('bestiary-list');
        list.innerHTML = '';

        Object.keys(DINOSAURS).forEach(key => {
            const dino = DINOSAURS[key];
            const div = document.createElement('div');
            div.className = 'bestiary-entry';
            div.innerHTML = `
                <div class="dino-entry">
                    <span class="dino-emoji">${dino.image}</span>
                    <div class="dino-info">
                        <h3>${dino.name}</h3>
                        <p>${dino.description}</p>
                        <div class="dino-stats">
                            <span>Rarity: ${dino.rarity}</span>
                            <span>Health: ${dino.health}</span>
                            <span>Attack: ${dino.attack}</span>
                            <span>Speed: ${dino.speed}</span>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    showSettings() {
        alert('Settings:\n- Sound: ON/OFF\n- Difficulty: NORMAL/HARD/INSANE\n- Graphics: LOW/HIGH\n\nMore coming soon!');
    }

    showFallbackMode() {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AR not available. Running in simulation mode.', canvas.width / 2, canvas.height / 2);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new JurassicFNAFAR();
});
