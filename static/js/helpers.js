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

// Sends a save/unsave request to the server for a given item
async function saveData(itemId, saved) {
    try {
        const res = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id: itemId, saved: saved })
        });
        if (!res.ok) {
            throw new Error(`save failed with status ${res.status}`);
        }
    } catch (err) {
        console.error("Failed to save:", err);
        alert("something went wrong saving the data");
    }
}

// Build the HTML for a single item: type label, the file itself, thoughts, date, and save button.
// We use createElement for everything instead of innerHTML so that we never
// accidentally destroy DOM nodes we've already attached (innerHTML re-parses
// the entire content, which would wipe out our file element).
async function renderItem(id, item) {
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

    // Save button — text and style reflect current saved state, and clicks toggle it
    const saveBtn = document.createElement("button");
    saveBtn.className = item.saved ? "unsave-btn" : "save-btn";
    saveBtn.textContent = item.saved ? "unsave" : "save";
    saveBtn.addEventListener("click", async () => {
        await saveData(id, item.saved);
        item.saved = !item.saved;
        saveBtn.className = item.saved ? "unsave-btn" : "save-btn";
        saveBtn.textContent = item.saved ? "unsave" : "save";
    });
    div.appendChild(saveBtn);

    return div;
}
