import json
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, request

# Create the Flask app and tell it where static files live (css, js, images, etc.)
app = Flask(__name__, static_folder="static")


# When someone visits the root URL ("/"), serve the main HTML page
@app.route("/")
def index():
    return send_from_directory("static", "index.html")


# Saved page — shows all saved items
@app.route("/saved")
def saved():
    return send_from_directory("static", "saved.html")

@app.route("/info")
def info():
    return send_from_directory("static", "info.html")

def create_todays_data():
    with open("data/my_data.json") as f:
        my_data = json.load(f)

    # Sort all item IDs numerically and take the next 5
    ids = sorted(my_data["data"].keys(), key=int)
    next_five_ids = ids[:5]

    # Build the items for today's file
    todays_items = {}
    for item_id in next_five_ids:
        item = my_data["data"][item_id]
        item["saved"] = 0
        todays_items[item_id] = item

    # Move those 5 items from data → archived_data
    for item_id in next_five_ids:
        # this adds to archived_data and removes from data in 1 line!
        my_data["archived_data"][item_id] = my_data["data"].pop(item_id)

    # Write the updated my_data.json (those 5 items are now archived)
    with open("data/my_data.json", "w") as f:
        json.dump(my_data, f, indent=4)

    # Create and write todays_data.json
    todays_data = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "items": todays_items
    }
    with open("data/todays_data.json", "w") as f:
        json.dump(todays_data, f, indent=4)
    return todays_data


# this function checks to see what the date in todays_data.json is and compares it to the current date
# if the date is the same, it returns the data
# if the date is different, it creates a new todays_data.json file
def get_todays_data():
    with open("data/todays_data.json") as f:
        data = json.load(f)

    # If the file is an empty dict {} (first visit ever), create fresh data
    if "date" not in data:
        data = create_todays_data()
        return jsonify(data)

    if data["date"] == datetime.now().strftime("%Y-%m-%d"):
        return jsonify(data)
    else:
        data = create_todays_data()
        return jsonify(data)


# API endpoint that the frontend calls to get today's data.
# It reads the JSON file from disk and returns it as a JSON response.
@app.route("/api/today")
def today():
    return get_todays_data()


# Serves files (photos, text files, etc.) from the static/assets folder.
# For example, a request to /assets/file_2.jpeg will return static/assets/file_2.jpeg.
@app.route("/assets/<path:filename>")
def asset_file(filename):
    return send_from_directory("static/assets", filename)


### SAVE DATA ENDPOINTS ###

@app.route("/api/get_saved", methods=["GET"])
def get_saved():
    with open("data/my_data.json") as f:
        my_data = json.load(f)
    
    print(my_data["saved_data"])
    return jsonify(my_data["saved_data"])

@app.route("/api/save", methods=["POST"])
def save():
    body = request.get_json()
    item_id = body["item_id"]
    saved = body["saved"]

    # saved is a boolean -- if true, it means this item is already saved and is being unsaved
    # if it is false, it means this item is being saved now

    with open("data/my_data.json") as f:
        my_data = json.load(f)

    if not saved:
        # move piece of data from archived to saved
        my_data["saved_data"][item_id] = my_data["archived_data"].pop(item_id)
        my_data["saved_data"][item_id]["saved"] = 1
    else:
        # move piece of data from saved to archived
        my_data["archived_data"][item_id] = my_data["saved_data"].pop(item_id)
        my_data["archived_data"][item_id]["saved"] = 0

    # Write the updated my_data.json
    with open("data/my_data.json", "w") as f:
        json.dump(my_data, f, indent=4)

    
    with open("data/todays_data.json") as f:
        todays_data = json.load(f)

    if not saved:
        todays_data["items"][item_id]["saved"] = 1
    else:
        todays_data["items"][item_id]["saved"] = 0 

    with open("data/todays_data.json", "w") as f:
        json.dump(todays_data, f, indent=4)

    return jsonify({"status": "ok"})

### FOOTER ENDPOINTS ###

# Resets my_data.json by moving everything in saved_data and archived_data back into data.
# Uses POST because it modifies data on the server.
@app.route("/api/reset", methods=["POST"])
def reset():
    with open("data/my_data.json") as f:
        my_data = json.load(f)

    # Move all saved items back into data
    my_data["data"].update(my_data["saved_data"])
    my_data["saved_data"] = {}

    # Move all archived items back into data
    my_data["data"].update(my_data["archived_data"])
    my_data["archived_data"] = {}

    # Write the reset version back to disk
    with open("data/my_data.json", "w") as f:
        json.dump(my_data, f, indent=4)


    # Write empty json back to todays_data.json
    with open("data/todays_data.json", "w") as f:
        todays_data = {}
        json.dump(todays_data, f, indent=4)

    return jsonify({"status": "ok", "total_items": len(my_data["data"])})


@app.route("/api/get_new_data_for_today", methods=["POST"])
def get_new_data_for_today():
    data = create_todays_data()
    return jsonify(data)


if __name__ == "__main__":
    # debug=True auto-reloads the server when you change code
    app.run(debug=True, port=5001)
