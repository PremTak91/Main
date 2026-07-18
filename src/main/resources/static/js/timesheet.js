function changePageSize(size) {
    document.getElementById('sizeInput').value = size;
    document.getElementById('pageInput').value = 0;
    document.getElementById('searchForm').submit();
}

function goToPage(page) {
    document.getElementById('pageInput').value = page;
    document.getElementById('searchForm').submit();
}

function editTimesheet(btn) {
    const id = btn.getAttribute('data-id');
    const inTimeStr = btn.getAttribute('data-in');
    const outTimeStr = btn.getAttribute('data-out');
    
    $('#timesheetId').val(id);
    
    // Format the date strings for datetime-local input
    if (inTimeStr && inTimeStr !== "null") {
        $('#inTime').val(inTimeStr);
    } else {
        $('#inTime').val('');
    }
    
    if (outTimeStr && outTimeStr !== "null") {
        $('#outTime').val(outTimeStr);
    } else {
        $('#outTime').val('');
    }
    
    $('#editTimesheetModal').modal('show');
}

function saveTimesheet() {
    const id = $('#timesheetId').val();
    const inTime = $('#inTime').val();
    const outTime = $('#outTime').val();

    if (!inTime) {
        showToast('In Time is required.', 'error');
        return;
    }

    const requestData = {
        inTime: inTime,
        outTime: outTime
    };

    showLoader();

    $.ajax({
        url: `/NRS/timesheet/${id}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            hideLoader();
            $('#editTimesheetModal').modal('hide');
            showToast(response.message || 'Timesheet updated successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            hideLoader();
            const message = xhr.responseJSON?.message || 'Failed to update timesheet';
            showToast(message, 'error');
        }
    });
}

function deleteTimesheet(id) {
    showConfirm("Delete Timesheet", "Are you sure you want to delete this timesheet entry? This action cannot be undone.", function() {
        showLoader();
        $.ajax({
            url: `/NRS/timesheet/${id}`,
            type: 'DELETE',
            success: function(response) {
                hideLoader();
                showToast(response.message || 'Timesheet deleted successfully', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            },
            error: function(xhr) {
                hideLoader();
                const message = xhr.responseJSON?.message || 'Failed to delete timesheet';
                showToast(message, 'error');
            }
        });
    });
}

function openRequestModal() {
    $('#requestTimesheetForm')[0].reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    $('#reqDate').val(today);
    $('#reqInTime').val(today + 'T09:00');
    $('#reqOutTime').val(today + 'T17:00');
    
    $('#requestTimesheetModal').modal('show');
}

function submitManualRequest() {
    const date = $('#reqDate').val();
    const inTime = $('#reqInTime').val();
    const outTime = $('#reqOutTime').val();
    const approverId = $('#reqApprover').val();
    const reason = $('#reqReason').val();

    if (!date || !inTime || !outTime || !approverId || !reason) {
        showToast('All fields are required.', 'error');
        return;
    }

    if (new Date(inTime) >= new Date(outTime)) {
        showToast('In Time must be before Out Time.', 'error');
        return;
    }

    const $btn = $('#submitRequestBtn');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Submitting...');

    const requestData = {
        attendanceDate: date,
        inTime: inTime,
        outTime: outTime,
        approverId: approverId,
        reason: reason
    };

    showLoader();

    $.ajax({
        url: '/NRS/timesheet/request',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            hideLoader();
            $('#requestTimesheetModal').modal('hide');
            showToast(response.message || 'Request submitted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            hideLoader();
            $btn.prop('disabled', false).html(originalHtml);
            const message = xhr.responseJSON?.message || 'Failed to submit request';
            showToast(message, 'error');
        }
    });
}

function approveRequest(btn, id) {
    showConfirm("Approve Request", "Are you sure you want to approve this manual timesheet entry request?", function() {
        const $btn = $(btn);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

        showLoader();

        $.ajax({
            url: `/NRS/timesheet/request/approve/${id}`,
            type: 'POST',
            success: function(response) {
                hideLoader();
                showToast(response.message || 'Request approved successfully', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            },
            error: function(xhr) {
                hideLoader();
                $btn.prop('disabled', false).html(originalHtml);
                const message = xhr.responseJSON?.message || 'Failed to approve request';
                showToast(message, 'error');
            }
        });
    });
}

function rejectRequestPrompt(btn, id) {
    $('#rejectRequestId').val(id);
    $('#rejectReason').val('');
    $('#rejectRequestModal').modal('show');
}

function submitRejection() {
    const id = $('#rejectRequestId').val();
    const reason = $('#rejectReason').val();

    if (!reason || reason.trim() === '') {
        showToast('Rejection reason is required.', 'error');
        return;
    }

    const $btn = $('#submitRejectBtn');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Rejecting...');

    const requestData = {
        reason: reason
    };

    showLoader();

    $.ajax({
        url: `/NRS/timesheet/request/reject/${id}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            hideLoader();
            $('#rejectRequestModal').modal('hide');
            showToast(response.message || 'Request rejected successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            hideLoader();
            $btn.prop('disabled', false).html(originalHtml);
            const message = xhr.responseJSON?.message || 'Failed to reject request';
            showToast(message, 'error');
        }
    });
}

