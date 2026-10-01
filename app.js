/* =========================================================
PERSONAL RPG
Core Application
========================================================= */

/* =========================================================
STORAGE
========================================================= */

const STORAGE_KEYS = {
player: "personalRPG_player",
skills: "personalRPG_skills",
quests: "personalRPG_quests",
focus: "personalRPG_focus",
coach: "personalRPG_coach"
};

function saveData(key, data) {
localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, fallback = null) {
const data = localStorage.getItem(key);

if (data === null) {
    return fallback;
}

try {
    return JSON.parse(data);
} catch {
    return fallback;
}

}

/* =========================================================
TEMPORARY DEVELOPMENT RESET
========================================================= */

function resetAppData() {

    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

/*
Temporary development behavior:
every app start resets all RPG data.
*/

resetAppData();

/* =========================================================
PLAYER
========================================================= */

const player = {
level: 1,
xp: 0,
xpToNextLevel: 100,
totalXP: 0
};

function loadPlayer() {
const saved = loadData(STORAGE_KEYS.player);

if (!saved) {
    return;
}

player.level = saved.level ?? 1;
player.xp = saved.xp ?? 0;
player.xpToNextLevel = saved.xpToNextLevel ?? 100;
player.totalXP = saved.totalXP ?? 0;

}

function savePlayer() {
saveData(STORAGE_KEYS.player, player);
}

function addPlayerXP(amount) {

if (!Number.isFinite(amount) || amount <= 0) {
    return;
}

player.xp += amount;
player.totalXP += amount;

while (player.xp >= player.xpToNextLevel) {

    player.xp -= player.xpToNextLevel;
    player.level += 1;

    player.xpToNextLevel =
        Math.floor(player.xpToNextLevel * 1.25);

    showNotification(
        `Level Up! You are now Level ${player.level}.`
    );
}

savePlayer();
updatePlayerUI();

}

/* =========================================================
SKILLS
========================================================= */

const defaultSkills = {
focus: {
name: "Focus",
xp: 0,
level: 1,
default: true
},

knowledge: {
    name: "Knowledge",
    xp: 0,
    level: 1,
    default: true
},

discipline: {
    name: "Discipline",
    xp: 0,
    level: 1,
    default: true
},

problemSolving: {
    name: "Problem Solving",
    xp: 0,
    level: 1,
    default: true
}

};

let skills = {};

function loadSkills() {

const saved =
    loadData(STORAGE_KEYS.skills);

if (saved) {
    skills = saved;
    return;
}

skills = structuredClone(defaultSkills);

saveSkills();

}

function ensureMinimumQuests(newSkillName = null) {

    const minimumQuests =
        Object.keys(skills).length;

    if (
        newSkillName &&
        quests.length < minimumQuests
    ) {

        const skillEntry =
    Object.entries(skills).find(
        ([id, skill]) =>
            skill.name === newSkillName
    );

if (!skillEntry) {
    return;
}

const skillId =
    skillEntry[0];

        quests.push({
            id: `skill-quest-${skillId}`,
            title: `Improve Your ${newSkillName} Skill`,
            description:
                `Spend focused time practicing and improving your ${newSkillName} skill.`,
            rewards: {
                [skillId]: 30
            },
            playerXP: 30,
            completed: false
        });

        saveQuests();
        return;
    }

    saveQuests();
}

function saveSkills() {
saveData(STORAGE_KEYS.skills, skills);
}

function getSkillXPRequired(skillLevel) {
return 100 + ((skillLevel - 1) * 50);
}

function addSkillXP(skillId, amount) {

const skill = skills[skillId];

if (!skill) {
    return;
}

if (!Number.isFinite(amount) || amount <= 0) {
    return;
}

skill.xp += amount;

while (
    skill.xp >=
    getSkillXPRequired(skill.level)
) {

    skill.xp -=
        getSkillXPRequired(skill.level);

    skill.level += 1;

    showNotification(
        `${skill.name} reached Level ${skill.level}.`
    );
}

saveSkills();

renderSkills();
updateDashboard();

}

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createSkill(name) {

const cleanName = name.trim();

if (!cleanName) {
    return false;
}

const id = createSkillId(cleanName);

if (skills[id]) {
    showNotification("That skill already exists.");
    return false;
}

skills[id] = {
    name: cleanName,
    xp: 0,
    level: 1,
    default: false
};

saveSkills();

ensureMinimumQuests(cleanName);

renderSkills();
renderQuests();
renderHomeQuests();
updateDashboard();

return true;

}

function createSkillId(name) {

    let id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!id) {
        id = "skill";
    }

    let finalId = id;
    let number = 2;

    while (skills[finalId]) {
        finalId = `${id}-${number}`;
        number++;
    }

    return finalId;
}

