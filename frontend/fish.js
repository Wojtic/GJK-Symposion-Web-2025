const TYPE_COUNT = 5;
const FISH_SPEED = [10, 15, 20, 25, 30];

document.addEventListener("DOMContentLoaded", function () {
  const fishCount = 30;
  const fishContainer = document.getElementById("fish_container");
  const fish = [];
  for (let i = 0; i < fishCount; i++) {
    const newFish = new Fish(fishContainer);
    newFish.initRandom();
    fish.push(newFish);
  }
  function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < fishCount; i++) {
      fish[i].update();
    }
  }
  animate();
});

class Fish {
  constructor(
    container,
    type = Math.floor(Math.random() * TYPE_COUNT),
    size = Math.floor(Math.random() * 100) + 250
  ) {
    this.type = type;
    this.speed = FISH_SPEED[type];
    this.size = size;
    this.container = container;

    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;

    this.vx = (Math.random() - 0.5) * this.speed;
    this.vy = (Math.random() - 0.5) * this.speed;

    this.x = 0;
    this.y = 0;

    this.element = document.createElement("img");
    this.element.src = `./media/fish/fish${this.type + 1}.gif`;
    this.element.style.width = this.size + "px";
    this.element.classList.add("fish");

    this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";

    this.container.appendChild(this.element);
  }

  initRandom() {
    this.x = Math.random() * this.containerWidth;
    this.y = Math.random() * this.containerHeight;

    this.setPosition(this.x, this.y);
  }

  setPosition(x, y) {
    this.element.style.left = x - this.size / 2 + "px";
    this.element.style.top = y - this.size / 2 + "px";
  }

  faceDirection() {
    this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";
    if (this.vx > 0)
      this.element.style.rotate = Math.atan2(this.vy, this.vx) + "rad";
    else
      this.element.style.rotate =
        Math.PI + Math.atan2(this.vy, this.vx) + "rad";
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > this.containerWidth) {
      this.vx = -this.vx;
      this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";
    }
    if (this.y < 0 || this.y > this.containerHeight) {
      this.vy = -this.vy;
    }

    this.faceDirection();

    this.x = Math.max(0, Math.min(this.x, this.containerWidth));
    this.y = Math.max(0, Math.min(this.y, this.containerHeight));

    this.setPosition(this.x, this.y);
  }
}
