import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, FileText, Image, FileCode, AlignLeft, File, ArrowRight, Brain, Zap, Shield, Database } from 'lucide-react';
import { Link } from 'wouter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <Badge />
        
        <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-4xl leading-tight">
          Find anything on your computer. <span className="text-gradient">Instantly.</span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          MemoryOS is a personal AI layer for your digital life. Search your files, documents, and images using natural language instead of trying to remember filenames.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/dashboard" className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_30px_-5px] shadow-primary/50 text-lg">
            Open Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#how-it-works" className="h-14 px-8 rounded-full bg-white/5 border border-white/10 font-medium flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-md text-lg">
            See how it works
          </a>
        </div>
        
        <HeroSearchVisualization />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Your Second Brain. Local.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything runs locally on your machine. Your data never leaves your computer, ensuring absolute privacy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Brain}
              title="Semantic Search" 
              description="Ask 'What was that recipe for sourdough?' instead of searching for 'sourdough_v2.pdf'."
            />
            <FeatureCard 
              icon={Shield}
              title="Privacy First" 
              description="100% local embedding models and LLMs. No cloud storage. No API keys needed."
            />
            <FeatureCard 
              icon={Zap}
              title="Lightning Fast" 
              description="Indexed using local vector databases for millisecond retrieval times."
            />
            <FeatureCard 
              icon={Database}
              title="Omni-Format OCR" 
              description="Reads PDFs, Word Docs, Markdown, and even extracts text from images."
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">MemoryOS</span>
          </div>
          <p>© 2024 MemoryOS. Local First.</p>
        </div>
      </footer>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg tracking-tight">MemoryOS</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</a>
          <Link href="/dashboard" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors backdrop-blur-md border border-white/5">
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Badge() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      v1.0 Now Available
    </motion.div>
  );
}

function HeroSearchVisualization() {
  const queries = [
    "Find the PDF I studied before my ML exam",
    "Show me screenshots with Python errors",
    "Find my internship resume",
    "What notes did I write about transformers?"
  ];
  const [queryIndex, setQueryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueryIndex((prev) => (prev + 1) % queries.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="mt-20 w-full max-w-3xl glass-card p-2 rounded-2xl relative"
    >
      <div className="absolute -top-3 -right-3 z-10">
        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          AI Powered
        </div>
      </div>
      <div className="bg-background/80 rounded-xl p-4 flex items-center gap-4 border border-white/5 shadow-inner">
        <SearchIcon className="w-6 h-6 text-primary animate-pulse" />
        <div className="flex-1 overflow-hidden h-8 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={queryIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-lg text-left text-muted-foreground absolute inset-0 flex items-center whitespace-nowrap"
            >
              {queries[queryIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Mock results */}
      <div className="mt-4 grid gap-3 p-2">
        {[
          { icon: FileText, title: "Machine_Learning_Notes_Final.pdf", score: "98%" },
          { icon: FileCode, title: "transformer_architecture.md", score: "85%" },
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-md">{item.score} Match</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col items-start text-left group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
