function formatDateRange(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate || startDate);

    let options = { month: "long", day: "numeric" };

    let startText = start.toLocaleDateString("en-US", options);
    let endText = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return `${startText} - ${endText}`;
}
// Load data when page opens
window.onload = function () {
    loadStudents();
    setMinDate(); // 👈 add this
};

function setMinDate() {
    let today = new Date().toISOString().split("T")[0];

    document.getElementById("startDate").setAttribute("min", today);
    document.getElementById("endDate").setAttribute("min", today);
}

// Show time input only if same day
document.getElementById("endDate").addEventListener("change", checkDate);
document.getElementById("startDate").addEventListener("change", checkDate);

function checkDate() {
    let start = document.getElementById("startDate").value;
    let end = document.getElementById("endDate").value;

    // SHOW hours if ONLY start date OR same day
    if (start && (!end || start === end)) {
        document.getElementById("timeContainer").style.display = "block";
    } else {
        document.getElementById("timeContainer").style.display = "none";
    }
}

// SAVE + ADD STUDENT
function addStudent() {
    let name = document.getElementById("name").value;
    let section = document.getElementById("section").value;
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let hours = document.querySelector('input[name="hours"]:checked');

    // REQUIRED CHECK
    if (!name || !section || !startDate) {
        alert("Please fill all required fields!");
        return;
    }

    // If only start date → must choose hours
    if (!endDate && !hours) {
        alert("Please select hours for 1-day service!");
        return;
    }

    let student = {
        name,
        section,
        startDate,
        endDate: endDate || startDate, 
        sessions: {
            morning: { timeIn: null, timeOut: null },
            break: { timeIn: null, timeOut: null },
            lunch: { timeIn: null, timeOut: null }
        },
        hours: hours ? hours.value : null
    };

    let students = JSON.parse(localStorage.getItem("students")) || [];

    students.push(student);

    localStorage.setItem("students", JSON.stringify(students));

    loadStudents();

    // CLEAR
    document.getElementById("name").value = "";
    document.getElementById("section").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

    let radios = document.getElementsByName("hours");
    radios.forEach(r => r.checked = false);

    document.getElementById("timeContainer").style.display = "none";
}

// LOAD STUDENTS FROM STORAGE
function loadStudents() {
    let table = document.getElementById("studentTable");
    table.innerHTML = ""; // clear first

    let students = JSON.parse(localStorage.getItem("students")) || [];

    students.forEach((student, index) => {
        let row = table.insertRow();

        let dateText;

        if (student.startDate === student.endDate && student.hours) {
            dateText = `${formatDateRange(student.startDate, student.endDate)} (${student.hours} hrs)`;
        } else {
            dateText = formatDateRange(student.startDate, student.endDate);
        }

        row.insertCell(0).innerText = student.name;
        row.insertCell(1).innerText = student.section;
        row.insertCell(2).innerText = dateText;

        // 🔴 Delete button
        let deleteCell = row.insertCell(3);
        let btn = document.createElement("button");
        btn.innerText = "Delete";
        btn.onclick = function () {
            let confirmDelete = confirm("Are you sure you want to delete " + student.name + "?");

            if (confirmDelete) {
                deleteStudent(index);
            }
        };
        deleteCell.appendChild(btn);
    });
}

// DELETE FUNCTION
function deleteStudent(index) {
    let students = JSON.parse(localStorage.getItem("students")) || [];

    students.splice(index, 1);

    localStorage.setItem("students", JSON.stringify(students));

    loadStudents();
}