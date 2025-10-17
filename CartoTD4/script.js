const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });

// Références aux éléments de l'interface utilisateur
const infoDiv = document.getElementById('info');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const menuContainer = document.getElementById('menuContainer');
const playButton = document.getElementById('playButton');
const skinsButton = document.getElementById('skinsButton');
const skinsContainer = document.getElementById('skinsContainer');
const skinsList = document.getElementById('skinsList');
const backToMenuButton = document.getElementById('backToMenuButton');

let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;

let gameScene;
let menuScene;
let isGameRunning = false;
let keydownHandler; 

// --- GESTION DES SKINS (inchangé) ---
const skins = [
    { id: 'blue', name: 'Classique', color: new BABYLON.Color3(0.2, 0.4, 0.8) },
    { id: 'red', name: 'Rubis', color: new BABYLON.Color3(0.8, 0.2, 0.2) },
    { id: 'green', name: 'Émeraude', color: new BABYLON.Color3(0.2, 0.8, 0.4) },
    { id: 'purple', name: 'Améthyste', color: new BABYLON.Color3(0.6, 0.2, 0.8) },
    { id: 'gold', name: 'Or', color: new BABYLON.Color3(1, 0.84, 0) }
];
let selectedSkinId = localStorage.getItem('selectedSkinId') || 'blue';

function populateSkinsList() {
    skinsList.innerHTML = '';
    skins.forEach(skin => {
        const isSelected = skin.id === selectedSkinId;
        const skinItem = document.createElement('div');
        skinItem.className = 'skin-item';
        if (isSelected) skinItem.classList.add('selected');
        const skinName = document.createElement('h3');
        skinName.textContent = skin.name;
        skinItem.appendChild(skinName);
        const skinPreview = document.createElement('div');
        skinPreview.className = 'skin-preview';
        skinPreview.style.backgroundColor = `rgb(${skin.color.r * 255}, ${skin.color.g * 255}, ${skin.color.b * 255})`;
        skinItem.appendChild(skinPreview);
        skinItem.onclick = () => {
            selectedSkinId = skin.id;
            localStorage.setItem('selectedSkinId', selectedSkinId);
            const currentSkin = skins.find(s => s.id === selectedSkinId);
            if(menuScene && menuScene.getMeshByName("menuCube")){
                 menuScene.getMeshByName("menuCube").material.diffuseColor = currentSkin.color;
            }
            populateSkinsList();
        };
        skinsList.appendChild(skinItem);
    });
}


