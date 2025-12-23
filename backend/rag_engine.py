from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

class RAGEngine:
    def __init__(self):
        # استفاده از یک مدل سبک و سریع برای تبدیل متن به بردار (Vector)
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.vector_store = None

    def index_documents(self, chunks):
        """ذخیره تکه‌های متن در دیتابیس برداری"""
        self.vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory="./chroma_db" # دیتابیس در این پوشه ذخیره می‌شود
        )
        print("Documents indexed in Vector DB.")

    def search(self, query):
        """جستجوی مرتبط‌ترین بخش‌های اسناد برای سوال کاربر"""
        if not self.vector_store:
            return "ابتدا اسناد را آپلود کنید."
        
        # پیدا کردن ۳ تکه مرتبط با سوال
        docs = self.vector_store.similarity_search(query, k=3)
        context = "\n---\n".join([doc.page_content for doc in docs])
        return context