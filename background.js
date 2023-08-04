chrome.action.onClicked.addListener(() => {
    chrome.action.setPopup({popup: 'popup.html'});
});

chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.sync.get(alarm.name, (result) => {
        let alarmData = result[alarm.name];
        if (!alarmData || alarmData.enabled) {
            let parts = alarm.name.split('|');
            let url = (parts[0] === 'time') ? parts[1] : parts[1];
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'http://' + url;
            }
            chrome.tabs.create({ url });
        }
    });
});

function scheduleWebsite(key, periodInMinutes, callback) {
    let url = key.split('|')[1];
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    chrome.alarms.create(key, { delayInMinutes: periodInMinutes, periodInMinutes });
    chrome.storage.sync.set({ [key]: { enabled: true } });
    if (callback) {
      callback();
    }
}

function cancelSchedule(key, callback) {
    chrome.storage.sync.remove(key, function() {
      chrome.alarms.clear(key, function() {
        if (callback) {
          callback();
        }
      });
    });
}

function scheduleWebsiteAtTime(key, time, callback) {
    let url = key.split('|')[1];
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    let now = new Date();
    let scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time.split(':')[0], time.split(':')[1]);
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    let delayInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    chrome.alarms.create(key, { delayInMinutes, periodInMinutes: 24 * 60 });
    chrome.storage.sync.set({ [key]: { enabled: true } });
    if (callback) {
      callback();
    }
}

function toggleAlarm(key, callback) {
    chrome.storage.sync.get(key, (result) => {
        let alarmData = result[key];
        if (alarmData) {
            alarmData.enabled = !alarmData.enabled;
            chrome.storage.sync.set({ [key]: alarmData }, callback);
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'schedule') {
      scheduleWebsite(request.key, request.periodInMinutes, sendResponse);
      return true;
    } else if (request.action === 'scheduleAtTime') {
      scheduleWebsiteAtTime(request.key, request.time, sendResponse);
      return true;
    } else if (request.action === 'cancel') {
        cancelSchedule(request.key, sendResponse);
        return true;
    } else if (request.action === 'enable-disable') {
        toggleAlarm(request.key, sendResponse);
        return true;
    }
});
