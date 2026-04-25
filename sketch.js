// My global variables for the camera and flowers
let video;
let colorBuffer;
let flowers = [];
let petals = [];
let bgFlowers = []; // For the start screen background

// Keeping track of my touch/mouse interactions
let touchStartX = 0;
let touchStartY = 0;
let hasDragged = false;
let lastPetalFrame = 0;
let appStarted = false;

// Limits to keep the performance smooth
const FLOWER_LIMIT = 30;
const PETAL_LIMIT = 120;
const DRAG_THRESHOLD = 14;

// Audio setup
let flowerSound;
let audioReady = false;

// Loading my sound file before anything starts
function preload() {
  flowerSound = loadSound("Flower.MP3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(30);
  noStroke();

  // Setting up the back camera
  const constraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  };

  video = createCapture(constraints, () => {
    console.log("Camera is ready!");
  });

  video.size(640, 480);
  video.hide();

  // Ensuring it plays smoothly on mobile browsers
  if (video.elt) {
    video.elt.setAttribute("playsinline", "");
    video.elt.setAttribute("autoplay", "");
    video.elt.setAttribute("muted", "");
  }

  // Small buffer to sample colors from the video
  colorBuffer = createGraphics(64, 48);
  colorBuffer.pixelDensity(1);
  colorBuffer.noStroke();

  // Putting some flowers around the edges for the start screen
  initBgFlowers();
  setupStartScreen();
}

// Generate random colorful flowers at the screen edges
function initBgFlowers() {
  bgFlowers = [];
  const palette = [
    color('#f494b8'), // Pink
    color('#fbd76a'), // Yellow
    color('#7fc081'), // Green
    color('#446bbc'), // Blue
    color('#aa9ece'), // Purple
    color('#f28682')  // Red
  ];

  let numFlowers = windowWidth > 600 ? 18 : 12;

  for (let i = 0; i < numFlowers; i++) {
    let x, y;
    let edge = floor(random(4)); // Pick a random edge: Top, Bottom, Left, Right
    if (edge === 0) { x = random(width); y = random(0, height * 0.2); } 
    else if (edge === 1) { x = random(width); y = random(height * 0.8, height); } 
    else if (edge === 2) { x = random(0, width * 0.2); y = random(height); } 
    else { x = random(width * 0.8, width); y = random(height); }

    let c = random(palette);
    let bf = new BeautifulFlower(x, y, c);
    bf.targetSize = random(50, 110); 
    bf.currentSize = bf.targetSize; 
    bgFlowers.push(bf);
  }
}

// Handling the "Enter" button click
function setupStartScreen() {
  const startBtn = document.getElementById("start-btn");
  if (!startBtn) return;
  startBtn.addEventListener("click", async () => {
    await startExperience();
  });
}

// Switching from start screen to the AR experience
async function startExperience() {
  if (appStarted) return;
  appStarted = true;

  try {
    await userStartAudio(); // Unlocking audio for browsers
    audioReady = true;
  } catch (e) {
    console.warn("Audio failed to start:", e);
  }

  document.getElementById("start-screen").classList.remove("active");
  document.getElementById("ui-overlay").classList.remove("hidden");
}

// Play my flower growth sound
function playFlowerSound() {
  if (!audioReady || !flowerSound) return;
  flowerSound.play();
}

function draw() {
  // If the app hasn't started, show the cute flower background
  if (!appStarted) {
    background(253, 251, 246); // Off-white background
    for (let f of bgFlowers) {
      f.update(); 
      f.display();
    }
    return;
  }

  // Once started, show the camera and interactive flowers
  background(0);
  drawCameraCover();
  updateColorBuffer();

  for (let f of flowers) {
    f.update();
    f.display();
  }

  for (let i = petals.length - 1; i >= 0; i--) {
    petals[i].update();
    petals[i].display();
    if (petals[i].isDead()) petals.splice(i, 1);
  }

  // Clean up old objects to save memory
  if (flowers.length > FLOWER_LIMIT) flowers.splice(0, 1);
  if (petals.length > PETAL_LIMIT) petals.splice(0, 1);
}

// Fit the video feed to fill the screen
function drawCameraCover() {
  if (!video || !video.elt || video.elt.readyState < 2) return;
  const vw = video.width;
  const vh = video.height;
  const videoRatio = vw / vh;
  const canvasRatio = width / height;

  let dW, dH, dX, dY;
  if (canvasRatio > videoRatio) {
    dW = width; dH = width / videoRatio; dX = 0; dY = (height - dH) / 2;
  } else {
    dH = height; dW = height * videoRatio; dX = (width - dW) / 2; dY = 0;
  }
  image(video, dX, dY, dW, dH);
}

