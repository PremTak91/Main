/**
 * Notification Management - WebSockets and REST API
 */

let stompClient = null;
let currentUserId = null; // Ideally passed via meta tag or fetched

document.addEventListener('DOMContentLoaded', function() {
    fetchUnreadCount();
    fetchNotifications();
    connectWebSocket();
    registerFcmToken();
});

function registerFcmToken() {
    if (window.Android && typeof window.Android.getFcmToken === "function") {
        setTimeout(() => {
            const token = window.Android.getFcmToken();
            if (token && token.trim() !== '') {
                fetch('/NRS/api/notifications/fcm-token?token=' + encodeURIComponent(token), {
                    method: 'POST'
                }).then(res => console.log('FCM token registered'))
                  .catch(err => console.error('Error registering FCM token', err));
            }
        }, 3000); // Wait 3 seconds for FCM to initialize in Android
    }
}

function connectWebSocket() {
    const socket = new SockJS('/NRS/ws-notifications');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable debug logging in production

    stompClient.connect({}, function (frame) {
        console.log('Connected to Notification WebSocket');
        stompClient.subscribe('/user/queue/notifications', function (message) {
            const notification = JSON.parse(message.body);
            handleIncomingNotification(notification);
        });
    }, function(error) {
        console.error('WebSocket connection error:', error);
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
    });
}

function handleIncomingNotification(notification) {
    // Increment unread count
    const countBadge = document.getElementById('unreadNotificationCount');
    let count = parseInt(countBadge.innerText) || 0;
    count++;
    updateBadge(count);

    // Add to list
    const list = document.getElementById('notificationList');
    const emptyMsg = list.querySelector('.text-muted');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    const item = createNotificationElement(notification);
    list.insertAdjacentHTML('afterbegin', item);

    // Optional: Show toast for incoming notification
    if (typeof showToast === 'function') {
        showToast(notification.title, 'success');
    }
}

function fetchUnreadCount() {
    fetch('/NRS/api/notifications/unread-count')
        .then(response => response.json())
        .then(count => {
            updateBadge(count);
        })
        .catch(err => console.error('Error fetching unread count:', err));
}

function updateBadge(count) {
    const countBadge = document.getElementById('unreadNotificationCount');
    if (count > 0) {
        countBadge.innerText = count > 99 ? '99+' : count;
        countBadge.classList.remove('d-none');
    } else {
        countBadge.classList.add('d-none');
    }
}

function fetchNotifications() {
    fetch('/NRS/api/notifications?page=0&size=10')
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('notificationList');
            list.innerHTML = ''; // Clear loading

            if (data.content && data.content.length > 0) {
                data.content.forEach(notif => {
                    list.insertAdjacentHTML('beforeend', createNotificationElement(notif));
                });
            } else {
                list.innerHTML = '<div class="text-center p-3 text-muted small">No notifications</div>';
            }
        })
        .catch(err => {
            console.error('Error fetching notifications:', err);
            document.getElementById('notificationList').innerHTML = '<div class="text-center p-3 text-danger small">Failed to load</div>';
        });
}

function createNotificationElement(notif) {
    const isUnread = !notif.isRead;
    const bgClass = isUnread ? 'bg-light border-start border-primary border-3' : '';
    const date = new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let link = notif.deepLink ? notif.deepLink : '#';
    
    return `
        <a href="${link}" class="dropdown-item p-3 border-bottom text-wrap ${bgClass}" onclick="markAsRead('${notif.id}', this, event)">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1 text-truncate" style="max-width: 80%; font-size: 0.9rem;">${notif.title}</h6>
                <small class="text-muted" style="font-size: 0.7rem;">${date}</small>
            </div>
            <p class="mb-1 text-muted" style="font-size: 0.8rem; line-height: 1.2;">${notif.message}</p>
        </a>
    `;
}

function markAsRead(id, element, event) {
    // If it's already read, do nothing
    if (!element.classList.contains('bg-light')) {
        return;
    }

    // Call API
    fetch('/NRS/api/notifications/' + id + '/read', {
        method: 'PUT'
    }).then(response => {
        if (response.ok) {
            element.classList.remove('bg-light', 'border-start', 'border-primary', 'border-3');
            let countBadge = document.getElementById('unreadNotificationCount');
            let count = parseInt(countBadge.innerText) || 0;
            if (count > 0) {
                updateBadge(count - 1);
            }
        }
    });
}

function markAllNotificationsRead(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    fetch('/NRS/api/notifications/read-all', {
        method: 'PUT'
    }).then(response => {
        if (response.ok) {
            updateBadge(0);
            fetchNotifications(); // Reload list
        }
    });
}
