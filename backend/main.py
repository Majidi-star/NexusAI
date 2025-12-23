from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
from processor import DocumentProcessor 

app = FastAPI()
doc_processor = DocumentProcessor()

class FilePaths(BaseModel):
    paths: List[str]

class Query(BaseModel):
    text: str

# آدرس دقیق برای پردازش اسناد
@app.post("/process-docs")
async def process_documents(data: FilePaths):
    print(f"Python received: {data.paths}")
    try:
        results = doc_processor.process_multiple_files(data.paths)
        return {"status": "success", "processed_count": len(results)}
    except Exception as e:
        print(f"Processing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_ai(query: Query):
    return {"answer": f"پاسخ هوشمند به: {query.text}"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)