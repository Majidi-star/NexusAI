from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from processor import DocumentProcessor 
from rag_engine import RAGEngine

app = FastAPI()
doc_processor = DocumentProcessor()
rag_engine = RAGEngine()

# --- مدل‌های داده ---

class FilePaths(BaseModel):
    paths: List[str]

class DeleteDocRequest(BaseModel):
    path: str

class ChatMessage(BaseModel):
    role: str 
    content: str

class Query(BaseModel):
    text: str
    history: List[ChatMessage] = []

# --- نقاط اتصال (Endpoints) ---

@app.post("/process-docs")
async def process_documents(data: FilePaths):
    print(f"Python received request for: {len(data.paths)} files")
    try:
        chunks = doc_processor.process_multiple_files(data.paths)
        rag_engine.index_documents(chunks)
        return {"status": "success", "message": f"{len(chunks)} chunks indexed."}
    except Exception as e:
        print(f"Processing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete-doc")
async def delete_document(data: DeleteDocRequest):
    print(f"Request to delete document from memory: {data.path}")
    try:
        rag_engine.delete_document(data.path)
        return {"status": "success"}
    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_ai(query: Query):
    print(f"User asked: {query.text} | History length: {len(query.history)}")
    try:
        answer = rag_engine.ask(query.text, query.history)
        return {"answer": answer}
    except Exception as e:
        print(f"AI Engine Error: {e}")
        return {"answer": "متاسفانه مشکلی در تولید پاسخ هوشمند پیش آمد."}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)