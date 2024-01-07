import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS } from "./fruits";

// Configuración inicial
const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  }
});

const world = engine.world;

// Creación de paredes y suelo
const wallOptions = { isStatic: true, render: { fillStyle: "#E6B143" } };
const leftWall = Bodies.rectangle(15, 395, 30, 790, wallOptions);
const rightWall = Bodies.rectangle(605, 395, 30, 790, wallOptions);
const ground = Bodies.rectangle(310, 820, 620, 60, wallOptions);
const topLine = Bodies.rectangle(310, 150, 620, 2, { ...wallOptions, name: "topLine", isSensor: true });

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

// Variables de estado del juego
let currentBody = null;
let currentFruit = null;
let disableAction = false;
let movementInterval = null;

// Función para añadir frutas
function addFruits() {
  const index = Math.floor(Math.random() * FRUITS.length);
  const fruit = FRUITS[index];

  const fruitBody = Bodies.circle(300, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    render: { sprite: { texture: `${fruit.name}.png` } },
    restitution: 0.2,
  });

  currentBody = fruitBody;
  currentFruit = fruit;

  World.add(world, fruitBody);
}

// Movimiento y control de frutas
function moveFruit(direction) {
  const positionX = currentBody.position.x;
  const radius = currentFruit.radius;
  const moveStep = 10;
  const leftBoundary = 30;
  const rightBoundary = 590;

  if (direction === "left" && positionX - radius > leftBoundary) {
    Body.setPosition(currentBody, { x: positionX - moveStep, y: currentBody.position.y });
  } else if (direction === "right" && positionX + radius < rightBoundary) {
    Body.setPosition(currentBody, { x: positionX + moveStep, y: currentBody.position.y });
  }
}

window.onkeydown = (e) => {
  if (disableAction) return;

  switch (e.code) {
    case "ArrowLeft":
    case "ArrowRight":
      if (movementInterval) return;
      movementInterval = setInterval(() => moveFruit(e.code === "ArrowLeft" ? "left" : "right"), 5);
      break;
    case "ArrowDown":
      currentBody.isSleeping = false;
      disableAction = true;
      setTimeout(() => {
        addFruits();
        disableAction = false;
      }, 800);
      break;
  }
};

window.onkeyup = (e) => {
  if (["ArrowLeft", "ArrowRight"].includes(e.code)) {
    clearInterval(movementInterval);
    movementInterval = null;
  }
};

// Manejo de colisiones
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB, collision } = pair;
    
    // Lógica de combinación de frutas
    if (bodyA.index === bodyB.index) {
      const index = bodyA.index;
      if (index === FRUITS.length - 1) return;
      
      World.remove(world,[bodyA,bodyB]);
      
      const newFruit = FRUITS[index + 1];
      const newBody = Bodies.circle(
        collision.supports[0].x,
        collision.supports[0].y,
        newFruit.radius,
        {
          render : { 
            sprite: { texture: `${newFruit.name}.png`}
          },
          index: index + 1
        }
      );

      World.add(world,newBody);
    }


    // Game over al tocar la línea superior
    if (!disableAction && ["topLine", "topLine"].includes(bodyA.name || bodyB.name)) {
      alert("Game Over");
    }
  });
});

addFruits();