import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Features from "@/components/Features"
import CallToAction from "@/components/CallToAction"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  )
}

