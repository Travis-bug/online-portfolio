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
const sendButton = document.getElementById("send-message");

const CONTACT_EMAIL = "traviseweka39@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const visitorName = formData.get("visitorName")?.toString().trim();
        const visitorEmail = formData.get("visitorEmail")?.toString().trim();
        const visitorMessage = formData.get("visitorMessage")?.toString().trim();

        if (!visitorName || !visitorEmail || !visitorMessage) {
            formStatus.textContent = "Please complete the required fields before sending.";
            return;
        }

        // Bots fill every field, including the hidden one. Pretend it worked and stop.
        if (formData.get("_honey")) {
            formStatus.textContent = "Thanks! Your message was sent.";
            form.reset();
            return;
        }

        const subject = `Portfolio contact from ${visitorName}`;
        const body = buildPreview(formData);

        sendButton.disabled = true;
        sendButton.textContent = "Sending...";
        formStatus.textContent = "";

        try {
            // FormSubmit forwards the message to my inbox, so no email app is needed.
            const response = await fetch(FORM_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name: visitorName,
                    email: visitorEmail,
                    phone_or_contact: formData.get("visitorContact")?.toString().trim() || "Not provided",
                    organization: formData.get("visitorOrganization")?.toString().trim() || "Not provided",
                    message: visitorMessage,
                    _subject: subject,
                    _template: "table",
                }),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || String(result.success) !== "true") {
                throw new Error(result.message || `Request failed with status ${response.status}`);
            }

            form.reset();
            refreshContactPreview();
            formStatus.textContent = "Thanks! Your message was sent. I'll get back to you soon.";
        } catch (error) {
            console.error("Contact form error:", error);
            showMailtoFallback(subject, body);
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = "Send Message";
        }
    });
}

// Backup plan if the sending service is down: a mailto link that keeps normal spaces.
// encodeURIComponent turns a space into %20, which every email app understands.
// (URLSearchParams turned spaces into "+", which is why drafts looked like "hi+my+name+is...".)
function showMailtoFallback(subject, body) {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    formStatus.textContent = "";
    formStatus.append("The message couldn't be sent right now. ");

    const fallbackLink = document.createElement("a");
    fallbackLink.href = mailtoUrl;
    fallbackLink.textContent = "Open it in your email app instead";
    formStatus.append(fallbackLink, ".");
}

if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(CONTACT_EMAIL);
            formStatus.textContent = "Email address copied.";
        } catch (error) {
            formStatus.textContent = `Copy failed. Use ${CONTACT_EMAIL}.`;
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
