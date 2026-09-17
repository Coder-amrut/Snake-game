import * as THREE from './node_modules/three/build/three.module.js';

const sceneEl = document.querySelector('#scene');
const rollButton = document.querySelector('#roll-button');
const leaveButton = document.querySelector('#leave-button');
const diceFace = document.querySelector('#dice-face');
const positionReadout = document.querySelector('#position-readout');
const message = document.querySelector('#message');
const turnLabel = document.querySelector('#turn-label');
const loading = document.querySelector('#loading');
const soundStatus = document.querySelector('#sound-status');
const introScreen = document.querySelector('#intro-screen');
const nameForm = document.querySelector('#name-form');
const playerOneInput = document.querySelector('#player-one-name');
const playerTwoInput = document.querySelector('#player-two-name');
const playerOneLabel = document.querySelector('#player-one-label');
const playerTwoLabel = document.querySelector('#player-two-label');
const positionLabel = document.querySelector('#position-label');
const snakeAlert = document.querySelector('#snake-alert');
const snakeAlertPlayer = document.querySelector('#snake-alert-player');
const winnerAlert = document.querySelector('#winner-alert');
const winnerName = document.querySelector('#winner-name');
const playerOneColor = document.querySelector('#player-one-color');
const playerTwoColor = document.querySelector('#player-two-color');
const snakeCountInput = document.querySelector('#snake-count');
const ladderCountInput = document.querySelector('#ladder-count');
const playerCardOne = document.querySelector('#player-card-one');
const playerCardTwo = document.querySelector('#player-card-two');
const cornerOneName = document.querySelector('#corner-one-name');
const cornerTwoName = document.querySelector('#corner-two-name');
const cornerOnePosition = document.querySelector('#corner-one-position');
const cornerTwoPosition = document.querySelector('#corner-two-position');
const cornerOneDice = document.querySelector('#corner-one-dice');
const cornerTwoDice = document.querySelector('#corner-two-dice');

let audioContext;
let playerPosition = 1;
let playerTwoPosition = 1;
let activePlayer = 0;
let playerNames = ['PLAYER ONE', 'PLAYER TWO'];
let playerColors = ['#cbd54b', '#e34231'];
let busy = false;
let playerToken;
let playerTwoToken;
const movers = [];
const snakes = [];
const ladders = [];
const boardSize = 10;
const tileSize = 1.24;
const boardSpan = boardSize * tileSize;
const green = new THREE.Color('#111813');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080b09');
scene.fog = new THREE.FogExp2('#080b09', .027);
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .1, 100);
camera.position.set(13, 18, 19);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);
const view = { yaw: .58, pitch: .72, distance: 20, dragging: false, x: 0, y: 0 };
function updateCamera() {
  camera.position.set(Math.sin(view.yaw) * Math.cos(view.pitch) * view.distance, Math.sin(view.pitch) * view.distance, Math.cos(view.yaw) * Math.cos(view.pitch) * view.distance);
  camera.lookAt(0, 0, 0);
}
renderer.domElement.addEventListener('pointerdown', event => { view.dragging = true; view.x = event.clientX; view.y = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); });
renderer.domElement.addEventListener('pointermove', event => { if (!view.dragging) return; view.yaw -= (event.clientX - view.x) * .008; view.pitch = Math.max(.35, Math.min(1.15, view.pitch + (event.clientY - view.y) * .006)); view.x = event.clientX; view.y = event.clientY; updateCamera(); });
renderer.domElement.addEventListener('pointerup', () => { view.dragging = false; });
renderer.domElement.addEventListener('wheel', event => { view.distance = Math.max(12, Math.min(28, view.distance + event.deltaY * .01)); updateCamera(); }, { passive: true });
updateCamera();

scene.add(new THREE.HemisphereLight('#899077', '#050605', 1.5));
const moon = new THREE.DirectionalLight('#d7e4bd', 4.5);
moon.position.set(-8, 17, 8); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); scene.add(moon);
const redLight = new THREE.PointLight('#8d241f', 24, 15, 2);
redLight.position.set(4, 3, -5); scene.add(redLight);
const bloodLight = new THREE.PointLight('#ff1e16', 15, 10, 2);
bloodLight.position.set(-5, 1.5, 4); scene.add(bloodLight);
const emberLight = new THREE.PointLight('#ff5520', 10, 8, 2);
emberLight.position.set(0, .5, -7); scene.add(emberLight);

