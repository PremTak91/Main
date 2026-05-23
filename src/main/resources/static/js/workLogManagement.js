let workLogModal;

document.addEventListener("DOMContentLoaded", function () {
    workLogModal = new bootstrap.Modal(document.getElementById('workLogModal'));
    
    // Set default date to today for the add log form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("workDate").value = today;

    // Form submission logic
    document.getElementById("workLogForm").addEventListener("submit", function (e) {
        e.preventDefault();
        
        var form = this;
        if (!form.checkValidity()) { 
            form.reportValidity(); 
            return; 
        }

        var formData = new FormData(form);
        
        if (typeof showLoader === "function") showLoader();
        
        fetch("/NRS/worklogs/save", { 
            method: "POST", 
            body: formData 
        })
        .then(function (response) { 
            return response.json(); 
        })
        .then(function (data) {
            if (typeof hideLoader === "function") hideLoader();
            if (data.success) {
                if (typeof showToast === "function") showToast(data.message, "success");
                workLogModal.hide();
                setTimeout(function () { 
                    window.location.reload(); 
                }, 1000);
            } else {
                if (typeof showToast === "function") showToast(data.message, "error");
            }
        })
        .catch(function (error) {
            if (typeof hideLoader === "function") hideLoader();
            if (typeof showToast === "function") showToast("An error occurred while saving the work log.", "error");
            console.error("Save error:", error);
        });
    });
});

function openAddWorkLogModal() {
    document.getElementById("workLogModalLabel").innerHTML = '<i class="fas fa-edit me-2"></i>Add Work Log';
    document.getElementById("workLogId").value = "";
    document.getElementById("workDescription").value = "";
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("workDate").value = today;
    workLogModal.show();
}

function editWorkLog(id) {
    if (typeof showLoader === "function") showLoader();
    
    fetch("/NRS/worklogs/" + id)
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(function(data) {
            if (typeof hideLoader === "function") hideLoader();
            if (data.id) {
                document.getElementById("workLogModalLabel").innerHTML = '<i class="fas fa-edit me-2"></i>Edit Work Log';
                document.getElementById("workLogId").value = data.id;
                document.getElementById("workDate").value = data.workDate;
                document.getElementById("workDescription").value = data.workDescription;
                workLogModal.show();
            } else {
                if (typeof showToast === "function") showToast("Failed to fetch log details.", "error");
            }
        })
        .catch(function(error) {
            if (typeof hideLoader === "function") hideLoader();
            if (typeof showToast === "function") showToast("An error occurred while fetching log details.", "error");
            console.error("Fetch error:", error);
        });
}
