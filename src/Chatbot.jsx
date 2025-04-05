import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Send } from "lucide-react";


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleInputChange = (e) => setInputValue(e.target.value);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    setShowChat(true);
    const userMessage = { text: inputValue, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const result = await model.generateContent({
        contents: [{ parts: [{ text: inputValue }] }],
      });

      const text = result.response.text();
      setMessages((prev) => [...prev, { text, sender: "ai" }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, { text: "Sorry, something went wrong. Please try again.", sender: "ai" }]);
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 overflow-hidden"
    >
      {/* Responsive Header */}
      <motion.header 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="p-4 sm:p-6 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Lucia - AI ChatBot
        </h1>
      </motion.header>

      {/* Messages Container */}
      <motion.div 
        className={`
          flex-grow 
          overflow-y-auto 
          w-full 
          px-2 sm:px-4 md:px-6 
          py-2
          ${messages.length === 0 ? "flex items-center justify-center" : ""}
          max-w-7xl 
          mx-auto
        `}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !showChat ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
              className="text-center w-full p-4"
            >
              <motion.p className="text-lg sm:text-xl text-gray-400">
                Welcome! How can I assist you today?
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-sm text-gray-500"
              >
                Try asking me anything!
              </motion.div>
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "spring", duration: 0.5, delay: i * 0.1 }}
                className={`mb-4 flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  className="text-xs sm:text-sm font-semibold mb-1 px-2"
                >
                  {msg.sender === "user" ? "You" : "Lucia"}
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`
                    p-3 sm:p-4 
                    rounded-lg 
                    shadow-lg 
                    ${msg.sender === "user" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700" 
                      : "bg-gradient-to-r from-gray-800 to-gray-700"}
                    max-w-[85%] sm:max-w-[75%] md:max-w-[65%]
                    min-w-[100px]
                  `}
                >
                  <div className="whitespace-pre-wrap break-words text-sm sm:text-base">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start w-full"
            >
              <div className="p-3 rounded-lg shadow-lg bg-gray-800 max-w-[200px]">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-sm">Lucia is thinking</span>
                  <span className="animate-pulse">...</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input Area */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring" }}
          className="p-2 sm:p-4 md:p-6 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm w-full"
        >
          <motion.div 
            className="max-w-7xl mx-auto flex items-center space-x-2 sm:space-x-4 relative"
            whileHover={{ scale: 1.01 }}
          >
            <textarea
              className="
                flex-grow 
                p-2 sm:p-3 md:p-4 
                border border-gray-600 
                rounded-lg 
                bg-gray-700/50 
                backdrop-blur-sm 
                text-gray-200 
                resize-none 
                shadow-lg 
                focus:ring-2 
                focus:ring-blue-500 
                focus:border-transparent 
                transition-all 
                duration-300
                text-sm sm:text-base
                h-[40px] sm:h-[45px] md:h-[50px]
              "
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
            />
            
            {/* Voice Input Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startListening}
              className="
                absolute 
                right-[50px] sm:right-[60px] 
                top-1/2 
                transform 
                -translate-y-1/2 
                p-2 sm:p-3 
                text-white 
                rounded-full 
                hover:bg-gray-600/50 
                transition-colors 
                duration-300
              "
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </motion.button>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className="
                p-2 sm:p-3 md:p-4
                bg-gradient-to-r 
                from-blue-600 
                to-blue-700 
                text-white 
                rounded-lg 
                shadow-lg 
                hover:from-blue-700 
                hover:to-blue-800 
                transition-all 
                duration-300
                min-w-[40px] sm:min-w-[45px] md:min-w-[50px]
                flex 
                items-center 
                justify-center
              "
            >
              <Send size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default Chatbot;