function addHauntedBackdrop() {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#151312', roughness: 1 });
  const branchMaterial = new THREE.MeshStandardMaterial({ color: '#211817', roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 9 + (i % 3) * 1.8;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18 + (i % 3) * .08, .34, 5 + (i % 4), 7), trunkMaterial);
    trunk.position.set(x, 2.2 + (i % 4) * .4, z); trunk.rotation.z = Math.sin(i) * .18; trunk.castShadow = true; scene.add(trunk);
    for (let branch = 0; branch < 3; branch++) {
      const start = new THREE.Vector3(x, 4 + (i % 4) * .4, z);
      const end = start.clone().add(new THREE.Vector3((branch - 1) * 1.6, 1.1, (branch % 2 ? 1 : -1) * 1.3));
      cylinderBetween(start, end, .08, branchMaterial, 6);
    }
  }
  const spikeMaterial = new THREE.MeshStandardMaterial({ color: '#a99f6c', roughness: .72, metalness: .35, emissive: '#25170c', emissiveIntensity: .2 });
  for (let i = 0; i < 10; i++) {
    const x = -6.4 + i * 1.4;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(.12, 3.2 + (i % 2) * .7, 6), spikeMaterial);
    spike.position.set(x, 1.5, -7.1); spike.rotation.z = (i % 2 ? .08 : -.08); spike.castShadow = true; scene.add(spike);
  }
  const poolMaterial = new THREE.MeshBasicMaterial({ color: '#4d0808', transparent: true, opacity: .7 });
  for (let i = 0; i < 7; i++) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(.5 + (i % 3) * .25, 20), poolMaterial);
    pool.rotation.x = -Math.PI / 2; pool.position.set(-5 + i * 1.55, .015, -6.5 + (i % 2) * .5); pool.scale.set(1.5, .7, 1); scene.add(pool);
  }
}

function makeTexture(type) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = type === 'wall' ? '#181e17' : '#141914'; ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1200; i++) { ctx.fillStyle = `rgba(${type === 'wall' ? '176,184,139' : '115,130,85'},${Math.random() * .16})`; ctx.fillRect(Math.random()*128, Math.random()*128, 1 + Math.random()*3, 1 + Math.random()*3); }
  if (type === 'tile') { ctx.strokeStyle = 'rgba(203,213,75,.13)'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, 124, 124); }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; return texture;
}

function tilePosition(number, y = .12) {
  const index = number - 1; const row = Math.floor(index / boardSize); const col = index % boardSize;
  const actualCol = row % 2 === 0 ? col : boardSize - 1 - col;
  return new THREE.Vector3((actualCol - 4.5) * tileSize, y, (4.5 - row) * tileSize);
}
function addBox(size, position, material, bevel = 0) {
  const geometry = bevel ? new THREE.BoxGeometry(...size).toNonIndexed() : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material); mesh.position.copy(position); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}