// --- SCÈNE DU JEU ---
const createGameScene = function () {
    gameScene = new BABYLON.Scene(engine);

    // ... Le reste de la configuration de la scène est identique
    const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 6, 10), gameScene);
    camera.radius = 12; 
    camera.heightOffset = 5;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 20;
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), gameScene);
    light.intensity = 0.8;
    const light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, 1.0), gameScene);
    light2.position = new BABYLON.Vector3(0, 5, -5);
    const player = BABYLON.MeshBuilder.CreateBox("player", {size: 1.5}, gameScene);
    player.position = new BABYLON.Vector3(0, 0.75, 0);
    const playerMaterial = new BABYLON.StandardMaterial("playerMat", gameScene);
    const currentSkin = skins.find(s => s.id === selectedSkinId);
    playerMaterial.diffuseColor = currentSkin.color;
    player.material = playerMaterial;
    camera.lockedTarget = player;
    let lanes = [-3, 0, 3];
    let currentLane = 1;
    player.position.x = lanes[currentLane];
    let gameSpeed = 0.5;
    let score = 0;
    let isGameOver = false;
    const groundLevel = 0.75;
    let isJumping = false;
    let jumpVelocity = 0;
    const jumpForce = 0.55;
    const gravity = -0.04;
    let isSliding = false;
    let slideTimer = 0;
    const slideDuration = 45;
    const createTrack = (positionZ) => {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 12, height: 20}, gameScene);
        ground.position.z = positionZ;
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", gameScene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        ground.material = groundMaterial;
        return ground;
    };
    let tracks = [];
    for (let i = 0; i < 10; i++) {
        tracks.push(createTrack(i * 20));
    }
    let obstacles = [];
    let rewards = [];
    let trains = [];
    const trainHeight = 3;
    const trainWidth = 2.5;
    const createObstacle = (position, isHigh = false) => {
        const obstacle = BABYLON.MeshBuilder.CreateBox("obstacle", {size: 1.5}, gameScene);
        obstacle.position = isHigh ? new BABYLON.Vector3(position.x, 2.5, position.z) : position;
        const mat = new BABYLON.StandardMaterial("obsMat", gameScene);
        mat.diffuseColor = isHigh ? new BABYLON.Color3(0.9, 0.6, 0.1) : new BABYLON.Color3(0.8, 0.2, 0.2);
        obstacle.material = mat;
        obstacles.push(obstacle);
    };
    const createReward = (position) => {
        const reward = BABYLON.MeshBuilder.CreateTorus("reward", { diameter: 1.5, thickness: 0.3, tessellation: 16 }, gameScene);
        reward.position = position;
        reward.rotation.x = Math.PI / 2;
        const rewardMaterial = new BABYLON.StandardMaterial("rewardMat", gameScene);
        rewardMaterial.diffuseColor = new BABYLON.Color3.Yellow();
        rewardMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0);
        reward.material = rewardMaterial;
        rewards.push(reward);
    };
    const createTrain = (laneIndex, zPosition, length = 20, speed = 0) => {
        const train = BABYLON.MeshBuilder.CreateBox("train", { width: trainWidth, height: trainHeight, depth: length }, gameScene);
        train.position = new BABYLON.Vector3(lanes[laneIndex], trainHeight / 2, zPosition);
        const trainMaterial = new BABYLON.StandardMaterial("trainMat", gameScene);
        trainMaterial.diffuseColor = Math.random() > 0.5 ? new BABYLON.Color3(0.8, 0.1, 0.1) : new BABYLON.Color3(0.1, 0.1, 0.8);
        train.material = trainMaterial;
        train.speed = speed;
        train.length = length;
        trains.push(train);
        return train;
    };

    // --- CONTRÔLES CLAVIER ---
    const handleKeyDown = (e) => {
        if (isGameOver || !isGameRunning) return;
        const key = e.key.toLowerCase();
        if ((key === 'arrowleft' || key === 'q') && currentLane > 0) currentLane--;
        else if ((key === 'arrowright' || key === 'd') && currentLane < lanes.length - 1) currentLane++;
        else if ((key === 'arrowup' || key === ' ' || key === 'z') && !isJumping && !isSliding) {
            isJumping = true;
            jumpVelocity = jumpForce;
        } else if ((key === 'arrowdown' || key === 's') && !isJumping && !isSliding) {
            isSliding = true;
            slideTimer = slideDuration;
            player.scaling.y = 0.5;
            player.position.y -= 0.375;
        }
    };
    keydownHandler = handleKeyDown;
    window.addEventListener('keydown', keydownHandler);
    
    // --- NOUVEAU : CONTRÔLES TACTILES ---
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (isGameOver || !isGameRunning) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // On vérifie si le mouvement est principalement horizontal ou vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Swipe horizontal
            if (Math.abs(deltaX) > 30) { // Seuil de détection
                if (deltaX > 0 && currentLane < lanes.length - 1) { // Droite
                    currentLane++;
                } else if (deltaX < 0 && currentLane > 0) { // Gauche
                    currentLane--;
                }
            }
        } else {
            // Swipe vertical
            if (Math.abs(deltaY) > 30) { // Seuil de détection
                if (deltaY < 0 && !isJumping && !isSliding) { // Haut (saut)
                    isJumping = true;
                    jumpVelocity = jumpForce;
                } else if (deltaY > 0 && !isJumping && !isSliding) { // Bas (glissade)
                    isSliding = true;
                    slideTimer = slideDuration;
                    player.scaling.y = 0.5;
                    player.position.y -= 0.375;
                }
            }
        }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    // ------------------------------------

    const gameOver = () => {
        isGameOver = true;
        isGameRunning = false;
        gameSpeed = 0;

        // --- NOUVEAU : Nettoyage des écouteurs tactiles ---
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        // -------------------------------------------

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            highScoreElement.textContent = highScore;
        }
        alert("Game Over! Score: " + score);
        menuContainer.style.display = 'flex';
        infoDiv.style.display = 'none';
        playButton.textContent = 'Rejouer';
    };
    
    // Le reste du code de la boucle de jeu est identique...
    gameScene.onBeforeRenderObservable.add(() => {
        if (!isGameOver && isGameRunning) {
            player.position.z += gameSpeed;
            player.position.x = BABYLON.Scalar.Lerp(player.position.x, lanes[currentLane], 0.1);
            let effectiveGroundLevel = groundLevel;
            let playerIsOnPlatform = false;
            for (const train of trains) {
                if (Math.abs(player.position.x - train.position.x) < trainWidth / 2 &&
                    player.position.z > train.position.z - train.length / 2 &&
                    player.position.z < train.position.z + train.length / 2) {
                    if (player.position.y >= trainHeight && jumpVelocity <= 0) {
                        effectiveGroundLevel = trainHeight + 0.75;
                        playerIsOnPlatform = true;
                        player.position.z += train.speed;
                        break;
                    }
                }
            }
            if (isJumping) {
                const nextY = player.position.y + jumpVelocity;
                if (playerIsOnPlatform && nextY <= effectiveGroundLevel && player.position.y >= effectiveGroundLevel) {
                    player.position.y = effectiveGroundLevel;
                    isJumping = false;
                    jumpVelocity = 0;
                } else {
                    player.position.y = nextY;
                    jumpVelocity += gravity;
                    if (!playerIsOnPlatform && player.position.y <= groundLevel) {
                        player.position.y = groundLevel;
                        isJumping = false;
                        jumpVelocity = 0;
                    }
                }
            } else if (!playerIsOnPlatform && player.position.y > groundLevel) {
                 isJumping = true;
                 jumpVelocity = 0;
            }
            if (isSliding) {
                slideTimer--;
                if (slideTimer <= 0) {
                    isSliding = false;
                    player.scaling.y = 1;
                    player.position.y += 0.375;
                }
            }
            tracks.forEach(track => {
                if (track.position.z < player.position.z - 20) {
                    track.position.z += 20 * tracks.length;
                }
            });
            if (Math.random() < 0.06) {
                const spawnZ = player.position.z + 70;
                const randomLaneIndex = Math.floor(Math.random() * 3);
                if (Math.random() < 0.4 && trains.length < 5) {
                    const trainType = Math.floor(Math.random() * 2);
                    if (trainType === 0) createTrain(randomLaneIndex, spawnZ, 25, 0);
                    else createTrain(randomLaneIndex, spawnZ + 20, 20, -gameSpeed * 0.5);
                } else {
                     const hasHighObstacle = Math.random() < 0.4;
                     createObstacle(new BABYLON.Vector3(lanes[randomLaneIndex], groundLevel, spawnZ), hasHighObstacle);
                }
            }
            if (Math.random() < 0.07) {
                createReward(new BABYLON.Vector3(lanes[Math.floor(Math.random() * 3)], groundLevel + 0.5, player.position.z + 50));
            }
            for (let i = rewards.length - 1; i >= 0; i--) {
                if (player.intersectsMesh(rewards[i], false)) {
                    score += 10;
                    scoreElement.textContent = score;
                    rewards[i].dispose();
                    rewards.splice(i, 1);
                }
            }
            for (const train of trains) {
                if (player.intersectsMesh(train, false)) {
                    if (player.position.y < train.position.y + trainHeight / 2 - 0.1) {
                        gameOver();
                    }
                }
            }
            obstacles.forEach(obstacle => {
                if (player.intersectsMesh(obstacle, false)) {
                    gameOver();
                }
            });
            for (let i = trains.length - 1; i >= 0; i--) {
                trains[i].position.z += trains[i].speed;
                if (trains[i].position.z < player.position.z - trains[i].length) {
                    trains[i].dispose();
                    trains.splice(i, 1);
                }
            }
            obstacles = obstacles.filter(o => { if (o.position.z < player.position.z - 10) { o.dispose(); return false; } return true; });
            rewards = rewards.filter(r => { if (r.position.z < player.position.z - 10) { r.dispose(); return false; } return true; });
        }
    });
};