let skillToDelete = null;

function openDeleteSkill(skillId) {

if (!skills[skillId]) {
    return;
}

if (skills[skillId].default) {
    showNotification(
        "Default skills cannot be deleted."
    );
    return;
}

skillToDelete = skillId;

document
    .getElementById("delete-dialog")
    .classList.remove("hidden");

}

function closeDeleteSkillDialog() {

skillToDelete = null;

document
    .getElementById("delete-dialog")
    .classList.add("hidden");

}

function deleteSkill() {

if (!skillToDelete) {
    return;
}

if (!skills[skillToDelete]) {
    closeDeleteSkillDialog();
    return;
}

delete skills[skillToDelete];

saveSkills();

closeDeleteSkillDialog();

renderSkills();
updateDashboard();

showNotification("Skill deleted.");

}

/* =========================================================
QUESTS
========================================================= */

const coachQuestTemplates = {

    focus: [
        {
            title: "Focused Work Session",
            description:
                "Complete a distraction-free work session on one important task.",
            playerXP: 30
        },
        {
            title: "Distraction-Free Challenge",
            description:
                "Put away distractions and focus completely on one task.",
            playerXP: 40
        }
    ],

    knowledge: [
        {
            title: "Learn Something New",
            description:
                "Spend time learning a new concept or useful skill.",
            playerXP: 30
        },
        {
            title: "Knowledge Challenge",
            description:
                "Learn something new and explain what you learned in your own words.",
            playerXP: 40
        }
    ],

    discipline: [
        {
            title: "Complete Your Planned Task",
            description:
                "Choose one task you planned to do and finish it without skipping.",
            playerXP: 30
        },
        {
            title: "Discipline Challenge",
            description:
                "Complete an important task even if you don't feel motivated.",
            playerXP: 40
        }
    ],

    problemSolving: [
        {
            title: "Solve a Challenging Problem",
            description:
                "Choose a problem that requires careful thinking and work through it.",
            playerXP: 40
        },
        {
            title: "Problem Solving Challenge",
            description:
                "Break a difficult problem into smaller steps and find a solution.",
            playerXP: 50
        }
    ]

};

const defaultQuestTemplates = [

{
    id: "study",
    title: "Study for 30 Minutes",
    description:
        "Spend 30 focused minutes learning something useful.",
    rewards: {
        knowledge: 30
    },
    playerXP: 30
},

{
    id: "difficult-problem",
    title: "Solve a Difficult Problem",
    description:
        "Take on a problem that requires real effort to solve.",
    rewards: {
        problemSolving: 50
    },
    playerXP: 50
},

{
    id: "build-ai",
    title: "Build Something with AI",
    description:
        "Create or improve something using AI as a tool.",
    rewards: {
        discipline: 50,
    },
    playerXP: 100
},

{
    id: "skill-test",
    title: "Problem Solving Skill Test",
    description:
        "Challenge yourself with a difficult problem or puzzle.",
    rewards: {
        focus: 20
    },
    playerXP: 20
}

];

let quests = [];

function loadQuests() {

    const saved =
        loadData(STORAGE_KEYS.quests);

    if (
        saved &&
        Array.isArray(saved) &&
        saved.length > 0
    ) {
        quests = saved;
    } else {

        quests =
            defaultQuestTemplates.map(template => ({
                ...template,
                completed: false
            }));

    }

    const minimumQuests =
        Object.keys(skills).length;

    while (
        quests.length < minimumQuests
    ) {

        const template =
            defaultQuestTemplates[
                quests.length %
                defaultQuestTemplates.length
            ];

        quests.push({
            ...template,
            id: `${template.id}-${quests.length + 1}`,
            completed: false
        });
    }

    saveQuests();

}

function saveQuests() {
saveData(STORAGE_KEYS.quests, quests);
}

function completeQuest(questId) {

const quest =
    quests.find(item => item.id === questId);

if (!quest || quest.completed) {
    return;
}

quest.completed = true;

addPlayerXP(quest.playerXP);

Object.entries(quest.rewards).forEach(
    ([skillId, amount]) => {

        if (skills[skillId]) {
            addSkillXP(skillId, amount);
        }
    }
);

saveQuests();

renderQuests();
updateDashboard();

showNotification("Quest completed!");

}

