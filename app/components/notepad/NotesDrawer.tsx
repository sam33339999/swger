"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faPlus, 
  faTrash, 
  faPencilAlt, 
  faGripLines,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog';

// Defining the structure of a note tab
interface NoteTab {
  id: string;
  name: string;
  content: string;
}

interface NotesDrawerProps {
  className?: string;
}

interface NotesState {
  isOpen: boolean;
  tabs: NoteTab[];
  activeTabId: string | null;
  drawerWidth: number;
}

const STORAGE_KEY = 'swger_notes_drawer';

// Default state
const defaultState: NotesState = {
  isOpen: false,
  tabs: [],
  activeTabId: null,
  drawerWidth: 320
};

// Helper function to load state from localStorage
const loadFromStorage = (): NotesState => {
  if (typeof window === 'undefined') return defaultState;
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return defaultState;
    
    const parsedData = JSON.parse(storedData) as Partial<NotesState>;
    
    return {
      isOpen: parsedData.isOpen ?? defaultState.isOpen,
      tabs: parsedData.tabs ?? defaultState.tabs,
      activeTabId: parsedData.activeTabId ?? defaultState.activeTabId,
      drawerWidth: parsedData.drawerWidth ?? defaultState.drawerWidth
    };
  } catch (error) {
    console.error('Error parsing notes data:', error);
    return defaultState;
  }
};

// Helper function to save state to localStorage
const saveToStorage = (state: NotesState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const NotesDrawer: React.FC<NotesDrawerProps> = ({ className = '' }) => {
  // Initialize state from localStorage
  const [state, setState] = useState<NotesState>(defaultState);
  const { isOpen, tabs, activeTabId, drawerWidth } = state;
  
  // For tab editing
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Refs
  const drawerRef = useRef<HTMLDivElement>(null);
  const resizeStartXRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<NotesState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      if (isMountedRef.current) {
        saveToStorage(newState);
      }
      return newState;
    });
  }, []);

  // Load initial state from localStorage
  useEffect(() => {
    const initialState = loadFromStorage();
    setState(initialState);
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(240, Math.min(800, initialWidthRef.current - deltaX));
      updateState({ drawerWidth: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateState]);

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    initialWidthRef.current = drawerWidth;
  };

  // Toggle drawer visibility
  const toggleDrawer = () => {
    updateState({ isOpen: !isOpen });
  };

  // Add a new tab
  const addTab = () => {
    const newTab: NoteTab = {
      id: `note-${Date.now()}`,
      name: `筆記 ${tabs.length + 1}`,
      content: ''
    };
    
    const updatedTabs = [...tabs, newTab];
    updateState({
      tabs: updatedTabs,
      activeTabId: newTab.id
    });
  };

  // Start editing a tab name
  const startEditingTab = (tab: NoteTab) => {
    setEditingTabId(tab.id);
    setEditingTabName(tab.name);
  };

  // Save tab name edit
  const saveTabName = () => {
    if (!editingTabId) return;
    
    const updatedTabs = tabs.map(tab => 
      tab.id === editingTabId ? { ...tab, name: editingTabName.trim() || tab.name } : tab
    );
    
    updateState({ tabs: updatedTabs });
    setEditingTabId(null);
    setEditingTabName('');
  };

  // Delete a tab
  const deleteTab = (id: string) => {
    const updatedTabs = tabs.filter(tab => tab.id !== id);
    
    // If deleting the active tab, select another one
    let newActiveTabId = activeTabId;
    if (activeTabId === id) {
      newActiveTabId = updatedTabs.length > 0 ? updatedTabs[0].id : null;
    }
    
    updateState({
      tabs: updatedTabs,
      activeTabId: newActiveTabId
    });
  };

  // Update content of the active tab
  const updateTabContent = (content: string) => {
    if (!activeTabId) return;
    
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, content } : tab
    );
    
    updateState({ tabs: updatedTabs });
  };

  // Reset all notes data
  const resetAllData = () => {
    updateState({
      tabs: [],
      activeTabId: null,
      drawerWidth: 320
    });
    setShowConfirmDialog(false);
  };

  // Get the active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <>
      {/* Toggle Button */}
      <button 
        className={`fixed top-20 ${isOpen ? 'right-[5px]' : 'right-5'} z-40 bg-primary hover:bg-primary/90 text-white p-2 rounded-full shadow-md`}
        onClick={toggleDrawer}
        aria-label={isOpen ? '關閉筆記面板' : '開啟筆記面板'}
        title={isOpen ? '關閉筆記面板' : '開啟筆記面板'}
      >
        <FontAwesomeIcon icon={isOpen ? faChevronRight : faChevronLeft} className="h-4 w-4" />
      </button>

      {/* Notes Drawer */}
      <aside 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-30 bg-gray-900 shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className} flex flex-col`}
        style={{ width: `${drawerWidth}px` }}
      >
        {/* Resize Handle */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize flex items-center group"
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
        >
          <div className="h-16 w-1 bg-gray-600 group-hover:bg-primary transition-colors" />
        </div>

        {/* Header */}
        <div className="p-3 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faGripLines} className="mr-2 text-gray-400" />
            <h2 className="text-lg font-medium gradient-text">筆記面板</h2>
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="danger" 
              size="sm" 
              icon={faTrash}
              title="清除所有筆記"
              onClick={() => setShowConfirmDialog(true)} 
            >
              清除
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-800 overflow-auto flex bg-gray-800">
          <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <div className="flex">
              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`group min-w-[120px] max-w-[200px] flex items-center justify-between py-2 px-3 border-r border-gray-800 cursor-pointer ${
                    tab.id === activeTabId ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => updateState({ activeTabId: tab.id })}
                >
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={editingTabName}
                      onChange={e => setEditingTabName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveTabName()}
                      onBlur={saveTabName}
                      className="bg-gray-600 text-gray-100 px-1 py-0.5 text-sm rounded outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="truncate text-sm flex-1">{tab.name}</span>
                      <div className="flex space-x-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={e => { e.stopPropagation(); startEditingTab(tab); }}
                          className="text-gray-400 hover:text-white p-0.5"
                          title="重命名標籤"
                        >
                          <FontAwesomeIcon icon={faPencilAlt} className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={e => { e.stopPropagation(); deleteTab(tab.id); }}
                          className="text-gray-400 hover:text-red-400 p-0.5"
                          title="刪除標籤"
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button 
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
            onClick={addTab}
            title="新增標籤"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 bg-gray-800 bg-opacity-30">
          {activeTab ? (
            <textarea
              value={activeTab.content}
              onChange={e => updateTabContent(e.target.value)}
              className="w-full h-full p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:border-primary resize-none"
              placeholder="在這裡輸入筆記內容..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="mb-4">還沒有筆記標籤</p>
              <Button 
                variant="primary" 
                size="sm" 
                icon={faPlus} 
                onClick={addTab}
              >
                建立標籤
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>確認清除</DialogTitle>
          <div className="py-4">
            <p className="text-gray-300">確定要清除所有筆記資料嗎？此操作將刪除所有標籤和內容，且無法恢復。</p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowConfirmDialog(false)}
            >
              取消
            </Button>
            <Button 
              variant="danger" 
              icon={faTrash} 
              onClick={resetAllData}
            >
              清除所有資料
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotesDrawer;