import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";
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
      const {language, getCode } = get();
      const code = getCode();
      if(!code) {
        set({error: "Please enter some code to run."})
        return;
      }
      set({isRunning: true, error: null, output: ""})

      try {
        const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: runtime.language,
            version: runtime.version,
            files: [{content: code}]
          })
        });
        const data = await response.json();
        
        console.info("Data back from piston:", data);

        // ? Handle API-level errors
        if (data.message) {
          set({error: data.message, executionResult: {code, output: "", error: data.message}})
          return;
        }

        // ? Handle compilation errors
        if(data.compile && data.compile.code !== 0) {
          const error = data.compile.stderr || data.compile.output;
          set({
            error,
            executionResult: { code, output: "", error },
          })
          return;
        }

        // ? Handle runtime errors
        if(data.run && data.run.code !== 0) {
          const error = data.run.stderr || data.run.output;
          set({
            error,
            executionResult: { code, output: "", error },
          })
          return;
        }

        // *If we get here, the code ran successfully
        const output = data.run.output;
        set({
          output: output.trim(),
          error: null,
          executionResult: { code, output: output.trim(), error: null },
        });
                  
      } catch (error) {
        console.error("Error running code:", error);
        set({error: "Error running code. Please try again later.", executionResult: {code, output: "", error: "Error running code."}});
      } finally {
        set({isRunning: false});
      }
    },
    
  }
}); 

// *This is a helper function to get the latest execution result value.
export const getExecutionResult = () => useCodeEditorStore.getState().executionResult; 