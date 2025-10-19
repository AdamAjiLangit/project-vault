import * as THREE from "three";
import {
  vertexShader,
  fluidFragmentShader,
  displayFragmentShader,
} from "./shaders.js";

window.addEventListener("load", init);

function init() {
  const canvas = document.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    precision: "highp",
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mouse = new THREE.Vector2(0.5, 0.5);
  const prevMouse = new THREE.Vector2(0.5, 0.5);
  let isMoving = false;
  let lastMoveTime = 0;
  let mouseInCanvas = false;

  const size = 500;
  const pingPongTargets = [
    new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }),
    new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }),
  ];
  let currentTarget = 0;

  const topTexture = createPlaceholderTexture("#0000ff");
  const bottomTexture = createPlaceholderTexture("#ff0000");

  const topTextureSize = new THREE.Vector2(1, 1);
  const bottomTextureSize = new THREE.Vector2(1, 1);

  const trailsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPrevTrails: { value: null },
      uMouse: { value: mouse },
      uPrevMouse: { value: prevMouse },
      uResolution: { value: new THREE.Vector2(size, size) },
      uDecay: { value: 0.97 },
      uIsMoving: { value: false },
    },
    vertexShader,
    fragmentShader: fluidFragmentShader,
  });

  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uFluid: { value: null },
      uTopTexture: { value: topTexture },
      uBottomTexture: { value: bottomTexture },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uDpr: { value: window.devicePixelRatio },
      uTopTextureSize: { value: topTextureSize },
      uBottomTextureSize: { value: bottomTextureSize },
    },
    vertexShader,
    fragmentShader: displayFragmentShader,
  });

  loadImage("/portrait_top.jpg", topTexture, topTextureSize);
  loadImage("/portrait_bottom.jpg", bottomTexture, bottomTextureSize);

  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const displayMesh = new THREE.Mesh(planeGeometry, displayMaterial);
  scene.add(displayMesh);

  const simMesh = new THREE.Mesh(planeGeometry, trailsMaterial);
  const simScene = new THREE.Scene();
  simScene.add(simMesh);

  renderer.setRenderTarget(pingPongTargets[0]);
  renderer.clear();
  renderer.setRenderTarget(pingPongTargets[1]);
  renderer.clear();
  renderer.setRenderTarget(null);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("resize", onWindowResize);

  animate();

  function createPlaceholderTexture(color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function loadImage(url, targetTexture, textureSizeVector) {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      const originalWidth = img.width;
      const originalHeight = img.height;
      textureSizeVector.set(originalWidth, originalHeight);

      console.log(
        `Loaded texture: ${url}, size: ${originalWidth}x${originalHeight}`
      );

      const maxSize = 4096;
      let newWidth = originalWidth;
      let newHeight = originalHeight;

      if (originalWidth > maxSize || originalHeight > maxSize) {
        console.log(`Image exceeds max texture size, resizing...`);
        if (originalWidth > originalHeight) {
          newWidth = maxSize;
          newHeight = Math.floor(originalHeight * (maxSize / originalWidth));
        } else {
          newHeight = maxSize;
          newWidth = Math.floor(originalWidth * (maxSize / originalHeight));
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const newTexture = new THREE.CanvasTexture(canvas);
      newTexture.minFilter = THREE.LinearFilter;
      newTexture.magFilter = THREE.LinearFilter;

      if (url.includes("top")) {
        displayMaterial.uniforms.uTopTexture.value = newTexture;
      } else {
        displayMaterial.uniforms.uBottomTexture.value = newTexture;
      }
    };

    img.onerror = function (err) {
      console.error(`Error loading image ${url}:`, err);
    };

    img.src = url;
  }

  function onMouseMove(event) {
    const canvasRect = canvas.getBoundingClientRect();

    if (
      event.clientX >= canvasRect.left &&
      event.clientX <= canvasRect.right &&
      event.clientY >= canvasRect.top &&
      event.clientY <= canvasRect.bottom
    ) {
      prevMouse.copy(mouse);

      mouse.x = (event.clientX - canvasRect.left) / canvasRect.width;
      mouse.y = 1 - (event.clientY - canvasRect.top) / canvasRect.height;

      isMoving = true;
      lastMoveTime = performance.now();
    } else {
      isMoving = false;
    }
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      event.preventDefault();

      const canvasRect = canvas.getBoundingClientRect();
      const touchX = event.touches[0].clientX;
      const touchY = event.touches[0].clientY;

      if (
        touchX >= canvasRect.left &&
        touchX <= canvasRect.right &&
        touchY >= canvasRect.top &&
        touchY <= canvasRect.bottom
      ) {
        prevMouse.copy(mouse);

        mouse.x = (touchX - canvasRect.left) / canvasRect.width;
        mouse.y = 1 - (touchY - canvasRect.top) / canvasRect.height;

        isMoving = true;
        lastMoveTime = performance.now();
      } else {
        isMoving = false;
      }
    }
  }

  function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    displayMaterial.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
    displayMaterial.uniforms.uDpr.value = window.devicePixelRatio;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (isMoving && performance.now() - lastMoveTime > 50) {
      isMoving = false;
    }

    const prevTarget = pingPongTargets[currentTarget];
    currentTarget = (currentTarget + 1) % 2;
    const currentRenderTarget = pingPongTargets[currentTarget];

    trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;
    trailsMaterial.uniforms.uMouse.value.copy(mouse);
    trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse);
    trailsMaterial.uniforms.uIsMoving.value = isMoving;

    renderer.setRenderTarget(currentRenderTarget);
    renderer.render(simScene, camera);

    displayMaterial.uniforms.uFluid.value = currentRenderTarget.texture;

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }
}