function getQuestRewardText(quest) {

const rewards = [];

if (quest.playerXP > 0) {
    rewards.push(`+${quest.playerXP} XP`);
}

Object.entries(quest.rewards).forEach(
    ([skillId, amount]) => {

        if (!skills[skillId]) {
            return;
        }

        rewards.push(
            `+${amount} ${skills[skillId].name}`
        );
    }
);

return rewards;

}

/* =========================================================
FOCUS
========================================================= */

const focusState = {
duration: 25 * 60,
remaining: 25 * 60,
running: false,
interval: null,
totalMinutes: 0
};

function loadFocus() {

const saved =
    loadData(STORAGE_KEYS.focus);

if (!saved) {
    return;
}

focusState.totalMinutes =
    saved.totalMinutes ?? 0;

}

function saveFocus() {

saveData(
    STORAGE_KEYS.focus,
    {
        totalMinutes:
            focusState.totalMinutes
    }
);

}

function startFocus() {

if (focusState.running) {
    return;
}

focusState.running = true;

updateFocusButtons();

focusState.interval =
    setInterval(() => {

        if (focusState.remaining <= 0) {

            finishFocusSession();

            return;
        }

        focusState.remaining--;

        updateFocusTimer();

    }, 1000);

}

function stopFocus() {

if (!focusState.running) {
    return;
}

clearInterval(focusState.interval);

focusState.interval = null;
focusState.running = false;

const elapsedSeconds =
    focusState.duration -
    focusState.remaining;

const earnedMinutes =
    Math.floor(elapsedSeconds / 60);

if (earnedMinutes > 0) {

    focusState.totalMinutes +=
        earnedMinutes;

    addSkillXP(
        "focus",
        earnedMinutes
    );

    saveFocus();
}

focusState.remaining =
    focusState.duration;

updateFocusTimer();
updateFocusButtons();
updateDashboard();

}

function finishFocusSession() {

clearInterval(focusState.interval);

focusState.interval = null;
focusState.running = false;

focusState.totalMinutes += 25;

addSkillXP("focus", 25);
addPlayerXP(25);

saveFocus();

focusState.remaining =
    focusState.duration;

updateFocusTimer();
updateFocusButtons();
updateDashboard();

showNotification(
    "Focus session complete!"
);

}

function updateFocusTimer() {

const minutes =
    Math.floor(
        focusState.remaining / 60
    );

const seconds =
    focusState.remaining % 60;

const formatted =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

const timer =
    document.getElementById("focus-timer");

if (timer) {
    timer.textContent = formatted;
}

}

function updateFocusButtons() {

const startButton =
    document.getElementById("start-focus");

const stopButton =
    document.getElementById("stop-focus");

if (!startButton || !stopButton) {
    return;
}

startButton.disabled =
    focusState.running;

stopButton.disabled =
    !focusState.running;

}

function renderFocusStats() {

const element =
    document.getElementById("focus-total");

if (element) {
    element.textContent =
        focusState.totalMinutes;
}

}

/* =========================================================
NAVIGATION
========================================================= */

function showTab(tabId) {

    document
        .querySelectorAll(".tab")
        .forEach(tab => {
            tab.classList.remove("active");
        });

    const target =
        document.getElementById(tabId);

    if (target) {
        target.classList.add("active");
    }

    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.tab === tabId
            );

        });
}


function setupNavigation() {

document
    .querySelectorAll(".nav-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {
                showTab(button.dataset.tab);
            }
        );

    });


document
    .querySelectorAll("[data-tab-target]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {
                showTab(
                    button.dataset.tabTarget
                );
            }
        );

    });

}

/* =========================================================
PLAYER UI
========================================================= */

function updatePlayerUI() {

const levelElements = [
    document.getElementById("player-level"),
    document.getElementById("home-level")
];

levelElements.forEach(element => {

    if (element) {
        element.textContent =
            player.level;
    }

});


const xpElement =
    document.getElementById("player-xp");

if (xpElement) {
    xpElement.textContent =
        player.xp;
}


const requiredElement =
    document.getElementById("xp-required");

if (requiredElement) {
    requiredElement.textContent =
        player.xpToNextLevel;
}


const totalElement =
    document.getElementById("total-xp");

if (totalElement) {
    totalElement.textContent =
        player.totalXP;
}


const percentage =
    Math.min(
        100,
        (player.xp /
            player.xpToNextLevel) * 100
    );


const bar =
    document.getElementById(
        "player-xp-bar"
    );

if (bar) {
    bar.style.width =
        `${percentage}%`;
}

}

