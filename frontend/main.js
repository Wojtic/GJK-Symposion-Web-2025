let vlnkyHeight = 250;
let MODE = "FISH"; // FISH or POPUP or HIDDEN
const isPortrait = window.matchMedia("(orientation: portrait)").matches;
let scrollPercent = 0;

var clickStartTime;

document.addEventListener("readystatechange", (event) => {
  if (event.target.readyState === "complete") {
    vlnkyHeight = document.getElementsByClassName("voda_gif")[0].height;
    if (window.scrollY == 0) {
      enableFish();
    } else {
      hideOverlay();
    }

    document.getElementById("overlay").addEventListener("mousedown", (e) => {
      clickStartTime = new Date().getTime();
    });

    document.getElementById("overlay").addEventListener("mouseup", (e) => {
      let clickDuration = new Date().getTime() - clickStartTime;
      if (clickDuration < 100) {
        if (MODE == "FISH") return hideOverlay();
        if (MODE == "HIDDEN" && window.scrollY == 0) {
          scrollPercent = 0.6;
          document.getElementById("overlay").style.transition = "top 0.5s";
          return enableFish();
        }
        if (MODE == "POPUP") return hideOverlay();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", (event) => {
  fill_harmonogram();
});

window.addEventListener("scroll", (e) => {});

window.addEventListener("wheel", (e) => {
  scrollEvent(e.deltaY);
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scrollEvent(delta) {
  if (MODE == "HIDDEN") {
    if (window.scrollY > 0) return;
    if (delta > 0) return;
    scrollPercent = 0.6;
    document.getElementById("overlay").style.transition = "top 0.5s";
    return enableFish();
  }

  if (MODE == "FISH") {
    scrollPercent += 0.001 * delta;
    scrollPercent = clamp(scrollPercent, 0, 1);

    if (isPortrait && scrollPercent > 0.7) {
      document.getElementById("o-akci").scrollIntoView({ behavior: "smooth" });
      return hideOverlay();
    }
    if (!isPortrait && scrollPercent > 0.9) {
      return hideOverlay();
    }
    scrollPercent = clamp(scrollPercent, 0, 1);
    if (document.getElementById("fish_container").style.display == "none") {
      return enableFish();
    }
    return setOverlayTopFish();
  }

  if (MODE == "POPUP") {
    scrollPercent += 0.001 * delta;
    scrollPercent = clamp(scrollPercent, 0, 1);

    if (
      (isPortrait && scrollPercent > 0.7) ||
      (!isPortrait && scrollPercent > 0.9)
    ) {
      return hideOverlay();
    }
    setOverlayTopPopup();
  }
}

function setOverlayTopFish() {
  if (isPortrait) {
    const top = clamp(0.9 * window.innerWidth, 0, 600) * 0.6;
    const scrollRange = window.innerHeight - vlnkyHeight - top;
    return (document.getElementById("overlay").style.top =
      top + scrollPercent * scrollRange + "px");
  }
  document.getElementById("overlay").style.top =
    (window.innerHeight - vlnkyHeight) * scrollPercent + "px";
}

function enableFish() {
  MODE = "FISH";
  document.body.style.overflow = "hidden";

  document.getElementById("popup").style.display = "none";
  document.getElementById("intro").style.display = "block";
  document.getElementById("fish_container").style.display = "block";

  document.getElementsByClassName(
    "voda_gif"
  )[0].style.transform = `translateY(10px) scaleY(1)`;

  setOverlayTopFish();
  document.querySelectorAll(".day_table").forEach((el) => {
    el.style.zIndex = "initial";
  });
}

function hideOverlay() {
  MODE = "HIDDEN";
  scrollPercent = 1;
  const scale = 0.25;

  setTimeout(() => {
    document.getElementById("popup").style.display = "none";
    document.getElementById("intro").style.display = "none";
    document.getElementById("fish_container").style.display = "none";
  }, 500);

  document.body.style.overflow = "auto";

  document.getElementById("overlay").style.top =
    window.innerHeight - vlnkyHeight + "px";

  document.getElementsByClassName(
    "voda_gif"
  )[0].style.transform = `scaleY(${scale})`;

  document.querySelectorAll(".day_table").forEach((el) => {
    el.style.zIndex = "10";
  });
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
          cell.setAttribute("onclick", "popup(" + lecture.id + ")");
          cell.classList.add("clickable");
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

function setOverlayTopPopup() {
  const scrollRange = window.innerHeight - vlnkyHeight;
  document.getElementById("overlay").style.top =
    scrollPercent * scrollRange + "px";
  document.getElementsByClassName(
    "voda_gif"
  )[0].style.transform = `translateY(10px) scaleY(1)`;
}

function showPopup() {
  MODE = "POPUP";
  document.getElementById("popup").style.display = "block";
  document.getElementById("intro").style.display = "none";

  document.getElementById("overlay").style.top = "0px";
  scrollPercent = 0;
  setOverlayTopPopup();
  document.body.style.overflow = "hidden";

  document.querySelectorAll(".day_table").forEach((el) => {
    el.style.zIndex = "initial";
  });
}

async function popup(id) {
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

  document.getElementById("popup_title").textContent = data.title;
  document.getElementById("popup_presenter").textContent = data.name;
  document.getElementById("popup_annotation").textContent = data.annotation;
  document.getElementById("popup_profile").textContent = data.profile;
  document.getElementById("popup_room").textContent = data.room;
  document.getElementById("popup_time").textContent =
    data.start_time + " - " + data.end_time;

  showPopup();
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
