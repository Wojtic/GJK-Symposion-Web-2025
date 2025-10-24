let vlnkyHeight = 250;
let MODE = "FISH"; // FISH or POPUP or HIDDEN
const isPortrait = window.matchMedia("(orientation: portrait)").matches;

let lastScrollY = 0;
let lastScrollFish = 0;

document.addEventListener("readystatechange", (event) => {
  if (event.target.readyState === "complete") {
    vlnkyHeight = document.getElementsByClassName("voda_gif")[0].height;
    enableOverlayFish();
  }
});

window.addEventListener("scroll", (e) => {
  if (window.scrollY > 0) {
    e.preventDefault();
  } else if (MODE != "FISH") {
    MODE = "FISH";
    enableOverlayFish();
  }
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scrollEvent(delta) {
  const overlay = document.getElementById("overlay");

  if (MODE == "HIDDEN") {
    if (window.scrollY > 0) return;
    if (delta < 0) {
      return enableOverlayFish();
    }
    document.body.style.overflow = "auto";
    return;
  }

  if (MODE == "FISH") {
    if (window.scrollY > 0) return;
    document.body.style.overflow = "hidden";

    if (lastScrollY < window.innerHeight) {
      lastScrollY += delta;

      if (isPortrait) {
        if (
          clamp(0.9 * window.innerWidth, 0, 600) + lastScrollY >=
          window.innerHeight * 0.9
        ) {
          return hideOverlay();
        }
      }

      if (lastScrollY >= window.innerHeight - vlnkyHeight) {
        lastScrollY = Math.max(0, window.innerHeight - vlnkyHeight);
        document.body.style.overflow = "auto";
      }
      lastScrollY = Math.max(0, lastScrollY);
      if (isPortrait) {
        overlay.style.top = `calc(clamp(0px, 90vw, 60rem) * 0.6 +  ${lastScrollY}px)`;
      } else {
        overlay.style.top = `${lastScrollY}px`;
      }
    }
    return;
  }

  lastScrollFish += delta;
  lastScrollFish = Math.min(
    Math.max(0, lastScrollFish),
    window.innerHeight - vlnkyHeight
  );
  overlay.style.top = `${lastScrollFish}px`;

  if (lastScrollFish >= window.innerHeight - vlnkyHeight) {
    MODE = "FISH";
    setTimeout(enableOverlayFish, 100);
  }
}

window.addEventListener("wheel", (e) => {
  scrollEvent(e.deltaY);
});

document.addEventListener("keydown", function (e) {
  // TODO
  switch (e.key) {
    case "ArrowUp":
      console.log("Top");
      break;
    case "ArrowDown":
      console.log("Down");
      break;
  }
});

function hideOverlay() {
  const scaleFactor = 0.25;

  document.getElementById("intro").style.display = "none";
  document.getElementById("popup").style.display = "none";
  document.getElementById("fish_container").style.display = "none";

  document.body.style.overflow = "auto";
  document.getElementById("overlay").style.top =
    window.innerHeight - vlnkyHeight + "px";

  document.getElementsByClassName(
    "voda_gif"
  )[0].style.transform = `scaleY(${scaleFactor})`;

  MODE = "HIDDEN";
}

function enableOverlayFish() {
  document.getElementById("intro").style.display = "flex";
  document.getElementById("popup").style.display = "none";

  if (window.scrollY != 0) {
    document.body.style.overflow = "auto";
    overlay.style.top = `calc(100vh - ${vlnkyHeight}px)`;
    lastScrollY = window.innerHeight - vlnkyHeight;
  } else {
    document.body.style.overflow = "hidden";
    if (isPortrait) {
      overlay.style.top = `calc(clamp(0px, 90vw, 60rem) * 0.6) -  ${lastScrollY}px)`;
    } else {
      overlay.style.top = lastScrollY + "px";
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  fill_harmonogram();
});

document.addEventListener("touchmove", touchmove);
document.addEventListener("touchstart", touchstart);

let startY;

function touchstart(e) {
  startY = e.touches[0].clientY;
}

function touchmove(e) {
  let deltaY = e.touches[0].clientY - startY;

  startY = e.touches[0].clientY;

  scrollEvent(-deltaY);
}

async function fill_harmonogram() {
  const getData = async () => {
    const time = new Date().getTime(); // Add it to the URL to prevent caching
    const harmonogramURL = "http://localhost:8080/API/harmonogram";
    const url = harmonogramURL + "&t=" + time;
    let data;
    try {
      data = await cachedFetch("harmonogram", url, 180);
    } catch {
      console.error("error fetching data");
    }
    return data;
  };
  const data = await getData();
  const days = data["days"];

  days.forEach((day, index) => {
    const container = document.getElementById("harmonogram_days");
    const day_div = document.createElement("div");
    day_div.classList.add("day_table");
    const day_title = document.createElement("h3");
    day_title.textContent = day.day;
    day_div.appendChild(day_title);
    const table = document.createElement("table");
    table.id = "harmonogram_" + index;
    const header_row = document.createElement("tr");
    const time_header = document.createElement("th");
    time_header.textContent = "Čas";
    header_row.appendChild(time_header);

    const rooms = [];

    day.times.forEach((time) => {
      time.lectures.forEach((lecture) => {
        if (!rooms.includes(lecture.room)) {
          rooms.push(lecture.room);
        }
      });
    });

    function room_sort(a, b) {
      if (a[0] == "P" && b[0] != "P") return true;
      else if (a[0] != "P" && b[0] == "P") return false;
      return a.localeCompare(b, "cs");
    }

    rooms.sort(room_sort);

    rooms.forEach((room) => {
      const room_header = document.createElement("th");
      room_header.textContent = room;
      header_row.appendChild(room_header);
    });
    table.appendChild(header_row);

    day.times.forEach((time) => {
      const row = document.createElement("tr");
      const time_cell = document.createElement("td");
      time_cell.textContent = time.time;
      row.appendChild(time_cell);

      const lectures = time.lectures;
      lectures.sort((a, b) => room_sort(a.room, b.room));

      lectures.forEach((lecture) => {
        const cell = document.createElement("td");
        if (lecture.name != "" && lecture.title != "") {
          cell.setAttribute("onclick", "showPopup(" + lecture.id + ")");
        }
        const presenter_p = document.createElement("p");
        presenter_p.classList.add("presenter");
        presenter_p.textContent = lecture.name;
        const lecture_p = document.createElement("p");
        lecture_p.classList.add("lecture");
        lecture_p.textContent = lecture.title;
        cell.appendChild(presenter_p);
        cell.appendChild(lecture_p);
        row.appendChild(cell);
      });

      table.appendChild(row);
    });

    day_div.appendChild(table);
    container.appendChild(day_div);
  });
}

async function Popup(id) {
  MODE = "POPUP";

  const getData = async () => {
    const url = "http://localhost:8080/API/prednaska/" + id;
    let data;
    try {
      data = await cachedFetch("prednaska" + id, url, 180);
    } catch {
      console.error("error fetching data");
      data = {
        title: "Ukázkový název přednášky",
        name: "Jan Novák",
        annotation:
          "Toto je ukázková anotace přednášky. Bude zde popsán obsah přednášky a další informace.",
        profile:
          "Jan Novák je zkušený přednášející s mnohaletou praxí v oboru. Specializuje se na zajímavá témata a rád sdílí své znalosti.",
        room: "Aula",
        start_time: "10:00",
        end_time: "11:00",
      };
    }
    return data;
  };

  const data = await getData();
  console.log(id);

  document.getElementById("popup_title").textContent = data.title;
  document.getElementById("popup_presenter").textContent = data.name;
  document.getElementById("popup_annotation").textContent = data.annotation;
  document.getElementById("popup_profile").textContent = data.profile;
  document.getElementById("popup_room").textContent = data.room;
  document.getElementById("popup_time").textContent =
    data.start_time + " - " + data.end_time;

  document.getElementById("popup").style.display = "block";
  document.getElementById("intro").style.display = "none";

  document.getElementById("overlay").style.top = "0px";
  lastScrollFish = 0;
  document.body.style.overflow = "hidden";
}

async function cachedFetch(name, url, refresh_time) {
  let lst = "T_" + name;
  let t = Math.floor(new Date().getTime() / 1000);
  if (lst in localStorage) {
    if (t - localStorage[lst] < refresh_time) {
      console.log(
        "fetch to " + url + " was cached " + (t - localStorage[lst]) + "s ago"
      );
      return JSON.parse(localStorage[name]);
    }
  }
  console.log("fetching " + url);
  let r = await fetch(url);

  try {
    if (r.ok) {
      const json = await r.json();
      localStorage[lst] = t;
      localStorage[name] = JSON.stringify(json);
      return json;
    } else {
      throw new Error("fetch_error");
    }
  } catch (error) {
    console.error(error.message);
    console.error("net_error: " + error);
    if (lst in localStorage) {
      console.log(
        "fallback to cache for " +
          url +
          " from " +
          (t - localStorage[lst]) +
          "s ago"
      );
      return localStorage[name];
    }
  }
}
