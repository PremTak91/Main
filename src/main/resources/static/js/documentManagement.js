let documentModal;

document.addEventListener("DOMContentLoaded", function () {
    documentModal = new bootstrap.Modal(document.getElementById('documentModal'));
    
    // Add file validation on form submit
    document.getElementById("documentForm").addEventListener("submit", function(e) {
        const fileInput = document.getElementById("docFile");
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name.toLowerCase();
            const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
            
            const isValid = validExtensions.some(ext => fileName.endsWith(ext));
            if (!isValid) {
                e.preventDefault();
                if (typeof hideLoader === "function") hideLoader();
                showToast("Invalid file type. Please upload PDF, DOC, or XLS only.", "error");
            }
        }
    });
});

function openAddDocumentModal() {
    document.getElementById("documentForm").reset();
    documentModal.show();
}

function deleteDocument(id) {
    showConfirm(
        "Delete Document",
        "Are you sure you want to delete this document? This action cannot be undone.",
        function () {
            showLoader();
            fetch("/NRS/admin/documents/" + id, { 
                method: "DELETE" 
            })
            .then(function (response) { 
                return response.json(); 
            })
            .then(function (data) {
                hideLoader();
                if (data.success) {
                    showToast(data.message, "success");
                    setTimeout(function () { 
                        window.location.reload(); 
                    }, 1000);
                } else {
                    showToast(data.message, "error");
                }
            })
            .catch(function () {
                hideLoader();
                showToast("An error occurred while deleting the document.", "error");
            });
        }
    );
}

function downloadDocument(url, filename) {
    if (typeof showLoader === "function") showLoader();
    
    // ── Android WebView path ──────────────────────────────────────────
    if (window.Android && typeof window.Android.downloadUrl === "function") {
        try {
            if (typeof hideLoader === "function") hideLoader();
            window.Android.downloadUrl(url, filename);
        } catch (e) {
            if (typeof hideLoader === "function") hideLoader();
            showToast("Mobile download error: " + e.message, "error");
        }
        return; // Stop here — Android handles the rest natively
    }

    // ── Web / Desktop / iOS path ──────────────────────────────────────
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.blob();
        })
        .then(blob => {
            hideLoader();
            var blobUrl = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = blobUrl;
            
            // Try to add original extension if not present in filename
            let dlName = filename;
            if (!dlName.includes('.')) {
                if (url.includes('.pdf')) dlName += '.pdf';
                else if (url.includes('.doc')) dlName += '.docx';
                else if (url.includes('.xls')) dlName += '.xlsx';
            }
            
            a.download = dlName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            hideLoader();
            showToast("Error downloading document.", "error");
            console.error("Download error:", err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        });
}
