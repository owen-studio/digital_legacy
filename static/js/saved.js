// Main function: fetch all saved data and render it on the page
async function load() {
    console.log("loading...")
    try {
        const res = await fetch("/api/get_saved");
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();

        // Loop through each item and append it to the page
        const container = document.getElementById("items");
        for (const [id, item] of Object.entries(data)) {
            container.appendChild(await renderItem(id, item));
        }
        if (Object.keys(data).length === 0) {
            document.getElementById("items").textContent = "nothing has been saved (yet)";
        }

    } catch (err) {
        console.error("Failed to load today's data:", err);
        document.getElementById("items").textContent = "something went wrong";
    }
}

load();