/* =========================================================
SKILL UI
========================================================= */

function renderSkills() {

const container =
    document.getElementById("skills-list");

if (!container) {
    return;
}

container.innerHTML = "";

const skillEntries =
    Object.entries(skills);


if (skillEntries.length === 0) {

    container.innerHTML = `
        <div class="empty-state">
            No skills yet.
        </div>
    `;

    return;
}


skillEntries.forEach(([id, skill]) => {

    const required =
        getSkillXPRequired(
            skill.level
        );

    const percentage =
        Math.min(
            100,
            (skill.xp / required) * 100
        );


    const card =
        document.createElement(
            "article"
        );

    card.className =
        "skill-card";

    card.innerHTML = `
        <div class="skill-card-header">

            <div>
                <div class="skill-name">
                    ${escapeHTML(skill.name)}
                </div>
            </div>

            <div class="skill-level">
                LVL ${skill.level}
            </div>

        </div>

        <div class="skill-progress">

            <div
                class="skill-progress-fill"
                style="width: ${percentage}%"
            ></div>

        </div>

        <div class="skill-footer">

            <span class="skill-xp-text">
                ${skill.xp} / ${required} XP
            </span>

            ${
                skill.default
                    ? ""
                    : `
                        <button
                            class="delete-skill"
                            data-delete-skill="${id}"
                            type="button"
                        >
                            Delete
                        </button>
                    `
            }

        </div>
    `;

    container.appendChild(card);
});


container
    .querySelectorAll(
        "[data-delete-skill]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openDeleteSkill(
                    button.dataset.deleteSkill
                );

            }
        );

    });

}

/* =========================================================
HOME SKILLS
========================================================= */

function renderHomeSkills() {

const container =
    document.getElementById(
        "home-skills"
    );

if (!container) {
    return;
}

container.innerHTML = "";


Object.entries(skills)
    .forEach(([id, skill]) => {

        const required =
            getSkillXPRequired(
                skill.level
            );

        const percentage =
            Math.min(
                100,
                (skill.xp / required) * 100
            );


        const card =
            document.createElement(
                "article"
            );

        card.className =
            "skill-card";

        card.innerHTML = `
            <div class="skill-card-header">

                <span class="skill-name">
                    ${escapeHTML(skill.name)}
                </span>

                <span class="skill-level">
                    LVL ${skill.level}
                </span>

            </div>

            <div class="skill-progress">

                <div
                    class="skill-progress-fill"
                    style="width: ${percentage}%"
                ></div>

            </div>

            <div class="skill-footer">

                <span class="skill-xp-text">
                    ${skill.xp} / ${required} XP
                </span>

            </div>
        `;

        container.appendChild(card);
    });

}

/* =========================================================
QUEST UI
========================================================= */

function renderQuests() {

const container =
    document.getElementById(
        "quests-list"
    );

if (!container) {
    return;
}

container.innerHTML = "";


quests.forEach(quest => {

    const card =
        createQuestCard(quest);

    container.appendChild(card);
});

}

function createQuestCard(quest) {

const card =
    document.createElement(
        "article"
    );

card.className =
    `quest-card ${
        quest.completed
            ? "completed"
            : ""
    }`;


const rewardTags =
    getQuestRewardText(quest)
        .map(reward => `
            <span class="reward-tag">
                ${escapeHTML(reward)}
            </span>
        `)
        .join("");


card.innerHTML = `
    <div class="quest-header">

        <div>

            <div class="quest-title">
                ${escapeHTML(quest.title)}
            </div>

            <div class="quest-description">
                ${escapeHTML(quest.description)}
            </div>

        </div>

    </div>

    <div class="quest-rewards">
        ${rewardTags}
    </div>

    <div class="quest-action">

        ${
            quest.completed
                ? `
                    <div class="quest-completed">
                        ✓ Completed
                    </div>
                `
                : `
                    <button
                        class="primary-button complete-quest"
                        data-quest-id="${quest.id}"
                        type="button"
                    >
                        Complete Quest
                    </button>
                `
        }

    </div>
`;


const button =
    card.querySelector(
        ".complete-quest"
    );

if (button) {

    button.addEventListener(
        "click",
        () => {

            completeQuest(
                button.dataset.questId
            );

        }
    );

}


return card;

}

