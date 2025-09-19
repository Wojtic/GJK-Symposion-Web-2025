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
    const lecture = {"id": rowIndex + 2, "title": row[5], "name": row[0], "room": row[2], "start_time": startTime, "end_time": endTime} 

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

function getLectures() {
  let lectures = {};

  range.forEach((row, rowIndex) => { 
    const [ , startTime, , endTime] = row[1].split(" ")

    const lecture = {"id": rowIndex + 2, "title": row[5], "name": row[0], "room": row[2], "profile": row[3],"annotation": row[4], "start_time": startTime, "end_time": endTime}
    
    if(!lecture.title || !lecture.name || !lecture.room) {
      return;
    }

    lectures[rowIndex + 2] = lecture;
  });
  
  Logger.log(lectures);
  return lectures;
}

function doGet(e) {
  const action = e.queryString; // Get ?getHarmonogram or ?getLectures from URL
  let result;

  if (action === "getHarmonogram") {
    result = getHarmonogram();
  } else if (action === "getLectures") {
    result = getLectures();
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
