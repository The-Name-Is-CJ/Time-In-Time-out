let selectedDates = []; 
let currentDate = new Date();
let selectedHours = "";

const ADMIN_PASSWORD = "PODComServe";

window.onload = function () {
    renderCalendar();
    loadStudents();
};
 
function formatDisplayDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: '2-digit', 
        year: 'numeric' 
    });
}

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

    if (year === 2026) {
        holidayList.push(
            { date: "2026-04-02", name: "Maundy Thursday" },
            { date: "2026-04-03", name: "Good Friday" },
            { date: "2026-04-04", name: "Black Saturday" }
        );
    }
    return holidayList;
}

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
    const currentHolidays = getHolidays(year);

    monthYear.innerText = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();
 
    for (let i = 0; i < firstDay; i++) {
        container.innerHTML += "<div></div>";
    }
 
    for (let i = 1; i <= lastDate; i++) {
        let date = new Date(year, month, i);
        let dateStr = formatDate(date);
        let div = document.createElement("div");
        div.innerText = i;

        let holidayObj = currentHolidays.find(h => h.date === dateStr);

        if (holidayObj) {
            div.classList.add("blocked");
            div.title = holidayObj.name;
            div.onclick = () => alert("Holiday: " + holidayObj.name);
        } 
        else if (selectedDates.includes(dateStr)) {
            div.classList.add("selected");
            div.onclick = () => toggleDate(dateStr);
        }  
        else {
            div.onclick = () => toggleDate(dateStr);
        }
        container.appendChild(div);
    }
}

function toggleDate(dateStr) {
    if (selectedDates.includes(dateStr)) {
        selectedDates = selectedDates.filter(d => d !== dateStr);
        selectedHours = "";  
    } else {
        selectedDates.push(dateStr);
    }
     
    if (selectedDates.length !== 1) {
        selectedHours = ""; 
    }
    updateDateDisplay();
    renderCalendar();
}

function confirmHours() {
    let hourRadio = document.querySelector('input[name="modalHours"]:checked');
    if (hourRadio) {
        selectedHours = hourRadio.value;
        document.getElementById("hourModal").style.display = "none";
        updateDateDisplay(); 
        addStudent();
    } else {
        alert("Please select the number of hours.");
    }
}

function updateDateDisplay() {
    const displayElement = document.getElementById("eventDisplay");
    
    if (selectedDates.length > 0) { 
        let formattedDates = [...selectedDates]
            .sort()
            .map(date => `• ${formatDisplayDate(date)}`);  
        
        let displayText = formattedDates.join('\n');
         
        if (selectedDates.length === 1 && selectedHours) {
            displayText += ` (${selectedHours} hrs)`;
        }
        
        displayElement.innerText = displayText;
        displayElement.style.whiteSpace = "pre-line";
    } else {
        displayElement.innerText = "Click dates on the calendar to assign service days.";
    }
}

function clearSelection() {
    selectedDates = [];
    updateDateDisplay();
    renderCalendar();
}  

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function addStudent() {
    let name = document.getElementById("name").value;
    let section = document.getElementById("section").value;
    let offenseType = document.querySelector('input[name="offenseType"]:checked').value;
    let reasonRaw = document.getElementById("serviceReason").value;
    
    if (!name || !section || selectedDates.length === 0) {
        alert("Please fill in Name, Section, and select at least one date!");
        return;
    }

    if (selectedDates.length === 1 && !selectedHours) {
        document.getElementById("hourModal").style.display = "flex";
        return; 
    }

    let reasonLines = reasonRaw.split('\n').filter(line => line.trim() !== "");
    let bulletedReason = reasonLines.map(line => `• ${line.trim()}`).join('\n');

    let student = {
        name: name,
        section: section,
        offenseType: offenseType,  
        reason: bulletedReason,  
        dates: [...selectedDates].sort(),
        hours: selectedDates.length === 1 ? selectedHours : "" 
    };

    let students = JSON.parse(localStorage.getItem("students")) || [];
    students.push(student);
    localStorage.setItem("students", JSON.stringify(students));
 
    resetForm();
    loadStudents();
    renderCalendar();
}

