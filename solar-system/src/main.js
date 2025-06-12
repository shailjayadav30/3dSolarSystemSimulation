import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("solar-system"),
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Set clear color to black for better contrast
camera.position.set(0, 30, 60); // Closer camera for better visibility

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 3, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Planet Data
const planets = [
  {
    name: "Mercury",
    radius: 0.8,
    distance: 10,
    speed: 0.04,
    texture: "/textures/2k_mercury.jpg",
  },
  {
    name: "Venus",
    radius: 1.2,
    distance: 15,
    speed: 0.03,
    texture: "/textures/2k_venus_surface.jpg",
  },
  {
    name: "Earth",
    radius: 1.5,
    distance: 20,
    speed: 0.02,
    texture: "/textures/2k_earth_daymap.jpg",
  },
  {
    name: "Mars",
    radius: 1.0,
    distance: 25,
    speed: 0.016,
    texture: "/textures/2k_mars.jpg",
  },
  {
    name: "Jupiter",
    radius: 3.0,
    distance: 35,
    speed: 0.01,
    texture: "/textures/2k_jupiter.jpg",
  },
  {
    name: "Saturn",
    radius: 2.7,
    distance: 45,
    speed: 0.008,
    texture: "/textures/2k_saturn.jpg",
  },
  {
    name: "Uranus",
    radius: 1.8,
    distance: 55,
    speed: 0.006,
    texture: "/textures/2k_uranus.jpg",
  },
  {
    name: "Neptune",
    radius: 1.8,
    distance: 65,
    speed: 0.004,
    texture: "/textures/2k_neptune.jpg",
  },
];

// Create Sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunTexture = new THREE.TextureLoader().load("/textures/2k_sun.jpg");
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create Planets
const planetMeshes = [];
const planetSpeeds = {};
planets.forEach((planet) => {
  const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    planet.texture,
    (texture) => {
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
        emissive: new THREE.Color(0x222222),
        emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.distance;
      scene.add(mesh);
      planetMeshes.push({
        mesh,
        distance: planet.distance,
        angle: 0,
        baseSpeed: planet.speed,
        name: planet.name,
      });
      planetSpeeds[planet.name] = 1;
    },
    undefined,
    (error) => {
      console.error(`Failed to load texture for ${planet.name}:`, error);
    }
  );
});

// Background Stars
const starGeometry = new THREE.SphereGeometry(100, 32, 32);
const starTexture = new THREE.TextureLoader().load("/textures/2k_stars.jpg");
const starMaterial = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide,
});
const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

// Raycaster for Tooltips
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");

// Animation
let isPaused = false;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    const delta = clock.getDelta();
    planetMeshes.forEach((planet) => {
      planet.angle += planet.baseSpeed * planetSpeeds[planet.name] * delta * 10; // Amplify speed
      planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
      planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
      planet.mesh.rotation.y += 0.02; // Faster self-rotation
    });
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Speed Controls
planets.forEach((planet) => {
  const slider = document.getElementById(`${planet.name.toLowerCase()}-speed`);
  slider.addEventListener("input", () => {
    planetSpeeds[planet.name] = parseFloat(slider.value);
    console.log(`${planet.name} speed set to: ${planetSpeeds[planet.name]}`); // Debug
  });
});

// Pause/Resume
document.getElementById("pause-resume").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pause-resume").textContent = isPaused
    ? "Resume"
    : "Pause";
});

// Tooltip on Hover
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    planetMeshes.map((p) => p.mesh).concat(sun)
  );
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const name = planetMeshes.find((p) => p.mesh === obj)?.name || "Sun";
    tooltip.style.display = "block";
    tooltip.textContent = name;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  } else {
    tooltip.style.display = "none";
  }
});

// Camera Zoom on Click
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    planetMeshes.map((p) => p.mesh).concat(sun)
  );
  if (intersects.length > 0) {
    const target = intersects[0].object.position;
    camera.position.lerp(target.clone().add(new THREE.Vector3(0, 5, 10)), 0.1);
  }
});

// Handle Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