/* =========================================================
HOME QUESTS
========================================================= */

function renderHomeQuests() {

const container =
    document.getElementById(
        "home-quests"
    );

if (!container) {
    return;
}

container.innerHTML = "";


quests
    .forEach(quest => {

        container.appendChild(
            createQuestCard(quest)
        );

    });

}

/* =========================================================
DASHBOARD
========================================================= */

function updateDashboard() {

updatePlayerUI();

renderHomeSkills();
renderHomeQuests();

renderFocusStats();


const completed =
    quests.filter(
        quest => quest.completed
    ).length;


const completedElement =
    document.getElementById(
        "completed-quests"
    );

if (completedElement) {
    completedElement.textContent =
        completed;
}

  const dashboardQuestCount =
    document.getElementById(
        "dashboard-quest-count"
    );

if (dashboardQuestCount) {
    dashboardQuestCount.textContent =
        quests.length;
}

const skillCount =
    document.getElementById(
        "skill-count"
    );

if (skillCount) {
    skillCount.textContent =
        Object.keys(skills).length;
}

  const dashboardSkillCount =
    document.getElementById(
        "dashboard-skill-count"
    );

if (dashboardSkillCount) {
    dashboardSkillCount.textContent =
        Object.keys(skills).length;
}

const focusMinutes =
    document.getElementById(
        "focus-minutes"
    );

if (focusMinutes) {
    focusMinutes.textContent =
        focusState.totalMinutes;
}

}

/* =========================================================
NOTIFICATIONS
========================================================= */

function showNotification(message) {

let notification =
    document.getElementById(
        "app-notification"
    );


if (!notification) {

    notification =
        document.createElement("div");

    notification.id =
        "app-notification";

    notification.style.position =
        "fixed";

    notification.style.left =
        "50%";

    notification.style.bottom =
        "92px";

    notification.style.transform =
        "translateX(-50%) translateY(10px)";

    notification.style.zIndex =
        "1000";

    notification.style.padding =
        "11px 15px";

    notification.style.border =
        "1px solid rgba(139,124,255,0.25)";

    notification.style.borderRadius =
        "11px";

    notification.style.background =
        "#171b24";

  notification.style.color = "#ffffff";
notification.style.transition =
    "opacity 0.2s ease, transform 0.2s ease";
notification.style.pointerEvents = "none";

    notification.textContent = message;

document.body.appendChild(notification);
}

notification.textContent = message;

notification.style.opacity = "1";
notification.style.transform =
    "translateX(-50%) translateY(0)";

clearTimeout(notification._timeout);

notification._timeout = setTimeout(() => {

    notification.style.opacity = "0";
    notification.style.transform =
        "translateX(-50%) translateY(10px)";

}, 2500);
}

/* =========================================================
APP INITIALIZATION
========================================================= */

function initApp() {

    const loginScreen =
    document.getElementById("login-screen");

const loggedIn =
    localStorage.getItem(
        "personalRPG_loggedIn"
    );

if (
    loginScreen &&
    loggedIn === "true"
) {
    loginScreen.style.display = "none";
}

    loadPlayer();
    loadSkills();
    loadQuests();
    loadFocus();

    setupNavigation();

    const addSkillButton =
        document.getElementById("add-skill-button");

    const skillNameInput =
        document.getElementById("skill-name-input");

    if (addSkillButton && skillNameInput) {

        addSkillButton.addEventListener(
    "click",
    () => {

        const name =
            skillNameInput.value.trim();

        if (!name) {

            showNotification(
                "Enter a skill name first."
            );

            skillNameInput.focus();

            return;
        }

        if (createSkill(name)) {

            skillNameInput.value = "";

            showNotification(
                `${name} skill created!`
            );
        }
    }
);

        skillNameInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addSkillButton.click();
                }
            }
        );

      const startCoachAssessmentButton =
    document.getElementById(
        "start-coach-assessment"
    );

