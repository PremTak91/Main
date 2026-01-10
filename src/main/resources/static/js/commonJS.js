// Helper functions for Loader and Toaster
function showLoader() {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.remove("d-none");
}

function hideLoader() {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.add("d-none");
}



function showToast(message, type = 'success') {
    const toastEl = document.getElementById("commonToast");
    const toastBody = toastEl.querySelector(".toast-body");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");

    if (toastEl && toastMessage) {
        toastMessage.textContent = message;

        // Reset classes
        toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
        toastIcon.className = "fas me-2 fs-5";

        if (type === 'success') {
            toastEl.classList.add("text-bg-success");
            toastIcon.classList.add("fa-check-circle");
        } else if (type === 'error') {
            toastEl.classList.add("text-bg-danger");
            toastIcon.classList.add("fa-exclamation-circle");
        } else if (type === 'warning') {
            toastEl.classList.add("text-bg-warning");
            toastIcon.classList.add("fa-exclamation-triangle");
        } else {
            toastEl.classList.add("text-bg-info");
            toastIcon.classList.add("fa-info-circle");
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}