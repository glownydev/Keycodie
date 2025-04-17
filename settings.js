document.addEventListener('DOMContentLoaded', () => {
    const enablePopupCheckbox = document.getElementById('enablePopup');
    const saveSettingsButton = document.getElementById('saveSettings');

    // Load current settings
    chrome.storage.sync.get(['keycodiePopupEnabled'], (result) => {
        enablePopupCheckbox.checked = result.keycodiePopupEnabled !== false;
    });

    // Save settings
    saveSettingsButton.addEventListener('click', () => {
        const isPopupEnabled = enablePopupCheckbox.checked;
        
        chrome.storage.sync.set({
            keycodiePopupEnabled: isPopupEnabled
        }, () => {
            // Notify background script to update extension state
            chrome.runtime.sendMessage({
                action: 'updatePopupState',
                enabled: isPopupEnabled
            });

            // Show save confirmation
            saveSettingsButton.textContent = 'Saved!';
            setTimeout(() => {
                saveSettingsButton.textContent = 'Save Settings';
            }, 2000);
        });
    });
});
