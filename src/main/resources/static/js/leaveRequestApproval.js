/**
 * Leave Request Approval JavaScript
 */

document.addEventListener('DOMContentLoaded', function () {
    setupSearchFilter();
});

/**
 * Setup search filter for the table
 */
function setupSearchFilter() {
    const searchInput = document.getElementById('searchTable');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#leaveRequestTable tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

/**
 * Accept/Approve a leave request directly
 */
function acceptLeave(leaveId) {
    showLoader();

    fetch('/NRS/leave/approve/' + leaveId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave approved successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to approve leave', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error approving leave:', error);
            showToast('Error approving leave', 'error');
        });
}

/**
 * Open reject modal with leave ID
 */
function openRejectModal(leaveId) {
    document.getElementById('rejectLeaveId').value = leaveId;
    document.getElementById('rejectReason').value = '';
    const modal = new bootstrap.Modal(document.getElementById('rejectModal'));
    modal.show();
}

/**
 * Confirm rejection with reason
 */
function confirmReject() {
    const leaveId = document.getElementById('rejectLeaveId').value;
    const reason = document.getElementById('rejectReason').value.trim();

    if (!reason) {
        showToast('Please enter a reason for rejection', 'error');
        return;
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('rejectModal'));
    if (modal) {
        modal.hide();
    }

    showLoader();

    fetch('/NRS/leave/reject/' + leaveId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason })
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave rejected successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to reject leave', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error rejecting leave:', error);
            showToast('Error rejecting leave', 'error');
        });
}

/**
 * Show loader
 */
function showLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-none');
        loader.classList.add('d-flex');
    }
}

/**
 * Hide loader
 */
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-flex');
        loader.classList.add('d-none');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type) {
    const toastElement = document.getElementById('commonToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (toastElement && toastMessage) {
        toastMessage.textContent = message;

        toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white');
        if (toastIcon) {
            toastIcon.classList.remove('fa-check-circle', 'fa-exclamation-circle', 'fa-exclamation-triangle');
        }

        if (type === 'success') {
            toastElement.classList.add('bg-success', 'text-white');
            if (toastIcon) toastIcon.classList.add('fa-check-circle');
        } else if (type === 'error') {
            toastElement.classList.add('bg-danger', 'text-white');
            if (toastIcon) toastIcon.classList.add('fa-exclamation-circle');
        } else if (type === 'warning') {
            toastElement.classList.add('bg-warning');
            if (toastIcon) toastIcon.classList.add('fa-exclamation-triangle');
        }

        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}
