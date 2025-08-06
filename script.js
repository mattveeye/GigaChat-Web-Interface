class GigaChatAI {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setWelcomeTime();
    }

    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Send on Enter
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });

        sendButton.addEventListener('click', () => this.sendMessage());
    }

    setWelcomeTime() {
        const welcomeTime = document.getElementById('welcomeTime');
        welcomeTime.textContent = this.formatTime(new Date());
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botResponse = data.choices[0].message.content;

            this.addMessage(botResponse, 'bot');

        } catch (error) {
            console.error('Send error:', error);
            this.addMessage('Error sending message. Try again.', 'bot');
        }
    }

    addMessage(content, role) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-text">
                ${this.formatMessage(content)}
            </div>
            <div class="message-time">${this.formatTime(new Date())}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(content) {
        return content.split('\n').map(line => 
            line.trim() ? `<p>${this.escapeHtml(line)}</p>` : ''
        ).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new GigaChatAI();
}); 