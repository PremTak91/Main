/**
 * Inquiry Entry Management JavaScript
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
            const rows = document.querySelectorAll('#inquiryTable tbody tr');

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
    const modal = document.getElementById('addInquiryModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function () {
            resetInquiryForm();
        });
    }
}

/**
 * Change page size
 */
function changePageSize(size) {
    window.location.href = '/NRS/inquiry?page=0&size=' + size + '&sortBy=' + currentSortBy + '&sortDir=' + currentSortDir;
}

/**
 * Edit inquiry - fetch data and show modal
 */
function editInquiry(id) {
    showLoader();

    fetch('/NRS/inquiry/' + id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Inquiry not found');
            }
            return response.json();
        })
        .then(res => {
            hideLoader();
            if (res.success) {
                populateEditForm(res.data);
            } else {
                showToast(res.message || 'Error loading inquiry data', 'error');
                return;
            }

            // Update modal title
            document.getElementById('addInquiryModalLabel').textContent = 'Edit Inquiry';

            // Show modal
            const modalElement = document.getElementById('addInquiryModal');
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
                modal = new bootstrap.Modal(modalElement);
            }
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error fetching inquiry:', error);
            showToast('Error loading inquiry data', 'error');
        });
}

/**
 * Populate edit form with inquiry data
 */
function populateEditForm(data) {
    document.getElementById('inquiryId').value = data.id || '';
    document.getElementById('inquiryName').value = data.name || '';
    document.getElementById('contactNo').value = data.contactNo || '';
    document.getElementById('inquiryAddress').value = data.address || '';
    document.getElementById('inquiryHistory').value = data.inquiryHistory || '';
    document.getElementById('inquiryStatus').value = data.status || '';

    // Handle given by dropdown
    if (data.givenById) {
        document.getElementById('givenBy').value = data.givenById;
    }

    // Handle date
    if (data.inquiryDate) {
        document.getElementById('inquiryDate').value = data.inquiryDate;
    }
}

/**
 * Reset inquiry form
 */
function resetInquiryForm() {
    document.getElementById('inquiryForm').reset();
    document.getElementById('inquiryId').value = '';
    document.getElementById('addInquiryModalLabel').textContent = 'Add Inquiry';
}

/**
 * Save inquiry (add or update)
 */
function saveInquiry() {
    const inquiryId = document.getElementById('inquiryId').value;
    const isEdit = inquiryId && inquiryId !== '';

    const data = {
        name: document.getElementById('inquiryName').value,
        contactNo: document.getElementById('contactNo').value,
        address: document.getElementById('inquiryAddress').value,
        givenById: document.getElementById('givenBy').value || null,
        inquiryHistory: document.getElementById('inquiryHistory').value,
        inquiryDate: document.getElementById('inquiryDate').value || null,
        status: document.getElementById('inquiryStatus').value || null
    };

    showLoader();

    const url = isEdit ? '/NRS/inquiry/' + inquiryId : '/NRS/inquiry';
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
                showToast(result.message || 'Inquiry saved successfully', 'success');
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addInquiryModal'));
                if (modal) {
                    modal.hide();
                }
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to save inquiry', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error saving inquiry:', error);
            showToast('Error saving inquiry', 'error');
        });
}

/**
 * Delete inquiry
 */
function deleteInquiry(id) {
    if (!confirm('Are you sure you want to delete this inquiry?')) {
        return;
    }

    showLoader();

    fetch('/NRS/inquiry/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Inquiry deleted successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to delete inquiry', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting inquiry:', error);
            showToast('Error deleting inquiry', 'error');
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
