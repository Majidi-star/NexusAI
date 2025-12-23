import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )

    def process_multiple_files(self, paths: list):
        all_docs = []
        for path in paths:
            try:
                clean_path = path.replace("/", "\\")
                if not os.path.exists(clean_path): continue
                
                ext = clean_path.split('.')[-1].lower()
                if ext == 'pdf': loader = PyPDFLoader(clean_path)
                elif ext in ['docx', 'doc']: loader = Docx2txtLoader(clean_path)
                elif ext == 'txt': loader = TextLoader(clean_path, encoding='utf-8')
                else: continue

                data = loader.load()
                all_docs.extend(data)
                print(f"Success: Loaded {os.path.basename(clean_path)}")

            except Exception as e:
                print(f"Fail: {str(e)}")
        
        # تکه‌تکه کردن متون برای دیتابیس
        chunks = self.text_splitter.split_documents(all_docs)
        print(f"Created {len(chunks)} chunks from documents.")
        return chunks