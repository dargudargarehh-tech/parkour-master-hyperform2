const startBtn = document.getElementById('start-btn');
const titleScreen = document.getElementById('title-screen');
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');

let scene, camera, renderer, chikoritaTexture, chikoritaSprite;
let clock = new THREE.Clock(), keys = {}, platforms = [];
let velocityY = 0, jumpCount = 0;
const player = { position: new THREE.Vector3(0, 2, 0), state: 'RUNNING' };

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#05010a', 0.05);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 10);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#05010a');

    // Build Cyberpunk Platforms
    const geo = new THREE.BoxGeometry(4, 0.5, 1);
    for (let i = 0; i < 30; i++) {
        const color = i % 2 === 0 ? '#00ff88' : '#ff00ff'; 
        const mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(i * 6, Math.random() * 3, 0);
        scene.add(p); 
        platforms.push(p);
    }

    // Character Sprite (Green Placeholder)
    const loader = new THREE.TextureLoader();
    const spriteURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AMEBwwS8nNnRAAAADJJREFUeNrtzUENAAAAwqD3T20PBxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIDpAm6AAAF7pIs1AAAAAElFTkSuQmCC';
    
    loader.load(spriteURL, (tex) => {
        chikoritaTexture = tex;
        const spriteMat = new THREE.SpriteMaterial({ map: tex, color: '#00ff88' });
        chikoritaSprite = new THREE.Sprite(spriteMat);
        chikoritaSprite.scale.set(1.5, 1.5, 1);
        scene.add(chikoritaSprite);
    });

    // Controls
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    
    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Movement
    if (keys['ArrowLeft']) player.position.x -= 0.15;
    if (keys['ArrowRight']) player.position.x += 0.15;
    if (keys['Space'] && jumpCount < 2) {
        velocityY = 0.25; 
        jumpCount++; 
        keys['Space'] = false;
    }

    // Gravity & Collision
    velocityY -= 0.01; 
    player.position.y += velocityY;
    
    platforms.forEach(p => {
        if (player.position.x > p.position.x - 2 && player.position.x < p.position.x + 2 &&
            player.position.y - 0.75 <= p.position.y + 0.25 && velocityY <= 0) {
            player.position.y = p.position.y + 1; 
            velocityY = 0; 
            jumpCount = 0;
        }
    });

    // Fall off the map reset
    if (player.position.y < -10) { 
        player.position.set(0, 5, 0); 
        velocityY = 0; 
    }
    
    // Update Sprite & Camera
    if (chikoritaSprite) chikoritaSprite.position.copy(player.position);
    camera.position.x += (player.position.x - camera.position.x) * 0.1;
    camera.lookAt(camera.position.x, camera.position.y, 0);
    
    renderer.render(scene, camera);
}

// Start Game Trigger
startBtn.onclick = () => {
    titleScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    init();
};