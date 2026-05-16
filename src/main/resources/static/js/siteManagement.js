let siteModal;
let photoModal;
let previewModal;
let myDropzone;
Dropzone.autoDiscover = false;

document.addEventListener("DOMContentLoaded", function () {
    siteModal = new bootstrap.Modal(document.getElementById('siteModal'));
    photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
    previewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));

    // Initialize Dropzone

    myDropzone = new Dropzone("#sitePhotoDropzone", {
        url: "/NRS/sites/0/photos", // Dummy URL, will update dynamically
        paramName: "file",
        maxFilesize: 20, // MB
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        autoProcessQueue: true,
        dictDefaultMessage: "Drop site photos here to upload (Max 20MB)",
        init: function() {
            this.on("processing", function(file) {
                // Update URL dynamically based on current site ID
                const siteId = document.getElementById("currentPhotoSiteId").value;
                this.options.url = `/NRS/sites/${siteId}/photos`;
            });
            this.on("success", function(file, response) {
                if (response.success) {
                    showToast("Photo uploaded successfully!", "success");
                    loadSitePhotos(document.getElementById("currentPhotoSiteId").value);
                } else {
                    showToast(response.message || "Upload failed", "error");
                }
                this.removeFile(file); // Remove from dropzone once uploaded
            });
            this.on("error", function(file, response) {
                showToast(response.message || response || "Upload error", "error");
                this.removeFile(file);
            });
        }
    });
});

function openAddSiteModal() {
    document.getElementById("siteForm").reset();
    document.getElementById("siteId").value = "";
    document.getElementById("siteModalLabel").innerText = "Add New Site";
    siteModal.show();
}

function editSite(id) {
    showLoader();
    fetch(`/NRS/sites/${id}`)
        .then(response => response.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                const site = data.data;
                document.getElementById("siteId").value = site.id;
                document.getElementById("customerName").value = site.customerName || "";
                document.getElementById("contactNo").value = site.contactNo || "";
                document.getElementById("address").value = site.address || "";
                document.getElementById("siteStatus").value = site.siteStatus || "Pending";
                document.getElementById("expectedCompletedDate").value = site.expectedCompletedDate || "";
                document.getElementById("kilowatt").value = site.kilowatt || "";
                document.getElementById("assignedTechnicianId").value = site.assignedTechnicianId || "";
                document.getElementById("remarks").value = site.remarks || "";
                
                document.getElementById("siteModalLabel").innerText = "Edit Site Details";
                siteModal.show();
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(error => {
            hideLoader();
            showToast("Error loading site details", "error");
        });
}

function saveSite() {
    const form = document.getElementById("siteForm");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);

    showLoader();
    fetch("/NRS/sites/save", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showToast(data.message, "success");
            siteModal.hide();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(data.message, "error");
        }
    })
    .catch(error => {
        hideLoader();
        showToast("Error saving site", "error");
    });
}

function deleteSite(id) {
    if (confirm("Are you sure you want to delete this site? All associated photos will also be permanently deleted.")) {
        showLoader();
        fetch(`/NRS/sites/${id}`, {
            method: "DELETE"
        })
        .then(response => response.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                showToast(data.message, "success");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(error => {
            hideLoader();
            showToast("Error deleting site", "error");
        });
    }
}

// --- PHOTO MANAGEMENT ---

function openPhotoModal(siteId, customerName) {
    document.getElementById("currentPhotoSiteId").value = siteId;
    document.getElementById("photoCustomerName").innerText = customerName;
    loadSitePhotos(siteId);
    photoModal.show();
}

function loadSitePhotos(siteId) {
    const gallery = document.getElementById("photoGallery");
    const noPhotosMsg = document.getElementById("noPhotosMsg");
    
    gallery.innerHTML = ""; // Clear existing
    
    showLoader();
    fetch(`/NRS/sites/${siteId}/photos`)
        .then(response => response.json())
        .then(data => {
            hideLoader();
            if (data.success && data.data.length > 0) {
                noPhotosMsg.style.display = "none";
                data.data.forEach(photo => {
                    const card = document.createElement("div");
                    card.className = "photo-card";
                    card.innerHTML = `
                        <img src="${photo.url}" alt="Site Photo" onclick="previewSiteImage('${photo.url}')" title="Click to view full size">
                        <button class="delete-btn" onclick="deletePhoto(${photo.id})" title="Delete Photo"><i class="fas fa-times"></i></button>
                        <a href="${photo.url}" target="_blank" download class="download-btn" title="Download"><i class="fas fa-download"></i></a>
                    `;
                    gallery.appendChild(card);
                });
            } else {
                noPhotosMsg.style.display = "block";
                gallery.appendChild(noPhotosMsg);
            }
        })
        .catch(error => {
            hideLoader();
            showToast("Error loading photos", "error");
        });
}

function deletePhoto(photoId) {
    if (confirm("Are you sure you want to delete this photo?")) {
        fetch(`/NRS/sites/photos/${photoId}`, {
            method: "DELETE"
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast("Photo deleted", "success");
                loadSitePhotos(document.getElementById("currentPhotoSiteId").value);
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(error => {
            showToast("Error deleting photo", "error");
        });
    }
}

function previewSiteImage(url) {
    const previewImg = document.getElementById("fullSizePreview");
    if (previewImg) {
        previewImg.src = url;
        previewModal.show();
    }
}

function goToPage(page) {
    const keyword = document.querySelector('input[name="keyword"]').value;
    const startDate = document.querySelector('input[name="startDate"]').value;
    const endDate = document.querySelector('input[name="endDate"]').value;
    
    let url = `/NRS/sites?page=${page}&keyword=${encodeURIComponent(keyword)}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    window.location.href = url;
}
