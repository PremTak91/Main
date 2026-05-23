let siteModal;
let photoModal;
let previewModal;
let myDropzone;
Dropzone.autoDiscover = false;

/**
 * Detects if we're running inside an Android/iOS WebView (mobile app).
 * In a WebView, window.Android is injected OR the user agent contains "wv".
 */
function isMobileApp() {
    return (typeof window.Android !== 'undefined') ||
           /wv/.test(navigator.userAgent) ||
           /Android.*Mobile/.test(navigator.userAgent) ||
           (window.navigator.userAgent.includes('Android') && !window.navigator.userAgent.includes('Chrome/'));
}

document.addEventListener("DOMContentLoaded", function () {
    siteModal  = new bootstrap.Modal(document.getElementById('siteModal'));
    photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
    previewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));

    // ── Initialize Dropzone (for desktop drag-and-drop) ──────────────────────
    myDropzone = new Dropzone("#sitePhotoDropzone", {
        url: "/NRS/sites/0/photos",   // Will be updated dynamically per upload
        paramName: "file",
        maxFilesize: 20,              // MB
        acceptedFiles: "image/*",
        addRemoveLinks: true,
        autoProcessQueue: true,
        dictDefaultMessage: "Click or drop photos here",
        clickable: false,             // Clicks are handled by #sitePhotoInput below
        init: function () {
            this.on("processing", function (file) {
                const siteId  = document.getElementById("currentPhotoSiteId").value;
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
                const msg = (errMsg && errMsg.message) ? errMsg.message : (errMsg || "Upload error");
                showToast(msg, "error");
                this.removeFile(file);
            });
        }
    });

    // ── Native file input — handles BOTH web clicks and mobile selection ──────
    const sitePhotoInput = document.getElementById("sitePhotoInput");
    if (sitePhotoInput) {
        sitePhotoInput.addEventListener("change", function () {
            if (!this.files || this.files.length === 0) return;

            const files = Array.from(this.files);
            this.value = ""; // Reset so the same file can be re-selected

            if (isMobileApp()) {
                // ── MOBILE PATH: Upload directly via Fetch API ────────────────
                // Dropzone's XHR cannot read content:// URIs in Android WebViews.
                // Using fetch() + FormData works correctly in all WebView versions.
                uploadFilesDirectly(files);
            } else {
                // ── DESKTOP PATH: Hand files to Dropzone for upload ───────────
                files.forEach(function (file) {
                    myDropzone.addFile(file);
                });
            }
        });
    }
});

/**
 * Uploads files directly using Fetch API + FormData.
 * This is the reliable path for Android WebView where Dropzone's XHR
 * cannot read content:// URIs returned by the file picker.
 *
 * @param {File[]} files - Array of File objects to upload
 */
function uploadFilesDirectly(files) {
    const siteId = document.getElementById("currentPhotoSiteId").value;
    if (!siteId || siteId === "0") {
        showToast("Site not selected. Please open the photo manager from a site row.", "error");
        return;
    }

    const uploadUrl = window.location.origin + "/NRS/sites/" + siteId + "/photos";
    showLoader();

    // Upload files one by one (sequential) to avoid server overload
    let chain = Promise.resolve();
    let successCount = 0;
    let failCount = 0;

    files.forEach(function (file) {
        chain = chain.then(function () {
            const formData = new FormData();
            formData.append("file", file);

            return fetch(uploadUrl, {
                method: "POST",
                body: formData
                // NOTE: Do NOT set Content-Type header — browser sets multipart boundary automatically
            })
            .then(function (response) {
                if (!response.ok) {
                    // Non-2xx status
                    return response.json().then(function (data) {
                        throw new Error(data.message || ("Server error: " + response.status));
                    }).catch(function () {
                        throw new Error("Server error: " + response.status);
                    });
                }
                return response.json();
            })
            .then(function (data) {
                if (data && data.success) {
                    successCount++;
                } else {
                    failCount++;
                    console.warn("Upload response not success:", data);
                }
            })
            .catch(function (err) {
                failCount++;
                console.error("Upload failed for file:", file.name, err);
            });
        });
    });

    chain.then(function () {
        hideLoader();
        if (successCount > 0) {
            showToast(successCount + " photo(s) uploaded successfully!", "success");
            loadSitePhotos(siteId);
        }
        if (failCount > 0) {
            showToast(failCount + " photo(s) failed to upload.", "error");
        }
    });
}

// ── Site CRUD ────────────────────────────────────────────────────────────────

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
                const site = data.data;
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
    const form = document.getElementById("siteForm");
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const formData = new FormData(form);
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
    showConfirm("Delete Site",
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
        });
}

// ── Photo Management ─────────────────────────────────────────────────────────

function openPhotoModal(siteId, customerName) {
    document.getElementById("currentPhotoSiteId").value      = siteId;
    document.getElementById("photoCustomerName").innerText   = customerName;
    loadSitePhotos(siteId);
    photoModal.show();
}

function loadSitePhotos(siteId) {
    const gallery    = document.getElementById("photoGallery");
    const noPhotosMsg = document.getElementById("noPhotosMsg");
    gallery.innerHTML = "";

    showLoader();
    fetch("/NRS/sites/" + siteId + "/photos")
        .then(function (r) { return r.json(); })
        .then(function (data) {
            hideLoader();
            if (data.success && data.data.length > 0) {
                noPhotosMsg.style.display = "none";
                data.data.forEach(function (photo) {
                    const card = document.createElement("div");
                    card.className = "photo-card";
                    card.innerHTML =
                        '<img src="' + photo.url + '" alt="Site Photo" onclick="previewSiteImage(\'' + photo.url + '\')" title="Click to view full size">' +
                        '<button class="delete-btn" onclick="deletePhoto(' + photo.id + ')" title="Delete Photo"><i class="fas fa-times"></i></button>' +
                        '<a href="' + photo.url + '" target="_blank" download class="download-btn" title="Download"><i class="fas fa-download"></i></a>';
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
    const previewImg = document.getElementById("fullSizePreview");
    if (previewImg) {
        previewImg.src = url;
        previewModal.show();
    }
}

function goToPage(page) {
    const keyword   = document.querySelector('input[name="keyword"]').value;
    const startDate = document.querySelector('input[name="startDate"]').value;
    const endDate   = document.querySelector('input[name="endDate"]').value;

    let url = "/NRS/sites?page=" + page + "&keyword=" + encodeURIComponent(keyword);
    if (startDate) url += "&startDate=" + startDate;
    if (endDate)   url += "&endDate=" + endDate;

    window.location.href = url;
}