// --- SCÈNE DU MENU (inchangé) ---
const createMenuScene = function() {
    menuScene = new BABYLON.Scene(engine);
    menuScene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
    const camera = new BABYLON.ArcRotateCamera("menuCam", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), menuScene);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), menuScene);
    const menuCube = BABYLON.MeshBuilder.CreateBox("menuCube", {size: 1.5}, menuScene);
    const menuCubeMaterial = new BABYLON.StandardMaterial("menuCubeMat", menuScene);
    const currentSkin = skins.find(s => s.id === selectedSkinId);
    menuCubeMaterial.diffuseColor = currentSkin.color;
    menuCube.material = menuCubeMaterial;
    menuScene.onBeforeRenderObservable.add(() => {
        menuCube.rotation.y += 0.01;
        menuCube.rotation.x += 0.005;
    });
};

// --- DÉMARRAGE ET GESTION DES MENUS ---
createMenuScene();
populateSkinsList();

playButton.addEventListener('click', () => {
    menuContainer.style.display = 'none';
    infoDiv.style.display = 'block';
    
    if (gameScene) {
        if (keydownHandler) {
            window.removeEventListener('keydown', keydownHandler);
        }
        gameScene.dispose();
    }
    
    createGameScene();
    isGameRunning = true;
});

skinsButton.addEventListener('click', () => {
    menuContainer.style.display = 'none';
    skinsContainer.style.display = 'flex';
});

backToMenuButton.addEventListener('click', () => {
    skinsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
});

engine.runRenderLoop(function () {
    if (isGameRunning && gameScene) {
        gameScene.render();
    } else if (menuScene) {
        menuScene.render();
    }
});

window.addEventListener('resize', function () {
    engine.resize();
});