/**
 * Leave Role Management JavaScript
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
            const rows = document.querySelectorAll('#leaveRoleTable tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

/**
 * Save or update leave role
 */
function saveLeaveRole() {
    const leaveRoleId = document.getElementById('leaveRoleId').value;
    const employeeId = document.getElementById('employeeSelect').value;
    const approverId = document.getElementById('leaveApproverSelect').value;
    const active = document.getElementById('statusSelect').value;

    // Validation
    if (!employeeId || !approverId || !active) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const isEdit = leaveRoleId && leaveRoleId !== '';

    const data = {
        employeeId: employeeId,
        approverId: approverId,
        active: active
    };

    showLoader();

    const url = isEdit ? '/NRS/leaveRole/' + leaveRoleId : '/NRS/leaveRole';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave role saved successfully', 'success');
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to save leave role', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error saving leave role:', error);
            showToast('Error saving leave role', 'error');
        });
}

/**
 * Edit leave role - populate form with existing data
 */
function editLeaveRole(id, employeeId, approverId, active) {
    document.getElementById('leaveRoleId').value = id;
    document.getElementById('employeeSelect').value = employeeId;
    document.getElementById('leaveApproverSelect').value = approverId;
    document.getElementById('statusSelect').value = active;

    // Update UI
    document.getElementById('saveBtn').textContent = 'Update';
    document.getElementById('cancelBtn').classList.remove('d-none');

    // Scroll to form
    document.getElementById('leaveRoleForm').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Reset form to add mode
 */
function resetForm() {
    document.getElementById('leaveRoleForm').reset();
    document.getElementById('leaveRoleId').value = '';
    document.getElementById('saveBtn').textContent = 'Save';
    document.getElementById('cancelBtn').classList.add('d-none');
}

/**
 * Delete leave role (soft delete - set active to 2)
 */
function deleteLeaveRole(id) {
    if (!confirm('Are you sure you want to delete this leave role?')) {
        return;
    }

    showLoader();

    fetch('/NRS/leaveRole/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Leave role deleted successfully', 'success');
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to delete leave role', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting leave role:', error);
            showToast('Error deleting leave role', 'error');
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