function deleteRequest(id) {
    showConfirm("Delete Request", "Are you sure you want to delete this manual request?", function() {
        showLoader();

        $.ajax({
            url: `/NRS/timesheet/request/${id}`,
            type: 'DELETE',
            success: function(response) {
                hideLoader();
                showToast(response.message || 'Request deleted successfully', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            },
            error: function(xhr) {
                hideLoader();
                const message = xhr.responseJSON?.message || 'Failed to delete request';
                showToast(message, 'error');
            }
        });
    });
}

$(document).ready(function() {
    $('#reqDate').on('change', function() {
        const selectedDate = $(this).val();
        if (selectedDate) {
            const inTimeVal = $('#reqInTime').val();
            if (inTimeVal) {
                const timePart = inTimeVal.substring(inTimeVal.indexOf('T'));
                $('#reqInTime').val(selectedDate + timePart);
            } else {
                $('#reqInTime').val(selectedDate + 'T09:00');
            }
            
            const outTimeVal = $('#reqOutTime').val();
            if (outTimeVal) {
                const timePart = outTimeVal.substring(outTimeVal.indexOf('T'));
                $('#reqOutTime').val(selectedDate + timePart);
            } else {
                $('#reqOutTime').val(selectedDate + 'T17:00');
            }
        }
    });
});

function openMissingTimesheetModal() {
    // Set default dates: end = today, start = 6 days ago
    const today = new Date().toISOString().split('T')[0];
    const past = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    $('#missingSearchName').val('');
    $('#missingStartDate').val(past);
    $('#missingEndDate').val(today);
    
    loadMissingTimesheets(0);
    $('#missingTimesheetModal').modal('show');
}

function loadMissingTimesheets(page) {
    const employeeName = $('#missingSearchName').val() || '';
    const startDate = $('#missingStartDate').val() || '';
    const endDate = $('#missingEndDate').val() || '';
    
    showLoader();
    
    $.ajax({
        url: '/NRS/timesheet/missing',
        type: 'GET',
        data: {
            page: page,
            size: 10,
            employeeName: employeeName,
            startDate: startDate,
            endDate: endDate
        },
        success: function(response) {
            hideLoader();
            const pageData = response.data;
            const content = pageData.content || [];
            
            let tbodyHtml = '';
            if (content.length === 0) {
                tbodyHtml = '<tr><td colspan="5" class="text-center text-muted py-4">No missing timesheets found.</td></tr>';
            } else {
                content.forEach(item => {
                    let displayDate = item.missingDate;
                    if (displayDate) {
                        try {
                            const dateObj = new Date(displayDate);
                            const options = { day: '2-digit', month: 'short', year: 'numeric' };
                            displayDate = dateObj.toLocaleDateString('en-US', options);
                        } catch (e) {}
                    }
                    
                    tbodyHtml += `
                        <tr>
                            <td>NRS-${item.employeeId}</td>
                            <td class="fw-medium">${item.employeeName}</td>
                            <td><span class="badge bg-warning text-dark px-3 py-2">${displayDate || '-'}</span></td>
                            <td>${item.designation || '-'}</td>
                            <td><span class="badge bg-danger">Missing</span></td>
                        </tr>
                    `;
                });
            }
            $('#missingTimesheetTableBody').html(tbodyHtml);
            
            // Build pagination
            const totalPages = pageData.totalPages || 0;
            const currentPage = pageData.number || 0;
            const totalElements = pageData.totalElements || 0;
            
            let pagerHtml = '';
            if (totalPages > 0) {
                const startEnt = currentPage * 10 + 1;
                const endEnt = Math.min((currentPage + 1) * 10, totalElements);
                
                pagerHtml += `
                    <div class="text-muted small">
                        Showing ${startEnt} to ${endEnt} of ${totalElements} entries
                    </div>
                    <nav aria-label="Page navigation">
                        <ul class="pagination pagination-sm mb-0">
                `;
                
                // Previous button
                const prevDisabled = currentPage === 0 ? 'disabled' : '';
                pagerHtml += `
                    <li class="page-item ${prevDisabled}">
                        <a class="page-link" href="javascript:void(0)" onclick="if(${currentPage} > 0) loadMissingTimesheets(${currentPage - 1})">Previous</a>
                    </li>
                `;
                
                // Page numbers
                for (let i = 0; i < totalPages; i++) {
                    const activeClass = currentPage === i ? 'active' : '';
                    pagerHtml += `
                        <li class="page-item ${activeClass}">
                            <a class="page-link" href="javascript:void(0)" onclick="loadMissingTimesheets(${i})">${i + 1}</a>
                        </li>
                    `;
                }
                
                // Next button
                const nextDisabled = currentPage === totalPages - 1 ? 'disabled' : '';
                pagerHtml += `
                    <li class="page-item ${nextDisabled}">
                        <a class="page-link" href="javascript:void(0)" onclick="if(${currentPage} < ${totalPages} - 1) loadMissingTimesheets(${currentPage + 1})">Next</a>
                    </li>
                `;
                
                pagerHtml += `
                        </ul>
                    </nav>
                `;
            }
            $('#missingPaginationContainer').html(pagerHtml);
        },
        error: function(xhr) {
            hideLoader();
            const message = xhr.responseJSON?.message || 'Failed to load missing timesheets';
            showToast(message, 'error');
        }
    });
}