function resetForm() {
    document.getElementById("name").value = "";
    document.getElementById("section").value = "";
    document.getElementById("serviceReason").value = "";
    selectedDates = [];
    selectedHours = ""; 
    document.getElementById("eventDisplay").innerText = "Click dates on the calendar to assign service days.";
    document.querySelectorAll('input[name="modalHours"]').forEach(r => r.checked = false);
} 

let editSelectedDates = [];
let editCurrentDate = new Date();
let editIndex = null;

function loadStudents() {
    let table = document.getElementById("studentTable");
    if (!table) return; 
    table.innerHTML = "";
    let students = JSON.parse(localStorage.getItem("students")) || [];

    students.forEach((s, index) => {
        let row = table.insertRow();
        row.insertCell(0).innerText = s.name;
        row.insertCell(1).innerText = s.section;
 
        let reasonCell = row.insertCell(2);
        let tagClass = s.offenseType === 'Major' ? 'tag-major' : 'tag-minor';
        reasonCell.innerHTML = `<span class="offense-tag ${tagClass}">${s.offenseType}</span><br>${s.reason || "-"}`;
 
        let dateCell = row.insertCell(3);
        let sortedDates = [...s.dates].sort();
        let display = sortedDates.length > 2 
            ? `${formatDisplayDate(sortedDates[0])} ... ${formatDisplayDate(sortedDates[sortedDates.length-1])} (${sortedDates.length} days)`
            : sortedDates.map(formatDisplayDate).join(", ");
        if (s.hours && sortedDates.length === 1) display += ` (${s.hours} hrs)`;
        dateCell.innerText = display;
  
        let actionCell = row.insertCell(4);
         
        let editBtn = document.createElement("button");
        editBtn.innerHTML = "<i class='bx bx-edit'></i>";
        editBtn.className = "edit-btn";
        editBtn.onclick = () => {
            if (prompt("Enter Admin Password to Edit:") === ADMIN_PASSWORD) {
                openEditModal(index);
            } else {
                alert("Access denied.");
            }
        };
         
        let delBtn = document.createElement("button");
        delBtn.innerHTML = "<i class='bx bx-trash'></i>";
        delBtn.className = "delete-btn";
        delBtn.onclick = () => {
            if (prompt("Enter Admin Password to Delete:") === ADMIN_PASSWORD) {
                if(confirm("Are you sure you want to delete this record?")) {
                    students.splice(index, 1);
                    localStorage.setItem("students", JSON.stringify(students));
                    loadStudents();
                }
            } else {
                alert("Access denied.");
            }
        };
        
        actionCell.appendChild(editBtn);
        actionCell.appendChild(delBtn);
    });
}
 
function masterReset() { 
    if (confirm("WARNING: Clear all data?")) {
        if (prompt("Enter Master Password:") === ADMIN_PASSWORD) { 
            localStorage.clear();
            location.reload();
        } else {
            alert("Access denied.");
        }
    }
}

function accessReports() {
    const password = prompt("Please enter the Admin Password to access Reports:");
    if (password === ADMIN_PASSWORD) {
        window.location.href = "reports.html";
    } else if (password !== null) {
        alert("");
    }
}
  
function openEditModal(index) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let s = students[index];
    editIndex = index;
 
    document.getElementById("editName").value = s.name;
    document.getElementById("editSection").value = s.section;
    document.querySelector(`input[name="editOffenseType"][value="${s.offenseType}"]`).checked = true; 
    document.getElementById("editServiceReason").value = s.reason.replace(/• /g, "");
     
    editSelectedDates = [...s.dates];
    renderEditCalendar();
    updateEditDisplay();
    
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function renderEditCalendar() {
    const container = document.getElementById("editCalendarDates");
    const monthYear = document.getElementById("editMonthYear");
    container.innerHTML = "";

    let year = editCurrentDate.getFullYear();
    let month = editCurrentDate.getMonth();
    const currentHolidays = getHolidays(year);

    monthYear.innerText = editCurrentDate.toLocaleString("default", { month: "long", year: "numeric" });

    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();
 
    for (let i = 0; i < firstDay; i++) container.innerHTML += "<div></div>";
 
    for (let i = 1; i <= lastDate; i++) {
        let date = new Date(year, month, i);
        let dateStr = formatDate(date);
        let div = document.createElement("div");
        div.innerText = i;

        if (currentHolidays.find(h => h.date === dateStr)) {
            div.classList.add("blocked");
        } else if (editSelectedDates.includes(dateStr)) {
            div.classList.add("selected");
            div.onclick = () => toggleEditDate(dateStr);
        } else {
            div.onclick = () => toggleEditDate(dateStr);
        }
        container.appendChild(div);
    }
}

