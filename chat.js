const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");
const deleteButton = document.querySelector("#delete-btn");

let userText = "Hello";
let API_KEY;
fetch("https://hostapi-ipwd.onrender.com/env")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    API_KEY = data.API_KEY;
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });
console.log(API_KEY); 
const loadDataFromLocalstorage = () => {
  const themeColor = localStorage.getItem("themeColor");
  document.body.classList.toggle("light-mode", themeColor === "light_mode");
  themeButton.innerText = document.body.classList.contains("light-mode")
    ? "dark_mode"
    : "light_mode";
  const defaultText = `<div class="default-text">
                            <h1>ChatGPT</h1>
                            <p>Start a conversation and explore the power of AI.<br> Your chat history will be displayed here.</p>
                        </div>`;
  chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight); 
};
const createChatElement = (content, className) => {
  const chatDiv = document.createElement("div");
  chatDiv.classList.add("chat", className);
  chatDiv.innerHTML = content;
  return chatDiv; 
};
const getGitHubInfo = async () => {
  const githubToken = "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";
  const headers = {
    "Authorization": `Bearer ${githubToken}`,
    "Content-Type": "application/json"
  };

  try {
    const reposResponse = await fetch("https://api.github.com/user/repos", {
      method: "GET",
      headers: headers
    });

    if (!reposResponse.ok) {
      throw new Error("Failed to fetch GitHub repositories.");
    }

    const reposData = await reposResponse.json();
    const repositories = reposData.map(repo => repo.full_name);

    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: headers
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub username.");
    }

    const userData = await userResponse.json();
    const username = userData.login;

    return { username, repositories };
  } catch (error) {
    console.error("Error fetching GitHub info:", error);
    return { username: "", repositories: [] };
  }
};

const getChatResponse = async (incomingChatDiv) => {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const pElement = document.createElement("p");

  userText = userText.toLowerCase();

  const GitHubInfo = await getGitHubInfo();
  const username = GitHubInfo.username;
  const repositories = GitHubInfo.repositories;

  if (userText.includes("hello")) {
    pElement.textContent = `Hello ${username}`;
  } else if (userText.includes("what are my repos")) {
    pElement.textContent = `Your repos are: ${repositories.join(", ")}`;
  } else {
    const messages = [{ role: "user", content: userText }];
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch response from the API.");
      }
      const data = await response.json();
      pElement.textContent = data.choices[0].message.content.trim();
    } catch (error) {
      pElement.classList.add("error");
      pElement.textContent = "Oops! Something went wrong. Please try again.";
      console.error("Error fetching response:", error);
    }
  }

  incomingChatDiv.querySelector(".typing-animation").remove();
  incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
  localStorage.setItem("all-chats", chatContainer.innerHTML);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};




const copyResponse = (copyBtn) => {
  const reponseTextElement = copyBtn.parentElement.querySelector("p");
  navigator.clipboard.writeText(reponseTextElement.textContent);
  copyBtn.textContent = "done";
  setTimeout(() => (copyBtn.textContent = "content_copy"), 1000);
};
const showTypingAnimation = () => {
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/chatbot.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                </div>`;
  const incomingChatDiv = createChatElement(html, "incoming");
  chatContainer.appendChild(incomingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  getChatResponse(incomingChatDiv);
};
const handleOutgoingChat = () => {
  userText = chatInput.value.trim(); 
  if (!userText) return; 

  chatInput.value = "";
  chatInput.style.height = `${initialInputHeight}px`;
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/user.png" alt="user-img">
                        <p>${userText}</p>
                    </div>
                </div>`;

  const outgoingChatDiv = createChatElement(html, "outgoing");
  chatContainer.querySelector(".default-text")?.remove();
  chatContainer.appendChild(outgoingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showTypingAnimation, 500);
};
deleteButton.addEventListener("click", () => {

  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("all-chats");
    loadDataFromLocalstorage();
  }
});
themeButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("themeColor", themeButton.innerText);
  themeButton.innerText = document.body.classList.contains("light-mode")
    ? "dark_mode"
    : "light_mode";
});
const initialInputHeight = chatInput.scrollHeight;
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${initialInputHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});
chatInput.addEventListener("keydown", (e) => {

  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleOutgoingChat();
  }
});
function logout(){
  localStorage.removeItem('all-chats');
  window.location.href='login.html';
}
loadDataFromLocalstorage();
sendButton.addEventListener("click", handleOutgoingChat);

