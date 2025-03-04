const { ipcRenderer } = require('electron');

// Detectar nuevos mensajes
window.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.querySelector('[data-testid="conversation-panel"]');

  if (chatContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const messageNode = mutation.addedNodes[0];
          const messageContent = messageNode.innerText; // Obtiene el texto del mensaje
          const senderName = messageNode.querySelector('.copyable-text').innerText;
          
          // Enviar el mensaje al proceso principal
          ipcRenderer.send('new-message', { senderName, messageContent });
        }
      });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
  }
});
