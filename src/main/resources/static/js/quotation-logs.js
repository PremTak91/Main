function changePageSize(size) {
    document.getElementById('sizeInput').value = size;
    document.getElementById('pageInput').value = 0;
    document.getElementById('searchForm').submit();
}

function goToPage(page) {
    document.getElementById('pageInput').value = page;
    document.getElementById('searchForm').submit();
}

function deleteLog(id) {
    if (!confirm('Are you sure you want to delete this quotation log? This action cannot be undone.')) {
        return;
    }
    
    $('#loader').show();
    $.ajax({
        url: `/NRS/quts/logs/${id}`,
        type: 'DELETE',
        success: function(response) {
            $('#loader').hide();
            showToast(response.message || 'Quotation log deleted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        },
        error: function(xhr) {
            $('#loader').hide();
            const message = xhr.responseJSON?.message || 'Failed to delete quotation log';
            showToast(message, 'error');
        }
    });
}
