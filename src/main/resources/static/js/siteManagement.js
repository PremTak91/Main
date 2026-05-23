let siteModal;
let photoModal;
let previewModal;
let myDropzone;
Dropzone.autoDiscover = false;

document.addEventListener("DOMContentLoaded", function () {
    siteModal    = new bootstrap.Modal(document.getElementById('siteModal'));
    photoModal   = new bootstrap.Modal(document.getElementById('photoModal'));
    previewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));

    // ── Dropzone (handles web drag-and-drop and desktop file selection) ───────
    myDropzone = new Dropzone("#sitePhotoDropzone", {
        url: "/NRS/sites/0/photos",   // Updated dynamically on each upload
        paramName: "file",
        maxFilesize: 20,              // MB
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        autoProcessQueue: true,
        dictDefaultMessage: "Click or drop photos here",
        clickable: false,             // Clicks handled by #sitePhotoInput overlay
        init: function () {
            this.on("processing", function (file) {
                var siteId = document.getElementById("currentPhotoSiteId").value;
                this.options.url = window.location.origin + "/NRS/sites/" + siteId + "/photos";
            });
            this.on("success", function (file, response) {
                if (response && response.success) {
                    showToast("Photo uploaded successfully!", "success");
                    loadSitePhotos(document.getElementById("currentPhotoSiteId").value);
                } else {
                    showToast((response && response.message) || "Upload failed", "error");
                }
                this.removeFile(file);
            });
            this.on("error", function (file, errMsg) {
                var msg = (errMsg && errMsg.message) ? errMsg.message : (errMsg || "Upload error");
                showToast(msg, "error");
                this.removeFile(file);
            });
        }
    });

    // ── Native file input overlay (web path only) ─────────────────────────────
    // On Android, the upload is handled natively in MainActivity.java via
    // HttpURLConnection after onActivityResult detects the site-photo context.
    // This listener only fires on desktop/web browsers.
    var sitePhotoInput = document.getElementById("sitePhotoInput");
    if (sitePhotoInput) {
        sitePhotoInput.addEventListener("change", function () {
            if (!this.files || this.files.length === 0) return;
            var files = Array.from(this.files);
            this.value = ""; // Reset so the same file can be re-selected
            files.forEach(function (f) {
                myDropzone.addFile(f);
            });
        });
    }
});

// ── Site CRUD ─────────────────────────────────────────────────────────────────

function openAddSiteModal() {
    document.getElementById("siteForm").reset();
    document.getElementById("siteId").value = "";
    document.getElementById("siteModalLabel").innerText = "Add New Site";
    siteModal.show();
}

function editSite(id) {
    showLoader();
    fetch("/NRS/sites/" + id)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            hideLoader();
            if (data.success) {
                var site = data.data;
                document.getElementById("siteId").value                = site.id;
                document.getElementById("customerName").value          = site.customerName || "";
                document.getElementById("contactNo").value             = site.contactNo || "";
                document.getElementById("address").value               = site.address || "";
                document.getElementById("siteStatus").value            = site.siteStatus || "Pending";
                document.getElementById("expectedCompletedDate").value = site.expectedCompletedDate || "";
                document.getElementById("kilowatt").value              = site.kilowatt || "";
                document.getElementById("assignedTechnicianId").value  = site.assignedTechnicianId || "";
                document.getElementById("remarks").value               = site.remarks || "";
                document.getElementById("siteModalLabel").innerText    = "Edit Site Details";
                siteModal.show();
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(function () {
            hideLoader();
            showToast("Error loading site details", "error");
        });
}

function saveSite() {
    var form = document.getElementById("siteForm");
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var formData = new FormData(form);
    showLoader();
    fetch("/NRS/sites/save", { method: "POST", body: formData })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            hideLoader();
            if (data.success) {
                showToast(data.message, "success");
                siteModal.hide();
                setTimeout(function () { window.location.reload(); }, 1000);
            } else {
                showToast(data.message, "error");
            }
        })
        .catch(function () {
            hideLoader();
            showToast("Error saving site", "error");
        });
}

function deleteSite(id) {
    showConfirm(
        "Delete Site",
        "Are you sure you want to delete this site? All associated photos will also be permanently deleted.",
        function () {
            showLoader();
            fetch("/NRS/sites/" + id, { method: "DELETE" })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    hideLoader();
                    if (data.success) {
                        showToast(data.message, "success");
                        setTimeout(function () { window.location.reload(); }, 1000);
                    } else {
                        showToast(data.message, "error");
                    }
                })
                .catch(function () {
                    hideLoader();
                    showToast("Error deleting site", "error");
                });
        }
    );
}

// ── Photo Management ──────────────────────────────────────────────────────────

function openPhotoModal(siteId, customerName) {
    document.getElementById("currentPhotoSiteId").value    = siteId;
    document.getElementById("photoCustomerName").innerText = customerName;
    loadSitePhotos(siteId);
    photoModal.show();
}

function loadSitePhotos(siteId) {
    var gallery     = document.getElementById("photoGallery");
    var noPhotosMsg = document.getElementById("noPhotosMsg");
    gallery.innerHTML = "";

    showLoader();
    fetch("/NRS/sites/" + siteId + "/photos")
        .then(function (r) { return r.json(); })
        .then(function (data) {
            hideLoader();
            if (data.success && data.data.length > 0) {
                noPhotosMsg.style.display = "none";
                data.data.forEach(function (photo) {
                    var card = document.createElement("div");
                    card.className = "photo-card";
                    card.innerHTML =
                        '<img src="' + photo.url + '" alt="Site Photo" ' +
                            'onclick="previewSiteImage(\'' + photo.url + '\')" ' +
                            'title="Click to view full size">' +
                        '<button class="delete-btn" onclick="deletePhoto(' + photo.id + ')" title="Delete Photo">' +
                            '<i class="fas fa-times"></i></button>' +
                        '<a href="' + photo.url + '" target="_blank" download class="download-btn" title="Download">' +
                            '<i class="fas fa-download"></i></a>';
                    gallery.appendChild(card);
                });
            } else {
                noPhotosMsg.style.display = "block";
                gallery.appendChild(noPhotosMsg);
            }
        })
        .catch(function () {
            hideLoader();
            showToast("Error loading photos", "error");
        });
}

function deletePhoto(photoId) {
    showConfirm("Delete Photo", "Are you sure you want to delete this photo?", function () {
        fetch("/NRS/sites/photos/" + photoId, { method: "DELETE" })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success) {
                    showToast("Photo deleted", "success");
                    loadSitePhotos(document.getElementById("currentPhotoSiteId").value);
                } else {
                    showToast(data.message, "error");
                }
            })
            .catch(function () {
                showToast("Error deleting photo", "error");
            });
    });
}

function previewSiteImage(url) {
    var previewImg = document.getElementById("fullSizePreview");
    if (previewImg) {
        previewImg.src = url;
        previewModal.show();
    }
}

function goToPage(page) {
    var keyword   = document.querySelector('input[name="keyword"]').value;
    var startDate = document.querySelector('input[name="startDate"]').value;
    var endDate   = document.querySelector('input[name="endDate"]').value;

    var url = "/NRS/sites?page=" + page + "&keyword=" + encodeURIComponent(keyword);
    if (startDate) url += "&startDate=" + startDate;
    if (endDate)   url += "&endDate=" + endDate;

    window.location.href = url;
}
