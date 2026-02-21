/**
 * Roles & Permissions JavaScript
 */

let allAssignableEmployees = [];

function openAddUserRoleModal() {
    document.getElementById('employeeSelectContainer').style.display = 'block';
    document.getElementById('selectedEmployeeNameDisplay').style.display = 'none';
    document.getElementById('modalEmployeeId').value = '';

    showLoader();

    // Load assignable employees and roles in parallel
    Promise.all([
        fetch('/NRS/roles-permissions/api/employees').then(res => res.json()),
        fetch('/NRS/roles-permissions/api/roles').then(res => res.json())
    ])
        .then(([empRes, rolesRes]) => {
            hideLoader();
            if (!empRes.success || !rolesRes.success) {
                showToast('Error loading employees/roles', 'error');
                return;
            }
            const employees = empRes.data;
            const roles = rolesRes.data;
            allAssignableEmployees = employees;

            // Populate employee dropdown
            const select = document.getElementById('employeeSelect');
            select.innerHTML = '<option value="">-- Select Employee --</option>';
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.employeeId;
                option.textContent = `${emp.employeeName} (ID: ${emp.employeeId}) - ${emp.designation}`;
                select.appendChild(option);
            });

            populateRolesCheckboxes(roles);

            // Clear name displays
            document.getElementById('modalTitleEmployeeName').innerText = '';
            document.getElementById('modalDetailEmployeeName').innerText = '';

            const modal = new bootstrap.Modal(document.getElementById('assignRoleModal'));
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error loading data:', error);
            showToast('Error loading employees/roles', 'error');
        });
}

function openAssignRoleModal(employeeId, employeeName) {
    document.getElementById('employeeSelectContainer').style.display = 'none';
    document.getElementById('selectedEmployeeNameDisplay').style.display = 'block';
    document.getElementById('modalEmployeeId').value = employeeId;
    document.getElementById('modalTitleEmployeeName').innerText = employeeName;
    document.getElementById('modalDetailEmployeeName').innerText = `${employeeName} (ID: ${employeeId})`;

    showLoader();

    // Load roles
    fetch('/NRS/roles-permissions/api/roles')
        .then(response => response.json())
        .then(res => {
            hideLoader();
            if (!res.success) throw new Error(res.message);
            populateRolesCheckboxes(res.data);

            return fetch('/NRS/roles-permissions/api/employees');
        })
        .then(res => res.json())
        .then(res => {
            if (!res.success) throw new Error(res.message);
            const employees = res.data;
            const emp = employees.find(e => e.employeeId == employeeId);
            if (emp && emp.roleIds) {
                emp.roleIds.forEach(id => {
                    const cb = document.getElementById(`role_${id}`);
                    if (cb) cb.checked = true;
                });
            }
            const modal = new bootstrap.Modal(document.getElementById('assignRoleModal'));
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error loading roles/employee:', error);
            showToast('Error loading assignment data', 'error');
        });
}

function onEmployeeSelected() {
    const employeeId = document.getElementById('employeeSelect').value;
    const emp = allAssignableEmployees.find(e => e.employeeId == employeeId);

    // Reset checkboxes/radios
    document.querySelectorAll('.role-radio').forEach(cb => cb.checked = false);

    if (emp && emp.roleIds) {
        emp.roleIds.forEach(id => {
            const cb = document.getElementById(`role_${id}`);
            if (cb) cb.checked = true;
        });
    }
}

function populateRolesCheckboxes(roles) {
    const container = document.getElementById('rolesCheckboxesContainer');
    container.innerHTML = '';

    if (roles.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0 small">No assignable roles available for your level.</p>';
    } else {
        roles.forEach(role => {
            const div = document.createElement('div');
            div.className = 'form-check mb-2';
            div.innerHTML = `
                <input class="form-check-input role-radio" type="radio" name="userRole" value="${role.id}" id="role_${role.id}">
                <label class="form-check-label" for="role_${role.id}">
                    <strong>${role.roleId}</strong> - <span class="text-muted small">${role.description || ''}</span>
                </label>
            `;
            container.appendChild(div);
        });
    }
}

function saveRoleAssignment() {
    const employeeId = document.getElementById('modalEmployeeId').value || document.getElementById('employeeSelect').value;
    const selectedRoles = Array.from(document.querySelectorAll('.role-radio:checked'))
        .map(cb => parseInt(cb.value));

    if (!employeeId) {
        showToast('Please select an employee', 'error');
        return;
    }

    if (selectedRoles.length === 0) {
        showToast('Please select a role', 'error');
        return;
    }

    showLoader();

    fetch('/NRS/roles-permissions/api/assign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeId: employeeId,
            roleIds: selectedRoles
        })
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error assigning roles:', error);
            showToast('Error assigning roles', 'error');
        });
}

