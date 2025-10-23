const TYPE_COUNT = 5;
const FISH_SPEED = [10, 15, 20, 25, 20];
const FISH_MASS = [5, 5, 5, 5, 5];

const STREAM_VX = 3;
const allFish = [];

document.addEventListener("DOMContentLoaded", function () {
  const fishCount = 50;
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
    }
  }
  animate();
});

class Fish {
  constructor(
    container,
    type = Math.floor(Math.random() * TYPE_COUNT),
    size = Math.floor(Math.random() * 100) + 150
  ) {
    this.type = type;
    this.maxSpeed = FISH_SPEED[type] / 2;
    this.maxForce = 0.5;
    this.size = size;
    this.mass = FISH_MASS[type];
    this.container = container;
    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;

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

  initLeft() {
    this.x = -this.size;
    this.y = Math.random() * this.containerHeight;

    this.setPosition(this.x, this.y);
  }

  setPosition(x, y) {
    this.element.style.left = x - this.size / 2 + "px";
    this.element.style.top = y - this.size / 2 + "px";
  }

  applyForce(Fx, Fy) {
    this.ax += Fx / this.mass;
    this.ay += Fy / this.mass;
  }

  update() {
    this.flock();
    //this.applyForce(STREAM_VX - this.vx, 0);

    this.vx += this.ax;
    this.vy += this.ay;

    this.x += this.vx;
    this.y += this.vy;

    this.faceDirection();
    this.setPosition(this.x, this.y);

    if (this.x > this.containerWidth + this.size) {
      this.x = -this.size;
    }
    if (this.y < 0 || this.y > this.containerHeight) {
      this.vy = -this.vy;
    }
    this.y = Math.min(Math.max(0, this.y), this.containerHeight);

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
        let diffMag = this.length(diffX, diffY);

        diffX /= diffMag * d;
        diffY /= diffMag * d;

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
