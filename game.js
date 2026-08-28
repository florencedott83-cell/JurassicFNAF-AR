// Main Game Engine with FNAF AR Mechanics - Dinosaur Edition
class JurassicFNAFAR {
    constructor() {
        this.gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.currentNight = 1;
        this.score = 0;
        this.power = 100;
        this.maxPower = 100;
        this.health = 100;
        this.maxHealth = 100;
        this.time = 0; // Minutes into the night (0-480 = 8 hours)
        this.maxTime = 480;
        
        // Room system (like FNAF cameras)
        this.rooms = {
            'entrance': { name: 'Entrance', dinosaurs: [], power: 10 },
            'hallway_left': { name: 'Left Hallway', dinosaurs: [], power: 10 },
            'hallway_right': { name: 'Right Hallway', dinosaurs: [], power: 10 },
            'office': { name: 'Office', dinosaurs: [], power: 20, doorLeft: false, doorRight: false, lightsOn: false }
        };
        
        this.currentRoom = 'office';
        this.doorLeftActive = false;
        this.doorRightActive = false;
        this.lightsActive = false;
        
        this.arSupported = false;
        this.gameLoopRunning = false;
        
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
        } else {
            this.showFallbackMode();
        }
    }

    setupARCamera() {
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const drawFrame = () => {
            if (this.gameState === 'PLAYING') {
                // Draw camera feed
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Draw current room view
                this.drawRoomView(ctx);

                // Update game
                this.updateGame();
            }
            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    }

    drawRoomView(ctx) {
        const room = this.rooms[this.currentRoom];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Draw room name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 ${room.name}`, centerX, 50);

        // Draw dinosaurs in this room
        room.dinosaurs.forEach((dino, index) => {
            const angle = (index / room.dinosaurs.length) * Math.PI * 2;
            const distance = 150;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            // Draw dinosaur
            ctx.font = '64px Arial';
            ctx.fillText(dino.image, x - 32, y + 32);

            // Draw health bar
            const barWidth = 60;
            const barHeight = 5;
            const healthPercent = dino.currentHealth / dino.health;
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(x - barWidth/2, y - 50, barWidth, barHeight);
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.fillRect(x - barWidth/2, y - 50, barWidth * healthPercent, barHeight);

            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(dino.name, x, y + 50);
        });

        // Draw defense buttons
        const buttonY = window.innerHeight - 120;
        this.drawButton(ctx, 50, buttonY, 100, 60, this.doorLeftActive ? '🚪 CLOSE' : '🚪 LOCK', '#ff6600');
        this.drawButton(ctx, window.innerWidth - 150, buttonY, 100, 60, this.doorRightActive ? '🚪 CLOSE' : '🚪 LOCK', '#ff6600');
        this.drawButton(ctx, centerX - 50, buttonY, 100, 60, this.lightsActive ? '💡 OFF' : '💡 ON', '#ffff00');

        // Draw power warning if low
        if (this.power < 20) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ LOW POWER ⚠', centerX, 100);
        }
    }

    drawButton(ctx, x, y, width, height, text, color) {
        // Background
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width/2, y + height/2);
    }

    updateGame() {
        // Time passes
        this.time += 0.1;
        
        // Power consumption
        if (this.doorLeftActive) this.power -= 0.05;
        if (this.doorRightActive) this.power -= 0.05;
        if (this.lightsActive) this.power -= 0.03;
        
        this.power = Math.max(0, this.power);

        // Spawn dinosaurs randomly
        if (Math.random() < 0.005) {
            this.spawnDinosaurInRoom();
        }

        // Dinosaur behavior
        Object.keys(this.rooms).forEach(roomId => {
            const room = this.rooms[roomId];
            room.dinosaurs.forEach((dino, index) => {
                dino.moveCounter = (dino.moveCounter || 0) + 1;

                // Move towards office if power runs out or doors open
                if (this.power === 0) {
                    dino.movesTowardOffice = true;
                }

                if (dino.movesTowardOffice) {
                    if (roomId !== 'office' && Math.random() < 0.02) {
                        this.moveDinosaurCloser(roomId, dino);
                    }
                }

                // Attack doors or lights
                if (roomId === 'office') {
                    if (this.doorLeftActive && Math.random() < 0.01) {
                        dino.currentHealth -= 5; // Damage from hitting door
                    }
                    if (this.lightsActive && Math.random() < 0.01) {
                        dino.currentHealth -= 3;
                    }
                }

                // Remove if dead
                if (dino.currentHealth <= 0) {
                    this.score += Math.floor(dino.threat * 10);
                    room.dinosaurs.splice(index, 1);
                    this.showKillNotification(dino.name);
                }
            });
        });

        // Check game over
        if (this.power === 0 && !this.doorLeftActive && !this.doorRightActive) {
            // Dinosaurs attack
            Object.keys(this.rooms).forEach(roomId => {
                this.rooms[roomId].dinosaurs.forEach(dino => {
                    this.health -= dino.attack * 0.01;
                });
            });
        }

        if (this.health <= 0) {
            this.gameOver();
            return;
        }

        // Check if survived the night
        if (this.time >= this.maxTime) {
            this.surviveNight();
        }

        this.updateHUD();
    }

    spawnDinosaurInRoom() {
        const roomKeys = Object.keys(this.rooms).filter(r => r !== 'office');
        const randomRoom = roomKeys[Math.floor(Math.random() * roomKeys.length)];
        
        const dinoKeys = Object.keys(DINOSAURS);
        const randomDinoKey = dinoKeys[Math.floor(Math.random() * dinoKeys.length)];
        
        const dino = spawnDinosaur(randomDinoKey);
        this.rooms[randomRoom].dinosaurs.push(dino);
        
        // Alert
        const alert = document.getElementById('detection-alert');
        const text = document.getElementById('alert-text');
        text.textContent = `${dino.name} detected in ${this.rooms[randomRoom].name}!`;
        alert.classList.remove('hidden');
        setTimeout(() => alert.classList.add('hidden'), 2000);
    }

    moveDinosaurCloser(fromRoom, dino) {
        // Move dino closer to office through rooms
        const moveChance = Math.random();
        
        if (fromRoom === 'entrance' && moveChance < 0.5) {
            this.rooms['hallway_left'].dinosaurs.push(dino);
        } else if (fromRoom === 'entrance') {
            this.rooms['hallway_right'].dinosaurs.push(dino);
        } else if ((fromRoom === 'hallway_left' || fromRoom === 'hallway_right') && moveChance < 0.3) {
            this.rooms['office'].dinosaurs.push(dino);
        }
        
        this.rooms[fromRoom].dinosaurs = this.rooms[fromRoom].dinosaurs.filter(d => d !== dino);
    }

    toggleDoorLeft() {
        if (this.power > 15) {
            this.doorLeftActive = !this.doorLeftActive;
            this.power -= 5;
        }
    }

    toggleDoorRight() {
        if (this.power > 15) {
            this.doorRightActive = !this.doorRightActive;
            this.power -= 5;
        }
    }

    toggleLights() {
        if (this.power > 10) {
            this.lightsActive = !this.lightsActive;
            this.power -= 3;
        }
    }

    showKillNotification(dinoName) {
        const alert = document.getElementById('detection-alert');
        const text = document.getElementById('alert-text');
        text.textContent = `${dinoName} defeated!`;
        alert.classList.remove('hidden');
        setTimeout(() => alert.classList.add('hidden'), 1500);
    }

    changeRoom(roomId) {
        this.currentRoom = roomId;
    }

    updateHUD() {
        // Power
        const powerPercent = (this.power / this.maxPower) * 100;
        document.getElementById('health-fill').style.width = powerPercent + '%';

        // Health
        const healthPercent = (this.health / this.maxHealth) * 100;
        document.getElementById('threat-meter').style.width = healthPercent + '%';

        // Time
        const hours = Math.floor(this.time / 60);
        const minutes = Math.floor(this.time % 60);
        document.getElementById('ammo-count').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;

        // Night
        document.getElementById('wave-number').textContent = this.currentNight;

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
        const canvas = document.getElementById('game-canvas');
        
        // Click detection for buttons
        canvas.addEventListener('click', (e) => {
            if (this.gameState !== 'PLAYING') return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const buttonY = window.innerHeight - 120;
            
            // Left door button
            if (x > 50 && x < 150 && y > buttonY && y < buttonY + 60) {
                this.toggleDoorLeft();
            }
            
            // Right door button
            if (x > window.innerWidth - 150 && x < window.innerWidth - 50 && y > buttonY && y < buttonY + 60) {
                this.toggleDoorRight();
            }
            
            // Lights button
            if (x > window.innerWidth/2 - 50 && x < window.innerWidth/2 + 50 && y > buttonY && y < buttonY + 60) {
                this.toggleLights();
            }

            // Room selection (top area)
            if (y < 100) {
                // Quick room switching
                if (x < window.innerWidth / 4) this.changeRoom('entrance');
                else if (x < window.innerWidth / 2) this.changeRoom('hallway_left');
                else if (x < 3 * window.innerWidth / 4) this.changeRoom('hallway_right');
                else this.changeRoom('office');
            }
        });

        // Touch support for mobile
        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const buttonY = window.innerHeight - 120;
            
            if (x > 50 && x < 150 && y > buttonY && y < buttonY + 60) {
                this.toggleDoorLeft();
            }
            if (x > window.innerWidth - 150 && x < window.innerWidth - 50 && y > buttonY && y < buttonY + 60) {
                this.toggleDoorRight();
            }
            if (x > window.innerWidth/2 - 50 && x < window.innerWidth/2 + 50 && y > buttonY && y < buttonY + 60) {
                this.toggleLights();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'PLAYING') return;
            
            if (e.key === 'q') this.changeRoom('entrance');
            if (e.key === 'w') this.changeRoom('hallway_left');
            if (e.key === 'e') this.changeRoom('hallway_right');
            if (e.key === 'r') this.changeRoom('office');
            if (e.key === 'a') this.toggleDoorLeft();
            if (e.key === 's') this.toggleLights();
            if (e.key === 'd') this.toggleDoorRight();
        });
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.currentNight = 1;
        this.score = 0;
        this.power = 100;
        this.health = 100;
        this.time = 0;
        this.rooms = {
            'entrance': { name: 'Entrance', dinosaurs: [], power: 10 },
            'hallway_left': { name: 'Left Hallway', dinosaurs: [], power: 10 },
            'hallway_right': { name: 'Right Hallway', dinosaurs: [], power: 10 },
            'office': { name: 'Office', dinosaurs: [], power: 20, doorLeft: false, doorRight: false, lightsOn: false }
        };
        this.currentRoom = 'office';
        this.doorLeftActive = false;
        this.doorRightActive = false;
        this.lightsActive = false;

        document.getElementById('game-menu').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('ar-view').classList.remove('hidden');
    }

    surviveNight() {
        this.currentNight++;
        this.score += Math.floor(this.power * 10 + this.health * 5);
        this.health = this.maxHealth;
        this.power = this.maxPower;
        this.time = 0;
        
        if (this.currentNight > 8) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState = 'GAMEOVER';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('waves-survived').textContent = this.currentNight - 1;
        document.getElementById('dinos-defeated').textContent = Object.keys(this.rooms).reduce((sum, key) => sum, 0);
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
        alert('Settings:\n- Sound: ON/OFF\n- Difficulty: NORMAL/HARD/INSANE\n- Graphics: LOW/HIGH\n\nControls:\nQ/W/E/R - Switch rooms\nA - Left Door\nS - Lights\nD - Right Door');
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
        ctx.fillText('Running in simulation mode.', canvas.width / 2, canvas.height / 2);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new JurassicFNAFAR();
});
