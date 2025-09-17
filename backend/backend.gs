const daysMap = new Map([
  ["po", "Pondělí"],
  ["út", "Úterý"],
  ["st", "Středa"],
  ["čt", "Čtvrtek"],
  ["pá", "Pátek"],
  ["so", "Sobota"],
  ["ne", "Neděle"],
]);

const sheet = SpreadsheetApp.getActiveSheet()
const range = sheet.getRange("E2:J").getValues()

function getHarmonogram() {

  let json = {
    "update_date": new Date().toUTCString(),
    "days": []
    }

  range.forEach((row, rowIndex) => {

    const [dayShort, startTime, , endTime] = row[1].split(" ")
    const day = daysMap.get(dayShort);

    // rowIndex starts at 0, +2 -> one-based indexing and offset by header
    const lecture = {"id": rowIndex + 2, "title": row[5], "name": row[0], "room": row[2]} 

    if(!lecture.title || !lecture.name || !lecture.room) {
      return;
    }

    let jsonDay = json.days.find(d => d.day === day);

    if (!jsonDay) {
      jsonDay = {
        "day": day,
        "times": []
      }
      json.days.push(jsonDay);
    }
    
    let timeSlot = jsonDay.times.find(t => t.time === startTime);

    if (!timeSlot) {
      timeSlot = { time: startTime, lectures: [] };
      jsonDay.times.push(timeSlot);
    }

    timeSlot.lectures.push(lecture);
  })
  
  Logger.log(json);
  return json;
}

function getLecture(id) {
  let testId = 2;
  const row = range[testId - 2];

  const lecture = {"id": testId, "title": row[5], "name": row[0], "room": row[2], "profile": row[3],"annotation": row[4]} 

  Logger.log(lecture);
  return lecture;
}

function doGet(e) {
  const action = e.parameter.action; // Get ?action= from URL
  let result;

  if (action === "getHarmonogram") {
    result = getHarmonogram();
  } else if (action === "getLecture") {
    result = getLecture(e.parameter.id);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
 
/*{"update_date": new Date().toUTCString(), 
"days": [
  {"day": "Pondělí",
  "times": [
    {"time": "10:00",
    // Možná start_time a end_time by bylo praktičtejší?
    "lectures": [
      {"id": 5, "title": "Strašně zajímavá přednáška", "name": "Štěpán Hawking", "room": "USV"},
      {"id": 6, "title": "Méně zajímavá přednáška", "name": "Štěpán Molt", "room": "Aula"},
      {"id": 7, "title": "Nezajímavá přednáška", "name": "Štěpán Vomáčka", "room": "P2.3"}
    ]}
  ]},
  {"day": "Úterý",
  "times": [
    {"time": "10:00",
    // Možná start_time a end_time by bylo praktičtejší?
    "lectures": [
      {"id": 8, "title": "Strašně zajímavá přednáška", "name": "Štěpán Hawking", "room": "USV"},
      {"id": 9, "title": "Méně zajímavá přednáška", "name": "Štěpán Molt", "room": "Aula"},
      {"id": 10, "title": "Nezajímavá přednáška", "name": "Štěpán Vomáčka", "room": "P2.3"}
    ]}
  ]}
]}*/