// Capture current video frame to get colors
function updateColorBuffer() {
  if (!video || !video.elt || video.elt.readyState < 2) return;
  colorBuffer.push();
  colorBuffer.translate(colorBuffer.width, 0);
  colorBuffer.scale(-1, 1);
  colorBuffer.image(video, 0, 0, colorBuffer.width, colorBuffer.height);
  colorBuffer.pop();
}

// Pick color from the screen position
function sampleEnvironmentColor(x, y) {
  if (!colorBuffer) return color(255, 180, 200, 248);
  let sx = constrain(floor(map(x, 0, width, 0, colorBuffer.width - 1)), 0, colorBuffer.width - 1);
  let sy = constrain(floor(map(y, 0, height, 0, colorBuffer.height - 1)), 0, colorBuffer.height - 1);

  let env = colorBuffer.get(sx, sy);
  // Enhance the sampled color to make it pop
  let r = lerp(env[0], 255, 0.16);
  let g = lerp(env[1], 255, 0.10);
  let b = lerp(env[2], 255, 0.14);
  return color(r, g, b, 248);
}

function createFlowerAt(x, y) {
  flowers.push(new BeautifulFlower(x, y, sampleEnvironmentColor(x, y)));
  playFlowerSound();
}

function createPetalBurst(x, y, amount = 2) {
  for (let i = 0; i < amount; i++) {
    petals.push(new FallingPetal(x + random(-12, 12), y + random(-12, 12), sampleEnvironmentColor(x, y)));
  }
}

// Input handling
function touchStarted() {
  if (!appStarted) return false;
  touchStartX = mouseX; touchStartY = mouseY;
  hasDragged = false;
  return false;
}

function touchMoved() {
  if (!appStarted) return false;
  if (dist(mouseX, mouseY, touchStartX, touchStartY) > DRAG_THRESHOLD) hasDragged = true;
  if (hasDragged && frameCount - lastPetalFrame >= 2) {
    createPetalBurst(mouseX, mouseY, 2);
    lastPetalFrame = frameCount;
  }
  return false;
}

function touchEnded() {
  if (!appStarted) return false;
  if (!hasDragged) createFlowerAt(mouseX, mouseY);
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!appStarted) initBgFlowers();
}

// The Flower class
class BeautifulFlower {
  constructor(x, y, c) {
    this.x = x; this.y = y; this.color = c;
    this.petalCount = floor(random(4, 9));
    this.targetSize = random(40, 95);
    this.currentSize = 0;
    this.baseAngle = random(TWO_PI);
    this.rotationSpeed = random(-0.02, 0.02);
    this.petalLength = random(0.7, 1.3);
    this.petalWidth = random(0.2, 0.6);
  }

  update() {
    if (this.currentSize < this.targetSize) this.currentSize += (this.targetSize - this.currentSize) * 0.13;
    this.baseAngle += this.rotationSpeed; // Making it spin
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.baseAngle);
    noStroke();
    let angleStep = TWO_PI / this.petalCount;
    for (let i = 0; i < this.petalCount; i++) {
      push();
      rotate(i * angleStep);
      fill(red(this.color), green(this.color), blue(this.color), 238);
      ellipse(0, -this.currentSize * 0.4, this.currentSize * this.petalWidth, this.currentSize * this.petalLength);
      pop();
    }
    fill(255, 210, 70, 245); // Yellow flower center
    circle(0, 0, this.currentSize * 0.2);
    pop();
  }
}

// The Petal class
class FallingPetal {
  constructor(x, y, c) {
    this.x = x; this.y = y; this.color = c;
    this.size = random(12, 20);
    this.vy = random(0.8, 1.8);
    this.vx = random(-0.8, 0.8);
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.04, 0.04);
    this.alpha = 230;
  }

  update() {
    this.vy += 0.035; this.x += this.vx; this.y += this.vy;
    this.angle += this.rotationSpeed;
    this.alpha -= 2; // Fading away
  }

  display() {
    if (this.alpha <= 0) return;
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(red(this.color), green(this.color), blue(this.color), this.alpha);
    ellipse(0, 0, this.size, this.size * 0.6);
    pop();
  }

  isDead() { return this.alpha <= 0 || this.y > height + 40; }
}