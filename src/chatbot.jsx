// Import React hooks and system instructions
import React, { useState, useEffect } from "react";
import { SYSTEM_INSTRUCTIONS, WELCOME_MESSAGE } from "./systemInstructions";

/**
 * ChatBot Component - Main chatbot interface
 * This component handles the entire chat functionality including:
 * - Managing conversation state
 * - Sending messages to AI API
 * - Displaying chat history
 * - User input handling
 */
const ChatBot = () => {
  // STATE MANAGEMENT
  // ================

  // chatHistory: Array that stores all messages (user and AI responses)
  // Each message has: { role: "user" | "model", parts: [{ text: "message content" }] }
  const [chatHistory, setChatHistory] = useState([
    { role: "model", parts: [{ text: WELCOME_MESSAGE }] },
  ]);

  // userInput: Current text the user is typing
  const [userInput, setUserInput] = useState("");

  // isLoading: Boolean to show loading animation while waiting for AI response
  const [isLoading, setIsLoading] = useState(false);

  // SIDE EFFECTS
  // ============

  // Auto-scroll to bottom when new messages are added
  // This ensures users always see the latest message
  useEffect(() => {
    const chatContainer = document.getElementById("chat-messages");
    if (chatContainer) {
      // scrollTop = scrollHeight moves scroll to the very bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory]); // Runs every time chatHistory changes

  // API INTEGRATION
  // ===============

  /**
   * callGeminiApi - Sends user message to Google's Gemini AI API
   * @param {string} prompt - The user's message
   * @param {Array} currentChatHistory - Current conversation history
   *
   * This function:
   * 1. Adds user message to chat history
   * 2. Sends request to Gemini API with system instructions
   * 3. Processes the AI response
   * 4. Updates chat history with AI response
   * 5. Handles errors gracefully
   */
  const callGeminiApi = async (prompt, currentChatHistory) => {
    // Step 1: Add user's message to chat history immediately
    // This provides instant feedback to the user
    const updatedChatHistory = [
      ...currentChatHistory, // Spread existing messages
      { role: "user", parts: [{ text: prompt }] }, // Add new user message
    ];
    setChatHistory(updatedChatHistory);

    // Step 2: Set up API configuration
    const API_KEY = "API_Key"; // Google Gemini API key

    // Step 3: Prepare the payload for the API request
    const payload = {
      contents: updatedChatHistory, // Send entire conversation for context
      systemInstruction: {
        // System instructions define how the AI should behave
        parts: [{ text: SYSTEM_INSTRUCTIONS }],
      },
    };

    // Step 4: Construct the API endpoint URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
      // Step 5: Make the HTTP POST request to Gemini API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Convert payload to JSON string
      });

      // Step 6: Check if the request was successful
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Step 7: Parse the JSON response from the API
      const result = await response.json();

      // Step 8: Extract the AI's response from the complex response structure
      // Gemini API returns a nested structure, so we need to navigate through it
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        // Successfully got AI response - add it to chat history
        const text = result.candidates[0].content.parts[0].text;
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: "model", parts: [{ text: text }] },
        ]);
      } else {
        // API returned unexpected format - show error message
        setChatHistory((prevHistory) => [
          ...prevHistory,
          {
            role: "model",
            parts: [{ text: "Sorry, I couldn't generate a response." }],
          },
        ]);
      }
    } catch (error) {
      // Step 9: Handle any network or API errors
      console.error("API Error:", error);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          role: "model",
          parts: [{ text: "Connection error. Please try again." }],
        },
      ]);
    }
  };

  // USER INTERACTION HANDLERS
  // =========================

  /**
   * sendMessage - Handles sending user messages
   * This function:
   * 1. Validates the message (not empty, not currently loading)
   * 2. Clears the input field
   * 3. Sets loading state
   * 4. Calls the API
   * 5. Handles any errors
   * 6. Resets loading state
   */
  const sendMessage = async () => {
    // Step 1: Clean and validate the message
    const message = userInput.trim(); // Remove whitespace from start/end
    if (!message || isLoading) return; // Don't send empty messages or if already loading

    // Step 2: Clear input field immediately for better UX
    setUserInput("");

    // Step 3: Show loading animation
    setIsLoading(true);

    try {
      // Step 4: Send message to AI API
      await callGeminiApi(message, chatHistory);
    } catch (error) {
      // Step 5: Handle any unexpected errors
      console.error("Send message error:", error);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          role: "model",
          parts: [{ text: "Error occurred. Please try again." }],
        },
      ]);
    } finally {
      // Step 6: Always hide loading animation (even if error occurred)
      setIsLoading(false);
    }
  };

  /**
   * handleKeyPress - Handles keyboard input in the text field
   * Allows users to send messages by pressing Enter
   * Shift+Enter allows multi-line messages (though we use input, not textarea)
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter behavior
      sendMessage(); // Send the message
    }
  };

  // RENDER UI COMPONENTS
  // ====================

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Chat Messages - Takes up all available space */}
      <div
        id="chat-messages"
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900 min-h-0"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-100 border border-slate-600"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.parts[0].text}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-slate-600 bg-slate-800">
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Ask about energy consumption, grid management, or federated learning..."
            className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !userInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the ChatBot component so it can be imported and used in other files
export default ChatBot;
