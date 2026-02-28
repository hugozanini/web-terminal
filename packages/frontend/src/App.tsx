function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-800 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Happy Coffee</h1>
          <p className="text-sm text-amber-100">Brazilian Coffee Export Data Catalog</p>
        </div>
      </header>
      <main className="container mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to Happy Coffee</h2>
          <p className="text-gray-600">
            Data catalog loading... This is the foundation for the Happy Coffee data catalog with integrated terminal.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
