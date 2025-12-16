import { GoogleGenAI, Type } from "@google/genai";
import { ItineraryItem, TransportType, TransportOption } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

// Step 1: Get raw list of places to visit
export const getPlacesRecommendations = async (
  destination: string,
  budget: number
): Promise<{ name: string; description: string; type: 'place' }[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return [
      { name: "City Center Plaza", description: "The heart of the city.", type: 'place' },
      { name: "National Museum", description: "History and art.", type: 'place' },
      { name: "Central Park", description: "Green space for relaxation.", type: 'place' },
      { name: "Old Market", description: "Traditional shopping.", type: 'place' }
    ];
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Suggest 8 popular and distinct tourist places to visit in ${destination}.
    The user has a total budget of $${budget}.
    Return a JSON list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['place'] }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    return [];
  }
};

// Step 2: Generate Optimized Route with Transport Options
export const generateTripItinerary = async (
  destination: string,
  days: number,
  budget: number,
  selectedPlaces: string[],
  bucketNotes: string[] // Notes like "Buy notebook"
): Promise<ItineraryItem[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API Key. Returning mock.");
    return generateMockItinerary(destination, selectedPlaces);
  }

  const ai = new GoogleGenAI({ apiKey });

  // UPDATED PROMPT: Explicitly asking for TSP logic and stronger instruction for accommodation
  const prompt = `
    Create an optimized travel itinerary for ${days} days in ${destination}.
    Selected Places to visit: ${selectedPlaces.join(", ")}.
    User Notes/Reminders for this trip: ${bucketNotes.join(", ")}.
    
    1. **Route Optimization (Crucial):** Treat this as a Traveling Salesperson Problem (TSP). Reorder the 'Selected Places' to minimize total travel distance. Group nearby locations together.
    2. Between each place, provide a 'transport' item.
    3. For 'transport' items, provide 3 options: METRO, TAXI, and WALK.
    4. **CRITICAL: Provide REALISTIC costs in USD.** 
       - Lunch should be around $10-$30.
       - Metro tickets ~$2-$10.
       - Taxi based on distance ($10-$50).
    5. Include the User Notes as 'note' items or append them to the description of relevant places if they fit contextually.
    6. **Accommodation**: You MUST insert an 'accommodation' item at the end of the day or after every 3rd place. 
       For this item, provide 3 specific hotel/hostel recommendations with:
       - Real existing names if possible
       - Realistic price per night ($50-$300 depending on budget)
       - Rating (1-5 stars)
    
    Return a flat JSON array of sequence items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["place", "transport", "lunch", "accommodation"] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER },
              cost: { type: Type.NUMBER },
              // For transport items
              transportType: { type: Type.STRING, enum: ["walk", "taxi", "bus", "train", "metro"] },
              transportOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["walk", "taxi", "bus", "train", "metro"] },
                    durationMinutes: { type: Type.NUMBER },
                    cost: { type: Type.NUMBER },
                    recommended: { type: Type.BOOLEAN }
                  }
                }
              },
              // For accommodation items
              accommodationOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    pricePerNight: { type: Type.NUMBER },
                    rating: { type: Type.NUMBER },
                    address: { type: Type.STRING },
                    recommended: { type: Type.BOOLEAN }
                  }
                }
              }
            },
            required: ["type", "title"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => {
      // Robust handling for accommodation options
      let accOptions = item.accommodationOptions;
      if (item.type === 'accommodation' && (!accOptions || accOptions.length === 0)) {
        // Fallback if AI returns accommodation type but misses options
         accOptions = [
            { name: `${destination} Central Hotel`, pricePerNight: 120, rating: 4.5, address: 'City Center', recommended: true },
            { name: 'Budget Stay Hostel', pricePerNight: 45, rating: 3.8, address: 'Old Town', recommended: false },
            { name: 'Comfort Inn', pricePerNight: 85, rating: 4.0, address: 'Downtown', recommended: false }
         ];
      }

      return {
        ...item,
        id: generateId(),
        location: { lat: 35.6 + Math.random() * 0.1, lng: 139.7 + Math.random() * 0.1 },
        // Add mock images for accommodations since API doesn't return them
        accommodationOptions: accOptions?.map((opt: any) => ({
          ...opt,
          image: `https://picsum.photos/seed/${opt.name.replace(/\s/g, '')}/300/200`
        }))
      };
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return generateMockItinerary(destination, selectedPlaces);
  }
};

const generateMockItinerary = (destination: string, places: string[]): ItineraryItem[] => {
  const items: ItineraryItem[] = [];
  
  places.forEach((place, i) => {
    // Add place
    items.push({
      id: generateId(),
      type: 'place',
      title: place,
      description: `Visit to ${place}`,
      durationMinutes: 90,
      cost: 15, // Realistic entry fee/cost
      location: { lat: 50 + Math.random(), lng: 50 + Math.random() }
    });

    // Add transport to next place if not last
    if (i < places.length - 1) {
      items.push({
        id: generateId(),
        type: 'transport',
        title: `Travel to ${places[i+1]}`,
        transportType: TransportType.METRO,
        durationMinutes: 20,
        cost: 3, // Realistic Metro cost
        transportOptions: [
          { type: TransportType.METRO, durationMinutes: 20, cost: 3, recommended: true },
          { type: TransportType.TAXI, durationMinutes: 10, cost: 25, recommended: false },
          { type: TransportType.WALK, durationMinutes: 45, cost: 0, recommended: false }
        ]
      });
    }

    // Add accommodation more frequently in mock mode (e.g., after 2nd place or if it's the last place)
    if ((i > 0 && i % 2 === 0) || i === places.length - 1) {
        // Prevent adding accommodation twice if i is both %2 and last
        const alreadyAdded = items.length > 0 && items[items.length - 1].type === 'accommodation';
        
        if (!alreadyAdded) {
          items.push({
              id: generateId(),
              type: 'accommodation',
              title: `Stay near ${place}`,
              description: 'Recommended places to rest.',
              accommodationOptions: [
                  { name: `${destination} Grand Hotel`, pricePerNight: 120, rating: 4.5, address: 'Downtown', recommended: true, image: 'https://picsum.photos/seed/h1/300/200' },
                  { name: 'Backpacker Hostel', pricePerNight: 45, rating: 3.8, address: 'Near Station', recommended: false, image: 'https://picsum.photos/seed/h2/300/200' },
                  { name: 'City Inn', pricePerNight: 85, rating: 4.0, address: 'City Center', recommended: false, image: 'https://picsum.photos/seed/h3/300/200' }
              ]
          });
        }
    }
  });
  
  return items;
}