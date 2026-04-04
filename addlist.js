let students = JSON.parse(localStorage.getItem("students")) || [];

function addStudent() {
    const input = document.getElementById("studentName");
    const name = input.value.trim();

    if (!name) {
        alert("Enter a name");
        return;
    }

    students.push({
        name: name,
        timeIn: "",
        timeOut: ""
    });

    input.value = "";
    saveAndRender();
}

function timeIn(index) {
    if (!students[index].timeIn) {
        students[index].timeIn = new Date().toLocaleString();
        saveAndRender();
    }
}

function timeOut(index) {
    if (!students[index].timeOut) {
        students[index].timeOut = new Date().toLocaleString();
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem("students", JSON.stringify(students));
    render();
}

function render() {
    const table = document.getElementById("studentTable");
    table.innerHTML = "";

    students.forEach((s, i) => {
        table.innerHTML += `
        <tr>
            <td>${s.name}</td>
            <td>
                ${s.timeIn || `<button onclick="timeIn(${i})">Time In</button>`}
            </td>
            <td>
                ${s.timeOut || `<button onclick="timeOut(${i})">Time Out</button>`}
            </td>
        </tr>`;
    });
}
function clearData() {
    if (confirm("Clear all data?")) {
        localStorage.removeItem("students");
        students = [];
        render();
    }
}

render();