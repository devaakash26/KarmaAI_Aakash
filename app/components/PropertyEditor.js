'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, ChevronDown, ChevronUp, Palette, Type, Square, Circle, Box, Layers, RotateCcw } from 'lucide-react';

/**
 * PropertyEditor Component
 * 
 * A floating panel that allows editing properties of selected elements in the component preview
 * 
 * @param {Object} props
 * @param {Object} props.selectedElement - The currently selected element data
 * @param {Function} props.onClose - Function to call when closing the editor
 * @param {Function} props.onUpdate - Function to update the component code with new properties
 * @param {string} props.componentCode - The current component code
 */
export default function PropertyEditor({ selectedElement, onClose, onUpdate, componentCode }) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('style');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Element properties state
  const [properties, setProperties] = useState({
    padding: 4,
    fontSize: 16,
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 0,
    borderColor: '#000000',
    text: 'Button',
    shadowSize: 0
  });

  const editorRef = useRef(null);
  const textInputRef = useRef(null);
  
  // Initialize properties based on selected element
  useEffect(() => {
    if (selectedElement) {
      // Extract properties from the selected element
      // This is a simplified example - in a real implementation,
      // you would parse the element's actual styles
      setProperties({
        padding: selectedElement.padding || 4,
        fontSize: selectedElement.fontSize || 16,
        backgroundColor: selectedElement.backgroundColor || '#3B82F6',
        textColor: selectedElement.textColor || '#FFFFFF',
        borderRadius: selectedElement.borderRadius || 4,
        borderWidth: selectedElement.borderWidth || 0,
        borderColor: selectedElement.borderColor || '#000000',
        text: selectedElement.text || 'Button',
        shadowSize: selectedElement.shadowSize || 0
      });
    }
  }, [selectedElement]);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.property-controls')) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle property changes
  const handlePropertyChange = (property, value) => {
    setProperties(prev => {
      const prevValue = prev[property];
      // store last change for effect
      lastChangeRef.current = { prop: property, prev: prevValue };
      return { ...prev, [property]: value };
    });
  };

  // Ref to remember last changed property
  const lastChangeRef = useRef({ prop: null, prev: null });

  // Defer updating parent component after render commit
  useEffect(() => {
    const { prop, prev } = lastChangeRef.current;
    if (!prop) return;
    const currentValue = properties[prop];
    updateComponentCode(prop, currentValue, prev);

    // Reset ref to avoid duplicate updates
    lastChangeRef.current = { prop: null, prev: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  // Show tooltip on hover
  const handleShowTooltip = (text, e) => {
    setTooltipText(text);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleHideTooltip = () => {
    setShowTooltip(false);
  };

  // Update component code based on property changes
  const escapeRegExp = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const updateComponentCode = (property, value, prevValue = '') => {
    let updatedCode = componentCode;
    
    // This is a simplified example of how you might update the code
    // In a real implementation, you would use a proper JSX/CSS parser
    
    switch (property) {
      case 'padding':
        // Update padding in className or style
        updatedCode = updatedCode.replace(
          /p-\d+/g, 
          `p-${value}`
        );
        break;
      case 'fontSize':
        // Update font size in className or style
        updatedCode = updatedCode.replace(
          /text-\w+/g, 
          `text-${getFontSizeClass(value)}`
        );
        break;
      case 'backgroundColor': {
        const colorClass = getTailwindColor(value);
        if (colorClass) {
          if (updatedCode.includes('bg-')) {
            updatedCode = updatedCode.replace(/bg-\w+-\d+/g, `bg-${colorClass}`);
          } else {
            updatedCode = updatedCode.replace(/className="/, `className="bg-${colorClass} `);
          }
        } else {
          // inline style fallback
          updatedCode = updatedCode.replace(/<${selectedElement.tagName}/i, match => `${match} style={{backgroundColor: '${value}'}}`);
        }
        break;
      }
      case 'textColor': {
        const colorClass = getTailwindColor(value);
        if (colorClass) {
          updatedCode = updatedCode.replace(/text-\w+-\d+/g, `text-${colorClass}`);
        } else {
          updatedCode = updatedCode.replace(/<${selectedElement.tagName}/i, match => `${match} style={{color: '${value}'}}`);
        }
        break;
      }
      case 'text': {
        const tagName = selectedElement.tagName.toLowerCase();
        // Try to replace using previous value to avoid duplication
        if (prevValue) {
          const prevEscaped = escapeRegExp(prevValue);
          const prevRegex = new RegExp(`(<${tagName}[^>]*>)${prevEscaped}(<\\/${tagName}>)`, 'i');
          if (prevRegex.test(updatedCode)) {
            updatedCode = updatedCode.replace(prevRegex, `$1${value}$2`);
            break;
          }
        }

        // Fallback: replace first occurrence of text inside the selected tag
        const regex = new RegExp(`<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        updatedCode = updatedCode.replace(regex, (full, attrs, inner) => {
          // Avoid replacing nested HTML
          if (/<[a-z][\s\S]*>/i.test(inner)) return full;
          return `<${tagName}${attrs}>${value}</${tagName}>`;
        });
        break;
      }
      case 'borderRadius':
        // Update border radius
        updatedCode = updatedCode.replace(
          /rounded-\w+/g,
          `rounded-${getBorderRadiusClass(value)}`
        );
        break;
      case 'borderWidth':
        // Update border width
        if (value > 0) {
          if (updatedCode.includes('border-')) {
            updatedCode = updatedCode.replace(
              /border-\d+/g,
              `border-${value}`
            );
          } else {
            updatedCode = updatedCode.replace(
              /className="/,
              `className="border border-${value} `
            );
          }
        }
        break;
      case 'shadowSize':
        // Update shadow
        if (value > 0) {
          const shadowClass = getShadowClass(value);
          if (updatedCode.includes('shadow-')) {
            updatedCode = updatedCode.replace(
              /shadow-\w+/g,
              shadowClass
            );
          } else {
            updatedCode = updatedCode.replace(
              /className="/,
              `className="${shadowClass} `
            );
          }
        }
        break;
      default:
        break;
    }
    
    // Call the onUpdate function with the updated code
    onUpdate(updatedCode);
  };

  // Helper functions to convert values to Tailwind classes
  const getFontSizeClass = (size) => {
    if (size <= 12) return 'xs';
    if (size <= 14) return 'sm';
    if (size <= 16) return 'base';
    if (size <= 18) return 'lg';
    if (size <= 20) return 'xl';
    if (size <= 24) return '2xl';
    if (size <= 30) return '3xl';
    if (size <= 36) return '4xl';
    if (size <= 48) return '5xl';
    return '6xl';
  };

  const getBorderRadiusClass = (radius) => {
    if (radius <= 0) return 'none';
    if (radius <= 2) return 'sm';
    if (radius <= 4) return 'md';
    if (radius <= 6) return 'lg';
    if (radius <= 8) return 'xl';
    if (radius <= 12) return '2xl';
    if (radius <= 16) return '3xl';
    return 'full';
  };

  const getShadowClass = (size) => {
    if (size <= 0) return '';
    if (size <= 1) return 'shadow-sm';
    if (size <= 2) return 'shadow';
    if (size <= 3) return 'shadow-md';
    if (size <= 4) return 'shadow-lg';
    if (size <= 5) return 'shadow-xl';
    return 'shadow-2xl';
  };

  const tailwindMap = {
    '#EF4444': 'red-500',
    '#F97316': 'orange-500',
    '#F59E0B': 'amber-500',
    '#EAB308': 'yellow-500',
    '#84CC16': 'lime-500',
    '#22C55E': 'green-500',
    '#10B981': 'emerald-500',
    '#14B8A6': 'teal-500',
    '#06B6D4': 'cyan-500',
    '#0EA5E9': 'sky-500',
    '#3B82F6': 'blue-500',
    '#6366F1': 'indigo-500',
    '#8B5CF6': 'violet-500',
    '#A855F7': 'purple-500',
    '#D946EF': 'fuchsia-500',
    '#EC4899': 'pink-500',
    '#F43F5E': 'rose-500',
    '#000000': 'black',
    '#FFFFFF': 'white',
  };

  const getTailwindColor = (hexColor) => tailwindMap[hexColor.toUpperCase()] || '';

  if (!selectedElement) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={editorRef}
          className="fixed z-50 shadow-2xl rounded-lg overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            cursor: isDragging ? 'grabbing' : 'grab',
            width: isCollapsed ? 'auto' : '320px'
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Header */}
          <div 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 flex justify-between items-center"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center">
              <span className="font-semibold">Property Editor</span>
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">{selectedElement.tagName || 'Element'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="p-1 hover:bg-white/20 rounded transition-colors"
                onMouseEnter={(e) => handleShowTooltip(isCollapsed ? 'Expand' : 'Collapse', e)}
                onMouseLeave={handleHideTooltip}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <Minimize2 size={16} />}
              </button>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-white/20 rounded transition-colors"
                onMouseEnter={(e) => handleShowTooltip('Close', e)}
                onMouseLeave={handleHideTooltip}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isCollapsed && (
            <div className="bg-white dark:bg-gray-800 property-controls">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('style')}
                  className={`flex-1 py-2 px-4 text-sm font-medium flex justify-center items-center gap-1.5 ${
                    activeTab === 'style'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Palette size={16} />
                  <span>Style</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 px-4 text-sm font-medium flex justify-center items-center gap-1.5 ${
                    activeTab === 'text'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Type size={16} />
                  <span>Text</span>
                </button>
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`flex-1 py-2 px-4 text-sm font-medium flex justify-center items-center gap-1.5 ${
                    activeTab === 'layout'
                      ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Layers size={16} />
                  <span>Layout</span>
                </button>
              </div>

              <div className="p-4">
                {/* Style Tab */}
                {activeTab === 'style' && (
                  <div className="space-y-4">
                    {/* Color Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Background
                        </label>
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 mr-2"
                            style={{ backgroundColor: properties.backgroundColor }}
                          ></div>
                          <input
                            type="color"
                            value={properties.backgroundColor}
                            onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                            className="w-full h-8 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 mr-2"
                            style={{ backgroundColor: properties.textColor }}
                          ></div>
                          <input
                            type="color"
                            value={properties.textColor}
                            onChange={(e) => handlePropertyChange('textColor', e.target.value)}
                            className="w-full h-8 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Border Controls */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                        <span>Border Radius: {properties.borderRadius}px</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getBorderRadiusClass(properties.borderRadius)}
                        </span>
                      </label>
                      <div className="flex items-center">
                        <Square size={16} className="text-gray-400 mr-2" />
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={properties.borderRadius}
                          onChange={(e) => handlePropertyChange('borderRadius', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <Circle size={16} className="text-gray-400 ml-2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                        <span>Border Width: {properties.borderWidth}px</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={properties.borderWidth}
                        onChange={(e) => handlePropertyChange('borderWidth', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Shadow Control */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                        <span>Shadow</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {properties.shadowSize > 0 ? getShadowClass(properties.shadowSize) : 'None'}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={properties.shadowSize}
                        onChange={(e) => handlePropertyChange('shadowSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Text Tab */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    {/* Text Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Text Content
                      </label>
                      <textarea
                        ref={textInputRef}
                        value={properties.text}
                        onChange={(e) => handlePropertyChange('text', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                        <span>Font Size: {properties.fontSize}px</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getFontSizeClass(properties.fontSize)}
                        </span>
                      </label>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-2">A</span>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={properties.fontSize}
                          onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg text-gray-500 ml-2">A</span>
                      </div>
                    </div>

                    {/* Text preview */}
                    <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                      <div 
                        className="p-2 rounded-md"
                        style={{ 
                          backgroundColor: properties.backgroundColor,
                          color: properties.textColor,
                          fontSize: `${properties.fontSize}px`,
                          borderRadius: `${properties.borderRadius}px`,
                          borderWidth: `${properties.borderWidth}px`,
                          borderStyle: properties.borderWidth > 0 ? 'solid' : 'none',
                          borderColor: properties.borderColor,
                          boxShadow: properties.shadowSize > 0 ? 
                            properties.shadowSize === 1 ? '0 1px 2px rgba(0,0,0,0.1)' :
                            properties.shadowSize === 2 ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' :
                            properties.shadowSize === 3 ? '0 4px 6px rgba(0,0,0,0.1)' :
                            properties.shadowSize === 4 ? '0 10px 15px rgba(0,0,0,0.1)' :
                            properties.shadowSize === 5 ? '0 15px 25px rgba(0,0,0,0.15)' :
                            '0 20px 30px rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        {properties.text || 'Text Preview'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                        <span>Padding: {properties.padding}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">p-{properties.padding}</span>
                      </label>
                      <div className="flex items-center">
                        <Box size={14} className="text-gray-400 mr-2" />
                        <input
                          type="range"
                          min="0"
                          max="12"
                          value={properties.padding}
                          onChange={(e) => handlePropertyChange('padding', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <Box size={20} className="text-gray-400 ml-2" />
                      </div>
                    </div>

                    {/* Layout preview */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="flex justify-center items-center">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center" style={{ padding: `${8 + properties.padding * 4}px` }}>
                          <div 
                            className="bg-indigo-100 dark:bg-indigo-900 text-center text-xs text-indigo-800 dark:text-indigo-200 rounded"
                            style={{ padding: '8px', minWidth: '60px' }}
                          >
                            Content
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center text-xs text-gray-500">
                        Padding: {properties.padding} ({properties.padding * 4}px)
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <button
                  onClick={() => {
                    // Reset all properties to default
                    const defaultProps = {
                      padding: 4,
                      fontSize: 16,
                      backgroundColor: '#3B82F6',
                      textColor: '#FFFFFF',
                      borderRadius: 4,
                      borderWidth: 0,
                      borderColor: '#000000',
                      text: 'Button',
                      shadowSize: 0
                    };
                    
                    setProperties(defaultProps);
                    
                    // Update all properties at once
                    Object.entries(defaultProps).forEach(([key, value]) => {
                      updateComponentCode(key, value, properties[key]);
                    });
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset to Default
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="fixed bg-black text-white text-xs py-1 px-2 rounded pointer-events-none z-[60] opacity-80"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 30
          }}
        >
          {tooltipText}
        </div>
      )}
    </>
  );
} 