const token = document.querySelector("#token");
const msg = document.querySelector("#msg");

chrome.storage.local.get("token").then((stored) => {
  token.value = stored.token || "";
});

document.querySelector("#form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await chrome.storage.local.set({ token: token.value.trim() });
  msg.textContent = "Saved";
});
