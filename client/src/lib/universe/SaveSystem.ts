import { UniverseData } from "../../shared/schema";

export class SaveSystem {
  static downloadUniverse(universeData: UniverseData): void {
    try {
      // Convert to JSON string and create blob
      const jsonString = JSON.stringify(universeData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `universe-${universeData.mode}-${Date.now()}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log("Universe data downloaded successfully");
    } catch (error) {
      console.error("Error downloading universe:", error);
      throw new Error("Failed to download universe data");
    }
  }

  static async loadUniverse(file: File): Promise<UniverseData> {
    try {
      // Read file as text
      const text = await file.text();
      
      // Parse JSON
      const universeData: UniverseData = JSON.parse(text);
      
      // Basic validation
      if (!universeData.stars || !Array.isArray(universeData.stars)) {
        throw new Error("Invalid universe data: missing or invalid stars array");
      }
      
      if (!universeData.systems || !Array.isArray(universeData.systems)) {
        throw new Error("Invalid universe data: missing or invalid systems array");
      }
      
      if (!universeData.metadata) {
        throw new Error("Invalid universe data: missing metadata");
      }
      
      console.log("Universe data loaded successfully:", {
        stars: universeData.stars.length,
        systems: universeData.systems.length,
        mode: universeData.mode
      });
      
      return universeData;
    } catch (error) {
      console.error("Error loading universe:", error);
      throw new Error("Failed to load universe file");
    }
  }
}