const tileTexture = makeTexture('tile');
for (let n = 1; n <= 100; n++) {
  const pos = tilePosition(n, 0);
  const tile = addBox([tileSize-.035, .18, tileSize-.035], pos, new THREE.MeshStandardMaterial({ map: tileTexture, color: n % 2 ? '#3b4431' : '#283128', roughness: .92 }));
  tile.userData.number = n;
  const label = document.createElement('canvas'); label.width = label.height = 128; const ctx = label.getContext('2d'); ctx.fillStyle = 'rgba(8, 12, 8, .84)'; ctx.fillRect(8, 8, 112, 112); ctx.strokeStyle = n % 10 === 0 ? '#e8ed7b' : '#c7d19b'; ctx.lineWidth = 4; ctx.strokeRect(10, 10, 108, 108); ctx.fillStyle = n % 10 === 0 ? '#f2fa70' : '#e4e8ca'; ctx.font = 'bold 38px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5; ctx.fillText(String(n).padStart(2,'0'), 64, 66);
  const numberMesh = new THREE.Mesh(new THREE.PlaneGeometry(.7,.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(label), transparent: true, depthWrite: false })); numberMesh.rotation.x = -Math.PI/2; numberMesh.position.copy(pos); numberMesh.position.y = .105; scene.add(numberMesh);
}
const slabMaterial = new THREE.MeshStandardMaterial({ map: makeTexture('wall'), color: '#3b4433', roughness: 1 });
addBox([boardSpan + 1, .45, boardSpan + 1], new THREE.Vector3(0,-.27,0), new THREE.MeshStandardMaterial({color:'#0c100d', roughness:1}));
addBox([.38, 2.2, boardSpan + 1.2], new THREE.Vector3(-boardSpan/2-.35, .7, 0), slabMaterial);
addBox([.38, 2.2, boardSpan + 1.2], new THREE.Vector3(boardSpan/2+.35, .7, 0), slabMaterial);
addBox([boardSpan + 1.2, 2.2, .38], new THREE.Vector3(0, .7, -boardSpan/2-.35), slabMaterial);
addBox([boardSpan + 1.2, 2.2, .38], new THREE.Vector3(0, .7, boardSpan/2+.35), slabMaterial);

function cylinderBetween(a, b, radius, material, radialSegments = 8) {
  const direction = new THREE.Vector3().subVectors(b, a); const mid = new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments), material); mesh.position.copy(mid); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()); mesh.castShadow = true; scene.add(mesh); return mesh;
}
function addSnake(start, end, color = '#a51f25') {
  const created = new Set(scene.children);
  const a = tilePosition(start, .28), b = tilePosition(end, .28);
  const curve = new THREE.CatmullRomCurve3([a, new THREE.Vector3((a.x+b.x)/2 + .8, .3, (a.z+b.z)/2), b]);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#111318', roughness: .94, emissive: '#090205', emissiveIntensity: .45 });
  const scaleMaterial = new THREE.MeshStandardMaterial({ color: '#2e3438', roughness: .82, metalness: .08 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, .13, 12, false), bodyMaterial); tube.castShadow = true; scene.add(tube);
  const rings = [];
  for (let i = 1; i < 20; i++) {
    const progress = i / 20; const point = curve.getPoint(progress); const tangent = curve.getTangent(progress).normalize();
    const scale = new THREE.Mesh(new THREE.SphereGeometry(.155, 8, 6), scaleMaterial); scale.position.copy(point); scale.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent); scale.scale.set(1.05, .18, .7); scale.castShadow = true; scene.add(scale); rings.push(scale);
  }
  const coilMaterial = new THREE.MeshStandardMaterial({ color: '#17191c', roughness: .95, emissive: '#080307', emissiveIntensity: .4 });
  const coil = new THREE.Mesh(new THREE.TorusGeometry(.48, .13, 8, 32), coilMaterial); coil.position.set(a.x, .2, a.z); coil.rotation.x = Math.PI / 2; coil.scale.set(1.2, .8, 1); coil.castShadow = true; scene.add(coil);
  const headMaterial = new THREE.MeshStandardMaterial({ color: '#4b5457', roughness: .76, metalness: .04, emissive: '#121518', emissiveIntensity: .3 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), headMaterial); head.position.set(a.x, .38, a.z + .25); head.scale.set(1.05, .7, 1.65); head.castShadow = true; scene.add(head);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), headMaterial); snout.position.set(a.x, .35, a.z + .49); snout.scale.set(1, .7, 1.4); scene.add(snout);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#c9ef55' });
  [-.09, .09].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), eyeMaterial); eye.position.set(a.x + x, .44, a.z + .42); scene.add(eye); });
  const tongueCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(a.x, .34, a.z + .52), new THREE.Vector3(a.x, .33, a.z + .7), new THREE.Vector3(a.x, .34, a.z + .82)]);
  const tongue = new THREE.Mesh(new THREE.TubeGeometry(tongueCurve, 10, .012, 5, false), new THREE.MeshBasicMaterial({ color: '#e83d4a' })); scene.add(tongue);
  snakes.push({start,end,curve,tube,head,rings,coil,objects:scene.children.filter(child => !created.has(child)),baseY:a.y,phase:Math.random()*6});
}
function addLadder(start, end) { const created = new Set(scene.children); const a = tilePosition(start,.25), b = tilePosition(end,.25); const material = new THREE.MeshStandardMaterial({color:'#77744e', roughness:.8}); const side = new THREE.Vector3(-(b.z-a.z),0,b.x-a.x).normalize().multiplyScalar(.22); const parts = [cylinderBetween(a.clone().add(side),b.clone().add(side),.07,material), cylinderBetween(a.clone().sub(side),b.clone().sub(side),.07,material)]; for(let i=1;i<7;i++){ const p=a.clone().lerp(b,i/7); parts.push(cylinderBetween(p.clone().sub(side),p.clone().add(side),.06,material,6)); } ladders.push({start,end,parts:scene.children.filter(child => !created.has(child))}); }
addHauntedBackdrop();
const defaultSnakes = [[98,73],[64,42],[47,18],[31,6],[87,54],[76,33]];
const defaultLadders = [[4,29],[14,44],[37,68],[61,89]];
function buildHazards() { snakes.splice(0).forEach(snake => snake.objects.forEach(mesh => scene.remove(mesh))); ladders.splice(0).forEach(ladder => ladder.parts.forEach(mesh => scene.remove(mesh))); defaultSnakes.slice(0, Number(snakeCountInput.value)).forEach(([start,end]) => addSnake(start,end)); defaultLadders.slice(0, Number(ladderCountInput.value)).forEach(([start,end]) => addLadder(start,end)); }
buildHazards();

