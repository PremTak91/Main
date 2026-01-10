
document.addEventListener("DOMContentLoaded", function () {
    checkAttendanceStatus();
});

function toggleAttendance() {
    let btn = document.getElementById("attendanceBtn");
    let currentStatus = btn.innerText;

    let url = currentStatus === "IN" ? "/NRS/attendance/punch-in" : "/NRS/attendance/punch-out";

    // Disable button to prevent double clicks
    btn.disabled = true;

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
            // Add CSRF token if spring security requires it, usually cookies handle it or meta tag
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            // Status checks return "PUNCHED_IN" or "PUNCHED_OUT" or "ALREADY_IN" etc.
            // But for UI we just want to flip the button.
            // Actually the button text should reflect valid ACTION or valid STATE?
            // "IN" usually means "Click here to punch IN" or "Currently IN"?
            // User request: "once user click on IN button then its shoult change to out label"
            // So button label "IN" -> Click -> becomes "OUT".
            // This means "IN" label implies "I am currently OUT, click to go IN".
            // OR "IN" label implies "I am IN"?
            // Re-reading: "once user click on IN button then its shoult change to out label and once click on out its should be IN."
            // This usually means the label indicates the STATUS or the ACTION.
            // If button says "IN", and I click it, it changes to "OUT". This suggests the button shows the CURRENT STATUS? 
            // OR it shows the ACTION? 
            // If I am OUT, I want to Punch IN. Button should say "Punch IN".
            // If the user says "click on IN button", maybe they mean the button *says* IN.
            // Let's assume the button currently says "IN" (meaning "I am inside" or "Punch In"?). 
            // If it changes to "OUT", it probably means "I am now OUT" or "Click to Punch OUT".
            // Standard convention:
            // Button says "Check In" -> Click -> Button says "Check Out".
            // User says: "click on IN button then its shoult change to out label".
            // So Initial State: Button says "IN". Click -> Button says "OUT".
            // This implies "IN" was the action (Punch In).

            checkAttendanceStatus(); // Refresh status from server to be sure
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to update attendance");
        })
        .finally(() => {
            btn.disabled = false;
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

            if (data.status === "IN") {
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