function toggleEditDate(dateStr) {
    if (editSelectedDates.includes(dateStr)) {
        editSelectedDates = editSelectedDates.filter(d => d !== dateStr);
    } else {
        editSelectedDates.push(dateStr);
    }
    updateEditDisplay();
    renderEditCalendar();
}

function updateEditDisplay() {
    const displayElement = document.getElementById("editEventDisplay");
    if (editSelectedDates.length > 0) {
        displayElement.innerText = editSelectedDates.sort().map(d => `• ${formatDisplayDate(d)}`).join('\n');
    } else {
        displayElement.innerText = "No dates selected.";
    }
}

function changeEditMonth(step) {
    editCurrentDate.setMonth(editCurrentDate.getMonth() + step);
    renderEditCalendar();
}

function clearEditSelection() {
    editSelectedDates = [];
    updateEditDisplay();
    renderEditCalendar();
}

function updateStudent() {
    let name = document.getElementById("editName").value;
    let section = document.getElementById("editSection").value;
    
    if (!name || !section || editSelectedDates.length === 0) {
        alert("Please complete all required fields.");
        return;
    }
 
    if (editSelectedDates.length === 1) { 
        document.getElementById("editModal").style.display = "none";
         
        document.querySelectorAll('input[name="modalHours"]').forEach(r => r.checked = false);
         
        const confirmBtn = document.querySelector("#hourModal .confirm-btn");
        confirmBtn.setAttribute("onclick", "confirmEditHours()");
        
        document.getElementById("hourModal").style.display = "flex";
        return; 
    } 
    saveEditData(""); 
}

function confirmEditHours() {
    let hourRadio = document.querySelector('input[name="modalHours"]:checked');
    if (hourRadio) {
        let selectedHrs = hourRadio.value;
        document.getElementById("hourModal").style.display = "none";
         
        document.querySelector("#hourModal .confirm-btn").setAttribute("onclick", "confirmHours()");
        
        saveEditData(selectedHrs);
    } else {
        alert("Please select the number of hours.");
    }
}
function saveEditData(hoursValue) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let name = document.getElementById("editName").value;
    let section = document.getElementById("editSection").value;
    let offense = document.querySelector('input[name="editOffenseType"]:checked').value;
    let reasonRaw = document.getElementById("editServiceReason").value;

    let reasonLines = reasonRaw.split('\n').filter(line => line.trim() !== "");
    let bulletedReason = reasonLines.map(line => `• ${line.trim()}`).join('\n');

    students[editIndex] = {
        name: name,
        section: section,
        offenseType: offense,
        reason: bulletedReason,
        dates: [...editSelectedDates].sort(),
        hours: editSelectedDates.length === 1 ? hoursValue : ""
    };

    localStorage.setItem("students", JSON.stringify(students));
    closeEditModal();
    loadStudents();
}
 
function exportData() {
    const data = localStorage.getItem("students");
    if (!data || data === "[]") {
        alert("No data found to export.");
        return;
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = `community_service_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
} 

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Optional: Password protection for importing
    if (prompt("Enter Admin Password to Import Data:") !== ADMIN_PASSWORD) {
        alert("Incorrect password. Access denied.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) { 
                let currentStudents = JSON.parse(localStorage.getItem("students")) || [];
                let combinedData = currentStudents.concat(importedData);

                localStorage.setItem("students", JSON.stringify(combinedData));
                
                loadStudents(); 
                alert(`Success! Added ${importedData.length} records to your existing list.`);
            } else {
                alert("Invalid file format. Please upload a valid backup file.");
            }
        } catch (err) {
            alert("Error reading file. Make sure it's a valid JSON file.");
        }
    };
    reader.readAsText(file);
     
    event.target.value = '';
}