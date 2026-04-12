window.onload = function () {
    let today = new Date().toISOString().split("T")[0];
    document.getElementById("selectedDate").value = today;
    loadSchedule();
};

function isSameDate(date1, date2) {
    return date1 === date2;
}
// Load schedule for selected date
function loadSchedule() {
    let selectedDate = document.getElementById("selectedDate").value;
    let table = document.getElementById("scheduleTable");
    table.innerHTML = "";

    let today = new Date().toISOString().split("T")[0];

    let students = JSON.parse(localStorage.getItem("students")) || [];

    let filtered = students.filter(s =>
        selectedDate >= s.startDate &&
        selectedDate <= s.endDate
    );

    filtered.forEach((student) => {
        let row = table.insertRow();

        // NAME + SECTION
        row.insertCell(0).innerHTML = `<strong>${student.name}</strong>`;
        row.insertCell(1).innerHTML = `<strong>${student.section}</strong>`;

        // MORNING COLUMN
        let morningCell = row.insertCell(2);
        morningCell.appendChild(createSessionUI(student, "morning(am)", selectedDate, today));

        // BREAK COLUMN
        let breakCell = row.insertCell(3);
        breakCell.appendChild(createSessionUI(student, "After Break(am)", selectedDate, today));

        // LUNCH COLUMN
        let lunchCell = row.insertCell(4);
        lunchCell.appendChild(createSessionUI(student, "After Lunch(pm)", selectedDate, today));
    });
}
function createSessionUI(student, sessionName, selectedDate, today) {
    let container = document.createElement("div");
    container.style.marginBottom = "10px";

    let session = student.sessions?.[sessionName] || { timeIn: null, timeOut: null };

    // ===== TIME IN BUTTON =====
    let inBtn = document.createElement("button");
    inBtn.innerText = session.timeIn || "Time In";

    // Disable if already used OR not today
    if (session.timeIn || selectedDate !== today) {
        inBtn.disabled = true;
    }

    inBtn.onclick = function () {
        let confirmIn = confirm("Are you sure you want to Time In?");
        if (!confirmIn) return;

        session.timeIn = new Date().toLocaleTimeString();
        saveSession(student, sessionName, session);
        loadSchedule();
    };

    container.appendChild(inBtn);

    // ===== TIME OUT BUTTON =====
    let outBtn = document.createElement("button");
    outBtn.innerText = session.timeOut || "Time Out";

    // Disable if already used OR not today
    if (session.timeOut || selectedDate !== today) {
        outBtn.disabled = true;
    }

    outBtn.onclick = function () {
        let confirmOut = confirm("Are you sure you want to Time Out?");
        if (!confirmOut) return;

        session.timeOut = new Date().toLocaleTimeString();
        saveSession(student, sessionName, session);
        loadSchedule();
    };

    container.appendChild(outBtn);

    return container;
}

function saveSession(student, sessionName, sessionData) {
    let students = JSON.parse(localStorage.getItem("students")) || [];

    let index = students.findIndex(s =>
        s.name === student.name &&
        s.startDate === student.startDate
    );

    if (!students[index].sessions) {
        students[index].sessions = {
            morning: { timeIn: null, timeOut: null },
            break: { timeIn: null, timeOut: null },
            lunch: { timeIn: null, timeOut: null }
        };
    }

    students[index].sessions[sessionName] = sessionData;

    localStorage.setItem("students", JSON.stringify(students));
} 