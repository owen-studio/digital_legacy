// Main function: fetch today's data from the API, then render each item on the page
async function load() {
    try {
        const res = await fetch("/api/today");
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        const data = await res.json();

        const resDayData = await fetch("/api/days");
        if (!resDayData.ok) {
            throw new Error(`API returned ${resDayData.status}`);
        }
        const dayData = await resDayData.json();

        // Set the page header to today's date from the JSON
        document.getElementById("header").textContent = data.date;


        document.getElementById("subheader").textContent = "day " + dayData.day + " of " + dayData.total;

        // Loop through each item and append it to the page
        const container = document.getElementById("items");
        for (const [id, item] of Object.entries(data.items)) {
            container.appendChild(await renderItem(id, item));
        }
        if (Object.keys(data.items).length === 0) {
            document.getElementById("items").textContent = "there are no files left. you've reached the end. i love you. goodbye my friend";
            document.getElementById("subheader").textContent = ""
        }

    } catch (err) {
        console.error("Failed to load today's data:", err);
        document.getElementById("header").textContent = "something went wrong";
    }
}


// FOOTER

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
        document.getElementById("subheader").textContent = "";

        const msg = document.createElement("p");
        msg.className = "reset-message";
        msg.textContent = "data has been reset. reload to begin again.";
        document.getElementById("items").appendChild(msg);
    } catch (err) {
        console.error("Failed to reset:", err);
        alert("something went wrong resetting the data");
    }
}

async function getNewDataForToday() {
    try {
        const res = await fetch("/api/get_new_data_for_today", { method: "POST" });
        if (!res.ok) {
            throw new Error(`getting new data failed with status ${res.status}`);
        }
        window.location.reload();
    } catch (err) {
        console.error("Failed to reset:", err);
        alert("something went wrong getting new data for today");
    }
}

// Adds the reset button to the footer area at the bottom of the page
function addFooterButtons() {
    const footer = document.getElementById("footer");
    const btn = document.createElement("button");
    btn.className = "footer-btn";
    btn.textContent = "reset";
    btn.addEventListener("click", resetData);
    footer.appendChild(btn);

    const newDataButton = document.createElement("button");
    newDataButton.className = "footer-btn";
    newDataButton.textContent = "show me new data please";
    newDataButton.addEventListener("click", getNewDataForToday);
    footer.appendChild(newDataButton);
}

// Kick everything off
load().then(addFooterButtons);
