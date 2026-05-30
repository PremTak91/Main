/**
 * Leave Management JavaScript
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Client-side search filter
    const searchInput = document.getElementById('searchTable');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#leaveHistoryTable tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

/**
 * Apply for leave
 */
function applyLeave() {
    const employeeId = document.getElementById('employeeId').value;
    const leaveType = document.getElementById('leaveType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const description = document.getElementById('leaveReason').value;

    // Validation
    if (!employeeId) {
        showToast('Employee not found. Please login again.', 'error');
        return;
    }
    const approverId = document.getElementById('approverId').value;
    if (!approverId || approverId === '' || approverId === 'null') {
        showToast('Leave approver is not assigned so please contact your HR team.', 'error');
        return;
    }
    if (!leaveType || !fromDate || !toDate || !description) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
        showToast('To Date cannot be before From Date', 'error');
        return;
    }

    const data = {
        employeeId: employeeId,
        description: leaveType + ': ' + description,
        fromDate: fromDate,
        toDate: toDate
    };

    showLoader();

    fetch('/NRS/leave', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave applied successfully', 'success');
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('applyLeaveModal'));
                if (modal) {
                    modal.hide();
                }
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to apply leave', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error applying leave:', error);
            showToast('Error applying leave', 'error');
        });
}

function editLeave(btn) {
    const id = btn.getAttribute('data-id');
    const desc = btn.getAttribute('data-desc');
    const from = btn.getAttribute('data-from');
    const to = btn.getAttribute('data-to');

    document.getElementById('editLeaveId').value = id;
    
    // The description usually includes the leave type prefix (e.g. "Sick Leave: I am sick")
    // We can just put the whole thing in the reason textarea for simplicity, or strip it.
    let reason = desc;
    if (desc && desc.includes(': ')) {
        reason = desc.substring(desc.indexOf(': ') + 2);
    }
    document.getElementById('editLeaveReason').value = reason;

    if (from && from !== "null") {
        document.getElementById('editFromDate').value = from;
    }
    if (to && to !== "null") {
        document.getElementById('editToDate').value = to;
    }

    const modal = new bootstrap.Modal(document.getElementById('editLeaveModal'));
    modal.show();
}

function updateLeave() {
    const id = document.getElementById('editLeaveId').value;
    const fromDate = document.getElementById('editFromDate').value;
    const toDate = document.getElementById('editToDate').value;
    const description = document.getElementById('editLeaveReason').value;

    if (!fromDate || !toDate || !description) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
        showToast('To Date cannot be before From Date', 'error');
        return;
    }

    const data = {
        description: description,
        fromDate: fromDate,
        toDate: toDate
    };

    showLoader();

    fetch(`/NRS/leave/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.success) {
            showToast(result.message || 'Leave updated successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editLeaveModal'));
            if (modal) {
                modal.hide();
            }
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message || 'Failed to update leave', 'error');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Error updating leave:', error);
        showToast('Error updating leave', 'error');
    });
}

function deleteLeave(id) {
    showConfirm("Delete Leave", "Are you sure you want to delete this leave application?", function() {
        showLoader();
        fetch(`/NRS/leave/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave deleted successfully', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast(result.message || 'Failed to delete leave', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting leave:', error);
            showToast('Error deleting leave', 'error');
        });
    });
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
 * Show loader - uses commonUI loader
 */
function showLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-none');
        loader.classList.add('d-flex');
    }
}

/**
 * Hide loader - uses commonUI loader
 */
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-flex');
        loader.classList.add('d-none');
    }
}

/**
 * Show toast notification - uses commonUI toaster
 */
function showToast(message, type) {
    const toastElement = document.getElementById('commonToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (toastElement && toastMessage) {
        // Set message
        toastMessage.textContent = message;

        // Update styling based on type
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

        // Show toast
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}
