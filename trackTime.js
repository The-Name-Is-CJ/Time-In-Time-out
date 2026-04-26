window.onload = function () {
    let today = new Date().toISOString().split("T")[0];
    document.getElementById("selectedDate").value = today;
    loadSchedule();
};

// Load schedule for selected date
function loadSchedule() {
    let selectedDate = document.getElementById("selectedDate").value;
    let table = document.getElementById("scheduleTable");
    table.innerHTML = "";

    let today = new Date().toISOString().split("T")[0];
    let students = JSON.parse(localStorage.getItem("students")) || [];

    // Filter students who are scheduled for the specific selected date
    let filtered = students.filter(s => s.dates && s.dates.includes(selectedDate));

    if (filtered.length === 0) {
        table.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No students scheduled for this date.</td></tr>";
        return;
    }

    filtered.forEach((student) => {
        let row = table.insertRow();

        // NAME + SECTION
        row.insertCell(0).innerHTML = `<strong>${student.name}</strong>`;
        row.insertCell(1).innerHTML = `<strong>${student.section}</strong>`;

        // Create cells for the three sessions
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

    // Attendance is stored by date, then by session
    // Structure: student.attendance["2026-04-10"]["morning"] = {timeIn, timeOut}
    let attendance = student.attendance || {};
    let dailyRecord = attendance[selectedDate] || {};
    let session = dailyRecord[sessionKey] || { timeIn: null, timeOut: null };

    // ===== TIME IN BUTTON =====
    let inBtn = document.createElement("button");
    inBtn.innerText = session.timeIn || "In";
    inBtn.className = session.timeIn ? "btn-recorded" : "btn-action";

    // Disable if already used OR not today
    if (session.timeIn || selectedDate !== today) {
        inBtn.disabled = true;
    }

    inBtn.onclick = function () {
        if (confirm(`Time In for ${sessionKey}?`)) {
            session.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveAttendance(student, selectedDate, sessionKey, session);
            loadSchedule();
        }
    };

    // ===== TIME OUT BUTTON =====
    let outBtn = document.createElement("button");
    outBtn.innerText = session.timeOut || "Out";
    outBtn.className = session.timeOut ? "btn-recorded" : "btn-action";

    // Disable if already used OR not today OR if they haven't timed in yet
    if (session.timeOut || selectedDate !== today || !session.timeIn) {
        outBtn.disabled = true;
    }

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

    // Find the specific student in the global array
    let studentIndex = students.findIndex(s => s.name === student.name && s.section === student.section);

    if (studentIndex !== -1) {
        if (!students[studentIndex].attendance) {
            students[studentIndex].attendance = {};
        }
        if (!students[studentIndex].attendance[dateStr]) {
            students[studentIndex].attendance[dateStr] = {};
        }

        students[studentIndex].attendance[dateStr][sessionKey] = sessionData;
        localStorage.setItem("students", JSON.stringify(students));
    }
}