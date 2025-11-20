import Hero from '@/components/Hero';
import Features from '@/components/Features';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />

      <FAQ />
      <Footer />
    </main>
  );
}
