'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
// Additional minimal icon set from lucide-react for new navbar
import { ChevronDown, ArrowRight, LayoutGrid, Settings as SettingsIcon, HelpCircle, LogOut } from 'lucide-react';
import PropertyEditor from '../components/PropertyEditor';
import JSZip from 'jszip';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <img
          src={user.image || '/default-avatar.png'}
          alt="User"
          className="w-8 h-8 rounded-full border-2 border-amber-400"
        />
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
            onClick={() => signOut({ callbackUrl: '/' })}
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
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [history, setHistory] = useState([]);
  const [previewKey, setPreviewKey] = useState(0);
  const [editedCode, setEditedCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const [models, setModels] = useState([
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast & economical' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Advanced capabilities' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast & efficient' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Balanced performance' }
  ]);
  const chatEndRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const historyRef = useRef(null); // ref for auto-scrolling
  // New state for property editor
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const iframeRef = useRef(null);
  // Add new state
  const [downloadFormat, setDownloadFormat] = useState('jsx');
  // add state showDownload near others
  const [showDownload, setShowDownload] = useState(false);

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
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
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
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      if (isProfileMenuOpen && !event.target.closest('.user-dropdown')) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const fetchUserHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setChatHistory(data.chatHistory || []);
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
    }
  };

  // Update the handleGenerate function to handle available models response
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the component you want to generate.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Add user message to chat history
      const newChatHistory = [
        ...chatHistory,
        { role: 'user', content: prompt }
      ];
      setChatHistory(newChatHistory);

      let response;

      // If element selected and we are in chat tab -> override mode
      if (activeTab === 'chat' && selectedElement) {
        response = await fetch('/api/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, code: generatedCode, selectedElement })
        });
      } else {
        // Standard generate
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt,
            chatHistory: newChatHistory.slice(-3),
            model: selectedModel
          }),
        });
      }
 
      const data = await response.json();
 
      if (!response.ok) {
        // Handle API error
        const errorMessage = data.message || 'Failed to generate code';
        
        // If we got available models back, update our models list
        if (data.availableModels && Array.isArray(data.availableModels) && data.availableModels.length > 0) {
          // Create a new models array with the available models
          const updatedModels = data.availableModels.map(modelId => {
            // Try to match with our existing models
            const existingModel = models.find(m => modelId.includes(m.id.split('/')[0]));
            if (existingModel) {
              return {
                id: modelId,
                name: existingModel.name,
                description: 'Available model'
              };
            }
            
            // Otherwise create a generic entry
            const parts = modelId.split('/');
            return {
              id: modelId,
              name: parts[1] || modelId,
              description: `From ${parts[0] || 'provider'}`
            };
          });
          
          // Update models array and select the first available model
          setModels(updatedModels);
          if (updatedModels.length > 0) {
            setSelectedModel(updatedModels[0].id);
            setError(`${errorMessage} - Updated to available models. Please try again.`);
            setIsGenerating(false);
            return;
          }
        }
        
        throw new Error(errorMessage);
      }

      // On override update code but do not push to history
      if (activeTab === 'chat' && selectedElement) {
        setGeneratedCode(data.code);
        setEditedCode(data.code);
        setPreviewKey(k => k + 1);
      } else {
        setGeneratedCode(data.code);
        setEditedCode(data.code);

        // Add AI response to chat history
        setChatHistory([
          ...newChatHistory,
          { role: 'assistant', content: data.message || 'Here is the component you requested.', code: data.code }
        ]);

        // Add to history
        const newHistoryItem = {
          id: Date.now(),
          prompt,
          code: data.code,
          timestamp: new Date().toISOString(),
          model: selectedModel
        };
        setHistory(prev => {
          const updated = [newHistoryItem, ...prev.slice(0, 19)];
          // smooth scroll to top so user sees the new entry
          setTimeout(() => {
            if (historyRef.current) {
              historyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 100);
          return updated;
        });
        saveHistory(newHistoryItem);
      }
      if (!(activeTab === 'chat' && selectedElement)) {
        setPreviewKey(prevKey => prevKey + 1);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      
      // Check if error is related to credits
      const errorMsg = error.message || 'Failed to generate code. Please try again.';
      setError(errorMsg);
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: errorMsg.includes('credits') 
            ? 'Sorry, I ran out of API credits. Please try a simpler prompt or contact the administrator to upgrade the account.'
            : 'Sorry, I encountered an error while generating the code. Please try again with a different prompt.'
        }
      ]);
    } finally {
      setIsGenerating(false);
      setPrompt(''); // Clear input after generating
    }
  };

  const saveHistory = async (historyItem) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historyItem,
          chatHistory
        }),
      });
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handleExport = async () => {
    const codeToExport = isEditing ? editedCode : generatedCode;

    if (downloadFormat === 'jsx') {
      const blob = new Blob([codeToExport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Component.jsx';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // zip format
      const zip = new JSZip();
      zip.file('Component.jsx', codeToExport);
      // Optionally add README or CSS files here
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'component.zip';
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
    setPreviewKey(prevKey => prevKey + 1);
  };

  const cancelEditing = () => {
    setEditedCode(generatedCode);
    setIsEditing(false);
  };

  const selectHistoryItem = (item) => {
    setGeneratedCode(item.code);
    setEditedCode(item.code);
    setPreviewKey(prevKey => prevKey + 1);
    setActiveTab('preview');
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
        isButtonComponent = extractedJSX.toLowerCase().includes('<button') || 
                            extractedJSX.toLowerCase().includes('btn') || 
                            extractedJSX.toLowerCase().includes('button');
        
        // Convert React className to HTML class
        extractedJSX = extractedJSX.replace(/className=/g, 'class=');
        
        // Remove any React-specific attributes
        extractedJSX = extractedJSX.replace(/\{[^{}]*\}/g, (match) => {
          // Keep string literals inside curly braces
          if (match.includes('"') || match.includes("'")) {
            return match.replace(/[{}]/g, '').replace(/["']/g, '');
          }
          return '';
        });
      }
    } catch (error) {
      console.error("Error extracting JSX:", error);
    }

    // If we couldn't extract JSX, use a fallback
    if (!extractedJSX) {
      extractedJSX = '<div class="p-4 text-center text-gray-500">Preview not available</div>';
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
              ${isButtonComponent ? 'transform: scale(1.5);' : ''}
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
          className={`w-full border-0 rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-full min-h-[500px]'}`}
          title="Component Preview"
          sandbox="allow-scripts"
          onLoad={() => {
            // Add a small delay to ensure the iframe content is fully loaded
            setTimeout(() => {
              if (iframeRef.current) {
                try {
                  // Reinitialize interactive elements
                  iframeRef.current.contentWindow.postMessage({ type: 'reinitialize' }, '*');
                } catch (error) {
                  console.error('Error communicating with iframe:', error);
                }
              }
            }, 200);
          }}
        />
        
        {/* Refresh and fullscreen controls */}
        <div className={`absolute top-4 right-4 flex items-center space-x-2 bg-gray-800 bg-opacity-80 p-2 rounded-md shadow-md ${isFullscreen ? 'z-60' : 'z-10'}`}>
          <button
            onClick={() => setPreviewKey(prevKey => prevKey + 1)}
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
      if (event.data && event.data.type === 'element-selected') {
        const elementData = event.data.element;
        
        // Extract useful properties from computed style
        const computedStyle = elementData.computedStyle || {};
        
        // Create a more structured element object with parsed properties
        const element = {
          tagName: elementData.tagName,
          id: elementData.id,
          className: elementData.className,
          text: elementData.text || '',
          padding: parseInt(computedStyle.padding) || 4,
          fontSize: parseInt(computedStyle.fontSize) || 16,
          backgroundColor: computedStyle.backgroundColor || '#3B82F6',
          textColor: computedStyle.color || '#FFFFFF',
          borderRadius: parseInt(computedStyle.borderRadius) || 4,
          borderWidth: parseInt(computedStyle.borderWidth) || 0,
          borderColor: computedStyle.borderColor || '#000000',
          shadowSize: computedStyle.boxShadow && computedStyle.boxShadow !== 'none' ? 
            (computedStyle.boxShadow.includes('10px') ? 4 : 
             computedStyle.boxShadow.includes('4px') ? 2 : 1) : 0
        };
        
        // Add a success notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out';
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
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle property editor updates
  const handlePropertyUpdate = (updatedCode) => {
    setEditedCode(updatedCode);
    setGeneratedCode(updatedCode);
    
    // Delay the preview refresh to ensure the code is fully updated
    setTimeout(() => {
      setPreviewKey(prevKey => prevKey + 1);
    }, 50);
    
    // Do NOT save property-editor-only changes to history
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Update the main UI of the playground page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Inject global styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        .animate-fade-in-out {
          animation: fadeInOut 2s forwards;
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
        className="fixed top-0 left-0 right-0 z-40 bg-gray-900 bg-opacity-60 backdrop-blur-md"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              className="w-9 h-9"
            >
              <Image
                src="/globe.svg"
                alt="KarmaAI logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
                priority
              />
            </motion.div>
            <span className="text-xl font-bold text-gray-200">KarmaAI</span>
          </Link>
          {session?.user && <UserMenu user={session.user} />}
        </div>
      </motion.nav>
      
      {/* Add animation keyframes for the dropdown */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Rest of the page content */}
      <div className="container mx-auto px-4 py-6 pt-28">
        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 cursor-pointer text-sm font-medium flex items-center ${
              activeTab === 'preview'
                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-6 py-3 cursor-pointer text-sm font-medium flex items-center ${
              activeTab === 'code'
                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CodeBracketIcon className="w-4 h-4 mr-2" />
            Code
          </button>
          <button
            onClick={() => {
              setActiveTab('chat');
              setIsChatOpen(true);
            }}
            className={`px-6 py-3 cursor-pointer text-sm font-medium flex items-center ${
              activeTab === 'chat'
                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            Chat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - History */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Component History
              </h2>
              
              <div ref={historyRef} className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {history.map((item) => (
                      <motion.div
                        key={item.id || item.timestamp}
                        layout
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
                        exit={{ opacity: 0, x: -30 }}
                        whileHover={{ scale: 1.03 }}
                        className="relative pl-5 py-3 bg-white/70 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-lg cursor-pointer hover:shadow-lg"
                        onClick={() => selectHistoryItem(item)}
                      >
                        <span className="absolute left-2 top-4 w-2 h-2 bg-gradient-to-r from-fuchsia-500 to-amber-400 rounded-full"></span>
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate pr-6">{item.prompt}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No components generated yet</p>
                    <p className="text-sm mt-2">Your history will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Input Area – redesigned */}
            <motion.div 
              className="relative overflow-hidden rounded-2xl p-1 bg-gradient-to-r from-fuchsia-600 via-amber-500 to-red-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-6">
                <div className="flex items-center mb-6">
                  <svg className="h-8 w-8 text-amber-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-amber-500 to-red-500">Generate Component</h2>
                </div>
              <div className="mb-4">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe the component you want to create
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 dark:text-white"
                    placeholder="e.g., Make an amazing card with image component using Tailwind CSS"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleGenerate();
                      }
                    }}
                  ></textarea>
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    Press Ctrl+Enter to generate
                  </div>
                </div>
              </div>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-auto order-2 sm:order-1">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-600 to-red-500 shadow-lg text-white py-3 px-6 rounded-lg hover:-translate-y-0.5 hover:shadow-2xl transition disabled:opacity-50 flex justify-center items-center"
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" />
                        Generating...
                      </>
                    ) : (
                      'Generate Component'
                    )}
                  </button>
                </div>
                
                <div className="w-full sm:w-auto flex items-center gap-2 order-1 sm:order-2 sm:ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/60 backdrop-blur border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {models.map(model => (
                      <option key={model.id} value={model.id} className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            </motion.div>

            {/* Tab Content */}
            <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60">
              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="h-[600px]">
                  {generatedCode ? (
                    <ComponentPreview />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium mb-2">No component generated yet</p>
                      <p className="text-sm">Describe a component above and click "Generate Component"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Code Tab */}
              {activeTab === 'code' && (
                <div className="relative">
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button
                      onClick={copyToClipboard}
                      className="bg-white dark:bg-gray-700 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm"
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDownload(!showDownload)}
                        className="bg-white dark:bg-gray-700 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </button>
                      {showDownload && (
                        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 w-32">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => {setDownloadFormat('zip'); handleExport(); setShowDownload(false);}}>.zip</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => {setDownloadFormat('jsx'); handleExport(); setShowDownload(false);}}>.jsx</button>
                        </div>
                      )}
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white dark:bg-gray-700 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm"
                        title="Edit code"
                      >
                        <PencilSquareIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={applyChanges}
                          className="bg-green-500 p-2 rounded-md hover:bg-green-600 transition shadow-sm"
                          title="Apply changes"
                        >
                          <CheckIcon className="h-5 w-5 text-white" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-red-500 p-2 rounded-md hover:bg-red-600 transition shadow-sm"
                          title="Cancel editing"
                        >
                          <XMarkIcon className="h-5 w-5 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="pt-14">
                      <textarea
                        value={editedCode}
                        onChange={handleCodeEdit}
                        className="w-full h-[600px] font-mono text-sm p-4 bg-gray-900 text-gray-100 border-none focus:outline-none focus:ring-0"
                      />
                    </div>
                  ) : (
                    <div className="pt-14">
                      <SyntaxHighlighter
                        language="jsx"
                        style={atomDark}
                        className="rounded-md text-sm h-[600px] overflow-auto"
                        showLineNumbers
                      >
                        {generatedCode || '// No code generated yet. Create a component first.'}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="h-[600px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    {chatHistory.length > 0 ? (
                      chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.role === 'user'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <p>{message.content}</p>
                            {message.code && (
                              <div className="mt-2 text-xs bg-gray-800 p-2 rounded text-gray-200 max-h-40 overflow-y-auto">
                                <code>{message.code.substring(0, 200)}...</code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4" />
                        <p className="text-lg font-medium mb-2">No conversation yet</p>
                        <p className="text-sm">Start by generating a component or asking a question</p>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleGenerate();
                          }
                        }}
                        placeholder="Ask about the component or request changes..."
                        className="flex-1 px-4 py-2 border border-gray-300/60 dark:border-gray-600/60 rounded-l-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                        rows="2"
                      />
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg transition disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <ArrowPathIcon className="animate-spin h-5 w-5" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to send</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6 text-center text-gray-400 bg-transparent">
        Made with <span className="text-red-500">❤️</span> by Indian Developer
      </footer>
    </div>
  );
} 
