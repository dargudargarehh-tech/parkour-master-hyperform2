/* HYPERFORM 3D - INFINITE RUNNER ENGINE */

let scene, camera, renderer, player, texture;
let pos = { x: 0, y: 5, z: 0 }, velY = 0, jumpCount = 0;
let keys = {}, platforms = [], runAnim = 0, lastDir = 1;

// Score & Spawning Variables
let score = 0;
let lastPlatformId = -1;
let highScore = localStorage.getItem('hyperform_highscore') || 0;
let platformIndex = 0;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#05010a', 0.05);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('game-canvas'), 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#05010a');

    // --- UI ELEMENTS ---
    const scoreUI = document.createElement('div');
    Object.assign(scoreUI.style, {
        position: 'fixed', top: '20px', left: '20px',
        color: '#00ff88', fontSize: '24px', fontWeight: 'bold',
        fontFamily: 'monospace', textShadow: '0 0 10px #00ff88', zIndex: '1000'
    });
    scoreUI.innerText = `SCORE: 0 | BEST: ${highScore}`;
    document.body.appendChild(scoreUI);

    const saveBtn = document.createElement('button');
    saveBtn.innerText = "SAVE SCORE";
    Object.assign(saveBtn.style, {
        position: 'fixed', top: '60px', left: '20px',
        padding: '8px 15px', background: 'rgba(0, 255, 136, 0.2)',
        color: '#00ff88', border: '2px solid #00ff88',
        fontFamily: 'monospace', cursor: 'pointer', zIndex: '1000', fontWeight: 'bold'
    });
    document.body.appendChild(saveBtn);

    saveBtn.onclick = () => {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('hyperform_highscore', highScore);
            scoreUI.innerText = `SCORE: ${score} | BEST: ${highScore}`;
            saveBtn.innerText = "SAVED!";
            setTimeout(() => saveBtn.innerText = "SAVE SCORE", 2000);
        }
    };

    // --- CHARACTER ---
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    player = new THREE.Sprite(spriteMat);
    player.scale.set(2, 2, 1);
    scene.add(player);

    // Initial Spawning (Start with a floor)
    spawnPlatform(0, 0, 10); 

    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if(e.code === 'Space' && jumpCount < 2) { velY = 0.25; jumpCount++; }
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    animate(ctx, scoreUI);
}

function spawnPlatform(x, y, width = 4) {
    const boxGeo = new THREE.BoxGeometry(width, 0.5, 2);
    const mat = new THREE.MeshBasicMaterial({ 
        color: platformIndex % 2 ? '#00ff88' : '#ff00ff', 
        wireframe: true 
    });
    const p = new THREE.Mesh(boxGeo, mat);
    p.position.set(x, y, 0);
    p.userData = { id: platformIndex++ };
    scene.add(p);
    platforms.push(p);
}

function updateStickman(ctx, anim, jumping, dir) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.translate(64, 64);
    if(dir === -1) ctx.scale(-1, 1);
    ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 6; ctx.lineCap = "round";
    let swing = jumping ? 12 : Math.sin(anim) * 15;
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 20); // Torso
    ctx.moveTo(0, 0); ctx.lineTo(20, 15 + swing/2); // Arms
    ctx.moveTo(0, 0); ctx.lineTo(-20, 15 - swing/2);
    ctx.moveTo(0, 20); ctx.lineTo(15, 45 - swing); // Legs
    ctx.moveTo(0, 20); ctx.lineTo(-15, 45 + swing);
    ctx.stroke();
    ctx.fillStyle = "#00ff88"; ctx.beginPath(); ctx.arc(0, -25, 12, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    texture.needsUpdate = true;
}

function animate(ctx, scoreUI) {
    requestAnimationFrame(() => animate(ctx, scoreUI));
    
    // Movement
    if(keys['ArrowRight']) { pos.x += 0.15; lastDir = 1; runAnim += 0.2; }
    if(keys['ArrowLeft']) { pos.x -= 0.15; lastDir = -1; runAnim += 0.2; }

    // Physics
    velY -= 0.01; pos.y += velY;

    // INFINITE SPAWNING LOGIC
    // If we are close to the last platform, spawn a new one ahead
    let lastP = platforms[platforms.length - 1];
    if (pos.x > lastP.position.x - 20) {
        let nextX = lastP.position.x + 6 + Math.random() * 4;
        let nextY = Math.max(-2, Math.min(4, lastP.position.y + (Math.random() * 4 - 2)));
        spawnPlatform(nextX, nextY, 3 + Math.random() * 2);
    }

    // Cleanup old platforms to save memory
    if (platforms.length > 20) {
        let oldP = platforms.shift();
        scene.remove(oldP);
    }

    // Collisions
    platforms.forEach(p => {
        if(pos.x > p.position.x - 2 && pos.x < p.position.x + 2 &&
           pos.y - 1 <= p.position.y && velY < 0) {
            
            if (lastPlatformId !== p.userData.id) {
                score++;
                scoreUI.innerText = `SCORE: ${score} | BEST: ${highScore}`;
                lastPlatformId = p.userData.id;
            }
            pos.y = p.position.y + 1; velY = 0; jumpCount = 0;
        }
    });

    // Death/Reset
    if(pos.y < -15) { 
        pos.x = 0; pos.y = 5; velY = 0; score = 0; 
        scoreUI.innerText = `SCORE: 0 | BEST: ${highScore}`;
        lastPlatformId = -1;
        // Clear all platforms and restart
        platforms.forEach(p => scene.remove(p));
        platforms = [];
        platformIndex = 0;
        spawnPlatform(0, 0, 10);
    }

    player.position.set(pos.x, pos.y, pos.z);
    updateStickman(ctx, runAnim, Math.abs(velY) > 0.02, lastDir);

    camera.position.x += (pos.x - camera.position.x) * 0.1;
    camera.position.y += (pos.y + 2 - camera.position.y) * 0.1;
    camera.position.z = 12;
    camera.lookAt(pos.x, pos.y, 0);

    renderer.render(scene, camera);
}

document.getElementById('start-btn').onclick = () => {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    init();
};