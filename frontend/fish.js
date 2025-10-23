const TYPE_COUNT = 5;
const FISH_SPEED = [4, 4, 7, 5, 4];
const FISH_MASS = [5, 5, 5, 5, 5];

let maxX = 600;
const STREAM_VX = 2;
const allFish = [];

let mouseX = 0;
let mouseY = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX * (maxX / window.innerWidth);
  mouseY =
    e.clientY -
    document.getElementById("fish_container").getBoundingClientRect().top;
  mouseY = mouseY * (maxX / window.innerWidth);
});

document.addEventListener("DOMContentLoaded", function () {
  const screenWidth = window.innerWidth;
  maxX = 600 + ((screenWidth - 375) * (1000 - 600)) / (1920 - 375);

  const fishCount = 30;
  const fishContainer = document.getElementById("fish_container");
  for (let i = 0; i < fishCount; i++) {
    const newFish = new Fish(fishContainer);
    newFish.initRandom();
    allFish.push(newFish);
  }
  function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < fishCount; i++) {
      allFish[i].update();
      if (
        allFish[i].x > maxX + allFish[i].size ||
        allFish[i].x < -allFish[i].size
      ) {
        allFish[i].initLeft();
      }
    }
  }
  animate();
});

class Fish {
  constructor(
    container,
    type = Math.floor(Math.random() * TYPE_COUNT),
    size = Math.floor(Math.random() * 50) + 100
  ) {
    this.type = type;
    this.maxSpeed = FISH_SPEED[type];
    this.maxForce = 0.5;
    this.size = size;
    this.mass = FISH_MASS[type];
    this.container = container;
    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;

    // Scale it such that x is from 0 to 1500
    this.scale = this.containerWidth / maxX;

    this.x = 0;
    this.y = 0;

    this.vx = STREAM_VX;
    this.vy = 0;

    this.Fx = 0;
    this.Fy = 0;

    this.ax = 0;
    this.ay = 0;

    this.element = document.createElement("img");
    this.element.src = `./media/fish/fish${this.type + 1}.gif`;
    this.element.style.width = this.size * this.scale + "px";
    this.element.classList.add("fish");

    this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";

    this.container.appendChild(this.element);
  }

  initRandom() {
    this.x = Math.random() * maxX;
    this.y = (Math.random() * this.containerHeight) / this.scale;

    this.setPosition(this.x, this.y);
  }

  initLeft() {
    this.x = -this.size;
    this.y = (Math.random() * this.containerHeight) / this.scale;

    (this.type = Math.floor(Math.random() * TYPE_COUNT)),
      (this.size = Math.floor(Math.random() * 50) + 100);

    this.maxSpeed = FISH_SPEED[this.type];
    this.mass = FISH_MASS[this.type];

    this.vx = STREAM_VX;
    this.vy = 0;

    this.Fx = 0;
    this.Fy = 0;

    this.ax = 0;
    this.ay = 0;
    this.element.src = `./media/fish/fish${this.type + 1}.gif`;
    this.element.style.width = this.size * this.scale + "px";

    this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";

    this.setPosition(this.x, this.y);
  }

  setPosition(x, y) {
    this.element.style.left =
      x * this.scale - (this.scale * this.size) / 2 + "px";
    this.element.style.top = y * this.scale + "px";
  }

  applyForce(Fx, Fy) {
    this.ax += Fx / this.mass;
    this.ay += Fy / this.mass;
  }

  update() {
    this.flock();
    //this.applyForce(STREAM_VX - this.vx, 0);
    this.cursor();

    this.vx += this.ax;
    this.vy += this.ay;

    this.x += this.vx;
    this.y += this.vy;

    this.faceDirection();
    this.setPosition(this.x, this.y);

    if (this.x > this.containerWidth / this.scale + this.size / this.scale) {
      this.x = -this.size;
    }
    if (this.y < 0 || this.y > this.containerHeight / this.scale) {
      this.vy = -this.vy;
    }
    this.y = Math.min(Math.max(0, this.y), this.containerHeight / this.scale);

    this.ax = 0;
    this.ay = 0;
  }

