const CONTACT_EMAIL = "traviseweka39@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const messageCount = document.getElementById("message-count");
const sendButton = document.getElementById("send-message");
const copyEmailButton = document.getElementById("copy-email");

const field = (data, name) => (data.get(name) || "").toString().trim();

function buildBody(data) {
    return [
        "Portfolio inquiry",
        "",
        `Message: ${field(data, "visitorMessage")}`,
        "",
        `Name: ${field(data, "visitorName")}`,
        `Email: ${field(data, "visitorEmail")}`,
        `Phone / LinkedIn: ${field(data, "visitorContact") || "Not provided"}`,
        `Company: ${field(data, "visitorOrganization") || "Not provided"}`,
    ].join("\n");
}

// Backup if the sending service is down: a mailto link.
// encodeURIComponent keeps spaces as %20 so drafts don't show "+" signs.
function showMailtoFallback(subject, body) {
    const link = document.createElement("a");
    link.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.textContent = "open it in your email app instead";
    formStatus.textContent = "The message couldn't be sent right now. You can ";
    formStatus.append(link, ".");
}

if (form) {
    form.addEventListener("input", () => {
        const length = field(new FormData(form), "visitorMessage").length;
        messageCount.textContent = `${length} / 600 characters`;
        formStatus.textContent = "";
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = field(data, "visitorName");
        const email = field(data, "visitorEmail");
        const message = field(data, "visitorMessage");

        if (!name || !email || !message) {
            formStatus.textContent = "Add your name, email and a message, then send again.";
            return;
        }

        if (!form.querySelector('[name="visitorEmail"]').checkValidity()) {
            formStatus.textContent = "That email address doesn't look complete. Check it and send again.";
            return;
        }

        // Bots fill the hidden field. Pretend it worked and stop.
        if (field(data, "_honey")) {
            formStatus.textContent = "Message sent.";
            form.reset();
            return;
        }

        const subject = `Portfolio contact from ${name}`;
        const body = buildBody(data);

        sendButton.disabled = true;
        sendButton.textContent = "Sending…";
        formStatus.textContent = "";

        try {
            // FormSubmit forwards the message to my inbox, so no email app is needed.
            const response = await fetch(FORM_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    phone_or_contact: field(data, "visitorContact") || "Not provided",
                    organization: field(data, "visitorOrganization") || "Not provided",
                    message,
                    _subject: subject,
                    _template: "table",
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || String(result.success) !== "true") {
                throw new Error(result.message || `Request failed with status ${response.status}`);
            }

            form.reset();
            messageCount.textContent = "0 / 600 characters";
            formStatus.textContent = "Message sent. I'll reply to the email you gave.";
        } catch (error) {
            console.error("Contact form error:", error);
            showMailtoFallback(subject, body);
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = "Send message";
        }
    });
}

if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(CONTACT_EMAIL);
            copyEmailButton.textContent = "Email address copied";
        } catch {
            copyEmailButton.textContent = CONTACT_EMAIL;
        }
        setTimeout(() => { copyEmailButton.textContent = "Copy email address"; }, 2500);
    });
}

// Project filters
const filterButtons = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll(".project");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));

        projects.forEach((project) => {
            const tags = (project.dataset.tags || "").split(" ");
            const show = filter === "all" || tags.includes(filter);
            project.hidden = !show;
            project.classList.remove("is-entering");
            if (show) {
                void project.offsetWidth; // restart the small settle animation
                project.classList.add("is-entering");
            }
        });
    });
});

// Highlight the nav link for the section in view
const navLinks = document.querySelectorAll("[data-nav-link]");
const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
    });
}, { rootMargin: "-40% 0px -55% 0px" });

document.querySelectorAll("[data-section]").forEach((section) => navObserver.observe(section));

// Timeline points fill in once they've been scrolled past
const seenObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-seen");
            seenObserver.unobserve(entry.target);
        }
    });
}, { rootMargin: "0px 0px -35% 0px" });

document.querySelectorAll(".timeline li").forEach((item) => seenObserver.observe(item));
