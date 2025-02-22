export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <section className="hero bg-blue-500 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-4xl font-bold mb-4">Welcome to Better Budget</h2>
        <p className="text-lg mb-4">Take control of your finances and stop being poor.</p>
        <button className="bg-white text-blue-500 px-4 py-2 rounded">Get Started</button>
      </section>
      <section className="features mt-8">
        <h3 className="text-2xl font-bold mb-4">Features</h3>
        <ul className="list-disc list-inside">
          <li>Track your expenses</li>
          <li>Create budgets</li>
          <li>Analyze your spending habits</li>
        </ul>
      </section>
    </div>
  );
}
