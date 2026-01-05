"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  CommandLineIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
// Additional minimal icon set from lucide-react for new navbar
import {
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Zap,
  Palette,
  Code2,
} from "lucide-react";
import PropertyEditor from "../components/PropertyEditor";
import JSZip from "jszip";

/* ------------------------------------------------------------------
   User dropdown menu – extracted from Hero section so it can be reused here
-------------------------------------------------------------------*/
const UserMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <img
          src={user.image || "/default-avatar.png"}
          alt="User"
          className="w-8 h-8 rounded-full border-2 border-amber-400"
        />
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <motion.div
          className="absolute right-0 mt-2 w-56 bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-lg shadow-xl border border-gray-700 p-2 z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 border-b border-gray-700">
            <h4 className="font-semibold text-sm truncate">{user.name}</h4>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/playground"
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md"
            >
              <LayoutGrid className="w-4 h-4 mr-3" /> Playground
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md"
              >
                <ShieldCheckIcon className="w-4 h-4 mr-3" /> Admin Portal
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md"
            >
              <SettingsIcon className="w-4 h-4 mr-3" /> Settings
            </Link>
            <Link
              href="/help"
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md"
            >
              <HelpCircle className="w-4 h-4 mr-3" /> Help
            </Link>
          </div>
          <div className="border-t border-gray-700 my-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-md"
          >
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default function Playground() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [history, setHistory] = useState([]);
  const [previewKey, setPreviewKey] = useState(0);
  const [editedCode, setEditedCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-3.5-turbo");
  const [models, setModels] = useState([
    {
      id: "openai/gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Fast & economical",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      description: "Advanced capabilities",
    },
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      description: "Fast & efficient",
    },
    {
      id: "google/gemini-pro",
      name: "Gemini Pro",
      description: "Balanced performance",
    },
  ]);
  const chatEndRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const historyRef = useRef(null); // ref for auto-scrolling
  // New state for property editor
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const iframeRef = useRef(null);
  // Add new state
  const [downloadFormat, setDownloadFormat] = useState("jsx");
  // add state showDownload near others
  const [showDownload, setShowDownload] = useState(false);
  // Online count state
  const [onlineCount, setOnlineCount] = useState(0);
  // Typing animation for history title
  const [displayedTitle, setDisplayedTitle] = useState("");
  const fullTitle = "Component History";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullTitle.length) {
        setDisplayedTitle(fullTitle.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const DEFAULT_COMPONENT = `
// A simple card component with Tailwind CSS
function Card() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
      <div className="md:flex">
        <div className="md:shrink-0">
          <div className="h-48 w-full md:w-48 bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Welcome to KarmaAI</div>
          <h2 className="block mt-1 text-lg leading-tight font-medium text-black">Generate UI components with AI</h2>
          <p className="mt-2 text-gray-500">
            Describe any component you want in the input field above, and our AI will generate it for you.
          </p>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
`;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Load user's history and chat history
      fetchUserHistory();

      // Set default component if no code is loaded
      if (!generatedCode) {
        setGeneratedCode(DEFAULT_COMPONENT);
        setEditedCode(DEFAULT_COMPONENT);
      }

      setIsLoading(false);
    }
  }, [status, router, generatedCode]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Update edited code when generated code changes
  useEffect(() => {
    if (generatedCode) {
      setEditedCode(generatedCode);
    }
  }, [generatedCode]);

  // Add this function to close the profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileMenuOpen && !event.target.closest(".user-dropdown")) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const fetchUserHistory = async () => {
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setChatHistory(data.chatHistory || []);
      }
    } catch (error) {
      console.error("Error fetching user history:", error);
    }
  };

  // Update the handleGenerate function to handle available models response
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(
        "Please enter a description of the component you want to generate."
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Add user message to chat history
      const newChatHistory = [
        ...chatHistory,
        { role: "user", content: prompt },
      ];
      setChatHistory(newChatHistory);

      let response;

      // If element selected and we are in chat tab -> override mode
      if (activeTab === "chat" && selectedElement) {
        response = await fetch("/api/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            code: generatedCode,
            selectedElement,
          }),
        });
      } else {
        // Standard generate
        response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            chatHistory: newChatHistory.slice(-3),
            model: selectedModel,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle API error
        const errorMessage = data.message || "Failed to generate code";

        // If we got available models back, update our models list
        if (
          data.availableModels &&
          Array.isArray(data.availableModels) &&
          data.availableModels.length > 0
        ) {
          // Create a new models array with the available models
          const updatedModels = data.availableModels.map((modelId) => {
            // Try to match with our existing models
            const existingModel = models.find((m) =>
              modelId.includes(m.id.split("/")[0])
            );
            if (existingModel) {
              return {
                id: modelId,
                name: existingModel.name,
                description: "Available model",
              };
            }

            // Otherwise create a generic entry
            const parts = modelId.split("/");
            return {
              id: modelId,
              name: parts[1] || modelId,
              description: `From ${parts[0] || "provider"}`,
            };
          });

          // Update models array and select the first available model
          setModels(updatedModels);
          if (updatedModels.length > 0) {
            setSelectedModel(updatedModels[0].id);
            setError(
              `${errorMessage} - Updated to available models. Please try again.`
            );
            setIsGenerating(false);
            return;
          }
        }

        throw new Error(errorMessage);
      }

      // On override update code but do not push to history
      if (activeTab === "chat" && selectedElement) {
        setGeneratedCode(data.code);
        setEditedCode(data.code);
        setPreviewKey((k) => k + 1);
      } else {
        setGeneratedCode(data.code);
        setEditedCode(data.code);

        // Add AI response to chat history
        setChatHistory([
          ...newChatHistory,
          {
            role: "assistant",
            content: data.message || "Here is the component you requested.",
            code: data.code,
          },
        ]);

        // Add to history
        const newHistoryItem = {
          id: Date.now(),
          prompt,
          code: data.code,
          timestamp: new Date().toISOString(),
          model: selectedModel,
        };
        setHistory((prev) => {
          const updated = [newHistoryItem, ...prev.slice(0, 19)];
          // smooth scroll to top so user sees the new entry
          setTimeout(() => {
            if (historyRef.current) {
              historyRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
          }, 100);
          return updated;
        });
        saveHistory(newHistoryItem);
        // Refresh history from server to show instantly
        fetchUserHistory();
      }
      if (!(activeTab === "chat" && selectedElement)) {
        setPreviewKey((prevKey) => prevKey + 1);
        setActiveTab("preview");
      }
    } catch (error) {
      console.error("Error generating code:", error);

      // Check if error is related to credits
      const errorMsg =
        error.message || "Failed to generate code. Please try again.";
      setError(errorMsg);

      // Add error message to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg.includes("credits")
            ? "Sorry, I ran out of API credits. Please try a simpler prompt or contact the administrator to upgrade the account."
            : "Sorry, I encountered an error while generating the code. Please try again with a different prompt.",
        },
      ]);
    } finally {
      setIsGenerating(false);
      setPrompt(""); // Clear input after generating
    }
  };

  const saveHistory = async (historyItem) => {
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          historyItem,
          chatHistory,
        }),
      });
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const handleExport = async () => {
    const codeToExport = isEditing ? editedCode : generatedCode;

    if (downloadFormat === "jsx") {
      const blob = new Blob([codeToExport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Component.jsx";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // zip format
      const zip = new JSZip();
      zip.file("Component.jsx", codeToExport);
      // Optionally add README or CSS files here
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "component.zip";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const copyToClipboard = () => {
    const codeToExport = isEditing ? editedCode : generatedCode;
    navigator.clipboard.writeText(codeToExport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCodeEdit = (e) => {
    setEditedCode(e.target.value);
  };

  const applyChanges = () => {
    setGeneratedCode(editedCode);
    setIsEditing(false);
    setPreviewKey((prevKey) => prevKey + 1);
  };

  const cancelEditing = () => {
    setEditedCode(generatedCode);
    setIsEditing(false);
  };

  const selectHistoryItem = (item) => {
    setGeneratedCode(item.code);
    setEditedCode(item.code);
    setPreviewKey((prevKey) => prevKey + 1);
    setActiveTab("preview");
  };

  // Dynamic component preview
  const ComponentPreview = () => {
    if (!generatedCode) return null;

    const codeToRender = isEditing ? editedCode : generatedCode;

    // Extract the component's JSX from the code
    let extractedJSX = "";
    let isButtonComponent = false;

    try {
      // Try to find the return statement with JSX
      const returnMatch = codeToRender.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
      if (returnMatch && returnMatch[1]) {
        extractedJSX = returnMatch[1].trim();

        // Check if this is likely a button component
        isButtonComponent =
          extractedJSX.toLowerCase().includes("<button") ||
          extractedJSX.toLowerCase().includes("btn") ||
          extractedJSX.toLowerCase().includes("button");

        // Convert React className to HTML class
        extractedJSX = extractedJSX.replace(/className=/g, "class=");

        // Remove any React-specific attributes
        extractedJSX = extractedJSX.replace(/\{[^{}]*\}/g, (match) => {
          // Keep string literals inside curly braces
          if (match.includes('"') || match.includes("'")) {
            return match.replace(/[{}]/g, "").replace(/["']/g, "");
          }
          return "";
        });
      }
    } catch (error) {
      console.error("Error extracting JSX:", error);
    }

    // If we couldn't extract JSX, use a fallback
    if (!extractedJSX) {
      extractedJSX =
        '<div class="p-4 text-center text-gray-500">Preview not available</div>';
    }

    // Create a sandbox with the extracted JSX
    const sandboxHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Reset and base styles */
            *, *::before, *::after {
              box-sizing: border-box;
            }
            
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            body {
              background-color: transparent;
              color: #111827;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            /* Preview container */
            .preview-wrapper {
              width: 100%;
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              overflow: hidden;
              background-color: #111827; /* dark gray */
              background-image: none;
            }
            
            /* Component container */
            .component-container {
              position: relative;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1;
              background-color: transparent;
            }
            
            /* Component display */
            .component-display {
              display: inline-block;
              position: relative;
              ${isButtonComponent ? "transform: scale(1.5);" : ""}
              border-radius: 4px;
              overflow: hidden;
              background-color: transparent;
            }
            
            /* Hide the legacy device selector */
            .device-frame { display: none; }
            
            /* Cursor pointer for buttons */
            button {
              cursor: pointer;
            }

            /* Interactive element styles */
            .interactive-element {
              cursor: pointer;
              transition: outline 0.2s ease, transform 0.1s ease;
            }
            
            .interactive-element:hover {
              outline: 2px dashed rgba(99, 102, 241, 0.6);
              outline-offset: 2px;
              transform: scale(1.01);
            }
            
            .selected-element {
              outline: 2px solid rgb(99, 102, 241);
              outline-offset: 2px;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
            }
            
            /* Selection indicator animation */
            @keyframes pulse {
              0% { outline-color: rgba(99, 102, 241, 0.8); }
              50% { outline-color: rgba(99, 102, 241, 0.4); }
              100% { outline-color: rgba(99, 102, 241, 0.8); }
            }
            
            .selected-element {
              animation: pulse 2s infinite;
            }
            
            /* Tooltip */
            .element-tooltip {
              position: absolute;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              pointer-events: none;
              z-index: 100;
              transform: translateY(-100%);
              top: -8px;
              left: 50%;
              transform: translateX(-50%) translateY(-100%);
              white-space: nowrap;
              opacity: 0;
              transition: opacity 0.2s ease;
            }
            
            .interactive-element:hover .element-tooltip {
              opacity: 1;
            }
          </style>
          <script>
            // Function to make elements interactive
            function makeElementsInteractive() {
              const interactiveElements = document.querySelectorAll('button, a, input, div.card, div.container, h1, h2, h3, h4, h5, h6, p, span, img');
              
              interactiveElements.forEach(el => {
                el.classList.add('interactive-element');
                
                // Create tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'element-tooltip';
                tooltip.textContent = el.tagName.toLowerCase();
                el.style.position = 'relative';
                el.appendChild(tooltip);
                
                el.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Remove selection from other elements
                  document.querySelectorAll('.selected-element').forEach(selected => {
                    selected.classList.remove('selected-element');
                  });
                  
                  // Add selection to clicked element
                  el.classList.add('selected-element');
                  
                  // Extract text content, handling nested elements
                  let textContent = '';
                  if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                    // Simple text node
                    textContent = el.textContent.trim();
                  } else if (el.childNodes.length > 0) {
                    // Get direct text nodes only
                    for (const node of el.childNodes) {
                      if (node.nodeType === 3) { // Text node
                        const trimmed = node.textContent.trim();
                        if (trimmed) textContent = trimmed;
                      }
                    }
                  }
                  
                  // Send message to parent
                  window.parent.postMessage({
                    type: 'element-selected',
                    element: {
                      tagName: el.tagName,
                      id: el.id,
                      className: el.className,
                      text: textContent || el.innerText || '',
                      rect: el.getBoundingClientRect(),
                      computedStyle: Object.fromEntries(
                        Array.from(getComputedStyle(el))
                          .filter(prop => !prop.startsWith('-'))
                          .map(prop => [prop, getComputedStyle(el).getPropertyValue(prop)])
                      )
                    }
                  }, '*');
                });
              });
            }
            
            // Initialize when DOM is loaded
            document.addEventListener('DOMContentLoaded', () => {
              setTimeout(makeElementsInteractive, 100);
            });
          </script>
        </head>
        <body>
          <div class="preview-wrapper">
            <div class="component-container">
              <div class="component-display">
                ${extractedJSX}
              </div>
            </div>
          </div>
          </body>
       </html>
     `;

    return (
      <div className="relative h-[600px]">
        <iframe
          ref={iframeRef}
          key={previewKey}
          srcDoc={sandboxHtml}
          className={`w-full border-0 rounded-lg ${
            isFullscreen
              ? "fixed inset-0 z-50 h-screen"
              : "h-full min-h-[500px]"
          }`}
          title="Component Preview"
          sandbox="allow-scripts"
          onLoad={() => {
            // Add a small delay to ensure the iframe content is fully loaded
            setTimeout(() => {
              if (iframeRef.current) {
                try {
                  // Reinitialize interactive elements
                  iframeRef.current.contentWindow.postMessage(
                    { type: "reinitialize" },
                    "*"
                  );
                } catch (error) {
                  console.error("Error communicating with iframe:", error);
                }
              }
            }, 200);
          }}
        />

        {/* Refresh and fullscreen controls */}
        <div
          className={`absolute top-4 right-4 flex items-center space-x-2 bg-gray-800 bg-opacity-80 p-2 rounded-md shadow-md ${
            isFullscreen ? "z-60" : "z-10"
          }`}
        >
          <button
            onClick={() => setPreviewKey((prevKey) => prevKey + 1)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition"
            title="Refresh preview"
          >
            <ArrowPathIcon className="h-4 w-4 text-gray-200" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-4 w-4 text-gray-200" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4 text-gray-200" />
            )}
          </button>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-md hover:bg-gray-700 transition"
              title="Close fullscreen"
            >
              <XMarkIcon className="h-4 w-4 text-gray-200" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "element-selected") {
        const elementData = event.data.element;

        // Extract useful properties from computed style
        const computedStyle = elementData.computedStyle || {};

        // Create a more structured element object with parsed properties
        const element = {
          tagName: elementData.tagName,
          id: elementData.id,
          className: elementData.className,
          text: elementData.text || "",
          padding: parseInt(computedStyle.padding) || 4,
          fontSize: parseInt(computedStyle.fontSize) || 16,
          backgroundColor: computedStyle.backgroundColor || "#3B82F6",
          textColor: computedStyle.color || "#FFFFFF",
          borderRadius: parseInt(computedStyle.borderRadius) || 4,
          borderWidth: parseInt(computedStyle.borderWidth) || 0,
          borderColor: computedStyle.borderColor || "#000000",
          shadowSize:
            computedStyle.boxShadow && computedStyle.boxShadow !== "none"
              ? computedStyle.boxShadow.includes("10px")
                ? 4
                : computedStyle.boxShadow.includes("4px")
                ? 2
                : 1
              : 0,
        };

        // Add a success notification
        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out";
        notification.textContent = `Selected ${element.tagName.toLowerCase()} element`;
        document.body.appendChild(notification);

        // Remove notification after 2 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 2000);

        setSelectedElement(element);
        setShowPropertyEditor(true);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Online count tracking
  useEffect(() => {
    const sessionId =
      sessionStorage.getItem("karmaai_session") ||
      `session_${Date.now()}_${Math.random()}`;
    if (!sessionStorage.getItem("karmaai_session")) {
      sessionStorage.setItem("karmaai_session", sessionId);
    }

    const userId = session?.user?.id || null;

    // Add user to online count
    const addToOnline = async () => {
      try {
        const response = await fetch("/api/online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sessionId }),
        });
        if (response.ok) {
          const data = await response.json();
          setOnlineCount(data.count);
        }
      } catch (error) {
        console.error("Error adding to online count:", error);
      }
    };

    // Remove user from online count
    const removeFromOnline = async () => {
      try {
        await fetch("/api/online", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("Error removing from online count:", error);
      }
    };

    // Initial add
    addToOnline();

    // Set up periodic updates to keep user online
    const interval = setInterval(addToOnline, 60000); // Update every minute

    // Handle page unload
    const handleBeforeUnload = () => {
      removeFromOnline();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      removeFromOnline();
    };
  }, [session]);

  // Handle property editor updates
  const handlePropertyUpdate = (updatedCode) => {
    setEditedCode(updatedCode);
    setGeneratedCode(updatedCode);

    // Delay the preview refresh to ensure the code is fully updated
    setTimeout(() => {
      setPreviewKey((prevKey) => prevKey + 1);
    }, 50);

    // Do NOT save property-editor-only changes to history
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Update the main UI of the playground page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Inject global styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        .animate-fade-in-out {
          animation: fadeInOut 2s forwards;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(139, 92, 246, 0.6),
            rgba(236, 72, 153, 0.6)
          );
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(139, 92, 246, 0.8),
            rgba(236, 72, 153, 0.8)
          );
        }

        /* Enhanced focus styles */
        .focus-ring:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
        }

        /* Floating animation */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Pulse glow animation */
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6),
              0 0 40px rgba(139, 92, 246, 0.4);
            transform: scale(1.02);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        /* Gradient shift animation */
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }

        /* Bounce in animation */
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(50px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
          }
          70% {
            transform: scale(0.9) translateY(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out forwards;
        }
      `}</style>

      {/* Property Editor */}
      {showPropertyEditor && selectedElement && (
        <PropertyEditor
          selectedElement={selectedElement}
          onClose={() => {
            setShowPropertyEditor(false);
            setSelectedElement(null);
          }}
          onUpdate={handlePropertyUpdate}
          componentCode={isEditing ? editedCode : generatedCode}
        />
      )}

      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          transition: { duration: 0.6, ease: "easeOut" },
        }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{
                rotate: 360,
                scale: 1.1,
                transition: { duration: 0.6 },
              }}
              className="w-10 h-10 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Image
                src="/globe.svg"
                alt="KarmaAI logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain relative z-10"
                priority
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                KarmaAI
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                Playground
              </span>
            </div>
          </Link>

          {/* Quick stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <SparklesIcon className="w-4 h-4 text-purple-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Real-time</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Palette className="w-4 h-4 text-blue-500" />
              <span>Tailwind CSS</span>
            </div>
          </div>

          {session?.user && <UserMenu user={session.user} />}
        </div>
      </motion.nav>

      {/* Add animation keyframes for the dropdown */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Rest of the page content */}
      <div className="container mx-auto px-4 py-6 pt-32">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow mx-auto">
              <SparklesIcon className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-gradient"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            AI Component Playground
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Transform your ideas into beautiful, responsive UI components with
            the power of AI. Describe what you need, and watch it come to life
            instantly.
          </motion.p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center transition-all duration-300 cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <EyeIcon className="w-5 h-5 mr-2" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center transition-all duration-300 cursor-pointer ${
                  activeTab === "code"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Code2 className="w-5 h-5 mr-2" />
                Code
              </button>
              <button
                onClick={() => {
                  setActiveTab("chat");
                  setIsChatOpen(true);
                }}
                className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center transition-all duration-300 cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transform scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Chat
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - History */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 sticky top-24">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                  <RocketLaunchIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {displayedTitle}
                    <span className="animate-pulse text-purple-500">|</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your generated components
                  </p>
                </div>
              </div>

              <div
                ref={historyRef}
                className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
              >
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <motion.div
                      key={item.id || item.timestamp}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-4 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-md transition-all duration-200 group"
                      onClick={() => selectHistoryItem(item)}
                    >
                      <div className="absolute left-4 top-4 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <div className="pl-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-relaxed group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors line-clamp-2">
                          {item.prompt}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(item.timestamp).toLocaleDateString()} •{" "}
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.model?.split("/")[1] || "AI"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="text-center py-12 text-slate-500 dark:text-slate-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LightBulbIcon className="w-8 h-8 text-purple-500" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      No components yet
                    </p>
                    <p className="text-sm">
                      Your generated components will appear here
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Main Content */}
            <div className="lg:col-span-9 space-y-8">
              {/* Input Area – redesigned */}
              <motion.div
                className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 to-cyan-500 shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, delay: 0.8 },
                }}
              >
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
                  <div className="flex items-center mb-6">
                    <motion.div
                      className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mr-4 shadow-lg cursor-pointer"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                        Generate Component
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Describe your component and watch it come to life
                      </p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="prompt"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"
                    >
                      Component Description
                    </label>
                    <div className="relative">
                      <textarea
                        id="prompt"
                        rows="5"
                        className="w-full px-6 py-4 border border-slate-200/60 dark:border-slate-600/60 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 dark:text-white text-lg shadow-inner transition-all duration-300"
                        placeholder="e.g., Create a beautiful hero section with gradient background, animated text, and call-to-action buttons..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            handleGenerate();
                          }
                        }}
                      ></textarea>
                      <div className="absolute right-4 bottom-4 text-xs text-slate-400 bg-white/80 dark:bg-slate-700/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                        Press Ctrl+Enter to generate
                      </div>
                    </div>
                  </div>
                  {error && (
                    <motion.div
                      className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl relative shadow-lg"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs">!</span>
                        </div>
                        {error}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-full sm:w-auto order-2 sm:order-1">
                      <motion.button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-xl text-white py-4 px-8 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl flex justify-center items-center font-semibold text-lg group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isGenerating ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-6 w-6 mr-3" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                            Generate Component
                          </>
                        )}
                      </motion.button>
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-3 order-1 sm:order-2 sm:ml-auto">
                      <div className="flex items-center space-x-2">
                        <CpuChipIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Model:
                        </span>
                      </div>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-white/80 dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 shadow-sm transition-all duration-300"
                      >
                        {models.map((model) => (
                          <option
                            key={model.id}
                            value={model.id}
                            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          >
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tab Content */}
              <motion.div
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                {/* Preview Tab */}
                {activeTab === "preview" && (
                  <div className="min-h-[700px] relative">
                    {/* Preview Header */}
                    <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-600/50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <EyeIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              Component Preview
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Live preview of your generated component
                            </p>
                          </div>
                        </div>
                        {generatedCode && (
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Live</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="h-[650px] relative">
                      {generatedCode ? (
                        <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
                          {/* Professional Preview Header */}
                          <div className="mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60 p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <EyeIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                                    Component Preview
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Live interactive preview of your generated
                                    component
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                  {isEditing ? "Editing Mode" : "Generated"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview Container */}
                          <div className="h-[calc(100%-120px)] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                            <ComponentPreview />
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                          <div className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 text-center">
                            <motion.div
                              className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-bounce-in mx-auto"
                              animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, -2, 0],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <EyeIcon className="h-10 w-10 text-purple-500" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-3 text-slate-700 dark:text-slate-300">
                              Ready to Create
                            </h3>
                            <p className="text-sm text-center leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
                              Describe your component above and click "Generate
                              Component" to see it come to life here.
                            </p>
                            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span>AI-powered component generation</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Code Tab */}
                {activeTab === "code" && (
                  <div className="relative min-h-[700px]">
                    <div className="absolute top-6 right-6 flex space-x-3 z-10">
                      <motion.button
                        onClick={copyToClipboard}
                        className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-lg p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 dark:border-slate-600/50 cursor-pointer"
                        title="Copy to clipboard"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCopied ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        )}
                      </motion.button>
                      <div className="relative">
                        <motion.button
                          onClick={() => setShowDownload(!showDownload)}
                          className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-lg p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 dark:border-slate-600/50 cursor-pointer"
                          title="Download"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </motion.button>
                        {showDownload && (
                          <motion.div
                            className="absolute right-0 mt-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl z-50 w-40 overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <button
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200/50 dark:border-slate-600/50 last:border-b-0"
                              onClick={() => {
                                setDownloadFormat("zip");
                                handleExport();
                                setShowDownload(false);
                              }}
                            >
                              <div className="flex items-center">
                                <ArrowDownTrayIcon className="h-4 w-4 mr-3 text-slate-500" />
                                .zip file
                              </div>
                            </button>
                            <button
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => {
                                setDownloadFormat("jsx");
                                handleExport();
                                setShowDownload(false);
                              }}
                            >
                              <div className="flex items-center">
                                <Code2 className="h-4 w-4 mr-3 text-slate-500" />
                                .jsx file
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </div>
                      {!isEditing ? (
                        <motion.button
                          onClick={() => setIsEditing(true)}
                          className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-lg p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 dark:border-slate-600/50 cursor-pointer"
                          title="Edit code"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <PencilSquareIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </motion.button>
                      ) : (
                        <>
                          <motion.button
                            onClick={applyChanges}
                            className="bg-green-500/90 backdrop-blur-lg p-3 rounded-2xl hover:bg-green-500 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                            title="Apply changes"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <CheckIcon className="h-5 w-5 text-white" />
                          </motion.button>
                          <motion.button
                            onClick={cancelEditing}
                            className="bg-red-500/90 backdrop-blur-lg p-3 rounded-2xl hover:bg-red-500 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                            title="Cancel editing"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <XMarkIcon className="h-5 w-5 text-white" />
                          </motion.button>
                        </>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="pt-20">
                        <textarea
                          value={editedCode}
                          onChange={handleCodeEdit}
                          className="w-full h-[650px] font-mono text-sm p-6 bg-slate-900 text-slate-100 border-none focus:outline-none focus:ring-0 rounded-b-3xl"
                        />
                      </div>
                    ) : (
                      <div className="pt-20">
                        <SyntaxHighlighter
                          language="jsx"
                          style={atomDark}
                          className="rounded-b-3xl text-sm h-[650px] overflow-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800"
                          showLineNumbers
                          customStyle={{
                            margin: 0,
                            borderRadius: "0 0 1.5rem 1.5rem",
                            background: "transparent",
                          }}
                        >
                          {generatedCode ||
                            "// No code generated yet. Create a component first."}
                        </SyntaxHighlighter>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <div className="h-[700px] flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {chatHistory.length > 0 ? (
                        chatHistory.map((message, index) => (
                          <motion.div
                            key={index}
                            className={`mb-6 flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
                                message.role === "user"
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                  : "bg-white/80 dark:bg-slate-700/80 backdrop-blur-lg text-slate-800 dark:text-slate-200 border border-white/20 dark:border-slate-600/50"
                              }`}
                            >
                              <div className="flex items-center mb-2">
                                {message.role === "user" ? (
                                  <UserIcon className="w-5 h-5 mr-2" />
                                ) : (
                                  <SparklesIcon className="w-5 h-5 mr-2 text-purple-500" />
                                )}
                                <span className="font-semibold text-sm">
                                  {message.role === "user" ? "You" : "KarmaAI"}
                                </span>
                              </div>
                              <p className="leading-relaxed">
                                {message.content}
                              </p>
                              {message.code && (
                                <div className="mt-4 text-xs bg-slate-800 p-3 rounded-lg text-slate-200 max-h-40 overflow-y-auto border border-slate-600">
                                  <code>
                                    {message.code.substring(0, 300)}...
                                  </code>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                          <motion.div
                            className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                            animate={{
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <ChatBubbleLeftRightIcon className="h-10 w-10 text-emerald-500" />
                          </motion.div>
                          <h3 className="text-xl font-bold mb-3 text-slate-700 dark:text-slate-300">
                            Start a Conversation
                          </h3>
                          <p className="text-center max-w-md leading-relaxed">
                            Generate a component first, then chat with AI to
                            modify or improve it.
                          </p>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg rounded-b-3xl">
                      <div className="flex">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleGenerate();
                            }
                          }}
                          placeholder="Ask about the component or request changes..."
                          className="flex-1 px-6 py-4 border border-slate-200/60 dark:border-slate-600/60 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 dark:text-white shadow-inner transition-all duration-300 text-lg"
                          rows="3"
                        />
                        <motion.button
                          onClick={handleGenerate}
                          disabled={isGenerating || !prompt.trim()}
                          className="ml-4 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl text-white p-4 rounded-2xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isGenerating ? (
                            <ArrowPathIcon className="animate-spin h-6 w-6" />
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </motion.button>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 text-center">
                        Press Ctrl+Enter to send • AI-powered conversations
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        className="mt-20 py-8 text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl"></div>
        <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 mx-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  © 2026 KarmaAI. All rights reserved.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-slate-500 border-l border-slate-300 dark:border-slate-600 pl-6">
                <UserIcon className="w-4 h-4" />
                <span>{onlineCount} online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
