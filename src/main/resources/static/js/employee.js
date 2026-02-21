/**
 * Employee Management JavaScript
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    setupModalReset();
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
            const rows = document.querySelectorAll('#employeeTable tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

/**
 * Setup modal reset on close
 */
function setupModalReset() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function () {
            resetEmployeeForm();
        });
    }
}

/**
 * Change page size
 */
function changePageSize(size) {
    window.location.href = '/NRS/employee?page=0&size=' + size + '&sortBy=' + currentSortBy + '&sortDir=' + currentSortDir;
}

/**
 * Edit employee - fetch data and show modal
 */
function editEmployee(id) {
    showLoader();

    fetch('/NRS/employee/' + id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Employee not found');
            }
            return response.json();
        })
        .then(data => {
            hideLoader();
            // data now contains { employee: ..., roleId: ... }
            populateEditForm(data.employee, data.roleId);

            // Update modal title
            document.getElementById('employeeModalTitle').textContent = 'Edit User';

            // Show modal
            const modalElement = document.getElementById('addUserModal');
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
                modal = new bootstrap.Modal(modalElement);
            }
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error fetching employee:', error);
            showToast('Error loading employee data', 'error');
        });
}

/**
 * Populate edit form with employee data
 */
function populateEditForm(data, roleId) {
    document.getElementById('employeeId').value = data.id || '';
    document.getElementById('firstName').value = data.firstName || '';
    document.getElementById('middleName').value = data.middleName || '';
    document.getElementById('lastName').value = data.lastName || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phoneNo').value = data.phoneNo || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('city').value = data.city || '';
    document.getElementById('state').value = data.state || '';
    document.getElementById('branch').value = data.branch || '';

    // Clear password during edit for security
    document.getElementById('password').value = '';

    // Handle date
    if (data.dateOfJoining) {
        document.getElementById('dateOfJoining').value = data.dateOfJoining;
    }

    // Handle select fields
    if (data.designationId) {
        document.getElementById('designationId').value = data.designationId;
    }
    if (roleId) {
        document.getElementById('roleId').value = roleId;
    }
    if (data.empMainterId) {
        document.getElementById('empMainterId').value = data.empMainterId;
    }
    if (data.empStatus !== null && data.empStatus !== undefined) {
        // Map integer back to string for select if needed
        const statusMap = {
            1: 'Active',
            2: 'Inactive',
            3: 'Under Review',
            0: 'Terminated'
        };
        document.getElementById('empStatus').value = statusMap[data.empStatus] || data.empStatus;
    }
}

/**
 * Reset employee form
 */
function resetEmployeeForm() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModalTitle').textContent = 'Add User';
}

/**
 * Save employee (add or update)
 */
function saveEmployee() {
    const employeeId = document.getElementById('employeeId').value;
    const isEdit = employeeId && employeeId !== '';

    const data = {
        firstName: document.getElementById('firstName').value,
        middleName: document.getElementById('middleName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phoneNo: document.getElementById('phoneNo').value,
        phoneNumber: document.getElementById('phoneNo').value, // Add both for compatibility
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        branch: document.getElementById('branch').value,
        dateOfJoining: document.getElementById('dateOfJoining').value || null,
        designationId: document.getElementById('designationId').value || null,
        roleId: document.getElementById('roleId').value || null,
        password: document.getElementById('password').value || null,
        empMainterId: document.getElementById('empMainterId').value || null,
        empStatus: document.getElementById('empStatus').value || null
    };

    // Map status string back to integer if needed
    const statusMap = {
        'Active': 1,
        'Inactive': 2,
        'Under Review': 3,
        'Terminated': 0
    };
    if (isNaN(data.empStatus) && statusMap[data.empStatus] !== undefined) {
        data.empStatus = statusMap[data.empStatus];
    } else if (data.empStatus) {
        data.empStatus = parseInt(data.empStatus);
    }

    if (!isEdit && (!data.password || data.password.trim() === '')) {
        showToast('Password is required for new registration', 'error');
        return;
    }

    if (!isEdit && !data.roleId) {
        showToast('Role is required for new registration', 'error');
        return;
    }

    showLoader();

    // For new registrations, use the registration API
    const url = isEdit ? '/NRS/employee/' + employeeId : '/NRS/registration';
    const method = 'POST'; // Registration API expects POST. Employee update expects PUT technically, but let's check.

    // Wait, registration API uses @ModelAttribute which handles both JSON and multipart.
    // EmployeeController.updateEmployeeById uses @RequestBody for JSON.

    let fetchOptions;
    if (isEdit) {
        fetchOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } else {
        // Registration expects multipart/form-data or parameters. registration.js used FormData.
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null) formData.append(key, data[key]);
        });
        fetchOptions = {
            method: 'POST',
            body: formData
        };
    }

    fetch(url, fetchOptions)
        .then(async response => {
            const contentType = response.headers.get("content-type");
            const isJson = contentType && contentType.indexOf("application/json") !== -1;

            if (response.ok) {
                if (isJson) return response.json();
                const text = await response.text();
                return { success: true, message: text };
            } else {
                if (isJson) return response.json().then(json => ({ success: false, ...json }));
                const text = await response.text();
                return { success: false, message: text || 'Server error occurred' };
            }
        })
        .then(result => {
            hideLoader();
            if (result.success || (typeof result === 'string' && result.includes('success'))) {
                showToast(result.message || 'Saved successfully', 'success');
                // Close modal
                const modalElement = document.getElementById('addUserModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();

                setTimeout(() => location.reload(), 1000);
            } else {
                showToast(result.message || 'Failed to save employee', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error saving employee:', error);
            showToast('Error saving employee', 'error');
        });
}

/**
 * Delete employee (soft delete - set status to Inactive)
 */
function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee? This will set their status to Inactive.')) {
        return;
    }

    showLoader();

    fetch('/NRS/employee/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Employee deleted successfully', 'success');
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to delete employee', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting employee:', error);
            showToast('Error deleting employee', 'error');
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