if (startCoachAssessmentButton) {

    startCoachAssessmentButton.addEventListener(
        "click",
        startCoachAssessment
    );

}
    }

    updateFocusTimer();
    updateFocusButtons();

    renderSkills();
    renderQuests();
    updateDashboard();
    updateCoachAlert();
    renderCoachResults();
  
    const assessmentCompleted =
    localStorage.getItem(
        "personalRPG_coachAssessmentCompleted"
    );

if (assessmentCompleted !== "true") {

    setTimeout(() => {
        startCoachAssessment();
    }, 0);

}

}


initApp();


    /* =========================
       DELETE SKILL DIALOG
       ========================= */

    const cancelDeleteButton =
        document.getElementById("cancel-delete");

    const confirmDeleteButton =
        document.getElementById("confirm-delete");

    if (cancelDeleteButton) {

        cancelDeleteButton.addEventListener(
            "click",
            closeDeleteSkillDialog
        );

    }

    if (confirmDeleteButton) {

        confirmDeleteButton.addEventListener(
            "click",
            deleteSkill
        );

    }


    /* =========================
       FOCUS TIMER
       ========================= */

    const startFocusButton =
        document.getElementById("start-focus");

    const stopFocusButton =
        document.getElementById("stop-focus");

    if (startFocusButton) {

        startFocusButton.addEventListener(
            "click",
            startFocus
        );

    }

    if (stopFocusButton) {

        stopFocusButton.addEventListener(
            "click",
            stopFocus
        );

    }


    /* =========================
       INITIAL UI
       ========================= */

    updateFocusTimer();

    updateFocusButtons();

    renderSkills();

    renderQuests();

    updateDashboard();

/* ============================
    Coach Assessment Questions 
   ============================ */

const coachAssessmentQuestions = [

    {
        skill: "focus",
        question:
            "How well can you concentrate on one task?",
        answers: [
            {
                text: "I struggle to focus even for a few minutes.",
                score: 1
            },
            {
                text: "I can focus for about 10–20 minutes.",
                score: 2
            },
            {
                text: "I can focus for about 20–40 minutes.",
                score: 3
            },
            {
                text: "I can focus for about 40–60 minutes.",
                score: 4
            },
            {
                text: "I can focus for more than an hour.",
                score: 5
            }
        ]
    },

    {
        skill: "knowledge",
        question:
            "How often do you learn something new or develop your knowledge?",
        answers: [
            {
                text: "Almost never.",
                score: 1
            },
            {
                text: "Occasionally.",
                score: 2
            },
            {
                text: "A few times a week.",
                score: 3
            },
            {
                text: "Most days.",
                score: 4
            },
            {
                text: "Every day.",
                score: 5
            }
        ]
    },

    {
        skill: "discipline",
        question:
            "How well do you follow through on things you decide to do?",
        answers: [
            {
                text: "I rarely follow through.",
                score: 1
            },
            {
                text: "I often stop before finishing.",
                score: 2
            },
            {
                text: "I finish some of what I start.",
                score: 3
            },
            {
                text: "I usually follow through.",
                score: 4
            },
            {
                text: "I consistently do what I planned.",
                score: 5
            }
        ]
    },

    {
        skill: "problemSolving",
        question:
            "What do you do when you face a difficult problem?",
        answers: [
            {
                text: "I usually give up.",
                score: 1
            },
            {
                text: "I try briefly, then stop.",
                score: 2
            },
            {
                text: "I try and ask for help when needed.",
                score: 3
            },
            {
                text: "I keep trying different approaches.",
                score: 4
            },
            {
                text: "I break the problem down and systematically work toward a solution.",
                score: 5
            }
        ]
    },

    {
        skill: "overall",
        question:
            "How consistently do you work on improving yourself?",
        answers: [
            {
                text: "Almost never.",
                score: 1
            },
            {
                text: "Rarely.",
                score: 2
            },
            {
                text: "Sometimes.",
                score: 3
            },
            {
                text: "Regularly.",
                score: 4
            },
            {
                text: "Almost every day.",
                score: 5
            }
        ]
    }

];

var coachAssessmentAnswers = [];
var currentCoachQuestion = 0;

function startCoachAssessment() {

    coachAssessmentAnswers = [];
    currentCoachQuestion = 0;

    const overlay =
        document.getElementById(
            "coach-assessment-overlay"
        );

    if (overlay) {
        overlay.classList.add("active");
    }

    showCoachAssessmentQuestion();

}

