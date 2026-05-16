
document.addEventListener("DOMContentLoaded", function () {
    checkAttendanceStatus();
});

function toggleAttendance() {
    let btn = document.getElementById("attendanceBtn");
    let currentStatus = btn.innerText;

    let url = currentStatus === "IN" ? "/NRS/attendance/punch-in" : "/NRS/attendance/punch-out";

    // Disable button to prevent double clicks
    btn.disabled = true;
    showLoader();

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            showToast("Attendance updated successfully", "success");
            checkAttendanceStatus(); // Refresh status from server to be sure
        })
        .catch(error => {
            console.error("Error:", error);
            showToast("Failed to update attendance", "error");
        })
        .finally(() => {
            btn.disabled = false;
            hideLoader();
        });
}

function checkAttendanceStatus() {
    fetch("/NRS/attendance/status")
        .then(response => response.json())
        .then(data => {
            let btn = document.getElementById("attendanceBtn");
            // Status from server: "IN" (meaning currently present) or "OUT" (currently absent/punched out)
            // If status is "IN", the user IS inside. So the button should allow them to "Punch OUT".
            // Use request: "click on out its should be IN" (meaning become IN? or label becomes IN?)
            // Let's assume the label shows the Next Action or Current Status.
            // If user says "click on IN button", they probably see "IN".
            // If I am OUT, I see "IN" (to click).
            // If I am IN, I see "OUT" (to click).

            if (data.message === "IN") {
                btn.innerText = "OUT"; // Option to punch out
                btn.classList.remove("btn-danger"); // Green for "You are IN, click to go OUT"? Or Red for "Stop"?
                btn.classList.add("btn-success"); // Let's use Success for IN state, or maybe Keep it simple.
                // User sample was "badge bg-danger ... IN". Red IN? 
                // Let's stick to the text requested.
            } else {
                btn.innerText = "IN"; // Option to punch in
                btn.classList.remove("btn-success");
                btn.classList.add("btn-danger");
            }
        })
        .catch(error => console.error("Error fetching status:", error));
}
