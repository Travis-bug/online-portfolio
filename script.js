const contactPanel = document.getElementById("contact-panel");
const overlay = document.querySelector(".contact-overlay");
const contactTriggers = document.querySelectorAll("[data-contact-open]");
const closeTriggers = document.querySelectorAll("[data-contact-close]");
const contactTab = document.querySelector(".contact-tab");
const form = document.getElementById("contact-form");
const previewBox = document.getElementById("preview-box");
const messageCount = document.getElementById("message-count");
const formStatus = document.getElementById("form-status");
const copyEmailButton = document.getElementById("copy-email");
const navLinks = document.querySelectorAll("[data-nav-link]");
const sections = document.querySelectorAll("[data-section]");
const revealTargets = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-project-card]");

function setContactState(isOpen) {
    contactPanel.classList.toggle("is-open", isOpen);
    contactPanel.setAttribute("aria-hidden", String(!isOpen));
    contactPanel.inert = !isOpen;
    overlay.hidden = !isOpen;

    if (contactTab) {
        contactTab.setAttribute("aria-expanded", String(isOpen));
    }

    document.body.style.overflow = isOpen ? "hidden" : "";
}

function openContactPanel() {
    setContactState(true);
}

function closeContactPanel() {
    setContactState(false);
}

contactTriggers.forEach((trigger) => {
    trigger.addEventListener("click", openContactPanel);
});

closeTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeContactPanel);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeContactPanel();
    }
});

function buildPreview(formData) {
    const visitorName = formData.get("visitorName")?.trim() || "[Your name]";
    const visitorEmail = formData.get("visitorEmail")?.trim() || "[Your email]";
    const visitorContact = formData.get("visitorContact")?.trim() || "Not provided";
    const visitorOrganization = formData.get("visitorOrganization")?.trim() || "Not provided";
    const visitorMessage = formData.get("visitorMessage")?.trim() || "[Your short message]";

    return [
        "Portfolio inquiry",
        "",
        `Message: ${visitorMessage}`,
        "",
        "Contact details",
        `Name: ${visitorName}`,
        `Email: ${visitorEmail}`,
        `Phone / Preferred contact: ${visitorContact}`,
        `Organization: ${visitorOrganization}`,
    ].join("\n");
}

function refreshContactPreview() {
    if (!form) {
        return;
    }

    const formData = new FormData(form);
    const message = formData.get("visitorMessage")?.toString() || "";

    previewBox.textContent = buildPreview(formData);
    messageCount.textContent = `${message.length} / 600 characters`;
}

if (form) {
    refreshContactPreview();

    form.addEventListener("input", () => {
        refreshContactPreview();
        formStatus.textContent = "";
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const visitorName = formData.get("visitorName")?.toString().trim();
        const visitorEmail = formData.get("visitorEmail")?.toString().trim();
        const visitorMessage = formData.get("visitorMessage")?.toString().trim();

        if (!visitorName || !visitorEmail || !visitorMessage) {
            formStatus.textContent = "Please complete the required fields before opening the email draft.";
            return;
        }

        const params = new URLSearchParams({
            subject: `Portfolio contact from ${visitorName}`,
            body: buildPreview(formData),
        });

        window.location.href = `mailto:traviseweka39@gmail.com?${params.toString()}`;
        formStatus.textContent = "Opening your email app now.";
    });
}

if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText("traviseweka39@gmail.com");
            formStatus.textContent = "Email address copied.";
        } catch (error) {
            formStatus.textContent = "Copy failed. Use traviseweka39@gmail.com.";
        }
    });
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
        }
    });
}, { threshold: 0.18 });

revealTargets.forEach((target) => revealObserver.observe(target));

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }

        const sectionId = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${sectionId}`;
            link.classList.toggle("is-active", isActive);
        });
    });
}, { threshold: 0.45 });

sections.forEach((section) => navObserver.observe(section));

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.getAttribute("data-filter");

        filterButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");

        projectCards.forEach((card) => {
            const categories = card.getAttribute("data-category") || "";
            const showCard = filter === "all" || categories.includes(filter);
            card.classList.toggle("is-hidden", !showCard);
        });
    });
});