function showCoachAssessmentQuestion() {

    const question =
        coachAssessmentQuestions[
            currentCoachQuestion
        ];

    if (!question) {
        finishCoachAssessment();
        return;
    }

    const coachSection =
    document.getElementById(
        "coach-assessment-content"
    );

    if (!coachSection) {
        return;
    }

    coachSection.innerHTML = `
        <div class="coach-assessment">

            <h2>Coach Assessment</h2>

            <p class="assessment-progress">
                Question ${currentCoachQuestion + 1}
                of ${coachAssessmentQuestions.length}
            </p>

            <h3>
                ${escapeHTML(question.question)}
            </h3>

            <div class="assessment-answers">

                ${question.answers.map((answer, index) => `
                    <button
                        class="assessment-answer"
                        type="button"
                        data-answer-index="${index}"
                    >
                        ${escapeHTML(answer.text)}
                    </button>
                `).join("")}

            </div>

        </div>
    `;

    const answerButtons =
        coachSection.querySelectorAll(
            ".assessment-answer"
        );

    answerButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    Number(
                        button.dataset.answerIndex
                    );

                coachAssessmentAnswers[
                    currentCoachQuestion
                ] =
                    question.answers[index].score;

                currentCoachQuestion++;

                showCoachAssessmentQuestion();

            }
        );

    });

}

function finishCoachAssessment() {

  localStorage.setItem(
    "personalRPG_coachAssessmentCompleted",
    "true"
);

updateCoachAlert();

    const results = {

        focus:
            coachAssessmentAnswers[0] || 1,

        knowledge:
            coachAssessmentAnswers[1] || 1,

        discipline:
            coachAssessmentAnswers[2] || 1,

        problemSolving:
            coachAssessmentAnswers[3] || 1,

        overall:
            coachAssessmentAnswers[4] || 1

    };

    const totalScore =
        coachAssessmentAnswers.reduce(
            (total, score) =>
                total + score,
            0
        );

    const averageScore =
        Math.round(
            totalScore /
            coachAssessmentAnswers.length
        );

    applyCoachAssessmentResults(results);

    generateCoachQuests(results);

  localStorage.setItem(
    "personalRPG_coachResults",
    JSON.stringify(results)
);

renderCoachResults();
renderQuests();
renderHomeQuests();
updateDashboard();

    const coachSection =
    document.getElementById(
        "coach-assessment-content"
    );

    if (!coachSection) {
        return;
    }

  const overlay =
    document.getElementById(
        "coach-assessment-overlay"
    );

if (overlay) {
    overlay.classList.remove("active");
}
    coachSection.innerHTML = `
        <div class="coach-assessment">

            <h2>Assessment Complete!</h2>

            <p>
                Your starting level has been calculated.
            </p>

            <div class="assessment-score">
                ${totalScore} / 25
            </div>

            <p>
                Starting Level: ${averageScore}
            </p>

        </div>
    `;

}

function generateCoachQuests(results) {

    quests = quests.filter(
        quest =>
            !defaultQuestTemplates.some(
                template =>
                    template.id === quest.id
            )
    );

    Object.entries(results).forEach(
        ([skillId, score]) => {

            if (
                skillId === "overall" ||
                !skills[skillId]
            ) {
                return;
            }

            const templates =
                coachQuestTemplates[skillId];

            if (
                !templates ||
                templates.length === 0
            ) {
                return;
            }

            const difficultyData = {

    1: {
        difficulty: "easy",
        skillXP: 20,
        playerXP: 20
    },

    2: {
        difficulty: "easy",
        skillXP: 30,
        playerXP: 30
    },

    3: {
        difficulty: "medium",
        skillXP: 40,
        playerXP: 40
    },

    4: {
        difficulty: "hard",
        skillXP: 50,
        playerXP: 50
    },

    5: {
        difficulty: "hard",
        skillXP: 60,
        playerXP: 60
    }

};

const levelData =
    difficultyData[score] ||
    difficultyData[1];

const template =
    templates[
        score >= 4 ? 1 : 0
    ];

            quests.push({
                id:
                    `coach-${skillId}-${Date.now()}`,
                title:
                    template.title,
                description:
                    template.description,
                difficulty:
    levelData.difficulty,

rewards: {
    [skillId]: levelData.skillXP
},

playerXP:
    levelData.playerXP,
            });

        }
    );

    saveQuests();

}

