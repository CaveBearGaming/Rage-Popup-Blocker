const toggle = document.getElementById("toggle");
const count = document.getElementById("count");
const btn = document.getElementById("whitelist");

chrome.storage.local.get(["enabled", "blocked"], data => {
  toggle.checked = data.enabled;
  count.textContent = "Blocked: " + (data.blocked || 0);
});

toggle.onchange = () => {
  chrome.storage.local.set({ enabled: toggle.checked });
};

async function getHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new URL(tab.url).hostname;
}

btn.onclick = async () => {
  const host = await getHost();

  chrome.storage.local.get("whitelist", data => {
    let list = data.whitelist || [];

    if (list.includes(host)) {
      list = list.filter(x => x !== host);
    } else {
      list.push(host);
    }

    chrome.storage.local.set({ whitelist: list });
  });
};