function token(color, glow) { const group = new THREE.Group(); const material = new THREE.MeshStandardMaterial({color, emissive:glow, emissiveIntensity:1.8, roughness:.3}); const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22,.48,5,10), material); body.castShadow = true; group.add(body); const light = new THREE.PointLight(color, 2, 2); light.position.y=.35; group.add(light); scene.add(group); movers.push({group, target: group.position.clone(), phase: Math.random()*9}); return group; }
playerToken = token('#cbd54b','#667111'); playerTwoToken = token('#e34231','#76100d'); playerTwoToken.scale.set(.85,.85,.85); playerToken.position.copy(tilePosition(1,.42)); playerTwoToken.position.copy(tilePosition(1,.43));

function findWarp(pos) { for (const snake of snakes) if (snake.start === pos) return {to: snake.end, type:'snake'}; for (const ladder of ladders) if (ladder.start === pos) return {to: ladder.end, type:'ladder'}; return null; }
function moveToken(group, from, to, pathOverride = null) { return new Promise(resolve => { const path = pathOverride || []; if (!pathOverride) for(let p=from+1;p<=to;p++) path.push(tilePosition(p,.45)); let i=0; const tick=()=>{ if(i>=path.length){resolve(); return;} const start=group.position.clone(), end=path[i++]; const started=performance.now(); const animate=now=>{ const progress=Math.min((now-started)/170,1); group.position.lerpVectors(start,end,progress); group.position.y += Math.sin(progress*Math.PI)*.35; if(progress<1) requestAnimationFrame(animate); else tick(); }; requestAnimationFrame(animate); }; tick(); }); }
function moveAlongWarp(group, from, to, type) { const start = tilePosition(from, .45); const end = tilePosition(to, .45); const bend = new THREE.Vector3((start.x + end.x) / 2 + (type === 'snake' ? 1.2 : -.7), .95 + Math.abs(end.y - start.y), (start.z + end.z) / 2); const curve = new THREE.CatmullRomCurve3([start, bend, end]); const path = []; for (let i = 1; i <= 15; i++) path.push(curve.getPoint(i / 15)); return moveToken(group, from, to, path); }
function playWin() { [0,1,2,3].forEach(i=>setTimeout(()=>playTone(420+i*130,.45,'triangle',.06,100),i*120)); }
function celebrateWinner(name, group) { winnerName.textContent = name.toUpperCase(); winnerAlert.setAttribute('aria-hidden', 'false'); winnerAlert.classList.add('is-visible'); playWin(); const center = tilePosition(100, .8); const ringMaterial = new THREE.MeshBasicMaterial({ color: '#d7e84d', transparent: true, opacity: .78, side: THREE.DoubleSide }); const rings = [new THREE.Mesh(new THREE.TorusGeometry(.8,.035,8,32),ringMaterial), new THREE.Mesh(new THREE.TorusGeometry(1.2,.025,8,32),ringMaterial), new THREE.Mesh(new THREE.TorusGeometry(1.6,.018,8,32),ringMaterial)]; rings.forEach((ring,index)=>{ ring.position.copy(center); ring.rotation.x = Math.PI/2; ring.userData.phase=index; scene.add(ring); }); const sparks = []; for(let i=0;i<20;i++){ const spark = new THREE.Mesh(new THREE.SphereGeometry(.035,6,6), new THREE.MeshBasicMaterial({color:'#ff5a2b'})); spark.position.copy(center); spark.userData.velocity = new THREE.Vector3((Math.random()-.5)*.06, .03+Math.random()*.06, (Math.random()-.5)*.06); scene.add(spark); sparks.push(spark); } group.position.copy(center); setTimeout(()=>{ rings.forEach(ring=>scene.remove(ring)); sparks.forEach(spark=>scene.remove(spark)); },7000); }
function playTone(frequency, duration, type='sine', volume=.04, slide=0) { try { audioContext ??= new AudioContext(); const oscillator=audioContext.createOscillator(), gain=audioContext.createGain(); oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime); if(slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,frequency+slide),audioContext.currentTime+duration); gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration); } catch { soundStatus.textContent='SOUND OFF'; } }
function playRoll() { [0,1,2,3,4,5].forEach(i=>setTimeout(()=>playTone(90+i*55,.14,'square',.03,70),i*65)); }
function playSnake() { playTone(240,.35,'sawtooth',.08,-180); setTimeout(()=>playTone(105,.55,'sawtooth',.07,-70),100); setTimeout(()=>playTone(48,.7,'square',.05,-15),260); }
function playLadder() { playTone(280,.3,'triangle',.06,240); setTimeout(()=>playTone(520,.3,'triangle',.05,160),100); setTimeout(()=>playTone(840,.4,'sine',.035,80),210); }
function playTurn() { playTone(activePlayer ? 190 : 310,.22,'triangle',.05,70); }
function playDeath() { playTone(140,.9,'sawtooth',.1,-105); setTimeout(()=>playTone(44,1.2,'square',.07,-10),180); setTimeout(()=>playTone(28,1.5,'sawtooth',.05,-5),420); }

