document.getElementById("modalEmployeePhoto").addEventListener("change", function(event) {
    if (this.files && this.files.length > 0) {
        const photoData = new FormData();
        photoData.append("employeeId", document.getElementById("updateProfileBtn").dataset.param);
        photoData.append("photo", this.files[0]);

        showLoader();

        fetch("/NRS/profile/photo", {
            method: "POST",
            body: photoData,
            credentials: "same-origin"
        })
        .then(response => {
            if (!response.ok) throw new Error("Photo upload failed");
            return response.json();
        })
        .then(data => {
            showToast("Profile photo uploaded successfully! Reloading...", "success");
            // Clear the file input so it doesn't upload again with the main form
            document.getElementById("modalEmployeePhoto").value = "";
            setTimeout(() => location.reload(), 1500);
        })
        .catch(error => {
            console.error("Error uploading photo:", error);
            showToast("Failed to upload profile photo.", "error");
            document.getElementById("modalEmployeePhoto").value = "";
        })
        .finally(() => {
            hideLoader();
        });
    }
});
document.getElementById("updateProfileBtn").addEventListener("click", function (event) {
    event.preventDefault();

    const formData = new FormData();

    formData.append("employeeId", $(this).data("param"));
    formData.append("email", document.getElementById("modalEmail").value);
    formData.append("postalCode", document.getElementById("modalPinCode").value);
    formData.append("address", document.getElementById("modalAddress").value);
    formData.append("phoneNo", document.getElementById("modalPhoneNo").value);
    formData.append("designation", document.getElementById("modalPosition").value);
    formData.append("qualification", document.getElementById("modalEducation").value);
    formData.append("dateOfBirth", document.getElementById("modalDOB").value);

    // Do not append photo here because it is uploaded instantly via the change listener
    // However, if for some reason they bypassed the change listener, we can still attach it
    const fileInput = document.getElementById("modalEmployeePhoto");
    if (fileInput && fileInput.files.length > 0) {
        formData.append("photo", fileInput.files[0]);
    }

    // Show Loader
    showLoader();

    fetch("/NRS/profile", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Employee updates failed");
            }
            return response.json();
        })
        .then(data => {
            // Show Success Toast
            showToast("Profile updated successfully!", "success");

            // Close modal after short delay or immediately?
            // Let's close modal immediately
            const modalEl = document.getElementById('editProfileModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }

            // Reload after 1.5 seconds to let user see the toast
            setTimeout(() => {
                location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error("Error:", error);
            showToast("Failed to update profile. Please try again.", "error");
        })
        .finally(() => {
            // Hide Loader
            hideLoader();
        });

});
