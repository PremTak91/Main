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

    $('#loader').show();

    $.ajax({
        url: `/NRS/timesheet/${id}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            $('#loader').hide();
            $('#editTimesheetModal').modal('hide');
            showToast(response.message || 'Timesheet updated successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to update timesheet';
            showToast(message, 'error');
        }
    });
}

function deleteTimesheet(id) {
    if (!confirm('Are you sure you want to delete this timesheet entry? This action cannot be undone.')) {
        return;
    }
    
    $('#loader').show();
    $.ajax({
        url: `/NRS/timesheet/${id}`,
        type: 'DELETE',
        success: function(response) {
            $('#loader').hide();
            showToast(response.message || 'Timesheet deleted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to delete timesheet';
            showToast(message, 'error');
        }
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

    const requestData = {
        attendanceDate: date,
        inTime: inTime,
        outTime: outTime,
        approverId: approverId,
        reason: reason
    };

    $('#loader').show();

    $.ajax({
        url: '/NRS/timesheet/request',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            $('#loader').hide();
            $('#requestTimesheetModal').modal('hide');
            showToast(response.message || 'Request submitted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to submit request';
            showToast(message, 'error');
        }
    });
}

function approveRequest(id) {
    if (!confirm('Are you sure you want to approve this manual timesheet entry request?')) {
        return;
    }

    $('#loader').show();

    $.ajax({
        url: `/NRS/timesheet/request/approve/${id}`,
        type: 'POST',
        success: function(response) {
            $('#loader').hide();
            showToast(response.message || 'Request approved successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to approve request';
            showToast(message, 'error');
        }
    });
}

function rejectRequestPrompt(id) {
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

    const requestData = {
        reason: reason
    };

    $('#loader').show();

    $.ajax({
        url: `/NRS/timesheet/request/reject/${id}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            $('#loader').hide();
            $('#rejectRequestModal').modal('hide');
            showToast(response.message || 'Request rejected successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to reject request';
            showToast(message, 'error');
        }
    });
}

function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this pending manual request?')) {
        return;
    }

    $('#loader').show();

    $.ajax({
        url: `/NRS/timesheet/request/${id}`,
        type: 'DELETE',
        success: function(response) {
            $('#loader').hide();
            showToast(response.message || 'Request deleted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to delete request';
            showToast(message, 'error');
        }
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
