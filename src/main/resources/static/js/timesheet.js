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
