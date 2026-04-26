window.onload = function () {
    showReport();
};

function clearDateFilter() {
    document.getElementById("reportDatePicker").value = "";
    showReport();
}

function showReport() {
    const filterDate = document.getElementById("reportDatePicker").value;
    const students = JSON.parse(localStorage.getItem("students")) || [];
    
    const listTable = document.getElementById("studentListContent");
    const attendanceTable = document.getElementById("attendanceContent");
    
    listTable.innerHTML = "";
    attendanceTable.innerHTML = "";

    students.forEach(student => {
        // --- Logic for TABLE 1 (General Registry) ---
        // If filter is set, only show student if they are scheduled for that day
        if (!filterDate || student.dates.includes(filterDate)) {
            let row1 = listTable.insertRow();
            row1.innerHTML = `
                <td><strong>${student.name}</strong></td>
                <td>${student.section}</td>
                <td>${student.reason}</td>
                <td>${student.dates.join(", ")}</td>
            `;
        }

        // --- Logic for TABLE 2 (Time Logs) ---
        const attendance = student.attendance || {};
        student.dates.forEach(date => {
            // Only show the specific date if filter is active
            if (filterDate && date !== filterDate) return;

            const logs = attendance[date] || {};
            let row2 = attendanceTable.insertRow();
            row2.innerHTML = `
                <td><strong>${student.name}</strong></td>
                <td>${date}</td>
                <td>${formatLog(logs.morning)}</td>
                <td>${formatLog(logs.break)}</td>
                <td>${formatLog(logs.lunch)}</td>
            `;
        });
    });
}

function formatLog(session) {
    if (!session) return "No Record";
    return `${session.timeIn || '--'} to ${session.timeOut || '--'}`;
}

// --- EXCEL EXPORT FUNCTION ---
function exportTableToCSV(tableID, filename) {
    let csv = [];
    let rows = document.getElementById(tableID).querySelectorAll("tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            // Clean text of commas to avoid breaking CSV format
            let data = cols[j].innerText.replace(/,/g, " | ");
            row.push('"' + data + '"');
        }
        csv.push(row.join(","));
    }

    let csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    let downloadLink = document.createElement("a");
    downloadLink.download = filename + ".csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}