// Tab listeners
document.addEventListener('DOMContentLoaded', function () {
    const rolesTabs = document.getElementById('rolesTabs');
    if (rolesTabs) {
        rolesTabs.addEventListener('shown.bs.tab', function (event) {
            if (event.target.id === 'system-roles-tab') {
                loadAllRolesForManagement();
            }
        });
    }
});

function loadAllRolesForManagement() {
    showLoader();
    fetch('/NRS/roles-permissions/api/roles/all')
        .then(response => response.json())
        .then(res => {
            hideLoader();
            if (!res.success) {
                showToast(res.message || 'Error loading roles list', 'error');
                return;
            }
            const roles = res.data;
            tbody.innerHTML = '';

            roles.forEach(role => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td> ${role.roleId}</td>
                <td>${role.description || ''}</td>
                <td><span class="badge bg-secondary">${role.priority}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-info me-1" onclick='editSystemRole(${JSON.stringify(role)})'>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSystemRole(${role.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            hideLoader();
            console.error('Error loading all roles:', error);
            showToast('Error loading roles list', 'error');
        });
}

function openAddRoleModal() {
    document.getElementById('systemRoleForm').reset();
    document.getElementById('rolePrimaryKeyId').value = '';
    document.getElementById('systemRoleModalLabel').textContent = 'Add New Role';
    const modal = new bootstrap.Modal(document.getElementById('systemRoleModal'));
    modal.show();
}

function editSystemRole(role) {
    document.getElementById('rolePrimaryKeyId').value = role.id;
    document.getElementById('roleIdInput').value = role.roleId;
    document.getElementById('roleDescriptionInput').value = role.description || '';
    document.getElementById('rolePriorityInput').value = role.priority || '';
    document.getElementById('systemRoleModalLabel').textContent = 'Edit Role';
    const modal = new bootstrap.Modal(document.getElementById('systemRoleModal'));
    modal.show();
}

function saveSystemRole() {
    const id = document.getElementById('rolePrimaryKeyId').value;
    const roleId = document.getElementById('roleIdInput').value;
    const description = document.getElementById('roleDescriptionInput').value;
    const priority = document.getElementById('rolePriorityInput').value;

    if (!roleId) {
        showToast('Role ID is required', 'error');
        return;
    }

    if (!priority || isNaN(priority) || priority < 1) {
        showToast('Valid Priority is required (positive number)', 'error');
        return;
    }

    const roleData = {
        roleId: roleId,
        description: description,
        priority: parseInt(priority)
    };
    if (id) roleData.id = id;

    showLoader();

    fetch('/NRS/roles-permissions/api/roles/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('systemRoleModal')).hide();
                loadAllRolesForManagement();
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error saving role:', error);
            showToast('Error saving role', 'error');
        });
}

function deleteSystemRole(id) {
    if (!confirm('Are you sure you want to delete this role?')) return;

    showLoader();

    fetch(`/NRS/roles-permissions/api/roles/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message, 'success');
                loadAllRolesForManagement();
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error deleting role:', error);
            showToast('Error deleting role', 'error');
        });
}

function clearUserRoles(employeeId) {
    if (!confirm('Are you sure you want to clear all roles for this user?')) return;

    showLoader();

    fetch('/NRS/roles-permissions/api/assign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeId: employeeId,
            roleIds: [] // Empty list to clear roles
        })
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast('All roles cleared successfully', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error clearing roles:', error);
            showToast('Error clearing roles', 'error');
        });
}

// Reuse common UI helpers
function showLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-none');
        loader.classList.add('d-flex');
    }
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('d-flex');
        loader.classList.add('d-none');
    }
}

function showToast(message, type) {
    const toastElement = document.getElementById('commonToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (toastElement && toastMessage) {
        toastMessage.textContent = message;
        toastElement.classList.remove('bg-success', 'bg-danger', 'text-white');

        if (type === 'success') {
            toastElement.classList.add('bg-success', 'text-white');
            if (toastIcon) toastIcon.className = 'fas fa-check-circle me-2';
        } else {
            toastElement.classList.add('bg-danger', 'text-white');
            if (toastIcon) toastIcon.className = 'fas fa-exclamation-circle me-2';
        }

        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}
