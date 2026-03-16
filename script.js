/* HYPERFORM 3D - NEON LIGHTING ENGINE */

let scene, camera, renderer, player, texture;
let pos = { x: 0, y: 5, z: 0 }, velY = 0, jumpCount = 0;
let keys = {}, platforms = [], runAnim = 0, lastDir = 1;

let score = 0;
let lastPlatformId = -1;
let highScore = localStorage.getItem('hyperform_highscore') || 0;
let platformIndex = 0;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    scene.fog = new THREE.FogExp2('#000000', 0.08);

    // BETTER LIGHTING: Ambient for base visibility + Point light for player glow
    const ambient = new THREE.AmbientLight(0x404040, 2); 
    scene.add(ambient);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // UI: Score
    const scoreUI = document.createElement('div');
    Object.assign(scoreUI.style, {
        position: 'fixed', top: '20px', left: '20px', color: '#00ff88', 
        fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', zIndex: '1000'
    });
    scoreUI.innerText = `SCORE: 0 | BEST: ${highScore}`;
    document.body.appendChild(scoreUI);

    // Stickman setup
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    texture = new THREE.CanvasTexture(canvas);
    player = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    player.scale.set(2.2, 2.2, 1);
    scene.add(player);

    spawnPlatform(0, 0, 10); 

    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if(e.code === 'Space' && jumpCount < 2) { velY = 0.25; jumpCount++; }
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    animate(ctx, scoreUI);
}

function spawnPlatform(x, y, width = 4) {
    const color = platformIndex % 2 ? 0x00ff88 : 0xff00ff;
    const p = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 2), 
        new THREE.MeshBasicMaterial({ color: color, wireframe: true }));
    p.position.set(x, y, 0);
    p.userData = { id: platformIndex++ };
    
    // Add a point light to each platform for that neon "Better Lighting" look
    const light = new THREE.PointLight(color, 1, 6);
    p.add(light);
    
    scene.add(p);
    platforms.push(p);
}

function updateStickman(ctx, anim, jumping, dir) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.translate(64, 64);
    if(dir === -1) ctx.scale(-1, 1);
    ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 7; ctx.lineCap = "round";
    // Stronger swing for more "Master" movement
    let swing = jumping ? 15 : Math.sin(anim) * 18;
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 20); // Body
    ctx.moveTo(0, 0); ctx.lineTo(22, 12 + swing/2); // Arms
    ctx.moveTo(0, 0); ctx.lineTo(-22, 12 - swing/2);
    ctx.moveTo(0, 20); ctx.lineTo(18, 45 - swing); // Legs
    ctx.moveTo(0, 20); ctx.lineTo(-18, 45 + swing);
    ctx.stroke();
    ctx.fillStyle = "#00ff88"; ctx.beginPath(); ctx.arc(0, -28, 13, 0, Math.PI*2); ctx.fill(); // Head
    ctx.restore();
    texture.needsUpdate = true;
}

function animate(ctx, scoreUI) {
    requestAnimationFrame(() => animate(ctx, scoreUI));
    if(keys['ArrowRight']) { pos.x += 0.18; lastDir = 1; runAnim += 0.25; }
    if(keys['ArrowLeft']) { pos.x -= 0.18; lastDir = -1; runAnim += 0.25; }
    velY -= 0.01; pos.y += velY;

    let lastP = platforms[platforms.length - 1];
    if (pos.x > lastP.position.x - 25) {
        let nextX = lastP.position.x + 8 + Math.random() * 5;
        let nextY = Math.max(-2, Math.min(4, lastP.position.y + (Math.random() * 4 - 2)));
        spawnPlatform(nextX, nextY, 3 + Math.random() * 2);
    }

    if (platforms.length > 15) {
        let oldP = platforms.shift();
        scene.remove(oldP);
    }

    platforms.forEach(p => {
        if(pos.x > p.position.x - (p.geometry.parameters.width/2 + 0.5) && 
           pos.x < p.position.x + (p.geometry.parameters.width/2 + 0.5) && 
           pos.y - 1.1 <= p.position.y && velY < 0) {
            if (lastPlatformId !== p.userData.id) {
                score++;
                scoreUI.innerText = `SCORE: ${score} | BEST: ${highScore}`;
                lastPlatformId = p.userData.id;
            }
            pos.y = p.position.y + 1.1; velY = 0; jumpCount = 0;
        }
    });

    if(pos.y < -15) { 
        pos.x = 0; pos.y = 8; velY = 0; score = 0; 
        scoreUI.innerText = `SCORE: 0 | BEST: ${highScore}`;
        lastPlatformId = -1;
        platforms.forEach(p => scene.remove(p));
        platforms = [];
        platformIndex = 0;
        spawnPlatform(0, 0, 10);
    }

    player.position.set(pos.x, pos.y, pos.z);
    updateStickman(ctx, runAnim, Math.abs(velY) > 0.02, lastDir);
    
    // Snappy camera
    camera.position.x += (pos.x - camera.position.x) * 0.15;
    camera.position.y += (pos.y + 1.5 - camera.position.y) * 0.15;
    camera.position.z = 11;
    camera.lookAt(pos.x, pos.y, 0);
    renderer.render(scene, camera);
}

document.getElementById('start-btn').onclick = () => {
    document.getElementById('title-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        init();
    }, 300);
};