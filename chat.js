const BASE_URL = 'https://chatsphere.arthurxyl.com/api';


let userId;

window.addEventListener('pageshow', () => {
    fetch(`${BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include', 
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                userId = data.user.id;
                document.body.style.display = 'inline';
            } else {
                window.location.href = '/user-login/login.html';
            }
        })
        .catch(error => {
            console.error('Error checking auth status:', error);
            window.location.href = '/user-login/login.html';
        });
});

document.addEventListener("DOMContentLoaded", function() {
    // Get necessary DOM elements
    const addContactBtn = document.getElementById("add-contact-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const modal = document.getElementById("addContactModal");
    const searchBtn = modal.querySelector('#add-contact-modal-search');
    const searchResult = modal.querySelector("#searchResult");
    const submitBtn = modal.querySelector('#add-contact-modal-submit');
    const cancelBtn = modal.querySelector('#add-contact-modal-cancel');
    
    let searchedUserId;
    
    // Event listener for the Add Contact button
    addContactBtn.addEventListener("click", () => {
        console.log("Add Contact Button Clicked!");
        modal.showModal();
    });

    // Event listener for the search button inside the modal
    searchBtn.addEventListener('click', () => {
        const userInput = document.getElementById("searchInput").value;
        if (userInput === null || userInput === "") {
            searchResult.innerHTML = `Input cannot be empty`;
            searchedUserId = null;
        } else {
            const sanitizedInput = DOMPurify.sanitize(userInput);
            // Fetch user from the server/database
            fetch(`${BASE_URL}/search/?username=${sanitizedInput}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if(data.exists) {
                    searchResult.innerHTML = `Username: ${data.username}`;
                    searchedUserId = data.userId;
                    console.log(searchedUserId);
                } else {
                    searchResult.innerHTML = `User doesn't exist`;
                    searchedUserId = null;
                }
            })
            .catch(error => {
                console.error('Error searching user:', error);
                searchResult.innerHTML = `Error occurred during search`;
            });
        }
    });

    // Event listener for the Submit button inside the modal
    submitBtn.addEventListener('click', () => {
        console.log("Submit Button Clicked!");
        console.log(searchedUserId);
        if (!searchedUserId) {
            searchResult.innerHTML = 'Please search a valid user before sending a request.';
            return;
        }

        // Send a friend request
        return fetch(`${BASE_URL}/friend-requests`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                contactId: searchedUserId
            })
        })
        .then(response => response.json())
        .then(data => {
            searchResult.innerHTML = data.message;
        })
        .catch(error => {
            console.error('Error sending friend request:', error);
            searchResult.innerHTML = 'Error sending friend request. Please try again later.';
        });
    });


    // Event listener for the Cancel button inside the modal
    cancelBtn.addEventListener('click', () => {
        console.log("Cancel Button Clicked!");
        searchResult.innerHTML = '';
        searchedUserId = null;
        modal.close();
        console.log("Closing modal after cancel");
    });

    document.getElementById("toggle-list-btn").addEventListener("click", () => {
        const btn = document.getElementById('toggle-list-btn');
        const showing = btn.getAttribute('data-showing');
        
        const contactsDiv = document.getElementById('contacts-list-div');
        const requestsDiv = document.getElementById('friend-requests-div');
        
        if (showing === 'contacts') {
            // Currently showing contacts, so now show friend requests.
            contactsDiv.style.display = 'none';
            requestsDiv.style.display = '';
        
            btn.setAttribute('data-showing', 'friend-requests');
            btn.textContent = 'Contacts';
    
            console.log("loading friend request");
            // Call the function to load and display the friend requests.
            loadFriendRequests();
        } else {
            // Currently showing friend requests, so now show contacts.
            contactsDiv.style.display = '';
            requestsDiv.style.display = 'none';
        
            btn.setAttribute('data-showing', 'contacts');
            btn.textContent = 'Friend Requests';
            loadContacts();
        }
    });
    
    function loadFriendRequests() {
        const requestsDiv = document.getElementById('friend-requests-div');
    
        // Clear previous friend requests if any
        requestsDiv.innerHTML = '';
    
        fetch(`${BASE_URL}/friend-requests/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const requestsContainer = document.getElementById('friend-requests-div');
            requestsContainer.innerHTML = ''; // Clear existing requests

            if (data && data.length > 0) {
                data.forEach(request => {
                    const requestDiv = document.createElement('div');
                    requestDiv.className = 'request-item';

                    if (currentUserId === request.sender_id) {
                        // Current user is the sender
                        const receiverInfo = document.createElement('span');
                        receiverInfo.textContent = `Request to ${request.receiver_username} is ${request.status}`;
                        requestDiv.appendChild(receiverInfo);
                    } else {
                        const usernameSpan = document.createElement('span');
                        usernameSpan.textContent = `Request from ${request.sender_username} `;
                        requestDiv.appendChild(usernameSpan);

                        if (request.status === "pending") {
                            // Display the accept and decline buttons only when the status is pending
                            const acceptBtn = document.createElement('button');
                            acceptBtn.textContent = 'Accept';
                            acceptBtn.addEventListener('click', () => {
                                acceptFriendRequest(request.id, currentUserId, request.sender_id);
                            });
                            requestDiv.appendChild(acceptBtn);
                    
                            const rejectBtn = document.createElement('button');
                            rejectBtn.textContent = 'Reject';
                            rejectBtn.addEventListener('click', () => {
                                rejectFriendRequest(request.id);
                            });
                            requestDiv.appendChild(rejectBtn);
                        } else {
                            // Display the status of the friend request when it's either accepted or declined
                            const statusSpan = document.createElement('span');
                            statusSpan.textContent = request.status;
                            requestDiv.appendChild(statusSpan);
                        }
                    }
                    requestsContainer.appendChild(requestDiv);
                });
            } else {
                requestsContainer.innerHTML = 'No friend requests at the moment.';
            }
        })
        .catch(error => {
            console.error('Error fetching friend requests:', error);
        });
    }

    function acceptFriendRequest(requestId, userId, contactId) {
        // Accept request
        fetch(`${BASE_URL}/friend-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'accepted'
            })
        })
        .catch(error => {
            console.error('Error accepting friend request:', error);
        });

        // Add to contact
        fetch(`${BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                contactId: contactId
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message); 
            loadFriendRequests();
        })
        .catch(error => {
            console.error('Error accepting friend request:', error);
        });
    }
    
    function rejectFriendRequest(requestId) {
        // Accept request
        fetch(`${BASE_URL}/friend-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'declined'
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadFriendRequests();
        })
        .catch(error => {
            console.error('Error rejecting friend request:', error);
        });
    }
    
    logoutBtn.addEventListener('click', () => {
        fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',  // ensures cookies are sent with the request
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Server responded with a status of ${response.status}`);
            }
        })
        .then(data => {
            alert(data.message);
            window.location.href = '/user-login/login.html';
        })
        .catch(error => {
            console.error('Error during logout:', error);
            alert('Error during logout.');
        });
    });

    function loadContacts() {
        const contactsList = document.querySelector('.contact-list');
        fetch(`${BASE_URL}/contacts/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(contacts => {
            contactsList.innerHTML = ''; // Clear existing contacts
            contacts.forEach(contact => {
                const contactItem = document.createElement('li');
                contactItem.textContent = contact.username;
                contactsList.appendChild(contactItem);
            });
        })
        .catch(error => {
            console.error('Error fetching contacts:', error);
        });
    }    

    // Function to send a message
    function sendMessage() {
        const chatHistory = document.getElementById("chatHistory");
        const chatInput = document.getElementById("chatInput");

        if (chatInput.value.trim() !== "") {
            const newMessage = document.createElement("div");
            newMessage.className = "message sent";
            newMessage.innerText = chatInput.value.trim();
            chatHistory.appendChild(newMessage);

            chatInput.value = "";
        }
    }

    // Function to load chat for a selected contact
    function loadChat(contactElement) {
        const chatHeader = document.querySelector(".chat header h2");
        chatHeader.textContent = contactElement.textContent;
    }
});
