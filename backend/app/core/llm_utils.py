import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    from ctransformers import AutoModelForCausalLM
    LLAMA_CPP_AVAILABLE = True
    LLM_LIBRARY = "ctransformers"
except ImportError:
    try:
        from llama_cpp import Llama
        LLAMA_CPP_AVAILABLE = True
        LLM_LIBRARY = "llama-cpp-python"
    except ImportError:
        LLAMA_CPP_AVAILABLE = False
        LLM_LIBRARY = None
        logger.warning("Neither ctransformers nor llama-cpp-python are available. LLM functionality will be disabled.")

class LLMManager:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or self._get_default_model_path()
        self.model = None
        self.context_window = 4096
        
    def _get_default_model_path(self) -> str:
        """Get default model path - user will need to download a model"""
        # Common model names for Mistral 7B quantized
        possible_paths = [
            "models/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
            "models/zephyr-7b-beta.Q4_K_M.gguf",
            "models/llama-2-7b-chat.Q4_K_M.gguf"
        ]        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        # Return first path as default (user will need to download)
        return possible_paths[0]
    
    def load_model(self):
        """Load the LLM model"""
        if not LLAMA_CPP_AVAILABLE:
            raise ImportError(f"No LLM library available. LLM functionality is not available.")
        
        if self.model is None:
            try:
                if not os.path.exists(self.model_path):
                    raise FileNotFoundError(
                        f"Model not found at {self.model_path}. "
                        f"Please download a GGUF model (e.g., Mistral 7B) and place it at this path."
                    )                
                logger.info(f"Loading LLM model from: {self.model_path} using {LLM_LIBRARY}")
                
                if LLM_LIBRARY == "ctransformers":
                    self.model = AutoModelForCausalLM.from_pretrained(
                        self.model_path,
                        model_type="mistral",
                        max_new_tokens=512,
                        context_length=self.context_window,
                        threads=4
                    )
                elif LLM_LIBRARY == "llama-cpp-python":
                    self.model = Llama(
                        model_path=self.model_path,
                        n_ctx=self.context_window,
                        n_threads=4,
                        verbose=False                    )
                
                logger.info("LLM model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load LLM model: {e}")
                raise
    
    def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]], max_tokens: int = 256) -> str:
        """Generate an answer based on question and retrieved context"""
        if not LLAMA_CPP_AVAILABLE:
            # Fallback response when no LLM library is available
            context_text = "\n\n".join([chunk.get('content', '') for chunk in context_chunks[:2]])  # Reduced to 2 chunks
            return f"""Based on the available context, I can provide this information:

{context_text[:300]}...

Note: The full LLM functionality is not available because no LLM library is installed. To get AI-generated answers, please install the required dependencies and download a model file."""
        
        if self.model is None:
            self.load_model()
        
        try:
            # Prepare context from chunks (limit context size for speed)
            context_text = "\n\n".join([chunk.get('content', '')[:200] for chunk in context_chunks[:2]])  # Shorter chunks
            
            # Create prompt
            prompt = self._create_prompt(question, context_text)
            
            # Generate response based on library
            if LLM_LIBRARY == "ctransformers":
                answer = self.model(
                    prompt,
                    max_new_tokens=max_tokens,
                    temperature=0.5,  # Lower temperature for faster, more focused responses
                    top_p=0.8,        # Reduced for speed
                    stop=["Human:", "Assistant:", "\n\n---", "\n\n"]
                )
            elif LLM_LIBRARY == "llama-cpp-python":
                response = self.model(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=0.5,
                    top_p=0.8,
                    stop=["Human:", "Assistant:", "\n\n---", "\n\n"],
                    echo=False
                )
                answer = response['choices'][0]['text'].strip()
            
            return answer.strip()
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            # Fallback response
            return f"I apologize, but I encountered an error while generating an answer. Error: {str(e)}"
    
    def _create_prompt(self, question: str, context: str) -> str:
        """Create a prompt for the LLM"""
        prompt = f"""You are a helpful assistant that answers questions based on the provided context. Use only the information from the context to answer the question. If the context doesn't contain enough information to answer the question, say so clearly.

Context:
{context}

Question: {question}

Answer: """
        return prompt
    
    def is_model_available(self) -> bool:
        """Check if model file exists"""
        return os.path.exists(self.model_path)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_path": self.model_path,
            "is_loaded": self.model is not None,
            "is_available": self.is_model_available(),
            "context_window": self.context_window,
            "llama_cpp_available": LLAMA_CPP_AVAILABLE,
            "library": LLM_LIBRARY or "none"
        }

# Global LLM manager instance
llm_manager = LLMManager()