function showSnakeAlert(playerName) { snakeAlertPlayer.textContent = `${playerName.toUpperCase()} WAS EATEN`; snakeAlert.setAttribute('aria-hidden', 'false'); snakeAlert.classList.add('is-visible'); setTimeout(() => { snakeAlert.classList.remove('is-visible'); snakeAlert.setAttribute('aria-hidden', 'true'); }, 720); }

async function roll() { if(busy || !introScreen.classList.contains('is-hidden')) return; busy=true; rollButton.disabled=true; try { if(audioContext?.state==='suspended') await audioContext.resume(); } catch {} playRoll(); const value=Math.floor(Math.random()*6)+1; diceFace.textContent=value; if(activePlayer===0) cornerOneDice.textContent=value; else cornerTwoDice.textContent=value; const movingToken=activePlayer===0?playerToken:playerTwoToken; const currentPosition=activePlayer===0?playerPosition:playerTwoPosition; const movingName=playerNames[activePlayer]; const destination=currentPosition+value; turnLabel.textContent=`${movingName.toUpperCase()} ROLLED ${value}`; if(destination>100){ message.textContent=`${movingName.toUpperCase()} NEEDS ${100-currentPosition} OR LESS TO REACH THE EXIT.`; turnLabel.textContent=`${movingName.toUpperCase()} ROLLED ${value} — STAY`; activePlayer=activePlayer===0?1:0; playerCardOne.classList.toggle('active', activePlayer===0); playerCardTwo.classList.toggle('active', activePlayer===1); positionLabel.textContent=`${playerNames[activePlayer].toUpperCase()} POSITION`; positionReadout.textContent=String(activePlayer===0?playerPosition:playerTwoPosition).padStart(2,'0')+' / 100'; turnLabel.textContent=`${playerNames[activePlayer].toUpperCase()}'S TURN`; playTurn(); busy=false; rollButton.disabled=false; return; } message.textContent=`${movingName.toUpperCase()} ROLLED ${value} — MOVING TO ${destination}.`; await moveToken(movingToken,currentPosition,destination); let position=destination; let warp=findWarp(position); if(warp){ if(warp.type==='snake'){ message.textContent='THE SNAKE HAS EATEN YOU.'; playSnake(); showSnakeAlert(movingName); await new Promise(resolve=>setTimeout(resolve,720)); } else { message.textContent='THE LADDER RATTLES IN THE DARK.'; playLadder(); } await moveAlongWarp(movingToken,position,warp.to,warp.type); position=warp.to; } if(activePlayer===0) { playerPosition=position; cornerOnePosition.textContent=String(position).padStart(2,'0')+' / 100'; } else { playerTwoPosition=position; cornerTwoPosition.textContent=String(position).padStart(2,'0')+' / 100'; } positionReadout.textContent=String(position).padStart(2,'0')+' / 100'; if(position===100){ message.textContent=`${movingName.toUpperCase()} ESCAPED THE HOUSE.`; celebrateWinner(movingName,movingToken); busy=false; return; } message.textContent=warp ? (warp.type==='snake'?'THE SNAKE DRAGS YOU DOWN TO ITS TAIL.':'THE LADDER PULLS YOU UP.') : `${movingName.toUpperCase()} HEARS SOMETHING MOVE.`; activePlayer=activePlayer===0?1:0; playerCardOne.classList.toggle('active', activePlayer===0); playerCardTwo.classList.toggle('active', activePlayer===1); positionLabel.textContent=`${playerNames[activePlayer].toUpperCase()} POSITION`; positionReadout.textContent=String(activePlayer===0?playerPosition:playerTwoPosition).padStart(2,'0')+' / 100'; turnLabel.textContent=`${playerNames[activePlayer].toUpperCase()}'S TURN`; playTurn(); busy=false; rollButton.disabled=false; }
rollButton.addEventListener('click', roll);
leaveButton.addEventListener('click', () => { leaveButton.disabled = true; window.location.reload(); });
nameForm.addEventListener('submit', event => { event.preventDefault(); playerNames=[playerOneInput.value.trim() || 'PLAYER ONE', playerTwoInput.value.trim() || 'PLAYER TWO']; playerColors=[playerOneColor.value, playerTwoColor.value]; playerOneLabel.textContent=playerNames[0].toUpperCase(); playerTwoLabel.textContent=playerNames[1].toUpperCase(); cornerOneName.textContent=playerNames[0].toUpperCase(); cornerTwoName.textContent=playerNames[1].toUpperCase(); cornerOneName.style.color=playerColors[0]; cornerTwoName.style.color=playerColors[1]; playerToken.children[0].material.color.set(playerColors[0]); playerTwoToken.children[0].material.color.set(playerColors[1]); buildHazards(); playerCardOne.classList.add('active'); positionLabel.textContent=`${playerNames[0].toUpperCase()} POSITION`; turnLabel.textContent=`${playerNames[0].toUpperCase()}'S TURN`; introScreen.classList.add('is-hidden'); playTurn(); setTimeout(()=>introScreen.remove(),900); });
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);});
function animate(time=0) { requestAnimationFrame(animate); movers.forEach(m=>{ m.group.position.y += Math.sin(time*.002+m.phase)*.0008; }); snakes.forEach(snake=>{ const pulse=Math.sin(time*.004+snake.phase); snake.tube.rotation.y=pulse*.035; snake.head.position.y=.38+Math.abs(pulse)*.025; snake.head.rotation.y=pulse*.12; snake.coil.rotation.z=pulse*.04; snake.rings.forEach((ring, index)=>{ ring.scale.y=1+Math.sin(time*.006+snake.phase+index*.35)*.06; }); }); redLight.intensity=20+Math.sin(time*.006)*7; bloodLight.intensity=12+Math.sin(time*.008+2)*6; emberLight.intensity=8+Math.sin(time*.01)*4; renderer.render(scene,camera); }
animate(); setTimeout(()=>{loading.style.opacity='0'; setTimeout(()=>loading.remove(),900);},700);
