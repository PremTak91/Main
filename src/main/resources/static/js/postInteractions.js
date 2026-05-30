function toggleLike(postId, btnElement) {
    fetch(`/NRS/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Toggle UI
            const icon = btnElement.querySelector('i');
            const countSpan = btnElement.querySelector('.like-count');
            const countWrapper = btnElement.querySelector('.like-count-wrapper');
            
            if (data.data.liked) {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-primary');
                btnElement.classList.add('text-primary');
            } else {
                icon.classList.remove('fas', 'text-primary');
                icon.classList.add('far');
                btnElement.classList.remove('text-primary');
            }
            
            countSpan.textContent = data.data.likeCount;
            if (countWrapper) {
                countWrapper.style.display = data.data.likeCount > 0 ? '' : 'none';
            }
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error toggling like:', error);
        showToast('Failed to like post', 'error');
    });
}

function showLikes(postId, likerNamesStr) {
    const likers = likerNamesStr.split(',');
    const listHtml = likers.filter(n => n.trim() !== '').map(name => `<li class="list-group-item">${name}</li>`).join('');
    
    if (listHtml === '') return;
    
    document.getElementById('likesModalBody').innerHTML = `<ul class="list-group list-group-flush">${listHtml}</ul>`;
    new bootstrap.Modal(document.getElementById('likesModal')).show();
}

function toggleCommentSection(postId) {
    const section = document.getElementById(`comment-section-${postId}`);
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

function submitComment(postId) {
    const inputField = document.getElementById(`comment-input-${postId}`);
    const commentText = inputField.value.trim();
    
    if (!commentText) return;
    
    const btnElement = document.getElementById(`comment-btn-${postId}`);
    btnElement.disabled = true;
    
    fetch(`/NRS/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: commentText })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear input
            inputField.value = '';
            
            // Append new comment to list
            const commentsList = document.getElementById(`comments-list-${postId}`);
            
            let photoHtml = '';
            if (data.data.authorPhoto && data.data.authorPhoto !== 'null' && data.data.authorPhoto !== '') {
                const photoSrc = data.data.authorPhoto.startsWith('http') ? data.data.authorPhoto : `/NRS/images/employeePhoto/${data.data.authorPhoto}`;
                photoHtml = `<img src="${photoSrc}" alt="Avatar" class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">`;
            } else {
                const letter = data.data.authorName.charAt(0).toUpperCase();
                photoHtml = `<div class="avatar-circle me-2 letter-${letter}" style="width: 32px; height: 32px; font-size: 14px; line-height: 32px;">
                                <span class="avatar-letter">${letter}</span>
                             </div>`;
            }
            
            const newCommentHtml = `
                <div class="d-flex mb-3">
                    ${photoHtml}
                    <div class="bg-light rounded p-2 flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <strong>${data.data.authorName}</strong>
                            <small class="text-muted">Just now</small>
                        </div>
                        <p class="mb-0 small">${data.data.text}</p>
                    </div>
                </div>
            `;
            
            commentsList.insertAdjacentHTML('beforeend', newCommentHtml);
            
            // Update comment count UI
            const countSpan = document.getElementById(`comment-count-${postId}`);
            if (countSpan) {
                const newCount = parseInt(countSpan.textContent) + 1;
                countSpan.textContent = newCount;
                
                // Show the wrapper if it was hidden
                const wrapper = countSpan.closest('.comment-count-wrapper');
                if (wrapper) {
                    wrapper.style.display = '';
                }
            }
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error adding comment:', error);
        showToast('Failed to add comment', 'error');
    })
    .finally(() => {
        btnElement.disabled = false;
    });
}

function deletePost(postId) {
    const modalElement = document.getElementById('confirmModal');
    if (!modalElement) {
        // Fallback if modal doesn't exist on page
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }
        executeDeletePost(postId);
        return;
    }

    document.getElementById('confirmTitle').textContent = 'Delete Post';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this post? This action cannot be undone.';
    
    const confirmBtn = document.getElementById('confirmBtn');
    
    // Remove existing event listeners to prevent multiple fires
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', function() {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        executeDeletePost(postId);
    });
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function executeDeletePost(postId) {
    showLoader();
    
    fetch(`/NRS/api/posts/${postId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Post deleted successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            hideLoader();
            showToast(data.message || 'Failed to delete post', 'error');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Error deleting post:', error);
        showToast('An error occurred while deleting the post', 'error');
    });
}
