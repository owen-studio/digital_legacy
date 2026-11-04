// File types we know are images — we'll display these as <img> tags.
// Anything else (like .txt) gets fetched and shown as text.
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

// Helper: grab the extension from a filename like "file_2.jpeg" → "jpeg"
function fileExtension(name) {
    return name.split(".").pop().toLowerCase();
}

// Given a file_name from the data, create the right HTML element to display it.
// Images become <img> tags; text files get fetched and put inside a <pre> block.
// Returns a Promise so we can wait for everything to be ready before adding it to the page.
async function renderFile(fileName) {
    const ext = fileExtension(fileName);

    // If it's an image, create an <img> pointing to our /assets/ route
    if (IMAGE_EXTENSIONS.includes(ext)) {
        const img = document.createElement("img");
        img.src = `/assets/${fileName}`;
        img.alt = fileName;
        return img;
    }

    // Otherwise treat it as a text file — fetch its contents from the server
    // and display them in a <pre> block (preserves whitespace / line breaks)
    const res = await fetch(`/assets/${fileName}`);
    if (!res.ok) {
        const span = document.createElement("span");
        span.textContent = `(could not load ${fileName})`;
        return span;
    }
    const text = await res.text();
    const pre = document.createElement("pre");
    pre.textContent = text;
    return pre;
}

// Build the HTML for a single item: type label, the file itself, thoughts, and date.
// We use createElement for everything instead of innerHTML so that we never
// accidentally destroy DOM nodes we've already attached (innerHTML re-parses
// the entire content, which would wipe out our file element).
async function renderItem(item) {
    const div = document.createElement("div");
    div.className = "item";

    // Type badge at the top (e.g. "note", "photo")
    const typeEl = document.createElement("div");
    typeEl.className = "item-type";
    typeEl.textContent = item.type;
    div.appendChild(typeEl);

    // Render the actual file (image or text) and add it to the item
    const fileWrap = document.createElement("div");
    fileWrap.className = "item-file";
    fileWrap.appendChild(await renderFile(item.file_name));
    div.appendChild(fileWrap);

    // Thoughts text below the file
    const thoughtsEl = document.createElement("div");
    thoughtsEl.className = "item-thoughts";
    thoughtsEl.textContent = item.thoughts;
    div.appendChild(thoughtsEl);

    // Date stamp at the bottom
    const dateEl = document.createElement("div");
    dateEl.className = "item-date";
    dateEl.textContent = item.created_at;
    div.appendChild(dateEl);

    return div;
}

// Main function: fetch today's data from the API, then render each item on the page
async function load() {
    try {
        const res = await fetch("/api/today");
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();

        // Set the page header to today's date from the JSON
        document.getElementById("header").textContent = data.date;

        // Loop through each item and append it to the page
        const container = document.getElementById("items");
        for (const item of data.items) {
            container.appendChild(await renderItem(item));
        }
    } catch (err) {
        console.error("Failed to load today's data:", err);
        document.getElementById("header").textContent = "something went wrong";
    }
}

// Calls the reset endpoint, then replaces the page with a confirmation message
async function resetData() {
    try {
        const res = await fetch("/api/reset", { method: "POST" });
        if (!res.ok) {
            throw new Error(`Reset failed with status ${res.status}`);
        }

        // Clear the page and show a confirmation
        document.getElementById("header").textContent = "";
        document.getElementById("items").innerHTML = "";
        document.getElementById("footer").innerHTML = "";

        const msg = document.createElement("p");
        msg.className = "reset-message";
        msg.textContent = "data has been reset. reload to begin again.";
        document.getElementById("items").appendChild(msg);
    } catch (err) {
        console.error("Failed to reset:", err);
        alert("something went wrong resetting the data");
    }
}

// Adds the reset button to the footer area at the bottom of the page
function addResetButton() {
    const footer = document.getElementById("footer");
    const btn = document.createElement("button");
    btn.className = "reset-btn";
    btn.textContent = "reset";
    btn.addEventListener("click", resetData);
    footer.appendChild(btn);
}

// Kick everything off
load().then(addResetButton);
