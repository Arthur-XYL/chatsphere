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

function loadChat(contactElement) {
    const chatHeader = document.querySelector(".chat header h2");
    chatHeader.textContent = contactElement.textContent;
    // Here, you would typically load the chat history for the selected contact.
}


