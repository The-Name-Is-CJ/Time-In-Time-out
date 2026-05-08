window.onload = function () {
    showReport();
};

document.addEventListener('DOMContentLoaded', function() {
    const blockedDates = JSON.parse(localStorage.getItem("blockedDates") || "[]");
    const manualBlocked = blockedDates.map(b => b.date);

    flatpickr("#reportDatePicker", {
        dateFormat: "Y-m-d",
        allowInput: false,
        disable: [
            function(date) { return (date.getDay() === 0 || date.getDay() === 6); },
            ...manualBlocked
        ],
        onChange: function(selectedDates, dateStr) {
            showReport();
        }
    });
});

function clearDateFilter() {
    const input = document.getElementById("reportDatePicker");
    if (input._flatpickr) { input._flatpickr.clear(); }
    input.value = ""; 
    showReport();     
}

function showReport() {
    const filterDate = document.getElementById("reportDatePicker").value;
    const students = JSON.parse(localStorage.getItem("students")) || [];
    const today = new Date().toISOString().split("T")[0]; 
     
    const tables = [
        "studentListContent", "attendanceContent", 
        "completedContent", "incompleteContent", "absentContent"
    ];
     
    tables.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });

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

    students.forEach(student => {
        const attendance = student.attendance || {};
        const totalScheduled = student.dates.length;
        const isOneDayStudent = totalScheduled === 1;
        const requiredHours = parseFloat(student.hours) || 8;
        let completedDaysCount = 0;
 
        if (!filterDate || student.dates.includes(filterDate)) {
            let row = document.getElementById("studentListContent").insertRow();
            let dateDisplay = "-";
            if (student.dates && student.dates.length > 0) {
                if (student.dates.length === 1) { 
                    dateDisplay = formatPrettyDate(student.dates[0]);
                    if (student.hours) dateDisplay += ` (${student.hours} hr/s)`;
                } else { 
                    const startDate = student.dates[0];
                    const endDate = student.dates[student.dates.length - 1];
                    dateDisplay = `${formatPrettyDate(startDate)} - ${formatPrettyDate(endDate)}`;
                }
            }
            row.innerHTML = `<td><strong>${student.name}</strong></td><td>${student.section}</td><td>${student.reason}</td><td>${dateDisplay}</td>`;
        }

        student.dates.forEach(date => {
            const logs = attendance[date] || null;
            const isFilterMatch = !filterDate || date === filterDate;
            const isFuture = date > today; 

            let status = "";
            let remarks = "";
            let dailyHours = 0;

            if (!logs) {
                if (date < today) { status = "Absent"; remarks = "No records found"; }
                else if (date === today) { status = "Ongoing"; remarks = "In progress..."; }
                else { status = "Scheduled"; remarks = "Future date"; }
            } else { 
                let mins = 0;
                ["morning", "break", "lunch"].forEach(k => {
                    if (logs[k] && logs[k].timeIn && logs[k].timeOut) {
                        mins += (timeToMinutes(logs[k].timeOut) - timeToMinutes(logs[k].timeIn));
                    }
                });
                dailyHours = mins / 60;

                let missing = [];
                const sessionMap = { morning: "Morning", break: "After Break", lunch: "After Lunch" };
                Object.keys(sessionMap).forEach(key => {
                    const sess = logs[key];
                    if (!sess) missing.push(`${sessionMap[key]} (No In/Out)`);
                    else {
                        if (!sess.timeIn) missing.push(`${sessionMap[key]} (No Time In)`);
                        if (!sess.timeOut) missing.push(`${sessionMap[key]} (No Time Out)`);
                    }
                });

                if ((isOneDayStudent && dailyHours >= requiredHours) || (missing.length === 0)) {
                    status = "Completed";
                    remarks = isOneDayStudent ? `Hours Met (${dailyHours.toFixed(1)}/${requiredHours})` : "Full Attendance";
                    completedDaysCount++;
                } else {
                    status = "Incomplete";
                    remarks = `Missing: ${missing.join(", ")}`;
                }
            }

            if (isFilterMatch) {  
                if (!isFuture) {
                    let rowLog = document.getElementById("attendanceContent").insertRow();
                    rowLog.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td>
                        <td>${formatLog(logs ? logs.morning : null)}</td>
                        <td>${formatLog(logs ? logs.break : null)}</td>
                        <td>${formatLog(logs ? logs.lunch : null)}</td>`;
                }

                if (status === "Absent") {
                    const absentRow = document.getElementById("absentContent").insertRow();
                    absentRow.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td>
                        <td><span style="color:red">Absent</span></td>
                        <td><button onclick="rescheduleDay('${student.name}', '${date}')" class="btn-excel-small" style="background-color: #3498db;"><i class='bx bx-calendar-plus'></i> Reschedule</button></td>`;
                } 

                if (status === "Incomplete") {
                    const incRow = document.getElementById("incompleteContent").insertRow();
                    incRow.innerHTML = `<td><strong>${student.name}</strong></td><td>${date}</td>
                        <td><span style="color:#f39c12">${remarks}</span></td>
                        <td><div style="display:flex; gap:5px;">
                            <button onclick="forceComplete('${student.name}', '${date}')" class="btn-excel-small" style="background-color: #27ae60;"><i class='bx bx-check'></i> Mark Done</button>
                            <button onclick="markAsAbsent('${student.name}', '${date}')" class="btn-excel-small" style="background-color: #e74c3c;"><i class='bx bx-x'></i> Mark Absent</button>
                        </div></td>`;
                }
            }
        });

        if (completedDaysCount === totalScheduled && totalScheduled > 0) {
            let rowComp = document.getElementById("completedContent").insertRow();
            rowComp.innerHTML = `<td><strong>${student.name}</strong></td><td>${student.section}</td><td>${student.reason}</td><td><span style="color:green; font-weight:bold;">100% Cleared</span></td>`;
        }
    });
 
    tables.forEach(id => {
        const tableBody = document.getElementById(id);
        if (tableBody && tableBody.rows.length === 0) {
            const colCount = tableBody.closest('table').querySelectorAll('thead th').length;
            const emptyRow = tableBody.insertRow();
            emptyRow.innerHTML = `<td colspan="${colCount}" style="text-align:center; color:#999; padding:20px;">No records found.</td>`;
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
    let rows = table.querySelectorAll("tr"); 
    
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
 
function forceComplete(studentName, date) {
    if (!confirm(`Force mark ${date} as Completed for ${studentName}?`)) return;
    
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let student = students.find(s => s.name === studentName);
    
    if (student) {
        if (!student.attendance) student.attendance = {}; 
        student.attendance[date] = {
            morning: { timeIn: "Manual", timeOut: "Override" },
            break: { timeIn: "Manual", timeOut: "Override" },
            lunch: { timeIn: "Manual", timeOut: "Override" },
            isForced: true
        };
        localStorage.setItem("students", JSON.stringify(students));
        showReport(); 
    }
}
 
function markAsAbsent(studentName, date) {
    if (!confirm(`Are you sure you want to clear logs for ${studentName} on ${date} and mark as Absent?`)) return;

    let students = JSON.parse(localStorage.getItem("students")) || [];
    let student = students.find(s => s.name === studentName);

    if (student && student.attendance && student.attendance[date]) {
        delete student.attendance[date];
        localStorage.setItem("students", JSON.stringify(students));
        showReport();
    }
}

function rescheduleDay(studentName, oldDate) {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let studentIndex = students.findIndex(s => s.name === studentName);
    
    if (studentIndex !== -1) {
        let student = students[studentIndex];
         
        const confirmMsg = `The student missed their service on ${oldDate}. \n\nConfirming this will remove ${oldDate} and automatically add 1 more day to the end of their schedule. \n\nDo you want to proceed?`;
        
        if (confirm(confirmMsg)) { 
            student.dates = student.dates.filter(d => d !== oldDate);
            let lastDateStr = student.dates.length > 0 ? student.dates[student.dates.length - 1] : new Date().toISOString().split('T')[0];
            let lastDateObj = new Date(lastDateStr);
             
            let today = new Date();
            today.setHours(0,0,0,0);
            if (lastDateObj < today) {
                lastDateObj = today;
            }
 
            let nextDate = getNextValidDate(lastDateObj);
 
            student.dates.push(nextDate);
            student.dates.sort();  
            
            localStorage.setItem("students", JSON.stringify(students));
            alert(`Rescheduled! ${oldDate} removed. New service date added: ${nextDate}`);
            showReport();
        }
    }
}

function getNextValidDate(startDate) {
    let resultDate = new Date(startDate);
    const blockedDates = JSON.parse(localStorage.getItem("blockedDates") || "[]").map(b => b.date);
    
    let found = false;
    while (!found) { 
        resultDate.setDate(resultDate.getDate() + 1);
        
        let dateStr = resultDate.toISOString().split('T')[0];
        let day = resultDate.getDay();
 
        const isWeekend = (day === 0 || day === 6);
        const isBlocked = blockedDates.includes(dateStr);

        if (!isWeekend && !isBlocked) {
            found = true;
        }
    }
    return resultDate.toISOString().split('T')[0];
}
 
function formatPrettyDate(dateStr) {
    if (!dateStr) return "-";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}
function accessReports() {
    const password = prompt("Please enter the Admin Password to access Reports:");
    const masterPass = "PODComServe";  

    if (password === masterPass) {
        window.location.href = "reports.html";
    } else if (password !== null) {
        alert("Access denied.");
    }
}