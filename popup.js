chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let currentUrl = tabs[0].url;
    document.getElementById('frequencyUrl').value = currentUrl;
    document.getElementById('timeUrl').value = currentUrl;
});

document.getElementById('frequencyScheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let urlInput = document.getElementById('frequencyUrl');
    let frequencyInput = document.getElementById('frequency');
    let url = urlInput.value;
    let frequency = parseInt(frequencyInput.value);
    let key = 'frequency|' + url;

    if (!url || frequency < 1) {
        showMessage('Invalid input. Please make sure the URL is valid and the frequency is a positive number.', true);
        return;
    }
    
    chrome.runtime.sendMessage({action: 'schedule', key, periodInMinutes: frequency}, () => {
        showMessage(`Scheduled ${url} to open every ${frequency} minutes.`);
        urlInput.value = '';
        frequencyInput.value = '';
        displaySchedules();
    });
});

document.getElementById('timeScheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let urlInput = document.getElementById('timeUrl');
    let timeInput = document.getElementById('time');
    let url = urlInput.value;
    let time = timeInput.value;
    let key = 'time|' + url + '|' + time;

    if (!url) {
        showMessage('Invalid input. Please make sure the URL is valid.', true);
        return;
    }
    
    chrome.runtime.sendMessage({action: 'scheduleAtTime', key, time}, () => {
        showMessage(`Scheduled ${url} to open at ${time}.`);
        urlInput.value = '';
        timeInput.value = '';
        displaySchedules();
    });
});

document.getElementById('scheduleBody').addEventListener('click', (e) => {
    if (e.target.className === 'cancel') {
        let key = e.target.dataset.key;
        chrome.runtime.sendMessage({action: 'cancel', key}, () => {
            showMessage(`Canceled schedule for ${key}.`);
            displaySchedules();
        });
    }
    if (e.target.className === 'enable-disable') {
        let key = e.target.dataset.key;
        chrome.runtime.sendMessage({action: 'enable-disable', key}, displaySchedules);
    }
});

function displaySchedules() {
    chrome.alarms.getAll((alarms) => {
        let scheduleBody = document.getElementById('scheduleBody');
        scheduleBody.innerHTML = '';
        alarms.forEach((alarm) => {
            chrome.storage.sync.get(alarm.name, (result) => {
                let alarmData = result[alarm.name];
                let parts = alarm.name.split('|');
                let url = parts[1];
                let frequency = parts[0] === 'frequency' ? alarm.periodInMinutes : '';
                let time = parts[0] === 'time' ? parts[2] : '';
                let enabled = alarmData ? alarmData.enabled : false;

                let row = document.createElement('tr');
                let urlCell = document.createElement('td');
                urlCell.textContent = url;
                row.appendChild(urlCell);

                let frequencyCell = document.createElement('td');
                frequencyCell.textContent = frequency;
                row.appendChild(frequencyCell);

                let timeCell = document.createElement('td');
                timeCell.textContent = time;
                row.appendChild(timeCell);

                let enabledCell = document.createElement('td');
                let checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                checkbox.className = "enable-disable";
                checkbox.dataset.key = alarm.name;
                checkbox.checked = enabled;
                enabledCell.appendChild(checkbox);
                row.appendChild(enabledCell);

                let actionCell = document.createElement('td');
                let cancelBtn = document.createElement('button');
                cancelBtn.classList.add("cancel");
                cancelBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16"><path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z"/><path fill-rule="evenodd" d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5V4h-5v-.5zM14 5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h1.5A1.5 1.5 0 0 1 6 2h4a1.5 1.5 0 0 1 1.5 1.5H13a1 1 0 0 1 1 1v1z"/></svg>';
                cancelBtn.dataset.key = alarm.name;

            cancelBtn.addEventListener('click', function(event) {
                event.stopPropagation();
    
                let alarmKey = event.currentTarget.dataset.key;
                chrome.runtime.sendMessage({action: 'cancel', key: alarmKey}, () => {
                    displaySchedules();
                });
            });

                
                
                actionCell.appendChild(cancelBtn);
                row.appendChild(actionCell);

                scheduleBody.appendChild(row);
            });
        });
    });
}

function showMessage(message, isError = false) {
    let messageDiv = document.querySelector("#message");
    messageDiv.style.display = "block";
    messageDiv.textContent = message;
    if (isError) {
        messageDiv.classList.remove("message-success");
        messageDiv.classList.add("message-error");
    } else {
        messageDiv.classList.remove("message-error");
        messageDiv.classList.add("message-success");
    }
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 3000);
}

displaySchedules();
