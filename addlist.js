function getHolidays(year) {
    const holidayList = [
        { date: `${year}-01-01`, name: "New Year's Day" },
        { date: `${year}-04-09`, name: "Araw ng Kagitingan" },
        { date: `${year}-05-01`, name: "Labor Day" },
        { date: `${year}-06-12`, name: "Independence Day" },
        { date: `${year}-11-30`, name: "Bonifacio Day" },
        { date: `${year}-12-25`, name: "Christmas Day" },
        { date: `${year}-12-30`, name: "Rizal Day" },
        { date: `${year}-02-25`, name: "EDSA Revolution Anniversary" },
        { date: `${year}-08-21`, name: "Ninoy Aquino Day" },
        { date: `${year}-11-01`, name: "All Saints' Day" },
        { date: `${year}-11-02`, name: "All Souls' Day" },
        { date: `${year}-12-08`, name: "Feast of Immaculate Conception" },
        { date: `${year}-12-31`, name: "Last Day of the Year" }
    ];

    // Calculate National Heroes Day (Last Monday of August)
    let aug31 = new Date(year, 7, 31);
    let day = aug31.getDay();
    let diff = (day >= 1) ? (day - 1) : 6;
    aug31.setDate(31 - diff);
    holidayList.push({ date: formatDate(aug31), name: "National Heroes Day" });

    // 2026 Specific Holy Week
    if (year === 2026) {
        holidayList.push(
            { date: "2026-04-02", name: "Maundy Thursday" },
            { date: "2026-04-03", name: "Good Friday" },
            { date: "2026-04-04", name: "Black Saturday" }
        );
    }

    return holidayList;
}
let blockedDates = JSON.parse(localStorage.getItem("blockedDates")) || [];
let selectedDates = [];

let currentDate = new Date();

let rangeStart = null;
let rangeEnd = null;
let tempSelected = [];


window.onload = function () {
    renderCalendar();
    loadStudents();
};

function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


function renderCalendar() {
    const container = document.getElementById("calendarDates");
    const monthYear = document.getElementById("monthYear");
    container.innerHTML = "";

    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    // Get the dynamic holiday list for the year being viewed
    const currentHolidays = getHolidays(year);

    monthYear.innerText = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        container.innerHTML += "<div></div>";
    }

    for (let i = 1; i <= lastDate; i++) {
        let date = new Date(year, month, i, 0, 0, 0, 0);
        let dateStr = formatDate(date);
        let div = document.createElement("div");
        div.innerText = i;

        let day = date.getDay();
        
        // Find if this date is a holiday or a manually blocked event
        let holidayObj = currentHolidays.find(h => h.date === dateStr);
        let blockedObj = blockedDates.find(b => b.date === dateStr);

        // 1. PRIORITY: Mark as Red if it's a Holiday OR a Blocked Event
        if (holidayObj || blockedObj) {
            div.classList.add("blocked"); // Use the red style
            
            div.onclick = (e) => {
                e.stopPropagation();
                // Determine which reason to show
                let reason = holidayObj ? holidayObj.name : blockedObj.reason;
                document.getElementById("eventDisplay").innerText = dateStr + " - " + reason;
            };
        } 
        // 2. Mark Weekends (Optional: keeps them grey if not a holiday)
        else if (day === 0 || day === 6) {
            div.classList.add("weekend");
            div.onclick = (e) => {
                e.stopPropagation();
                toggleDate(dateStr);
            };
        }
        // 3. Mark Selected (Green)
        else if (selectedDates.includes(dateStr)) {
            div.classList.add("selected");
            div.onclick = (e) => {
                e.stopPropagation();
                toggleDate(dateStr);
            };
        } 
        // 4. Normal Date
        else {
            div.onclick = (e) => {
                e.stopPropagation();
                toggleDate(dateStr);
            };
        }
        container.appendChild(div);
    }
}
// MONTH NAVIGATION
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function formatPrettyDate(dateStr) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}
function addStudent() {
    let name = document.getElementById("name").value;
    let section = document.getElementById("section").value;
    let startInput = document.getElementById("startDate").value;
    let daysInput = parseInt(document.getElementById("numDays").value);
    let reason = document.getElementById("serviceReason").value || "Community Service";

    if (!name || !section || !startInput || isNaN(daysInput)) {
        alert("Please fill name, section, start date, and number of days!");
        return;
    }

    // 1. Initialize variables BEFORE the loop
    let current = new Date(startInput);
    let currentHolidays = getHolidays(current.getFullYear()); 
    let finalSchedule = [];
    let added = 0;
    let safetyCounter = 0;

    // 2. The Logic Loop
    while (added < daysInput && safetyCounter < 365) {
        let dateStr = formatDate(current);
        let day = current.getDay();

        // Refresh holiday list if year changes (e.g., Dec to Jan)
        if (current.getFullYear() !== parseInt(dateStr.split('-')[0])) {
            currentHolidays = getHolidays(current.getFullYear());
        }

        let isHoliday = currentHolidays.some(h => h.date === dateStr);
        let isWeekend = (day === 0 || day === 6);
        let isBlockedByEvent = blockedDates.some(b => b.date === dateStr);

        // Valid if NOT holiday, NOT weekend, and NOT a blocked event
        if (!isHoliday && !isWeekend && !isBlockedByEvent) {
            finalSchedule.push(dateStr);
            added++;
        }
        
        current.setDate(current.getDate() + 1);
        safetyCounter++;
    }

    // 3. Save Student
    let student = {
        name: name,
        section: section,
        reason: reason,
        dates: finalSchedule
    };

    let students = JSON.parse(localStorage.getItem("students")) || [];
    students.push(student);
    localStorage.setItem("students", JSON.stringify(students));

    // 4. Refresh UI
    document.getElementById("name").value = "";
    document.getElementById("section").value = "";
    document.getElementById("serviceReason").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("numDays").value = "";

    loadStudents();
    renderCalendar();
}
 
