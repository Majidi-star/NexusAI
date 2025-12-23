from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

class RAGEngine:
    def __init__(self):
        print("Initializing RAG Engine with Memory & Deletion support...")
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.llm = OllamaLLM(model="llama3")
        
        # بارگذاری دیتابیس موجود یا ایجاد دیتابیس جدید
        self.vector_store = Chroma(
            persist_directory="./chroma_db",
            embedding_function=self.embeddings
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "شما دستیار NexusAI هستید. با استفاده از مستندات زیر پاسخ دهید. اگر پاسخ در متن نیست، بگویید در اسناد یافت نشد.\n\nمحتوای اسناد:\n{context}"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ])

    def index_documents(self, chunks):
        """افزودن اسناد به حافظه بدون حذف قبلی‌ها"""
        if self.vector_store:
            self.vector_store.add_documents(chunks)
        else:
            self.vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory="./chroma_db"
            )
        print(f"Indexed {len(chunks)} chunks.")

    def delete_document(self, file_path):
        """حذف فیزیکی داده‌های یک فایل از دیتابیس برداری بر اساس منبع آن"""
        if self.vector_store:
            # در LangChain، منبع فایل در متادیتایی به نام source ذخیره می‌شود
            self.vector_store.delete(where={"source": file_path})
            print(f"Successfully deleted chunks associated with: {file_path}")

    def ask(self, query, history_data):
        if not self.vector_store:
            return "لطفاً ابتدا اسناد را آپلود کنید."
        
        formatted_history = []
        for msg in history_data:
            if msg.role == "user":
                formatted_history.append(HumanMessage(content=msg.content))
            else:
                formatted_history.append(AIMessage(content=msg.content))

        # جستجوی ۴ تکه مرتبط
        docs = self.vector_store.similarity_search(query, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        chain = self.prompt | self.llm
        response = chain.invoke({
            "context": context,
            "question": query,
            "chat_history": formatted_history
        })
        return response