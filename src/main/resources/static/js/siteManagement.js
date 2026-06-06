let siteModal;
let photoModal;
let previewModal;
let myDropzone;
let currentSitePhotos = [];
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

    // Listen to changes on team-member select dropdown to update the hidden input
    $(document).on("change", "#teamMembersSelect", function() {
        var selected = $(this).val() || [];
        $("#teamMembers").val(selected.join(", "));
    });
});

// ── Site CRUD ─────────────────────────────────────────────────────────────────

function openAddSiteModal() {
    document.getElementById("siteForm").reset();
    document.getElementById("siteId").value = "";
    $("#teamMembersSelect").val([]);
    $("#teamMembers").val("");
    $("#siteOwner").val("NRS");
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
                document.getElementById("srNo").value                  = site.srNo || "";
                document.getElementById("customerName").value          = site.customerName || "";
                document.getElementById("contactNo").value             = site.contactNo || "";
                document.getElementById("address").value               = site.address || "";
                document.getElementById("siteStatus").value            = site.siteStatus || "Pending";
                document.getElementById("expectedCompletedDate").value = site.expectedCompletedDate || "";
                document.getElementById("kilowatt").value              = site.kilowatt || "";
                document.getElementById("assignedTechnicianId").value  = site.assignedTechnicianId || "";
                document.getElementById("siteOwner").value             = site.siteOwner || "NRS";
                document.getElementById("remarks").value               = site.remarks || "";
                
                // Populate team member select dropdown
                var teamMembersStr = site.teamMembers || "";
                var membersArray = teamMembersStr ? teamMembersStr.split(",").map(function(s) { return s.trim(); }) : [];
                $("#teamMembersSelect").val(membersArray);
                document.getElementById("teamMembers").value = teamMembersStr;
                
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
            currentSitePhotos = [];
            var downloadBtn = document.getElementById("downloadAllBtn");
            if (data.success && data.data.length > 0) {
                currentSitePhotos = data.data;
                noPhotosMsg.style.display = "none";
                if (downloadBtn) downloadBtn.style.display = "inline-block";
                
                data.data.forEach(function (photo, index) {
                    var card = document.createElement("div");
                    card.className = "photo-card";
                    var filename = "photo_" + (index + 1) + ".jpg";
                    card.innerHTML =
                        '<img src="' + photo.url + '" alt="Site Photo" ' +
                            'onclick="previewSiteImage(\'' + photo.url + '\')" ' +
                            'title="Click to view full size">' +
                        '<button class="delete-btn" onclick="deletePhoto(' + photo.id + ')" title="Delete Photo">' +
                            '<i class="fas fa-times"></i></button>' +
                        '<button class="download-btn border-0 bg-transparent" onclick="downloadSinglePhoto(\'' + photo.url + '\', \'' + filename + '\')" style="cursor: pointer;" title="Download">' +
                            '<i class="fas fa-download text-white"></i></button>';
                    gallery.appendChild(card);
                });
            } else {
                noPhotosMsg.style.display = "block";
                if (downloadBtn) downloadBtn.style.display = "none";
            }
        })
        .catch(function (error) {
            hideLoader();
            console.error("Error loading photos:", error);
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

// ── Image Downloading Logic ───────────────────────────────────────────────────

function downloadSinglePhoto(url, filename) {
    showLoader();
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            hideLoader();
            var blobUrl = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            hideLoader();
            showToast("Failed to download image", "error");
            console.error(err);
        });
}

function downloadAllPhotos(format) {
    if (!currentSitePhotos || currentSitePhotos.length === 0) {
        showToast("No photos available to download.", "error");
        return;
    }
    
    var customerName = document.getElementById("photoCustomerName").innerText.trim() || "Customer";
    customerName = customerName.replace(/[^a-z0-9_]/gi, '_'); // sanitize

    if (format === 'zip') {
        saveAsZip(customerName);
    } else if (format === 'folder') {
        saveToLocalFolder(customerName);
    }
}

async function saveAsZip(customerName) {
    if (typeof JSZip === 'undefined') {
        showToast("ZIP library not loaded. Please try again later.", "error");
        return;
    }

    showLoader();
    try {
        var zip = new JSZip();
        var folderName = "NRS_solarSite_" + customerName;
        var folder = zip.folder(folderName);

        var fetchPromises = currentSitePhotos.map((photo, index) => {
            return fetch(photo.url)
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.blob();
                })
                .then(blob => {
                    var filename = "photo_" + (index + 1) + ".jpg";
                    folder.file(filename, blob);
                });
        });

        await Promise.all(fetchPromises);
        
        var content = await zip.generateAsync({ type: "blob" });
        hideLoader();
        
        var blobUrl = window.URL.createObjectURL(content);
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = folderName + ".zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        
        showToast("ZIP downloaded successfully!", "success");
    } catch (err) {
        hideLoader();
        showToast("Error creating ZIP file. Check console for details.", "error");
        console.error(err);
    }
}

async function saveToLocalFolder(customerName) {
    if (!window.showDirectoryPicker) {
        showToast("Your browser does not support saving directly to a folder. Please use 'Save as ZIP' instead. (Try Chrome or Edge on Desktop)", "error");
        return;
    }

    try {
        // 1. Ask user for a root directory (e.g. D:\)
        const rootHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'desktop'
        });

        showLoader();

        // 2. Create NRS/solarSite/[CustomerName] structure
        const nrsHandle = await rootHandle.getDirectoryHandle('NRS', { create: true });
        const solarSiteHandle = await nrsHandle.getDirectoryHandle('solarSite', { create: true });
        const customerHandle = await solarSiteHandle.getDirectoryHandle(customerName, { create: true });

        // 3. Fetch and save each photo
        var fetchPromises = currentSitePhotos.map(async (photo, index) => {
            const filename = "photo_" + (index + 1) + ".jpg";
            
            const fileHandle = await customerHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            
            const response = await fetch(photo.url);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            
            await writable.write(blob);
            await writable.close();
        });

        await Promise.all(fetchPromises);
        
        hideLoader();
        showToast("Successfully saved " + currentSitePhotos.length + " photos to NRS/solarSite/" + customerName, "success");
        
    } catch (err) {
        hideLoader();
        if (err.name === 'AbortError') return; // User cancelled picker
        
        showToast("Error saving to folder. Please ensure you granted write permissions.", "error");
        console.error(err);
    }
}
