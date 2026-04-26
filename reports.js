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
    
    // Clear all tables
    const tables = [
        "studentListContent", "attendanceContent", 
        "completedContent", "incompleteContent", "absentContent"
    ];
    tables.forEach(id => document.getElementById(id).innerHTML = "");

    students.forEach(student => {
        const attendance = student.attendance || {};
        let totalScheduled = student.dates.length;
        let completedDays = 0;

        // --- Logic for Registry & Attendance (Existing) ---
        if (!filterDate || student.dates.includes(filterDate)) {
            let row = document.getElementById("studentListContent").insertRow();
            row.innerHTML = `<td><strong>${student.name}</strong></td><td>${student.section}</td><td>${student.reason}</td><td>${student.dates.join(", ")}</td>`;
        }

        // --- Process Every Scheduled Date ---
        student.dates.forEach(date => {
            const logs = attendance[date] || null;
            const isFilterMatch = !filterDate || date === filterDate;

            if (isFilterMatch) {
                // Fill Time Log Table
                let rowLog = document.getElementById("attendanceContent").insertRow();
                rowLog.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td>
                    <td>${formatLog(logs ? logs.morning : null)}</td>
                    <td>${formatLog(logs ? logs.break : null)}</td>
                    <td>${formatLog(logs ? logs.lunch : null)}</td>`;
            }

            // --- Status Logic ---
            if (!logs) {
                // ABSENT: No record at all for this date
                if (isFilterMatch) {
                    let rowAbs = document.getElementById("absentContent").insertRow();
                    rowAbs.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td><td><span style="color:red">No Attendance recorded</span></td>`;
                }
            } else {
                // Check for Incomplete (Has record but missing a Time In or Time Out)
                let sessions = [logs.morning, logs.break, logs.lunch];
                let isMissingAny = sessions.some(s => s && (!s.timeIn || !s.timeOut));
                let hasAtLeastOne = sessions.some(s => s && s.timeIn);

                if (isMissingAny) {
                    if (isFilterMatch) {
                        let rowInc = document.getElementById("incompleteContent").insertRow();
                        rowInc.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td><td><span style="color:#f39c12">Forgot to Time In or Out</span></td>`;
                    }
                } else if (hasAtLeastOne) {
                    // This day is fully completed
                    completedDays++;
                }
            }
        });

        // --- COMPLETED SERVICE LOGIC ---
        // A student is completed if their fully cleared days equal their total scheduled days
        if (completedDays === totalScheduled && totalScheduled > 0) {
            let rowComp = document.getElementById("completedContent").insertRow();
            rowComp.innerHTML = `<td><strong>${student.name}</strong></td><td>${student.section}</td><td>${student.reason}</td><td><span style="color:green; font-weight:bold;">100% Cleared</span></td>`;
        }
    });
}

function formatLog(session) {
    if (!session) return "No Record";
    return `${session.timeIn || '--'} to ${session.timeOut || '--'}`;
}

function exportTableToCSV(tableID, filename) {
    let csv = [];
    let table = document.getElementById(tableID);
    let rows = table.querySelectorAll("tr"); // This gets both th and td rows
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/,/g, " | ").replace(/\n/g, " ");
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