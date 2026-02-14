/**
 * Post Activity JavaScript
 */

function previewImage(input) {
    const container = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            container.classList.remove('d-none');
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        container.classList.add('d-none');
    }
}

function submitPost() {
    const form = document.getElementById('createPostForm');
    const formData = new FormData(form);
    const postId = document.getElementById('editPostId').value;

    const url = postId ? `/NRS/api/posts/${postId}` : '/NRS/api/posts';

    showLoader();

    fetch(url, {
        method: 'POST', // We use POST for both create and update because of MultipartFile handling limitations in some Servlet environments with PUT
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                showToast(result.message, 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
                modal.hide();
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error submitting post:', error);
            showToast('Error submitting post', 'error');
        });
}

function editPost(id) {
    showLoader();

    fetch(`/NRS/api/posts/${id}`)
        .then(response => response.json())
        .then(post => {
            hideLoader();
            document.getElementById('editPostId').value = post.id;
            document.getElementById('postText').value = post.postText || '';
            document.getElementById('createPostModalLabel').textContent = 'Edit Post';

            const previewContainer = document.getElementById('imagePreviewContainer');
            const previewImage = document.getElementById('imagePreview');

            if (post.postImage) {
                previewImage.src = `/NRS/images/postImages/${post.postImage}`;
                previewContainer.classList.remove('d-none');
            } else {
                previewContainer.classList.add('d-none');
            }

            const modal = new bootstrap.Modal(document.getElementById('createPostModal'));
            modal.show();
        })
        .catch(error => {
            hideLoader();
            console.error('Error fetching post:', error);
            showToast('Error loading post details', 'error');
        });
}

// Reset modal on close
document.getElementById('createPostModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('createPostForm').reset();
    document.getElementById('editPostId').value = '';
    document.getElementById('imagePreviewContainer').classList.add('d-none');
    document.getElementById('createPostModalLabel').textContent = 'Create Post';
});

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
