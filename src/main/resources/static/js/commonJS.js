// ─── Loader ──────────────────────────────────────────────
function showLoader() {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.remove("d-none");
}

function hideLoader() {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.add("d-none");
}

// ─── Toast ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toastEl = document.getElementById("commonToast");
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

// ─── Global Session-Expiry Handler ───────────────────────
/**
 * Called whenever any API request returns 401 (Unauthorized / token expired).
 * Clears state and redirects to login with an ?expired=true flag.
 */
function handleSessionExpired() {
    // Avoid redirect loop if already on login page
    if (window.location.pathname.includes('/login')) return;
    window.location.href = window.location.origin + '/NRS/login?expired=true';
}

// ── jQuery AJAX global 401 interceptor ───────────────────
$(document).ajaxError(function (event, jqXHR) {
    if (jqXHR.status === 401) {
        handleSessionExpired();
    }
});

// ── Native fetch() interceptor ────────────────────────────
(function () {
    const _fetch = window.fetch;
    window.fetch = function (...args) {
        return _fetch.apply(this, args).then(function (response) {
            if (response.status === 401) {
                handleSessionExpired();
            }
            return response;
        });
    };
})();