/**
 * Expenses Management JavaScript
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
            const rows = document.querySelectorAll('#expensesTable tbody tr');

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
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function () {
            resetExpenseForm();
        });
    }
}

/**
 * Change page size
 */
function changePageSize(size) {
    window.location.href = '/NRS/expenses?page=0&size=' + size + '&sortBy=' + currentSortBy + '&sortDir=' + currentSortDir;
}

/**
 * Edit expense - fetch data and show modal
 */
function editExpense(id) {
    showLoader();

    fetch('/NRS/expenses/' + id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Expense not found');
            }
            return response.json();
        })
        .then(res => {
            hideLoader();
            if (res.success) {
                populateEditForm(res.data);
            } else {
                showToast(res.message || 'Error loading expense data', 'error');
                return;
            }

            // Update modal title
            document.getElementById('addExpenseModalLabel').textContent = 'Edit Expense';

            // Show modal
            const modalElement = document.getElementById('addExpenseModal');
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
                modal = new bootstrap.Modal(modalElement);
            }
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error fetching expense:', error);
            showToast('Error loading expense data', 'error');
        });
}

/**
 * Populate edit form with expense data
 */
function populateEditForm(data) {
    document.getElementById('expenseId').value = data.id || '';
    document.getElementById('paymentDescription').value = data.description || '';
    document.getElementById('totalAmount').value = data.totalAmount || '';
    document.getElementById('advancedAmount').value = data.advancedAmount || '';
    document.getElementById('givenBy').value = data.givenBy || '';
    document.getElementById('givenTo').value = data.givenTo || '';
    document.getElementById('expenseType').value = data.expenseType || '';

    // Handle date
    if (data.expenseDate) {
        document.getElementById('expenseDate').value = data.expenseDate;
    }
}

/**
 * Reset expense form
 */
function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('addExpenseModalLabel').textContent = 'Add Expense';
}

/**
 * Save expense (add or update)
 */
function saveExpense() {
    const expenseId = document.getElementById('expenseId').value;
    const isEdit = expenseId && expenseId !== '';

    const data = {
        description: document.getElementById('paymentDescription').value,
        totalAmount: document.getElementById('totalAmount').value || null,
        advancedAmount: document.getElementById('advancedAmount').value || null,
        expenseDate: document.getElementById('expenseDate').value || null,
        givenBy: document.getElementById('givenBy').value || null,
        givenTo: document.getElementById('givenTo').value || null,
        expenseType: document.getElementById('expenseType').value || null
    };

    showLoader();

    const url = isEdit ? '/NRS/expenses/' + expenseId : '/NRS/expenses';
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
                showToast(result.message || 'Expense saved successfully', 'success');
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
                if (modal) {
                    modal.hide();
                }
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to save expense', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error saving expense:', error);
            showToast('Error saving expense', 'error');
        });
}

/**
 * Delete expense
 */
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    showLoader();

    fetch('/NRS/expenses/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message || 'Expense deleted successfully', 'success');
                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(result.message || 'Failed to delete expense', 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting expense:', error);
            showToast('Error deleting expense', 'error');
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
