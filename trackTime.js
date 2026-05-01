const TEST_MODE = true;
document.addEventListener('DOMContentLoaded', function() {
    initTrackDatePicker();
});

function initTrackDatePicker() {
    const blockedDates = JSON.parse(localStorage.getItem("blockedDates") || "[]");
    const manualBlocked = blockedDates.map(b => b.date);

    flatpickr("#selectedDate", {
        defaultDate: "today",
        dateFormat: "Y-m-d",
        locale: { firstDayOfWeek: 0 },
        disable: [
            function(date) { return (date.getDay() === 0 || date.getDay() === 6); },
            ...manualBlocked
        ], 
        onChange: function(selectedDates, dateStr) {
            loadSchedule();
        }, 
        onReady: function(selectedDates, dateStr) {
            loadSchedule();
        }
    });
}

function loadSchedule() {
    let selectedDate = document.getElementById("selectedDate").value;
    let table = document.getElementById("scheduleTable");
    table.innerHTML = "";

    let today = new Date().toISOString().split("T")[0];
    let students = JSON.parse(localStorage.getItem("students")) || [];
 
    let filtered = students.filter(s => s.dates && s.dates.includes(selectedDate));

    if (filtered.length === 0) {
        table.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No students scheduled for this date.</td></tr>";
        return;
    }

    filtered.forEach((student) => {
        let row = table.insertRow();
 
        row.insertCell(0).innerHTML = `<strong>${student.name}</strong>`;
        row.insertCell(1).innerHTML = `<strong>${student.section}</strong>`;
 
        const sessionKeys = ["morning", "break", "lunch"];
        
        sessionKeys.forEach((key, index) => {
            let cell = row.insertCell(index + 2);
            cell.appendChild(createSessionUI(student, key, selectedDate, today));
        });
    });
}

function createSessionUI(student, sessionKey, selectedDate, today) {
    let container = document.createElement("div");
    container.className = "session-controls"; 
    
    let attendance = student.attendance || {};
    let dailyRecord = attendance[selectedDate] || {};
    let session = dailyRecord[sessionKey] || { timeIn: null, timeOut: null };
 
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeDecimal = currentHour + (currentMinute / 60);
 
    const timeConfigs = {
        morning: { inStart: 7,    outStart: 10 },    
        break:   { inStart: 10.5, outStart: 12 },    
        lunch:   { inStart: 13,   outStart: 16 }    
    };

    const config = timeConfigs[sessionKey];
 
    let inBtn = document.createElement("button");
    inBtn.innerText = session.timeIn || "In";
     
    const canTimeIn = (TEST_MODE || selectedDate === today) && 
                      !session.timeIn && 
                      currentTimeDecimal >= config.inStart;

    inBtn.className = session.timeIn ? "btn-recorded" : (canTimeIn ? "btn-action" : "btn-disabled");
    inBtn.disabled = !canTimeIn;

    inBtn.onclick = function () {
        if (confirm(`Time In for ${sessionKey}?`)) {
            session.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveAttendance(student, selectedDate, sessionKey, session);
            loadSchedule();
        }
    };
 
    let outBtn = document.createElement("button");
    outBtn.innerText = session.timeOut || "Out";
 
    const canTimeOut = (TEST_MODE || selectedDate === today) && 
                       session.timeIn && 
                       !session.timeOut && 
                       currentTimeDecimal >= config.outStart;

    outBtn.className = session.timeOut ? "btn-recorded" : (canTimeOut ? "btn-action" : "btn-disabled");
    outBtn.disabled = !canTimeOut;

    outBtn.onclick = function () {
        if (confirm(`Time Out for ${sessionKey}?`)) {
            session.timeOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveAttendance(student, selectedDate, sessionKey, session);
            loadSchedule();
        }
    };

    container.appendChild(inBtn);
    container.appendChild(outBtn);
    return container;
}

function saveAttendance(student, dateStr, sessionKey, sessionData) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let studentIndex = students.findIndex(s => s.name === student.name && s.section === student.section);

    if (studentIndex !== -1) {
        let currentStudent = students[studentIndex];  
        if (!currentStudent.attendance) currentStudent.attendance = {};
        if (!currentStudent.attendance[dateStr]) currentStudent.attendance[dateStr] = {};
 
        currentStudent.attendance[dateStr][sessionKey] = sessionData;
        const dayRecord = currentStudent.attendance[dateStr];
 
            const isOneDayStudent = currentStudent.dates && currentStudent.dates.length === 1;
 
            const requiredHours = parseFloat(currentStudent.hours) || 8; 

            let totalMinutesWorked = 0;
            const sessionKeys = ["morning", "break", "lunch"];
 
            const timeToMinutes = (timeStr) => {
                if (!timeStr) return null; 
                const parts = timeStr.match(/(\d+):(\d+)\s+(AM|PM)/);
                if (!parts) return null;
                
                let hours = parseInt(parts[1]);
                let minutes = parseInt(parts[2]);
                let modifier = parts[3];

                if (hours === 12) hours = 0;
                if (modifier === 'PM') hours += 12;
                return hours * 60 + minutes;
            };
 
        sessionKeys.forEach(key => {
            const sess = dayRecord[key];
            if (sess && sess.timeIn && sess.timeOut) {
                const start = timeToMinutes(sess.timeIn);
                const end = timeToMinutes(sess.timeOut);
                if (end > start) totalMinutesWorked += (end - start);
            }
        });

        const totalHoursWorked = totalMinutesWorked / 60;
 
        let missingDetails = [];
        const labels = { morning: "Morning", break: "After Break", lunch: "After Lunch" };

        sessionKeys.forEach(key => {
            const sess = dayRecord[key];
            const label = labels[key];
            if (!sess) {
                missingDetails.push(`${label} (No In/Out)`);
            } else {
                if (!sess.timeIn) missingDetails.push(`${label} (No Time In)`);
                if (!sess.timeOut) missingDetails.push(`${label} (No Time Out)`);
            }
        });
 
        if (isOneDayStudent && totalHoursWorked >= requiredHours) {
            dayRecord.status = "Completed";
            dayRecord.remarks = `Hours Met (${totalHoursWorked.toFixed(1)}/${requiredHours} hrs)`;
        }  
        else if (missingDetails.length === 0) {
            dayRecord.status = "Completed";
            dayRecord.remarks = "All sessions filled";
        } else {
            dayRecord.status = "Incomplete";
            dayRecord.remarks = `Missing: ${missingDetails.join(", ")}`;
        }

        localStorage.setItem("students", JSON.stringify(students));
    }
}