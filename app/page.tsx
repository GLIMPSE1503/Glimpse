export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      <h1 className="text-6xl font-bold tracking-tight">
        Glimpse
      </h1>

      <p className="mt-6 text-xl text-gray-300 text-center max-w-xl">
        Capture moments. Preserve memories.
        <br />
        Your life, one glimpse at a time.
      </p>

      <button className="mt-8 rounded-full bg-white text-black px-8 py-3 font-semibold hover:bg-gray-200 transition">
        Start Sharing
      </button>
    </main>
  );
}