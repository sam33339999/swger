"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";

// Define types for our tabs
interface NotepadTab {
  id: string;
  name: string;
  content: string;
}

export const Notepad = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [tabs, setTabs] = useState<NotepadTab[]>([
    { id: "tab-1", name: "Tab 1", content: "" }
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load stored data from localStorage on component mount
  useEffect(() => {
    try {
      // Load drawer state
      const savedIsOpen = localStorage.getItem("notepadIsOpen");
      if (savedIsOpen) {
        setIsOpen(savedIsOpen === "true");
      }

      // Load drawer width
      const savedWidth = localStorage.getItem("notepadWidth");
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= 300) {
          setWidth(parsedWidth);
        }
      }

      // Load tabs
      const savedTabs = localStorage.getItem("notepadTabs");
      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs);
          if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
            setTabs(parsedTabs);
            
            // Load active tab
            const savedActiveTab = localStorage.getItem("notepadActiveTab");
            // Verify the saved active tab exists in the loaded tabs
            if (savedActiveTab && parsedTabs.some(tab => tab.id === savedActiveTab)) {
              setActiveTabId(savedActiveTab);
            } else {
              // Default to the first tab if the saved active tab doesn't exist
              setActiveTabId(parsedTabs[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to parse saved tabs:", e);
        }
      }
      
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading notepad data from localStorage:", error);
      setHasInitialized(true);
    }
  }, []);

  // Save all data to localStorage when relevant state changes
  useEffect(() => {
    if (!hasInitialized) return;
    
    try {
      localStorage.setItem("notepadIsOpen", String(isOpen));
      localStorage.setItem("notepadWidth", String(width));
      localStorage.setItem("notepadTabs", JSON.stringify(tabs));
      localStorage.setItem("notepadActiveTab", activeTabId);
    } catch (error) {
      console.error("Error saving notepad data to localStorage:", error);
    }
  }, [isOpen, width, tabs, activeTabId, hasInitialized]);

  // Auto focus on rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const toggleNotepad = () => {
    setIsOpen(!isOpen);
  };

  const handleContentChange = (content: string) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content } 
        : tab
    ));
  };

  const addNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    setTabs([...tabs, { id: newTabId, name: `Tab ${tabs.length + 1}`, content: "" }]);
    setActiveTabId(newTabId);
  };

  const removeTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (tabs.length === 1) {
      // Don't allow removing the last tab - clear it instead
      setTabs([{ id: tabId, name: "Tab 1", content: "" }]);
      return;
    }

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // If we're removing the active tab, switch to another tab
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const startRenameTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setIsRenaming(tabId);
      setNewTabName(tab.name);
    }
  };

  const finishRenameTab = () => {
    if (!isRenaming) return;
    
    setTabs(tabs.map(tab => 
      tab.id === isRenaming 
        ? { ...tab, name: newTabName || `Tab ${tabs.findIndex(t => t.id === tab.id) + 1}` } 
        : tab
    ));
    
    setIsRenaming(null);
    setNewTabName("");
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate the new width based on mouse position
      // We're resizing from left edge, so subtract from window width
      const newWidth = Math.max(300, window.innerWidth - e.clientX);
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // Find current active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  const confirmClearAll = () => {
    setShowClearConfirm(true);
  };

  const clearAllNotes = () => {
    // Clear all tab contents but keep the structure
    setTabs(tabs.map(tab => ({ ...tab, content: "" })));
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Drawer toggle button */}
      <div 
        className={`fixed top-1/2 right-0 -translate-y-1/2 transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <Button
          variant="dark"
          size="sm"
          className="shadow-md rounded-l-md rounded-r-none py-8 px-2 text-white"
          onClick={toggleNotepad}
        >
          {isOpen ? ">" : "備忘錄"}
        </Button>
      </div>

      {/* Resize handle that appears when dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}

      {/* Drawer container */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: `${width}px`,
          maxWidth: "90vw"
        }}
      >
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700">
          {/* Resize handle */}
          <div 
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 group"
            onMouseDown={startResize}
          >
            <div className="absolute top-1/2 left-0 w-1 h-12 -translate-y-1/2 bg-blue-500 opacity-0 group-hover:opacity-100"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-700 dark:text-white mr-4">備忘錄</h3>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmClearAll}
                className="text-xs text-white"
              >
                清空
              </Button>
            </div>
            <Button
              variant="dark"
              size="sm"
              onClick={toggleNotepad}
              className="p-1 text-gray-700 dark:text-white"
            >
              ✕
            </Button>
          </div>
          
          {/* Tab Bar */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center min-w-[100px] max-w-[200px] px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer ${
                  activeTabId === tab.id 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isRenaming === tab.id ? (
                  <input 
                    ref={renameInputRef}
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    onBlur={finishRenameTab}
                    onKeyDown={(e) => e.key === 'Enter' && finishRenameTab()}
                    className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                  />
                ) : (
                  <>
                    <span 
                      className="flex-1 truncate"
                      onDoubleClick={(e) => startRenameTab(tab.id, e)}
                    >
                      {tab.name}
                    </span>
                    <button
                      onClick={(e) => removeTab(tab.id, e)}
                      className="ml-2 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
            <Button
              variant="dark"
              size="sm"
              onClick={addNewTab}
              className="min-w-[30px] px-2 text-gray-700 dark:text-white"
            >
              +
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            <textarea
              ref={textareaRef}
              value={activeTab?.content || ""}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="輸入您的筆記..."
              className="w-full h-full p-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              style={{ minHeight: "calc(100vh - 150px)" }}
            />
          </div>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">確認清除所有筆記</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              您確定要清除所有筆記嗎？此操作無法撤銷。
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="dark"
                onClick={cancelClear}
                className="text-gray-700 dark:text-white"
              >
                取消
              </Button>
              <Button
                variant="warning"
                onClick={clearAllNotes}
                className="text-red-500 dark:text-red-400"
              >
                確認清除
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notepad;