document.addEventListener("click", function (e) {
    const wrapper = document.querySelector(".calendar-wrapper");
    const modal = document.getElementById("eventModal");
    
    if (wrapper && !wrapper.contains(e.target) && !modal.contains(e.target)) {
        selectedDates = [];
        renderCalendar();
    }
});
// LOAD TABLE
function loadStudents() {
    let table = document.getElementById("studentTable");
    table.innerHTML = "";

    let students = JSON.parse(localStorage.getItem("students")) || [];

    students.forEach((s, index) => {
        let row = table.insertRow();

        row.insertCell(0).innerText = s.name;
        row.insertCell(1).innerText = s.section;
        row.insertCell(2).innerText = s.reason || "-";
        row.insertCell(3).innerText = (s.dates || []).map(d => formatPrettyDate(d)).join(", ");

        let cell = row.insertCell(3);
        let btn = document.createElement("button");

        btn.innerText = "Delete";
        btn.onclick = () => deleteStudent(index);

        cell.appendChild(btn);
    });
}

function toggleDate(dateStr) {
    if (selectedDates.includes(dateStr)) {
        selectedDates = selectedDates.filter(d => d !== dateStr);
    } else {
        selectedDates.push(dateStr);
    }
    renderCalendar();
}

document.getElementById("numDays").addEventListener("input", function () {
    let days = parseInt(this.value);

    if (days === 1) {
        document.getElementById("timeContainer").style.display = "block";
    } else {
        document.getElementById("timeContainer").style.display = "none";
    }
});

// DELETE
function deleteStudent(index) {
    let students = JSON.parse(localStorage.getItem("students")) || [];

    let removedDates = students[index].dates;

    blockedDates = blockedDates.filter(b => !removedDates.includes(b.date));

    students.splice(index, 1);

    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("blockedDates", JSON.stringify(blockedDates));

    loadStudents();
    renderCalendar();
}

function getDateRange(start, end) {
    let result = [];
    let current = new Date(start);
    let last = new Date(end);

    if (current > last) {
        [current, last] = [last, current];
    }

    while (current <= last) {
        let d = current.toISOString().split("T")[0];
        let day = current.getDay();

        if (
            day !== 0 &&
            day !== 6 &&
            !holidays.includes(d) &&
            !blockedDates.some(b => b.date === d)
        ) {
            result.push(d);
        }

        current.setDate(current.getDate() + 1);
    }

    return result;
}

function openModal() {
    if (selectedDates.length === 0) {
        alert("Select date(s) first!");
        return;
    }

    document.getElementById("eventModal").style.display = "block";
    document.getElementById("selectedDatesText").innerText =
        "Dates: " + selectedDates.join(", ");
}

function closeModal() {
    document.getElementById("eventModal").style.display = "none";
    document.getElementById("eventReason").value = "";
}

function confirmBlock() {
    let reason = document.getElementById("eventReason").value;

    if (!reason) {
        alert("Enter a reason!");
        return;
    }

    selectedDates.forEach(d => {
        blockedDates.push({
            date: d,
            reason: reason
        });
    });

    localStorage.setItem("blockedDates", JSON.stringify(blockedDates));

    selectedDates = [];

    closeModal();
    renderCalendar();
} 