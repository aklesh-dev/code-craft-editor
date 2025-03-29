import { CodeEditorState } from "@/types";
import { Monaco } from "@monaco-editor/react";
import { create } from "zustand";


const getInitialState = () => {
  // *If we are on the server, return default values
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      fontSize: 16,
      theme: "vs-dark",
    }
  }

  // *If we are on the client, get the values from local storage bez localStorage is a browser API
  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedFontSize = localStorage.getItem("editor-font-size") || 16;
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";

  return {
    language: savedLanguage,
    fontSize: Number(savedFontSize),
    theme: savedTheme,
  }
  
};


export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  const initialState = getInitialState();
  return {
    ...initialState,
    output: "",
    isRunning: false,
    error: null,
    editor: null,
    executionResult: null,

    getCode: () => get().editor?.getValue() || "",

    setEditor: (editor: Monaco) => {
      const savedCode = localStorage.getItem(`editor-code-${get().language}`);
      if (savedCode) editor.setValue(savedCode);
      
      set({ editor });
    },

    setTheme: (theme: string) => {
      localStorage.setItem("editor-theme", theme);
      set({ theme });
    },

    setFontSize: (fontSize: number) => {
      localStorage.setItem("editor-font-size", fontSize.toString());
      set({ fontSize });
    },

    setLanguage: (language: string) => {
      // *Save the current code to local storage
      const currentCode = get().editor?.getValue();
      if (currentCode){
      localStorage.setItem(`editor-code-${get().language}`, currentCode);
      }
      // *Set the new language
      localStorage.setItem("editor-language", language);
      set({
        language,
        output: "",
        error: null,
      });
    },

    runCode: async () => {
      // Todo: Implement runCode logic
    },
    
  }
}); 