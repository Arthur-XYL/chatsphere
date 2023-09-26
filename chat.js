const BASE_URL = 'https://chatsphere.arthurxyl.com/api';
const socket = io('https://chatsphere.arthurxyl.com');

socket.on('receive message', (data) => {
    if (data.chat_id === chatId) { // Check if the received message belongs to the current chat
        const chatHistoryDiv = document.getElementById('chat-history');
        const messageItem = document.createElement('div');
        messageItem.textContent = data.content;
        if (data.sender_id === userId) {
            messageItem.classList.add('message', 'sent');
        } else {
            messageItem.classList.add('message', 'received');
        }
        chatHistoryDiv.appendChild(messageItem);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }
});

let userId;
let chatId;

window.addEventListener('pageshow', checkAuthentication);

// function fetchWithErrorHandler(url, method, body) {
//     const options = {
//         method: method,
//         credentials: 'include',
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     };
//     if (body) options.body = JSON.stringify(body);

//     return fetch(url, options)
//         .then(response => {
//             if (response.ok) return response.json();
//             throw new Error('Network response was not ok');
//         });
// }
function fetchWithErrorHandler(url, method, body) {
    const options = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);

    return fetch(url, options)
        .then(response => {
            if (response.ok) return response.json();
            return response.json().then(err => { throw err; }); // modified this line to throw the error message
        });
}


function checkAuthentication() {
    fetchWithErrorHandler(`${BASE_URL}/auth/status`, 'GET')
        .then(data => {
            if (data.isAuthenticated) {
                userId = data.user.id;
                document.body.style.display = 'inline';
                loadContacts();
            } else {
                redirectToLogin();
            }
        })
        .catch(() => {
            redirectToLogin();
        });
}

function redirectToLogin() {
    window.location.href = '/user-login/login.html';
}

document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
});

function initializeApp() {
    const addContactBtn = document.getElementById("add-contact-btn");
    const logoutBtn = document.getElementById("logout-btn");

    const requestModal = document.getElementById("addContactModal");
    const toggleListBtn = document.getElementById("toggle-list-btn");
    const sendMessageBtn = document.getElementById("send-message-btn");
    let searchedUserId;

    addContactBtn.addEventListener('click', showRequestModal);
    toggleListBtn.addEventListener("click", toggleList);
    logoutBtn.addEventListener('click', logoutUser);
    sendMessageBtn.addEventListener('click', sendMessage);

    function showRequestModal() {
        requestModal.showModal();
        const searchBtn = requestModal.querySelector('#add-contact-modal-search');
        const searchResult = requestModal.querySelector("#searchResult");
        const sendRequestBtn = requestModal.querySelector('#add-contact-modal-submit');
        const cancelRequestBtn = requestModal.querySelector('#add-contact-modal-cancel');

        searchBtn.addEventListener('click', searchUser);
        sendRequestBtn.addEventListener('click', submitFriendRequest);
        cancelRequestBtn.addEventListener('click', closeRequestModal);
    }

    function searchUser() {
        const userInput = document.getElementById("searchInput").value;
        if (!userInput) {
            searchResult.innerHTML = 'Input cannot be empty';
            searchedUserId = null;
            return;
        }
    
        const sanitizedInput = DOMPurify.sanitize(userInput);
        fetchWithErrorHandler(`${BASE_URL}/search/?username=${sanitizedInput}`, 'GET')
            .then(data => {
                if (data.exists) {
                    searchResult.innerHTML = `Username: ${data.username}`;
                    searchedUserId = data.userId;
                } else {
                    searchResult.innerHTML = 'User doesn\'t exist';
                    searchedUserId = null;
                }
            })
            .catch(error => {
                searchResult.innerHTML = error.message;
                searchedUserId = null;
            });
    }

    function submitFriendRequest() {
        if (!searchedUserId) {
            searchResult.innerHTML = 'Please search a valid user before sending a request.';
            return;
        }
    
        fetchWithErrorHandler(`${BASE_URL}/friend-requests`, 'POST', {
                userId: userId,
                contactId: searchedUserId
            })
            .then(data => {
                searchResult.innerHTML = data.message;
            })
            .catch(error => {
                searchResult.innerHTML = error.message || 'Error sending friend request. Please try again later.'; // display the error message from the server or the default one
            });
    }    
    
    function closeRequestModal() {
        searchResult.innerHTML = '';
        searchedUserId = null;
        requestModal.close();
    }

    function toggleList() {
        const combinedListDiv = document.getElementById('combined-list-div');
        const listTitle = document.getElementById('list-title');
    
        if (toggleListBtn.getAttribute('data-showing') === 'contacts') {
            listTitle.textContent = 'Friend Requests';
            toggleListBtn.setAttribute('data-showing', 'friend-requests');
            toggleListBtn.textContent = 'Contacts';
            loadFriendRequests();
        } else {
            listTitle.textContent = 'Contacts';
            toggleListBtn.setAttribute('data-showing', 'contacts');
            toggleListBtn.textContent = 'Friend Requests';
            loadContacts();
        }
    }
    
    function logoutUser() {
        fetchWithErrorHandler(`${BASE_URL}/auth/logout`, 'POST')
            .then(data => {
                alert(data.message);
                redirectToLogin();
            })
            .catch(() => {
                alert('Error during logout.');
            });
    }
}

function loadContacts() {
    const contactsList = document.querySelector('.combined-list');
    fetchWithErrorHandler(`${BASE_URL}/contacts/${userId}`, 'GET')
        .then(contacts => {
            contactsList.innerHTML = '';
            contacts.forEach(contact => {
                const contactItem = document.createElement('li');
                
                // Create a clickable span for each username
                const usernameSpan = document.createElement('span');
                usernameSpan.textContent = contact.contact_username;
                usernameSpan.classList.add('clickable-username'); // Some CSS to indicate it's clickable
                usernameSpan.addEventListener('click', () => loadChatHistory(contact.contact_user_id, contact.contact_username));
                contactItem.appendChild(usernameSpan);
                contactsList.appendChild(contactItem);
            });
        })
        .catch(() => {
            console.error('Error fetching contacts');
        });
}

function loadChatHistory(contactId, contactUsername) {
    if (chatId) {
        socket.emit('leave room', chatId);
    }

    const chatHeader = document.querySelector('.chat header h2');
    chatHeader.textContent = contactUsername; 

    fetchWithErrorHandler(`${BASE_URL}/chats/history?userId=${userId}&contactId=${contactId}`, 'GET')
        .then(data => {
            chatId = data.chatId;
            socket.emit('join room', chatId);
            const chatHistoryDiv = document.getElementById('chat-history'); 
            chatHistoryDiv.innerHTML = '';
            if (data.messages.length !== 0) {
                data.messages.forEach(message => {
                    const messageItem = document.createElement('div');

                    // Decide the class based on the message sender
                    if (message.sender_id === userId) {
                        messageItem.classList.add('message', 'sent');
                    } else {
                        messageItem.classList.add('message', 'received');
                    }

                    messageItem.textContent = message.content;
                    chatHistoryDiv.appendChild(messageItem);
                });
            }
        })
        .catch(() => {
            console.error('Error fetching chat history');
        });
}

function loadFriendRequests() {
    const requestsDiv = document.querySelector('.combined-list');
    fetchWithErrorHandler(`${BASE_URL}/friend-requests/${userId}`, 'GET')
        .then(requests => {
            requestsDiv.innerHTML = '';
            requests.forEach(request => {
                const requestItem = document.createElement('li');
                if (request.sender_id === userId) { // User is the sender
                    requestItem.textContent = `Request to ${request.receiver_username} is ${request.status}`;
                } else if (request.receiver_id === userId && request.status === 'pending') { // User is the receiver and request is pending
                    requestItem.textContent = `Request from ${request.sender_username} `;

                    // Create Accept button
                    const acceptBtn = document.createElement('button');
                    acceptBtn.textContent = 'Accept';
                    acceptBtn.addEventListener('click', () => updateFriendRequest(request.id, 'accepted', request.sender_id));

                    requestItem.appendChild(acceptBtn);

                    // Create Reject button
                    const rejectBtn = document.createElement('button');
                    rejectBtn.textContent = 'Decline';
                    rejectBtn.addEventListener('click', () => updateFriendRequest(request.id, 'declined'));

                    requestItem.appendChild(rejectBtn);
                } else { // User is the receiver and request is either accepted or declined
                    requestItem.textContent = `Request from ${request.sender_username} ${request.status}`;
                }
                
                requestsDiv.appendChild(requestItem);
            });
        })
        .catch(() => {
            console.error('Error fetching friend requests');
        });
}

function updateFriendRequest(requestId, status, contactId) {
    fetchWithErrorHandler(`${BASE_URL}/friend-requests/${requestId}`, 'PUT', {
        status: status
    })
    .then(data => {
        alert(data.message); // Notify the user of the result
        loadFriendRequests(); // Refresh the list after updating

        if (status === 'accepted') {
            // Add to contacts and then create chat
            return addContact(userId, contactId)
                   .then(() => createChat(userId, contactId));
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function addContact(userId, contactId) {
    return fetchWithErrorHandler(`${BASE_URL}/contacts`, 'POST', {
        userId: userId,
        contactId: contactId
    });
}

function createChat(userId, contactId) {
    return fetchWithErrorHandler(`${BASE_URL}/chats`, 'POST', {
        userId: userId,
        contactId: contactId
    });
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageContent = chatInput.value.trim();

    if (messageContent) {
        const content = DOMPurify.sanitize(messageContent);
        chatInput.value = '';

        socket.emit('send message', {
            chat_id: chatId,
            sender_id: userId,
            content: content
        });
    } 
}