  flock() {
    let [sepX, sepY] = this.separate();
    let [aliX, aliY] = this.align();
    let [cohX, cohY] = this.cohesion();

    this.applyForce(sepX * 1.5, sepY * 1.5);
    this.applyForce(aliX, aliY);
    this.applyForce(cohX, cohY);
  }

  cursor() {
    let mY = mouseY - this.size / 2 / this.scale;
    let dx = mouseX - this.x;
    let dy = mY - this.y;
    const dist = this.length(dx, dy);
    if (dist < 150 && dist > 20) {
      let [seekX, seekY] = this.seek(mouseX, mY);

      this.applyForce(seekX * 2, seekY * 2);
    }
  }

  separate() {
    const desiredseparation = 150;
    let steerX = 0;
    let steerY = 0;

    let count = 0;
    for (let i = 0; i < allFish.length; i++) {
      let other = allFish[i];
      const d = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);

      if (d > 0 && d < desiredseparation) {
        let diffX = this.x - other.x;
        let diffY = this.y - other.y;

        diffX /= d * d;
        diffY /= d * d;

        steerX += diffX;
        steerY += diffY;
        count++;
      }
    }

    if (count > 0) {
      steerX /= count;
      steerY /= count;
    }

    if (!(steerX == 0 && steerY == 0)) {
      let steerMag = this.length(steerX, steerY);
      steerX *= this.maxSpeed / steerMag;
      steerY *= this.maxSpeed / steerMag;

      steerX -= this.vx;
      steerY -= this.vy;

      const steerF = Math.sqrt(steerX * steerX + steerY * steerY);
      if (steerF > this.maxForce) {
        steerX = (steerX * this.maxForce) / steerF;
        steerY = (steerY * this.maxForce) / steerF;
      }
    }
    return [steerX, steerY];
  }

  align() {
    const neighbordist = 350;
    let sumX = 0;
    let sumY = 0;

    let count = 0;
    for (let i = 0; i < allFish.length; i++) {
      let other = allFish[i];
      const d = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);

      if (d > 0 && d < neighbordist) {
        sumX += other.vx;
        sumY += other.vy;
        count++;
      }
    }

    if (count > 0) {
      sumX /= count;
      sumY /= count;

      let sumMag = this.length(sumX, sumY);
      sumX *= this.maxSpeed / sumMag;
      sumY *= this.maxSpeed / sumMag;

      let steerX = sumX - this.vx;
      let steerY = sumY - this.vy;
      const steerF = Math.sqrt(steerX * steerX + steerY * steerY);
      if (steerF > this.maxForce) {
        steerX = (steerX * this.maxForce) / steerF;
        steerY = (steerY * this.maxForce) / steerF;
      }

      return [steerX, steerY];
    } else {
      return [0, 0];
    }
  }

  cohesion() {
    const neighbordist = 350;
    let sumX = 0;
    let sumY = 0;

    let count = 0;
    for (let i = 0; i < allFish.length; i++) {
      let other = allFish[i];
      const d = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);

      if (d > 0 && d < neighbordist) {
        sumX += other.x;
        sumY += other.y;
        count++;
      }
    }

    if (count > 0) {
      return this.seek(sumX / count, sumY / count);
    }
    return [0, 0];
  }

  length(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  seek(x, y) {
    let dx = x - this.x;
    let dy = y - this.y;

    const vel = Math.sqrt(dx * dx + dy * dy);
    dx = (dx * this.maxSpeed) / vel;
    dy = (dy * this.maxSpeed) / vel;

    let steerX = dx - this.vx;
    let steerY = dy - this.vy;

    const steerF = Math.sqrt(steerX * steerX + steerY * steerY);
    if (steerF > this.maxForce) {
      steerX = (steerX * this.maxForce) / steerF;
      steerY = (steerY * this.maxForce) / steerF;
    }

    return [steerX, steerY];
  }

  faceDirection() {
    this.element.style.transform = this.vx > 0 ? "scaleX(1)" : "scaleX(-1)";
    if (this.vx > 0)
      this.element.style.rotate = Math.atan2(this.vy, this.vx) + "rad";
    else
      this.element.style.rotate =
        Math.PI + Math.atan2(this.vy, this.vx) + "rad";
  }
}