function applyCoachAssessmentResults(results) {

    const skillMap = {
        focus: "focus",
        knowledge: "knowledge",
        discipline: "discipline",
        problemSolving: "problemSolving"
    };

    Object.entries(skillMap).forEach(
        ([resultKey, skillId]) => {

            if (skills[skillId]) {

                skills[skillId].level =
                    results[resultKey];

                skills[skillId].xp = 0;

            }

        }
    );

    saveSkills();

    renderSkills();
    updateDashboard();
}

function updateCoachAlert() {

    const alert =
        document.getElementById("coach-alert");

    if (!alert) {
        return;
    }

    const assessmentCompleted =
        localStorage.getItem(
            "personalRPG_coachAssessmentCompleted"
        );

    if (assessmentCompleted === "true") {

        alert.style.display = "none";

    } else {

        alert.style.display = "inline-flex";

    }
}

function renderCoachResults() {

    const resultsContainer =
        document.getElementById("coach-results");

    const assessmentButton =
        document.getElementById(
            "start-coach-assessment"
        );

    if (!resultsContainer) {
        return;
    }

    const savedResults =
        localStorage.getItem(
            "personalRPG_coachResults"
        );

    if (!savedResults) {

        resultsContainer.innerHTML = "";

        if (assessmentButton) {
            assessmentButton.style.display =
                "block";
        }

        return;
    }

    const results =
        JSON.parse(savedResults);

  const totalScore =
    results.focus +
    results.knowledge +
    results.discipline +
    results.problemSolving +
    results.overall;

const startingLevel =
    Math.round(
        totalScore / 5
    );

    if (assessmentButton) {
        assessmentButton.style.display =
            "none";
    }

    resultsContainer.innerHTML = `
        <div class="coach-results-card">

            <h3>Your Coach Assessment</h3>

            <div class="coach-result-item">
                <span>Focus</span>
                <strong>${results.focus} / 5</strong>
            </div>

            <div class="coach-result-item">
                <span>Knowledge</span>
                <strong>${results.knowledge} / 5</strong>
            </div>

            <div class="coach-result-item">
                <span>Discipline</span>
                <strong>${results.discipline} / 5</strong>
            </div>

            <div class="coach-result-item">
                <span>Problem Solving</span>
                <strong>${results.problemSolving} / 5</strong>
            </div>

            <div class="coach-result-item">
                <span>Overall Growth</span>
                <strong>${results.overall} / 5</strong>
            </div>

        </div>
    `;
}

/* ===================
    Login Logic/Code
   ===================*/
const loginButton =
    document.getElementById("login-button");

const loginUsername =
    document.getElementById("login-username");

const loginPassword =
    document.getElementById("login-password");

const loginMessage =
    document.getElementById("login-message");

if (
    loginButton &&
    loginUsername &&
    loginPassword &&
    loginMessage
) {

    loginButton.addEventListener(
        "click",
        () => {

            const username =
                loginUsername.value.trim();

            const password =
                loginPassword.value;

            if (!username || !password) {

                loginMessage.textContent =
                    "Please enter your username and password.";

                return;
            }

            /*
             * Temporary development login.
             * We will replace this with the real
             * account system later.
             */

            const savedUsername =
                localStorage.getItem(
                    "personalRPG_username"
                );

            const savedPassword =
                localStorage.getItem(
                    "personalRPG_password"
                );

            if (!savedUsername) {

                localStorage.setItem(
                    "personalRPG_username",
                    username
                );

                localStorage.setItem(
                    "personalRPG_password",
                    password
                );

                localStorage.setItem(
                    "personalRPG_loggedIn",
                    "true"
                );

                loginMessage.textContent =
                    "Account created. Welcome to Personal RPG!";

                setTimeout(() => {

                    document
                        .getElementById("login-screen")
                        .style.display = "none";

                }, 700);

                return;
            }

            if (
                username === savedUsername &&
                password === savedPassword
            ) {

                localStorage.setItem(
                    "personalRPG_loggedIn",
                    "true"
                );

                loginMessage.textContent =
                    "Login successful!";

                setTimeout(() => {

                    document
                        .getElementById("login-screen")
                        .style.display = "none";

                }, 500);

            } else {

                loginMessage.textContent =
                    "Incorrect username or password.";

            }

        }
    );

}

const logoutButton =
    document.getElementById("logout-button");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "personalRPG_loggedIn"
            );

            const loginScreen =
                document.getElementById(
                    "login-screen"
                );

            window.location.reload();

        }
    );


}

/* Start the application */

initApp();
