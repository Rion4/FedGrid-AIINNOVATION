import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://thefenrcadclcnazqqhx.supabase.co";
const SUPABASE_KEY = "key";

async function uploadWeights() {
  console.log("Initializing Supabase client...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const payload = {
      deviceId: "prosumer-device-1",
      model_version: "2.0.0",
      weights: [
        // Layer 1
        [
          /* Weights */ [
            [-0.123, 0.456],
            [-0.789, 0.012],
          ],
        ],
        [/* Biases  */ [0.111, 0.222]],
        // Layer 2
        [
          /* Weights */ [
            [-0.333, 0.444],
            [-0.555, 0.666],
          ],
        ],
        [/* Biases  */ [0.555, 0.666]],
      ],
    };

    // Prepare the data for the table columns
    const dataToUpload = {
      device_id: payload.deviceId,
      weights_payload: payload, // The entire complex object goes into the jsonb column
    };

    console.log("Uploading data for device: ${dataToUpload.device_id}...");

    const { data, error } = await supabase
      .from("model-weights")
      .insert([dataToUpload])
      .select();

    if (error) throw error;

    console.log("Upload successful!");
    console.log("--- Response from Supabase ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("------------------------------");
  } catch (e) {
    console.error("An error occurred:", e.message);
  }
}

uploadWeights();
