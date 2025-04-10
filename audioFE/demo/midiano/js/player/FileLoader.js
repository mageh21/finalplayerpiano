import { getLoader } from "../ui/Loader.js"

export class FileLoader {
	static async loadSongFromURL(url, callback) {
		const loader = getLoader(); // Get loader instance
		loader.startLoad(); // Show loader
		loader.setLoadMessage(`Loading Song: ${url.split('/').pop()}`); // Set message (using filename)

		try {
			const response = await fetch(url, {
				method: "GET"
			});

			if (!response.ok) { // Check for HTTP errors
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			const reader = new FileReader();

			reader.onload = function (theFile) {
				callback(reader.result, url, () => {}); // Call the original callback
				loader.stopLoad(); // Hide loader after callback is done
			};

			reader.onerror = function (error) { // Handle FileReader errors
				console.error("FileReader error:", error);
				loader.setLoadMessage("Error reading file.");
				// Optionally keep loader visible or stop with error message
				setTimeout(() => loader.stopLoad(), 2000); // Hide after delay
			};

			reader.readAsDataURL(blob);

		} catch (error) {
			console.error("Error loading song from URL:", error);
			loader.setLoadMessage("Error loading song.");
			// Optionally keep loader visible or stop with error message
			setTimeout(() => loader.stopLoad(), 2000); // Hide after delay
		}
	}
}
